from dotenv import load_dotenv
from pathlib import Path

load_dotenv(Path(__file__).parent / ".env")

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from knowledge.upload import router as upload_router
from knowledge.documents import router as documents_router
from chat.router import router as chat_router

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080","http://localhost:8081", "http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(
    upload_router,
    prefix="/knowledge",
    tags=["Knowledge"]
)

app.include_router(
    documents_router,
    prefix="/knowledge",
    tags=["Knowledge"]
)

app.include_router(
    chat_router,
    prefix="/api",
    tags=["Chat"]
)

print("Chat router registered!")

print("\nRegistered routes:")
for route in app.routes:
    print(route.path)