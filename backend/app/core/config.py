from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Literal

class Settings(BaseSettings):
    GROQ_API_KEY: str = ""
    MODEL: str = "groq"  # "groq" or "whisperx"

    # ตั้งค่าให้ไปดึงข้อมูลมาจากไฟล์ .env (ทั้ง root และ backend)
    model_config = SettingsConfigDict(
        env_file=(".env", "../.env"),
        env_file_encoding="utf-8", 
        extra="ignore"
    )

settings = Settings()