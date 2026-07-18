from dotenv import load_dotenv
from pathlib import Path

load_dotenv(Path(__file__).parent / ".env")

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from knowledge.upload import router as upload_router
from knowledge.documents import router as documents_router
from chat.router import router as chat_router
from mail import router as email_router
from analytics.router import router as analytics_router
from widget.router import router as widget_router

app = FastAPI()
app.include_router(email_router)

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex="https?://.*",
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

app.include_router(
    analytics_router,
    prefix="/api",
    tags=["Analytics"]
)

app.include_router(
    widget_router,
    prefix="/api",
    tags=["Widget"]
)

print("Chat router registered!")

print("\nRegistered routes:")
for route in app.routes:
    print(route.path)