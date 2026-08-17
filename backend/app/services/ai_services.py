import os
from groq import Groq
from app.core.config import settings

client = Groq(api_key=settings.GROQ_API_KEY)

def format_timestamp(seconds: float) -> str:
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    millisecs = int((seconds - int(seconds)) * 1000)
    return f"{hours:02d}:{minutes:02d}:{secs:02d},{millisecs:03d}"

def transcribe_audio_groq(audio_path: str, srt_path: str):
    """ส่งไฟล์เสียงให้ Groq และสร้างไฟล์ .srt"""
    with open(audio_path, "rb") as audio_file:
        transcription = client.audio.transcriptions.create(
            file=(audio_path, audio_file.read()),
            model="whisper-large-v3",
            response_format="verbose_json"
        )

    with open(srt_path, "w", encoding="utf-8") as f:
        for i, segment in enumerate(transcription.segments, start=1):
            start_time = format_timestamp(segment['start'])
            end_time = format_timestamp(segment['end'])
            f.write(f"{i}\n{start_time} --> {end_time}\n{segment['text'].strip()}\n\n")