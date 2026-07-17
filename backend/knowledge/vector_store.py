import chromadb

client = chromadb.PersistentClient(path="chroma_db")


def get_collection(company_id: str):
    """Return (or create) the ChromaDB collection for a specific company."""
    return client.get_or_create_collection(
        name=f"knowledge_{company_id}"
    )


def store_chunks(chunks, embeddings, filename, company_id: str):

    collection = get_collection(company_id)

    ids = [f"{company_id}_{filename}_{i}" for i in range(len(chunks))]

    metadatas = [
        {
            "company_id": company_id,
            "source": filename,
            "document_type": "knowledge",
        }
        for _ in chunks
    ]

    collection.add(
        ids=ids,
        documents=chunks,
        embeddings=embeddings,
        metadatas=metadatas
    )

    results = collection.get(include=["documents", "embeddings"])

    print("=" * 50)
    print(f"Collection: knowledge_{company_id}")
    print("Documents:", len(results["documents"]))
    print("Embeddings:", len(results["embeddings"]))
    print("First embedding length:", len(results["embeddings"][0]))
    print("First 10 values:", results["embeddings"][0][:10])
    print("=" * 50)