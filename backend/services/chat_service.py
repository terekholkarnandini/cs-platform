import time
import logging
import os
from typing import Dict, Any
from dotenv import load_dotenv
from supabase import create_client, Client

from services.retrieval_service import RetrievalService
from services.gemini_service import GeminiService
from services.prompt_builder import PromptBuilder

# Load .env
load_dotenv(
    dotenv_path=os.path.join(
        os.path.dirname(__file__),
        "..",
        "..",
        ".env"
    )
)

logger = logging.getLogger(__name__)

# -----------------------------
# Initialize Supabase
# -----------------------------
supabase_url = os.getenv("VITE_SUPABASE_URL")
supabase_key = os.getenv("VITE_SUPABASE_ANON_KEY")

print("\n========== SUPABASE DEBUG ==========")
print("Supabase URL:", supabase_url)
print("Anon Key Exists:", bool(supabase_key))
print("===================================\n")

if not supabase_url or not supabase_key:
    logger.error("Supabase URL or Anon Key is missing.")
    supabase = None
else:
    try:
        supabase = create_client(supabase_url, supabase_key)
        logger.info("Supabase initialized successfully.")
        print("[OK] Supabase client initialized successfully.\n")
    except Exception as e:
        logger.error(str(e))
        print("[ERROR] Failed to initialize Supabase:", e)
        supabase = None

