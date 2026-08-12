# Whisper


winget install ffmpeg
pip install faster-whisper firebase-admin uvicorn python-multipart yt-dlp

Terminal => uvicorn main:app --reload (รัน FastAPI ที่ localhost:8000)
Terminal อีกหน้าต่าง => ngrok http 8000