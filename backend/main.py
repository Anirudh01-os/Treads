from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import uvicorn
from typing import List, Optional
import os
from dotenv import load_dotenv

from api.clothing import router as clothing_router
from api.body_modeling import router as body_router
from api.tryons import router as tryons_router
from api.user import router as user_router

load_dotenv()

app = FastAPI(
    title="Treads Virtual Try-On API",
    description="AI-Powered Virtual Clothing Try-On Experience",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files for serving images and models
os.makedirs("uploads", exist_ok=True)
os.makedirs("generated", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")
app.mount("/generated", StaticFiles(directory="generated"), name="generated")

# Include routers
app.include_router(clothing_router, prefix="/api/clothing", tags=["clothing"])
app.include_router(body_router, prefix="/api/body", tags=["body-modeling"])
app.include_router(tryons_router, prefix="/api/tryons", tags=["try-ons"])
app.include_router(user_router, prefix="/api/user", tags=["user"])

@app.get("/")
async def root():
    return {"message": "Treads Virtual Try-On API", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "message": "API is running"}

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )