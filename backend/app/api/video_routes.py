import os
import shutil
import subprocess
import time
import json
import logging
from typing import List, Optional, Union, Dict, Any
from pydantic import BaseModel
from fastapi import APIRouter, UploadFile, File, Form, Request, BackgroundTasks, HTTPException
from fastapi.responses import FileResponse, JSONResponse
from app.services.ai_services import transcribe_audio_whisperx
from app.utils.ass_generator import generate_ass_content
import yt_dlp

logger = logging.getLogger("video_routes")
router = APIRouter()

TEMP_DIR = "temp_storage"
os.makedirs(TEMP_DIR, exist_ok=True)

def cleanup_files(*filepaths):
    """Background task to remove temporary files."""
    for path in filepaths:
        if path and os.path.exists(path):
            try:
                os.remove(path)
            except Exception as e:
                logger.warning(f"Failed to cleanup {path}: {e}")

class SubtitleItem(BaseModel):
    id: Optional[Union[int, str]] = None
    start: float
    end: float
    text: str

class StyleConfig(BaseModel):
    font_family: Optional[str] = "Noto Sans Thai"
    font_size: Optional[int] = 60
    bold: Optional[bool] = False
    italic: Optional[bool] = False
    underline: Optional[bool] = False
    shadow: Optional[bool] = True
    outline: Optional[bool] = False
    shadow_color: Optional[str] = "#000000"
    shadow_thickness: Optional[int] = 2
    text_color: Optional[str] = "#ffffff"
    bg_color: Optional[str] = "#000000"
    bg_opacity: Optional[float] = 0.0
    padding_x: Optional[int] = 24
    padding_y: Optional[int] = 12
    border_radius: Optional[int] = 12
    position: Optional[str] = "bottom"
    animation: Optional[str] = "none"

class RenderRequest(BaseModel):
    video_filename: str
    subtitles: List[SubtitleItem]
    styles: Optional[StyleConfig] = None


