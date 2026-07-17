from fastapi import APIRouter, UploadFile, File, Form
from typing import List
from datetime import datetime
import uuid
import os
import shutil
import json
from knowledge.extractor import extract_text
from knowledge.chunker import chunk_text
from knowledge.embeddings import generate_embeddings
from knowledge.vector_store import store_chunks

router = APIRouter()

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

ALLOWED_EXTENSIONS = [".pdf", ".docx", ".csv"]


@router.post("/upload")
async def upload_documents(
    files: List[UploadFile] = File(...),
    company_id: str = Form(...),
):

    uploaded_files = []
    skipped_files = []

    for file in files:

        ext = os.path.splitext(file.filename)[1].lower()

        if ext not in ALLOWED_EXTENSIONS:
            skipped_files.append(file.filename)
            continue

        file_path = os.path.join(UPLOAD_DIR, file.filename)

        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Extract text
        text = extract_text(file_path)

        # Chunk text
        chunks = chunk_text(text)

        # Generate embeddings
        embeddings = generate_embeddings(chunks)

        # Store in company-specific ChromaDB collection
        store_chunks(
            chunks,
            embeddings,
            file.filename,
            company_id,
        )

        uploaded_files.append({
            "id": str(uuid.uuid4()),
            "company_id": company_id,
            "filename": file.filename,
            "type": ext.replace(".", "").upper(),
            "chunks": len(chunks),
            "status": "Indexed",
            "uploaded_at": datetime.now().isoformat()
        })
    
    DATA_FILE = "data/documents.json"

    os.makedirs("data", exist_ok=True)

    if os.path.exists(DATA_FILE):
        with open(DATA_FILE, "r") as f:
            documents = json.load(f)
    else:
        documents = []

    documents.extend(uploaded_files)

    with open(DATA_FILE, "w") as f:
        json.dump(documents, f, indent=4)

    return {
        "message": "Knowledge upload completed",
        "uploaded_files": uploaded_files,
        "skipped_files": skipped_files
    }