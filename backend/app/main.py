import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.api import video_routes

app = FastAPI(title="Zaizub Auto Subtitles API")

# Ensure temp_storage directory exists
os.makedirs("temp_storage", exist_ok=True)

# Mount temp_storage for static video streaming to frontend
app.mount("/temp_storage", StaticFiles(directory="temp_storage"), name="temp_storage")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://prude-unloving-poet.ngrok-free.dev",
        "https://zaizub.vercel.app",
        "*",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API routes
app.include_router(video_routes.router, prefix="/api/v1")