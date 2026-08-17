from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import video_routes

app = FastAPI(title="Auto Subtitles API")

# เปิด CORS ให้ Next.js (ปกติ Next.js รันที่พอร์ต 3000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://prude-unloving-poet.ngrok-free.dev",
        "https://zaizub.vercel.app"], # อย่าลืมใส่ ngrok URL ทีหลัง http://localhost:3000
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ดึง Route มาใช้งาน
app.include_router(video_routes.router, prefix="/api/v1")