@router.post("/extract-audio")
async def extract_audio(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    language: Optional[str] = Form(None)
):
    """
    Endpoint 1:
    - Saves uploaded video to temp_storage.
    - Extracts audio using FFmpeg.
    - Transcribes audio using WhisperX.
    - Returns video_url and structured subtitles JSON array.
    """
    job_id = int(time.time() * 1000)
    original_name = file.filename or "video.mp4"
    _, ext = os.path.splitext(original_name)
    if not ext:
        ext = ".mp4"

    input_video = os.path.join(TEMP_DIR, f"in_{job_id}{ext}").replace("\\", "/")
    temp_audio = os.path.join(TEMP_DIR, f"aud_{job_id}.m4a").replace("\\", "/")

    try:
        # 1. Save uploaded video to disk
        with open(input_video, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # 2. Extract audio via ffmpeg
        extract_cmd = [
            'ffmpeg', '-y',
            '-i', input_video,
            '-vn',
            '-c:a', 'aac',
            '-b:a', '64k',
            temp_audio
        ]
        subprocess.run(extract_cmd, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)

        # 3. Transcribe audio using WhisperX
        subtitles = transcribe_audio_whisperx(temp_audio)

        # Queue audio cleanup
        background_tasks.add_task(cleanup_files, temp_audio)

        filename_only = os.path.basename(input_video)
        video_url = f"/temp_storage/{filename_only}"

        return {
            "success": True,
            "job_id": job_id,
            "video_url": video_url,
            "video_filename": filename_only,
            "subtitles": subtitles
        }

    except subprocess.CalledProcessError as e:
        cleanup_files(input_video, temp_audio)
        logger.error(f"FFmpeg audio extraction error: {e.stderr.decode('utf-8', errors='ignore') if e.stderr else str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to extract audio from video: {str(e)}")
    except Exception as e:
        cleanup_files(input_video, temp_audio)
        logger.error(f"Extract audio error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/render-video")
async def render_video(
    request: Request,
    background_tasks: BackgroundTasks
):
    """
    Endpoint 2:
    - Accepts JSON or FormData payload containing video_filename, subtitles, and styles.
    - Generates .ass subtitle file with styles and animations.
    - Burns subtitles onto video using FFmpeg libass.
    - Returns final rendered MP4 video.
    """
    content_type = request.headers.get("content-type", "")

    # Parse request payload (supports JSON body or FormData)
    if "application/json" in content_type:
        try:
            body = await request.json()
            video_filename = body.get("video_filename", "")
            subtitles_raw = body.get("subtitles", [])
            styles_raw = body.get("styles", {})
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid JSON payload: {e}")
    else:
        form = await request.form()
        video_filename = form.get("video_filename") or form.get("file_name") or ""
        subtitles_str = form.get("subtitles", "[]")
        styles_str = form.get("styles", "{}")
        try:
            subtitles_raw = json.loads(subtitles_str) if isinstance(subtitles_str, str) else subtitles_str
        except Exception:
            subtitles_raw = []
        try:
            styles_raw = json.loads(styles_str) if isinstance(styles_str, str) else styles_str
        except Exception:
            styles_raw = {}

    if not video_filename:
        raise HTTPException(status_code=400, detail="video_filename is required")

    # Resolve video path
    clean_filename = os.path.basename(video_filename)
    input_video_path = os.path.join(TEMP_DIR, clean_filename).replace("\\", "/")

    if not os.path.exists(input_video_path):
        # Also check if it's already an absolute or direct path
        if os.path.exists(video_filename):
            input_video_path = video_filename.replace("\\", "/")
        else:
            raise HTTPException(status_code=404, detail=f"Input video '{clean_filename}' not found on server.")

    job_id = int(time.time() * 1000)
    ass_file_path = os.path.join(TEMP_DIR, f"sub_{job_id}.ass").replace("\\", "/")
    output_video_path = os.path.join(TEMP_DIR, f"out_{job_id}.mp4").replace("\\", "/")

    try:
        # 1. Convert JSON subtitles to .ass file
        ass_content = generate_ass_content(
            subtitles=subtitles_raw,
            styles=styles_raw
        )
        with open(ass_file_path, "w", encoding="utf-8") as f:
            f.write(ass_content)

        # 2. Run FFmpeg with libass filter
        burn_cmd = [
            'ffmpeg', '-y',
            '-i', input_video_path,
            '-vf', f"ass={ass_file_path}",
            '-c:v', 'libx264',
            '-preset', 'fast',
            '-crf', '22',
            '-c:a', 'copy',
            output_video_path
        ]
        res = subprocess.run(burn_cmd, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)

        # 3. Schedule cleanup of the .ass file
        background_tasks.add_task(cleanup_files, ass_file_path)

        return FileResponse(
            output_video_path,
            media_type="video/mp4",
            filename=f"subtitled_{clean_filename}"
        )

    except subprocess.CalledProcessError as e:
        cleanup_files(ass_file_path, output_video_path)
        err_msg = e.stderr.decode('utf-8', errors='ignore') if e.stderr else str(e)
        logger.error(f"FFmpeg render error: {err_msg}")
        raise HTTPException(status_code=500, detail=f"FFmpeg render error: {err_msg}")
    except Exception as e:
        cleanup_files(ass_file_path, output_video_path)
        logger.error(f"Render video error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/process-video")
async def process_video(background_tasks: BackgroundTasks, file: UploadFile = File(...)):
    """Legacy one-step endpoint for backward compatibility."""
    job_id = int(time.time())
    input_video = f"{TEMP_DIR}/in_{job_id}.mp4"
    temp_audio = f"{TEMP_DIR}/aud_{job_id}.m4a"
    srt_file = f"{TEMP_DIR}/sub_{job_id}.srt"
    output_video = f"{TEMP_DIR}/out_{job_id}.mp4"

    try:
        with open(input_video, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        subprocess.run(['ffmpeg', '-y', '-i', input_video, '-vn', '-c:a', 'aac', '-b:a', '64k', temp_audio], check=True)
        transcribe_audio_whisperx(temp_audio, srt_file)
        safe_srt_path = srt_file.replace('\\', '/')
        subprocess.run(['ffmpeg', '-y', '-i', input_video, '-vf', f"subtitles='{safe_srt_path}'", output_video], check=True)

        background_tasks.add_task(cleanup_files, input_video, temp_audio, srt_file)
        return FileResponse(output_video, media_type="video/mp4", filename=f"subtitled_{file.filename}")

    except Exception as e:
        cleanup_files(input_video, temp_audio, srt_file, output_video)
        return {"error": str(e)}


class LinkRequest(BaseModel):
    url: str

@router.post("/process-link")
async def process_link(
    request: LinkRequest,
    background_tasks: BackgroundTasks
):
    """
    Endpoint 3:
    - Accepts JSON with a video URL.
    - Downloads the video using yt-dlp to temp_storage.
    - Extracts audio and calls WhisperX.
    - Returns video_url and subtitles (same format as /extract-audio).
    """
    job_id = int(time.time() * 1000)
    input_video = os.path.join(TEMP_DIR, f"in_{job_id}.mp4").replace("\\", "/")
    temp_audio = os.path.join(TEMP_DIR, f"aud_{job_id}.m4a").replace("\\", "/")

    try:
        # 1. โหลดวิดีโอจากลิงก์ด้วย yt-dlp
        ydl_opts = {
            'format': 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/mp4',
            'outtmpl': input_video,
            'quiet': True,
            'no_warnings': True,
        }
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.download([request.url])

        # 2. แยกเสียงออกมาเป็นไฟล์ .m4a ด้วย FFmpeg
        extract_cmd = [
            'ffmpeg', '-y',
            '-i', input_video,
            '-vn',
            '-c:a', 'aac',
            '-b:a', '64k',
            temp_audio
        ]
        subprocess.run(extract_cmd, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)

        # 3. ถอดเสียงด้วย WhisperX
        subtitles = transcribe_audio_whisperx(temp_audio)

        # ลบไฟล์เสียงชั่วคราวทิ้ง
        background_tasks.add_task(cleanup_files, temp_audio)

        filename_only = os.path.basename(input_video)
        video_url = f"/temp_storage/{filename_only}"

        return {
            "success": True,
            "job_id": job_id,
            "video_url": video_url,
            "video_filename": filename_only,
            "subtitles": subtitles
        }

    except subprocess.CalledProcessError as e:
        cleanup_files(input_video, temp_audio)
        err_msg = e.stderr.decode('utf-8', errors='ignore') if e.stderr else str(e)
        logger.error(f"FFmpeg error processing link: {err_msg}")
        raise HTTPException(status_code=500, detail="Failed to extract audio from downloaded video.")
    except Exception as e:
        cleanup_files(input_video, temp_audio)
        logger.error(f"Download/Process link error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to process video link: {str(e)}")
