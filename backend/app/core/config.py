from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Literal

class Settings(BaseSettings):
    GROQ_API_KEY: str = ""
    # any faster-whisper (CTranslate2) repo id or local path
    WHISPER_MODEL: str = "Vinxscribe/biodatlab-whisper-th-large-v3-faster"
    MODEL: str = "whisperx"  # "whisperx" or "groq"

    # ตั้งค่าให้ไปดึงข้อมูลมาจากไฟล์ .env
    model_config = SettingsConfigDict(
        env_file=("backend/.env", ".env", "../.env"),
        env_file_encoding="utf-8", 
        extra="ignore"
    )

settings = Settings()