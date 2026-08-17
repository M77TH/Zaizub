import os
import shutil
import subprocess
import time
from fastapi import APIRouter, UploadFile, File, BackgroundTasks
from fastapi.responses import FileResponse
from app.services.ai_services import transcribe_audio_groq

router = APIRouter()

def cleanup_files(*filepaths):
    for path in filepaths:
        if os.path.exists(path):
            os.remove(path)

@router.post("/process-video")
async def process_video(background_tasks: BackgroundTasks, file: UploadFile = File(...)):
    job_id = int(time.time())
    # สร้างโฟลเดอร์ temp_storage หากยังไม่มี
    os.makedirs("temp_storage", exist_ok=True)
    
    input_video = f"temp_storage/in_{job_id}.mp4"
    temp_audio = f"temp_storage/aud_{job_id}.m4a"
    srt_file = f"temp_storage/sub_{job_id}.srt"
    output_video = f"temp_storage/out_{job_id}.mp4"

    try:
        with open(input_video, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # 1. แยกเสียง
        subprocess.run(['ffmpeg', '-y', '-i', input_video, '-vn', '-c:a', 'aac', '-b:a', '64k', temp_audio], check=True)
        # 2. รัน Groq AI
        transcribe_audio_groq(temp_audio, srt_file)
        # 3. ฝังซับ
        safe_srt_path = srt_file.replace('\\', '/').replace(':', '\\:')
        subprocess.run(['ffmpeg', '-y', '-i', input_video, '-vf', f"subtitles='{safe_srt_path}'", output_video], check=True)

        background_tasks.add_task(cleanup_files, input_video, temp_audio, srt_file)
        return FileResponse(output_video, media_type="video/mp4", filename=f"subtitled_{file.filename}")

    except Exception as e:
        cleanup_files(input_video, temp_audio, srt_file, output_video)
        return {"error": str(e)}