from fastapi import APIRouter, UploadFile, File, HTTPException
import os
import shutil
from knowledge.extractor import extract_text
from knowledge.chunker import chunk_text
from knowledge.embeddings import generate_embeddings
from knowledge.vector_store import store_chunks
router = APIRouter()

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

ALLOWED_EXTENSIONS = [".pdf", ".docx", ".csv"]


@router.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    ext = os.path.splitext(file.filename)[1].lower()

    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail="Only PDF, DOCX and CSV files are allowed."
        )

    file_path = os.path.join(UPLOAD_DIR, file.filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    text = extract_text(file_path)
    chunks = chunk_text(text)

    embeddings = generate_embeddings(chunks)

    store_chunks(
    chunks,
    embeddings,
    file.filename
    )

    return {
    "message": "Knowledge uploaded successfully",
    "filename": file.filename,
    "chunks": len(chunks),
    "status": "Stored in ChromaDB"
}

    