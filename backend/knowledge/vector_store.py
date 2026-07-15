import chromadb

client = chromadb.PersistentClient(path="chroma_db")

collection = client.get_or_create_collection(
    name="knowledge_base"
)


def store_chunks(chunks, embeddings, filename):

    ids = [f"{filename}_{i}" for i in range(len(chunks))]

    metadatas = [
        {"source": filename}
        for _ in chunks
    ]

    collection.add(
        ids=ids,
        documents=chunks,
        embeddings=embeddings,
        metadatas=metadatas
    )