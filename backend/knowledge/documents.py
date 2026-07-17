from fastapi import APIRouter, Query
import json
import os

router = APIRouter()

DATA_FILE = "data/documents.json"


@router.get("/documents")
async def get_documents(company_id: str = Query(...)):

    if not os.path.exists(DATA_FILE):
        return []

    with open(DATA_FILE, "r") as f:
        documents = json.load(f)

    # Return only documents belonging to the requesting company
    return [doc for doc in documents if doc.get("company_id") == company_id]