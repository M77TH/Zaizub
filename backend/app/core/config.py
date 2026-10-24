from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Literal

class Settings(BaseSettings):
    GROQ_API_KEY: str = ""
    # faster-whisper (CTranslate2) repo id or local path; best: scripts/convert_typhoon.sh output
    WHISPER_MODEL: str = "Vinxscribe/biodatlab-whisper-th-large-v3-faster"
    # Primes Whisper's spelling/vocabulary; add your channel's recurring names and jargon. "" disables it.
    WHISPER_PROMPT: str = "สวัสดีครับ วันนี้เรามาคุยกันเรื่องต่าง ๆ ด้วยภาษาไทยที่ถูกต้อง ใช้เครื่องหมายวรรคตอนครบถ้วน"
    # Netscape cookies.txt for yt-dlp, used only as a fallback when YouTube blocks anonymous downloads; ignored if missing
    YTDLP_COOKIES: str = "~/cookies.txt"
    MODEL: str = "whisperx"  # "whisperx" or "groq"

    # ตั้งค่าให้ไปดึงข้อมูลมาจากไฟล์ .env
    model_config = SettingsConfigDict(
        env_file=("backend/.env", ".env", "../.env"),
        env_file_encoding="utf-8", 
        extra="ignore"
    )

settings = Settings()