from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import video_routes

app = FastAPI(title="Auto Subtitles API")[cite: 5]

# เปิด CORS ให้ Next.js
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://prude-unloving-poet.ngrok-free.dev",
        "https://zaizub.vercel.app"], # สามารถเพิ่ม http://localhost:3000 สำหรับรัน local ได้[cite: 5]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)[cite: 5]

# ดึง Route มาใช้งาน
app.include_router(video_routes.router, prefix="/api/v1")[cite: 5]