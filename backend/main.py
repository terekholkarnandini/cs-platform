from fastapi import FastAPI
from knowledge.upload import router as upload_router

app = FastAPI()

app.include_router(upload_router, prefix="/knowledge", tags=["Knowledge"])