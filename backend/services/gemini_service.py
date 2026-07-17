import os
import logging
import traceback
import google.generativeai as genai
from typing import Dict, Any

logger = logging.getLogger(__name__)

# Try to get API key from environment variables.
# VITE_ prefixed keys are also loaded via dotenv, so check both.
gemini_api_key = os.getenv("GEMINI_API_KEY") or os.getenv("VITE_GEMINI_API_KEY")

if gemini_api_key:
    genai.configure(api_key=gemini_api_key)
    logger.info("Gemini API configured successfully in GeminiService.")
else:
    logger.warning("GEMINI_API_KEY environment variable is missing. LLM calls will fail unless mock is handled.")

class GeminiService:
    def generate_response(self, prompt: str, ai_config: Dict[str, Any]) -> Dict[str, Any]:
        """
        Send prompt to Gemini 2.5 Flash model using configured temperature and max tokens.
        Returns a dict with 'answer' and 'tokens' usage information.
        """
        if not gemini_api_key:
            raise ValueError("Gemini API key is not configured. Please add GEMINI_API_KEY to your environment/dotenv file.")

        # 1. Validate AI Configuration (Step 4)
        try:
            temperature = float(ai_config.get("temperature", 0.2)) if ai_config.get("temperature") is not None else 0.2
        except (ValueError, TypeError):
            temperature = 0.2

        try:
            max_tokens = int(ai_config.get("max_tokens", 1500)) if ai_config.get("max_tokens") is not None else 1500
        except (ValueError, TypeError):
            max_tokens = 1500

        try:
            confidence_threshold = float(ai_config.get("confidence_threshold", 0.75)) if ai_config.get("confidence_threshold") is not None else 0.75
        except (ValueError, TypeError):
            confidence_threshold = 0.75

        # 2. Validate PromptBuilder Output (Step 5)
        if not prompt or not prompt.strip():
            raise ValueError("Prompt is empty or contains only whitespace.")
        if "Customer Question:" not in prompt:
            raise ValueError("Prompt error: Missing 'Customer Question:' section.")
        if "Knowledge Base:" not in prompt:
            raise ValueError("Prompt error: Missing 'Knowledge Base:' section.")
        
        # Ensure prompt is within reasonable token safety limits
        if len(prompt) > 200000:
            raise ValueError(f"Prompt length ({len(prompt)} characters) is abnormally large and exceeds safe testing limits.")

        # 3. Add complete Gemini logging before calling (Step 1)
        model_name = 'gemini-3.5-flash'
        logger.info("========== GEMINI API CALL ==========")
        logger.info(f"Model Name: {model_name}")
        logger.info(f"Prompt Length: {len(prompt)} characters")
        logger.info(f"Temperature: {temperature}")
        logger.info(f"Max Tokens: {max_tokens}")
        logger.info(f"First 1000 characters of Prompt:\n{prompt[:1000]}")
        logger.info("=====================================")

        try:
            # Ensure temperature is within [0.0, 2.0] for Gemini
            adjusted_temperature = max(0.0, min(2.0, temperature))
            
            model = genai.GenerativeModel(model_name)
            response = model.generate_content(
                prompt,
                generation_config=genai.GenerationConfig(
                    temperature=adjusted_temperature,
                    max_output_tokens=max_tokens
                )
            )

            # 4. Log the raw Gemini response (Step 2)
            logger.info("========== GEMINI RAW RESPONSE ==========")
            logger.info(f"Response Object Type: {type(response)}")

            # Check prompt feedback
            prompt_feedback = getattr(response, "prompt_feedback", None)
            if prompt_feedback:
                logger.info(f"Prompt Feedback: {prompt_feedback}")
                if getattr(prompt_feedback, "block_reason", None):
                    raise ValueError(f"Prompt was blocked by safety filters. Block reason: {prompt_feedback.block_reason}")

            # Check candidates
            candidates = getattr(response, "candidates", [])
            logger.info(f"Candidates returned: {len(candidates)}")

            if not candidates:
                raise ValueError("Gemini returned zero candidates. Response may have been blocked.")

            first_candidate = candidates[0]
            finish_reason = getattr(first_candidate, "finish_reason", None)
            logger.info(f"Candidate Finish Reason: {finish_reason}")

            # Log safety ratings
            safety_ratings = getattr(first_candidate, "safety_ratings", [])
            logger.info(f"Safety Ratings: {safety_ratings}")

            # Validate finish reason
            finish_reason_str = str(finish_reason)
            if "STOP" not in finish_reason_str and finish_reason_str != "1" and finish_reason_str != "FinishReason.STOP":
                if "MAX_TOKENS" in finish_reason_str or finish_reason_str == "2":
                    logger.warning("Generation stopped due to MAX_OUTPUT_TOKENS. Output is truncated.")
                else:
                    raise ValueError(f"Gemini generation stopped unexpectedly. Reason: {finish_reason_str}")

            # 5. Extract text safely (Step 6)
            try:
                answer = response.text.strip()
            except Exception as text_err:
                logger.error(f"Error accessing response.text directly: {str(text_err)}")
                content = getattr(first_candidate, "content", None)
                parts = getattr(content, "parts", []) if content else []
                if parts:
                    answer = "".join([getattr(part, "text", "") for part in parts]).strip()
                else:
                    raise ValueError("Could not extract generated text from the candidate parts.")

            # Extract token counts
            tokens = {"prompt": 0, "completion": 0, "total": 0}
            usage_metadata = getattr(response, "usage_metadata", None)
            if usage_metadata:
                tokens["prompt"] = getattr(usage_metadata, "prompt_token_count", 0)
                tokens["completion"] = getattr(usage_metadata, "candidates_token_count", 0)
                tokens["total"] = getattr(usage_metadata, "total_token_count", 0)
            else:
                tokens["prompt"] = len(prompt) // 4
                tokens["completion"] = len(answer) // 4
                tokens["total"] = tokens["prompt"] + tokens["completion"]

            logger.info(f"Extracted token metrics: {tokens}")
            logger.info("=========================================")

            return {
                "answer": answer,
                "tokens": tokens
            }

        except Exception as e:
            # 6. Print complete exception without swallowing (Step 3)
            tb_str = traceback.format_exc()
            logger.error("========== GEMINI EXCEPTION LOG ==========")
            logger.error(f"Exception Type: {type(e)}")
            logger.error(f"Exception Message: {str(e)}")
            logger.error(f"Traceback:\n{tb_str}")
            logger.error(f"Request Payload (AI Config): {ai_config}")
            logger.error("==========================================")
            raise e
