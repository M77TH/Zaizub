from faster_whisper import WhisperModel
import yt_dlp
import time
import os


WhisperModel
WHISPER_MODEL = "base" 

YOUTUBE_URL = "https://youtu.be/DdoJWX8YEWs?si=zQjbjmbyYg8C5Ken" 
OUTPUT_AUDIO = "data/output_mp3/audio"

def download_audio_from_youtube(url, output_path):
    print(f"กำลังดาวน์โหลดเสียงจาก YouTube: {url}")
    
    # ตั้งค่าให้โหลดเฉพาะไฟล์เสียงที่ดีที่สุด และแปลงเป็น .wav
    ydl_opts = {
        'format': 'bestaudio/best',
        'outtmpl': f'{output_path}.%(ext)s',
        'postprocessors': [{
            'key': 'FFmpegExtractAudio',
            'preferredcodec': 'wav',
            'preferredquality': '192',
        }],
        'quiet': True # ปิดการแสดง Log ยาวๆ ของ yt-dlp
    }
    
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        ydl.download([url])
        
    return f"{output_path}.wav"

def main():
    # 1. โหลดเสียงจาก YouTube
    start_dl_time = time.time()
    audio_file = download_audio_from_youtube(YOUTUBE_URL, OUTPUT_AUDIO)
    print(f"ดาวน์โหลดเสร็จสิ้น! ใช้เวลา {time.time() - start_dl_time:.2f} วินาที")
    print(f"ไฟล์ถูกบันทึกไว้ที่: {audio_file}")
    print("-" * 40)

    # 2. โหลดโมเดล Whisper
    print("กำลังโหลดโมเดล AI...")
    model = WhisperModel("WHISPER_MODEL", device="cpu", compute_type="int8")
    
    # 3. เริ่มถอดเสียง
    print("กำลังเริ่มถอดเสียง...")
    start_ai_time = time.time()
    segments, info = model.transcribe(audio_file, beam_size=5)
    
    print(f"ตรวจพบภาษา: '{info.language}' (ความมั่นใจ {info.language_probability:.2f})")
    
    # 4. แสดงผลลัพธ์
    for segment in segments:
        print(f"[{segment.start:.2f}s -> {segment.end:.2f}s] {segment.text}")
        
    print("-" * 40)
    print(f"ถอดเสียงเสร็จสิ้น! ใช้เวลา AI ประมวลผล {time.time() - start_ai_time:.2f} วินาที")

if __name__ == "__main__":
    main()