from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from knowledge.upload import router as upload_router
from knowledge.documents import router as documents_router
from mail import router as email_router

app = FastAPI()
app.include_router(email_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080", "http://localhost:3000", "http://localhost:5173"],
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