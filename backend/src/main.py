import os
import shutil
import subprocess
import time
from fastapi import FastAPI, UploadFile, File, Form, BackgroundTasks
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from faster_whisper import WhisperModel
import yt_dlp

app = FastAPI()

# 1. ตั้งค่า CORS ให้อนุญาตการเชื่อมต่อจากหน้าเว็บภายนอก (เช่น GitHub Pages)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 2. โหลดโมเดล Whisper เตรียมไว้ในหน่วยความจำ (ทำครั้งเดียวตอนเปิดเซิร์ฟเวอร์)
print("กำลังโหลดโมเดล AI...")

model = WhisperModel("small", device="cpu", compute_type="int8")

print("โหลดโมเดลเสร็จสิ้น!")

# --- ฟังก์ชันช่วยเหลือ (Helper Functions) ---

def format_timestamp(seconds: float) -> str:
    """แปลงวินาทีให้เป็นรูปแบบเวลาของไฟล์ .srt (HH:MM:SS,mmm)"""
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    millisecs = int((seconds - int(seconds)) * 1000)
    return f"{hours:02d}:{minutes:02d}:{secs:02d},{millisecs:03d}"

def create_srt_file(segments, srt_filename: str):
    """สร้างไฟล์ .srt จากผลลัพธ์ของ Whisper"""
    with open(srt_filename, "w", encoding="utf-8") as f:
        for i, segment in enumerate(segments, start=1):
            start_time = format_timestamp(segment.start)
            end_time = format_timestamp(segment.end)
            f.write(f"{i}\n")
            f.write(f"{start_time} --> {end_time}\n")
            f.write(f"{segment.text.strip()}\n\n")

def burn_subtitles(video_path: str, srt_path: str, output_path: str):
    """ใช้ FFmpeg ฝังซับไตเติ้ลลงในวิดีโอ (พร้อมดึงเสียงมาด้วย)"""
    command = [
        'ffmpeg', '-y',
        '-i', video_path,
        '-vf', f"subtitles={srt_path}",
        '-c:v', 'libx264',
        '-c:a', 'copy',  
        output_path
    ]
    subprocess.run(command, check=True)

def download_youtube(url: str, output_filename: str):
    """ดาวน์โหลดวิดีโอจาก YouTube ด้วย yt-dlp"""
    ydl_opts = {
        'format': 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
        'outtmpl': output_filename,
        'quiet': False
    }
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        ydl.download([url])

def cleanup_files(*filepaths):
    """ลบไฟล์ชั่วคราวเพื่อคืนพื้นที่ให้คอมพิวเตอร์"""
    for path in filepaths:
        if os.path.exists(path):
            os.remove(path)

# --- ส่วนของ API Endpoints ---

@app.post("/process-file")
async def process_file(background_tasks: BackgroundTasks, file: UploadFile = File(...)):
    # สร้างชื่อไฟล์ชั่วคราวที่ไม่ซ้ำกันด้วย Timestamp
    job_id = int(time.time())
    input_vid = f"temp_in_{job_id}.mp4"
    srt_file = f"temp_sub_{job_id}.srt"
    output_vid = f"temp_out_{job_id}.mp4"

    try:
        # บันทึกไฟล์ที่อัปโหลดลงเครื่อง
        with open(input_vid, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # 1. รัน AI ถอดเสียง
        print(f"กำลังถอดเสียงไฟล์: {file.filename}")
        segments, _ = model.transcribe(input_vid, beam_size=5)
        
        # 2. สร้างไฟล์ .srt
        create_srt_file(segments, srt_file)
        
        # 3. ฝังซับไตเติ้ลลงวิดีโอ
        print("กำลังฝังซับไตเติ้ล...")
        burn_subtitles(input_vid, srt_file, output_vid)

        # 4. ตั้งเวลาลบไฟล์ชั่วคราว (ไฟล์ต้นฉบับ และ .srt) หลังจากส่ง Response เสร็จ
        background_tasks.add_task(cleanup_files, input_vid, srt_file)

        # ส่งไฟล์วิดีโอที่มีซับกลับไปให้ผู้ใช้
        return FileResponse(output_vid, media_type="video/mp4", filename=f"subtitled_{file.filename}")

    except Exception as e:
        cleanup_files(input_vid, srt_file, output_vid)
        return {"error": str(e)}

@app.post("/process-youtube")
async def process_youtube(background_tasks: BackgroundTasks, url: str = Form(...)):
    job_id = int(time.time())
    input_vid = f"temp_yt_{job_id}.mp4"
    srt_file = f"temp_sub_{job_id}.srt"
    output_vid = f"temp_out_{job_id}.mp4"

    try:
        # 1. ดาวน์โหลด YouTube
        print(f"กำลังดาวน์โหลด: {url}")
        download_youtube(url, input_vid)

        # 2. รัน AI ถอดเสียง
        print("กำลังถอดเสียง...")
        segments, _ = model.transcribe(input_vid, beam_size=5)
        
        # 3. สร้างไฟล์ .srt
        create_srt_file(segments, srt_file)
        
        # 4. ฝังซับไตเติ้ลลงวิดีโอ
        print("กำลังฝังซับไตเติ้ล...")
        burn_subtitles(input_vid, srt_file, output_vid)

        # 5. สั่งลบไฟล์ชั่วคราว
        background_tasks.add_task(cleanup_files, input_vid, srt_file)

        return FileResponse(output_vid, media_type="video/mp4", filename="youtube_subtitled.mp4")

    except Exception as e:
        cleanup_files(input_vid, srt_file, output_vid)
        return {"error": str(e)}