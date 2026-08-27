from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    GROQ_API_KEY: str = ""

    # ตั้งค่าให้ไปดึงข้อมูลมาจากไฟล์ .env
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

# สร้างตัวแปร settings ไว้ให้ไฟล์อื่นเรียกใช้งาน
settings = Settings()