class ChatService:
    def __init__(self):
        self.retrieval_service = RetrievalService()
        self.gemini_service = GeminiService()
        self.prompt_builder = PromptBuilder()

    def process_chat(self, company_id: str, message: str, token: str = None, user_id: str = None) -> Dict[str, Any]:
        """
        Main orchestration logic:
        1. Validate company exists in Supabase (scoped using token to bypass/respect RLS).
        2. Retrieve Business Rules.
        3. Retrieve AI Configuration.
        """
        start_time = time.time()
        gemini_model = "gemini-3.5-flash"
        num_chunks = 0
        error_occurred = None

        try:
            if not supabase:
                raise ConnectionError("Supabase connection is not available.")

            # Create request-scoped Supabase client if a token is provided to honor user's RLS policies
            if token:
                from supabase.client import ClientOptions
                req_supabase = create_client(
                    supabase_url,
                    supabase_key,
                    options=ClientOptions(headers={"Authorization": f"Bearer {token}"})
                )
            else:
                req_supabase = supabase

            # 1. Validate company exists and owner check if user_id is provided
            logger.info("====================================")
            logger.info(f"Incoming company_id: {company_id}")
            logger.info(f"Supabase URL: {supabase_url}")

            companies = req_supabase.table("companies").select("id,name").execute()

            logger.info(f"Companies in database: {companies.data}")

            company_response = req_supabase.table("companies").select("*").eq("id", company_id).execute()
            logger.info(f"Company query result: {company_response.data}")
            logger.info("====================================")
            if not company_response.data:
                raise ValueError("Company profile does not exist.")

            company = company_response.data[0]
            company_name = company.get("name", "Acme")

            # 2. Retrieve Business Rules
            rules_response = req_supabase.table("business_rules").select("*").eq("company_id", company_id).execute()
            business_rules = rules_response.data[0] if rules_response.data else {}

            # 3. Retrieve AI Configuration
            config_response = req_supabase.table("ai_configuration").select("*").eq("company_id", company_id).execute()
            ai_config = config_response.data[0] if config_response.data else {}

            fallback_response = ai_config.get(
                "fallback_response", 
                "I'm sorry, I couldn't find a reliable answer to that question in our knowledge base. Let me transfer you to a member of our team."
            ) or "I'm sorry, I couldn't find a reliable answer to that question in our knowledge base. Let me transfer you to a member of our team."
            
            confidence_threshold = float(ai_config.get("confidence_threshold", 0.75))

            # 4. Search ChromaDB
            retrieval_start = time.time()
            try:
                chunks = self.retrieval_service.search_knowledge_base(company_id, message)
                num_chunks = len(chunks)
            except Exception as chroma_error:
                error_occurred = f"ChromaDB error: {str(chroma_error)}"
                logger.error(error_occurred)
                raise ConnectionError("Knowledge base is currently unavailable. Please try again later.")
            retrieval_time = time.time() - retrieval_start

            # Helper for fallback responses
            def get_fallback_payload(top_val=0.0):
                resp_t = time.time() - start_time
                return {
                    "answer": fallback_response,
                    "sources": [
                        {
                            "chunkId": chunk["chunkId"],
                            "score": chunk["score"],
                            "text": chunk.get("text", ""),
                            "metadata": chunk.get("metadata", {})
                        }
                        for chunk in chunks
                    ],
                    "responseTime": f"{resp_t:.4f}s",
                    "confidence": f"{round(top_val * 100, 2)}%",
                    "tokens": {
                        "prompt": len(message) // 4,
                        "completion": len(fallback_response) // 4,
                        "total": (len(message) + len(fallback_response)) // 4
                    },
                    "metrics": {
                        "retrievalTime": f"{retrieval_time:.4f}s",
                        "llmTime": "0.0000s",
                        "totalTime": f"{resp_t:.4f}s"
                    }
                }

            # 5. Check if chunks are found and compare similarity scores
            if not chunks:
                logger.warning(f"No documents found for query in ChromaDB: '{message}'")
                response_time = f"{time.time() - start_time:.4f}s"
                self._log_details(company_id, response_time, num_chunks, gemini_model, "No relevant documents found.")
                return get_fallback_payload(0.0)

            top_chunk = chunks[0]
            top_score = top_chunk["score"]

            # If top score is below the confidence threshold, trigger fallback immediately
            if top_score < confidence_threshold:
                response_time = f"{time.time() - start_time:.4f}s"
                logger.info(f"Top relevance score ({top_score}) is below confidence threshold ({confidence_threshold}). Fallback triggered.")
                self._log_details(company_id, response_time, num_chunks, gemini_model, f"Relevance score {top_score} below threshold.")
                return get_fallback_payload(top_score)

            # 6. Build the prompt
            prompt = self.prompt_builder.build_prompt(
                company_name=company_name,
                business_rules=business_rules,
                ai_config=ai_config,
                chunks=chunks,
                question=message
            )

            # 7. Call Gemini
            llm_start = time.time()
            try:
                gemini_res = self.gemini_service.generate_response(prompt, ai_config)
                answer = gemini_res["answer"]
                tokens = gemini_res["tokens"]
            except Exception as gemini_error:
                error_occurred = f"Gemini error: {str(gemini_error)}"
                logger.error(error_occurred, exc_info=True)
                # Development Mode: Return actual Gemini exception in the response instead of standard text
                resp_t = time.time() - start_time
                return {
                    "answer": f"We encountered an issue generating a response. Gemini Exception: {str(gemini_error)}",
                    "sources": [
                        {
                            "chunkId": chunk["chunkId"],
                            "score": chunk["score"],
                            "text": chunk.get("text", ""),
                            "metadata": chunk.get("metadata", {})
                        }
                        for chunk in chunks
                    ],
                    "responseTime": f"{resp_t:.4f}s",
                    "confidence": f"{round(top_score * 100, 2)}%",
                    "tokens": {
                        "prompt": len(prompt) // 4,
                        "completion": 15,
                        "total": (len(prompt) // 4) + 15
                    },
                    "metrics": {
                        "retrievalTime": f"{retrieval_time:.4f}s",
                        "llmTime": f"{time.time() - llm_start:.4f}s",
                        "totalTime": f"{resp_t:.4f}s"
                    }
                }
            llm_time = time.time() - llm_start

            # Format successful response
            total_time = time.time() - start_time
            response_time = f"{total_time:.4f}s"
            self._log_details(company_id, response_time, num_chunks, gemini_model)

            return {
                "answer": answer,
                "sources": [
                    {
                        "chunkId": chunk["chunkId"],
                        "score": chunk["score"],
                        "text": chunk.get("text", ""),
                        "metadata": chunk.get("metadata", {})
                    }
                    for chunk in chunks
                ],
                "responseTime": response_time,
                "confidence": f"{round(top_score * 100, 2)}%",
                "tokens": tokens,
                "metrics": {
                    "retrievalTime": f"{retrieval_time:.4f}s",
                    "llmTime": f"{llm_time:.4f}s",
                    "totalTime": f"{total_time:.4f}s"
                }
            }

        except Exception as e:
            if not error_occurred:
                error_occurred = str(e)
            logger.error(f"Error in chatService: {error_occurred}", exc_info=True)
            self._log_details(company_id, f"{time.time() - start_time:.4f}s", num_chunks, gemini_model, error_occurred)
            raise e

    def _log_details(self, company_id: str, response_time: str, num_chunks: int, model: str, error: str = None):
        """
        Utility logging function to conform to STEP 12.
        """
        log_msg = f"[Chat Request] Company ID: {company_id} | Response Time: {response_time} | Chunks: {num_chunks} | Model: {model}"
        if error:
            log_msg += f" | Error: {error}"
            logger.error(log_msg)
        else:
            logger.info(log_msg)
