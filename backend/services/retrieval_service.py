import logging
from typing import List, Dict, Any
from knowledge.embeddings import model
from knowledge.vector_store import get_collection

logger = logging.getLogger(__name__)

class RetrievalService:
    def __init__(self):
        self.model = model

    def search_knowledge_base(self, company_id: str, query: str) -> List[Dict[str, Any]]:
        """
        Generate query embedding and retrieve top 5 most relevant chunks from ChromaDB 
        for the given company, converting L2 distances to similarity scores.
        """
        try:
            # Generate query embedding
            logger.info(f"Generating query embedding for company: {company_id}")
            query_embedding = self.model.encode(query).tolist()

            # Retrieve collection
            logger.info(f"Accessing collection for company: {company_id}")
            collection = get_collection(company_id)

            # Search ChromaDB collection
            # Using metadata filter where company_id = company_id to enforce access scoping
            results = collection.query(
                query_embeddings=[query_embedding],
                n_results=5,
                where={"company_id": company_id},
                include=["documents", "metadatas", "distances"]
            )

            # Format results
            chunks = []
            if not results or not results.get("documents") or not results["documents"][0]:
                logger.warning(f"No chunks retrieved from ChromaDB for company: {company_id}")
                return chunks

            documents = results["documents"][0]
            metadatas = results["metadatas"][0] if results.get("metadatas") else [{}] * len(documents)
            distances = results["distances"][0] if results.get("distances") else [0.0] * len(documents)

            for i in range(len(documents)):
                # Convert L2 distance to similarity score
                # distance >= 0, score is mapped to [0.0, 1.0] using 1 / (1 + distance)
                distance = distances[i]
                similarity_score = round(1.0 / (1.0 + distance), 4)

                chunks.append({
                    "chunkId": f"{company_id}_chunk_{i}", # fallback if no id
                    "text": documents[i],
                    "score": similarity_score,
                    "metadata": metadatas[i] or {}
                })

            logger.info(f"Retrieved {len(chunks)} chunks for company: {company_id}")
            return chunks

        except Exception as e:
            logger.error(f"Error in retrievalService for company {company_id}: {str(e)}", exc_info=True)
            raise e
