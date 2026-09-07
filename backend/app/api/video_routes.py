import os
import shutil
import subprocess
import time
import json
import logging
import asyncio
from typing import List, Optional, Union, Dict, Any
from pydantic import BaseModel
from fastapi import APIRouter, UploadFile, File, Form, Request, BackgroundTasks, HTTPException
from fastapi.responses import FileResponse, JSONResponse
from app.utils.ass_generator import generate_ass_content, compute_canvas_dimensions
from app.core.supabase_client import upload_to_supabase_storage, delete_from_supabase_storage
import yt_dlp

logger = logging.getLogger("video_routes")
router = APIRouter()

TEMP_DIR = "temp_storage"
os.makedirs(TEMP_DIR, exist_ok=True)

def cleanup_files(*filepaths, delay: float = 0.0):
    """Background task to remove temporary files, with optional delay for streamed responses."""
    if delay > 0:
        time.sleep(delay)
    for path in filepaths:
        if path and os.path.exists(path):
            try:
                os.remove(path)
                logger.info(f"Cleaned up temp file: {path}")
            except Exception as e:
                logger.warning(f"Failed to cleanup {path}: {e}")

def cleanup_stale_temp_storage(max_age_seconds: int = 3600):
    """Prunes temporary files older than max_age_seconds to prevent disk buildup."""
    if not os.path.exists(TEMP_DIR):
        return
    now = time.time()
    for fname in os.listdir(TEMP_DIR):
        fpath = os.path.join(TEMP_DIR, fname)
        if os.path.isfile(fpath):
            try:
                # Remove intermediate files immediately if they are out_, sub_, or scratch_
                is_intermediate = fname.startswith(("out_", "sub_", "scratch_"))
                file_age = now - os.path.getmtime(fpath)
                if (is_intermediate and file_age > 120) or (file_age > max_age_seconds):
                    os.remove(fpath)
                    logger.info(f"Auto-pruned stale temp file: {fpath}")
            except Exception:
                pass

class StyleConfig(BaseModel):
    font_family: Optional[str] = "Noto Sans Thai"
    font_size: Optional[int] = 52
    bold: Optional[bool] = True
    italic: Optional[bool] = False
    underline: Optional[bool] = False
    shadow: Optional[bool] = False
    outline: Optional[bool] = False
    shadow_color: Optional[str] = "#000000"
    shadow_thickness: Optional[int] = 2
    text_color: Optional[str] = "#ffffff"
    bg_color: Optional[str] = "#000000"
    bg_opacity: Optional[float] = 0.85
    padding_x: Optional[int] = 18
    padding_y: Optional[int] = 10
    border_radius: Optional[int] = 12
    position: Optional[str] = "bottom"
    custom_x: Optional[float] = 50.0
    custom_y: Optional[float] = 82.0
    box_width: Optional[float] = 86.0
    animation: Optional[str] = "none"

    class Config:
        extra = "allow"

class SubtitleItem(BaseModel):
    id: Optional[Union[int, str]] = None
    start: float
    end: float
    text: str
    style: Optional[Dict[str, Any]] = None

    class Config:
        extra = "allow"

class RenderRequest(BaseModel):
    video_filename: str
    subtitles: List[SubtitleItem]
    styles: Optional[StyleConfig] = None
    video_width: Optional[int] = None
    video_height: Optional[int] = None

class DeleteMediaRequest(BaseModel):
    urls: Optional[List[str]] = []
    paths: Optional[List[str]] = []



def create_web_preview(input_path: str, preview_path: str):
    """
    Transcodes or normalizes video to standard H.264 / AAC MP4 with YUV420p and faststart.
    Optimized for Supabase Free Tier: scales to max 720p at CRF 28 and ~800k bitrate
    so a 2-minute video is only ~8-12 MB.
    """
    cmd = [
        'ffmpeg', '-y',
        '-i', input_path,
        '-vf', "scale='min(720,iw)':-2",
        '-c:v', 'libx264',
        '-pix_fmt', 'yuv420p',
        '-preset', 'fast',
        '-crf', '28',
        '-b:v', '900k',
        '-maxrate', '1200k',
        '-bufsize', '1800k',
        '-c:a', 'aac',
        '-b:a', '96k',
        '-movflags', '+faststart',
        preview_path
    ]
    subprocess.run(cmd, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)


def create_thumbnail(input_path: str, thumbnail_path: str):
    """
    Generates a crisp, high-quality JPG poster thumbnail frame (~100-150KB).
    Uses high-quality bicubic/lanczos scaling and low compression (q:v 2)
    so covers look razor sharp on retina/HD displays.
    """
    cmd = [
        'ffmpeg', '-y',
        '-ss', '00:00:01',
        '-i', input_path,
        '-vframes', '1',
        '-vf', "scale='min(1080,iw)':-2:flags=lanczos",
        '-q:v', '2',
        thumbnail_path
    ]
    try:
        subprocess.run(cmd, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    except Exception as e:
        # Fallback to frame 0 if video is shorter than 1 second
        cmd_fallback = [
            'ffmpeg', '-y',
            '-i', input_path,
            '-vframes', '1',
            '-vf', "scale='min(1080,iw)':-2:flags=lanczos",
            '-q:v', '2',
            thumbnail_path
        ]
        subprocess.run(cmd_fallback, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)


def probe_video_dimensions(video_path: str) -> tuple[int, int]:
    """
    Returns (width, height) of the video file using ffprobe.
    Defaults to 1080, 1920 if probing fails.
    """
    try:
        cmd = [
            'ffprobe', '-v', 'error',
            '-select_streams', 'v:0',
            '-show_entries', 'stream=width,height',
            '-of', 'json',
            video_path
        ]
        res = subprocess.run(cmd, capture_output=True, text=True, check=True)
        data = json.loads(res.stdout)
        stream = data.get('streams', [{}])[0]
        w = int(stream.get('width', 1080))
        h = int(stream.get('height', 1920))
        if w > 0 and h > 0:
            return w, h
    except Exception as e:
        logger.warning(f"Failed to probe video dimensions for {video_path}: {e}")
    return 1080, 1920


@router.post("/extract-audio")
async def extract_audio(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    language: Optional[str] = Form(None),
    engine: Optional[str] = Form(None)
):
    """
    Endpoint 1:
    - Saves uploaded video to temp_storage.
    - Extracts audio using FFmpeg and creates web-compatible preview video.
    - Transcribes audio using Groq API or WhisperX.
    - Returns video_url (browser-compatible H.264) and structured subtitles JSON array.
    """
    job_id = int(time.time() * 1000)
    original_name = file.filename or "video.mp4"
    _, ext = os.path.splitext(original_name)
    if not ext:
        ext = ".mp4"

    input_video = os.path.join(TEMP_DIR, f"in_{job_id}{ext}").replace("\\", "/")
    preview_video = os.path.join(TEMP_DIR, f"prev_{job_id}.mp4").replace("\\", "/")
    thumbnail_file = os.path.join(TEMP_DIR, f"thumb_{job_id}.jpg").replace("\\", "/")
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

        # 3. Generate browser-compatible H.264 preview video and thumbnail poster
        try:
            create_web_preview(input_video, preview_video)
            preview_filename = os.path.basename(preview_video)
        except Exception as pe:
            logger.warning(f"Preview transcoding warning: {pe}, using original file")
            preview_filename = os.path.basename(input_video)

        thumbnail_filename = ""
        try:
            # Generate thumbnail from original source video for maximum clarity
            create_thumbnail(input_video if os.path.exists(input_video) else preview_video, thumbnail_file)
            thumbnail_filename = os.path.basename(thumbnail_file)
        except Exception as te:
            logger.warning(f"Thumbnail generation warning: {te}")

        # 4. Transcribe audio using selected engine (groq or whisperx)
        from app.services.ai_services import transcribe_audio
        subtitles = transcribe_audio(temp_audio, engine=engine)

        filename_only = os.path.basename(input_video)

        # 5. Upload compressed preview and thumbnail to Supabase Storage
        video_url = f"/temp_storage/{preview_filename}"
        thumbnail_url = f"/temp_storage/{thumbnail_filename}" if thumbnail_filename else ""

        uploaded_to_cloud = False
        try:
            # Upload compressed preview video
            actual_preview_file = preview_video if os.path.exists(preview_video) else input_video
            if os.path.exists(actual_preview_file):
                uploaded_video_url = upload_to_supabase_storage(
                    actual_preview_file,
                    f"prev_{job_id}.mp4",
                    bucket_name="videos",
                    content_type="video/mp4"
                )
                video_url = uploaded_video_url
                uploaded_to_cloud = True
            
            # Upload thumbnail
            if thumbnail_file and os.path.exists(thumbnail_file):
                uploaded_thumb_url = upload_to_supabase_storage(
                    thumbnail_file,
                    f"thumb_{job_id}.jpg",
                    bucket_name="videos",
                    content_type="image/jpeg"
                )
                thumbnail_url = uploaded_thumb_url
        except Exception as sup_err:
            logger.warning(f"Supabase storage upload warning (serving locally via temp_storage): {sup_err}")

        # Always clean up raw video and extracted audio immediately to save local disk
        files_to_clean = [input_video, temp_audio]
        if uploaded_to_cloud:
            # Only delete local preview and thumbnail if they were safely stored in Supabase
            files_to_clean.extend([preview_video, thumbnail_file])

        background_tasks.add_task(cleanup_files, *files_to_clean)

        return {
            "success": True,
            "job_id": job_id,
            "video_url": video_url,
            "thumbnail_url": thumbnail_url,
            "video_filename": filename_only,
            "subtitles": subtitles
        }

    except subprocess.CalledProcessError as e:
        cleanup_files(input_video, temp_audio, preview_video)
        logger.error(f"FFmpeg audio extraction error: {e.stderr.decode('utf-8', errors='ignore') if e.stderr else str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to extract audio from video: {str(e)}")
    except Exception as e:
        cleanup_files(input_video, temp_audio, preview_video)
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
    video_url = ""
    aspect_ratio = None  # Will be set from request body
    req_width = None
    req_height = None
    req_preview_w = None
    req_preview_h = None
    if "application/json" in content_type:
        try:
            body = await request.json()
            video_filename = body.get("video_filename", "")
            video_url = body.get("video_url", "")
            aspect_ratio = body.get("aspect_ratio") or None
            subtitles_raw = body.get("subtitles", [])
            styles_raw = body.get("styles", {})
            req_width = body.get("video_width")
            req_height = body.get("video_height")
            req_preview_w = body.get("preview_width")
            req_preview_h = body.get("preview_height")
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid JSON payload: {e}")
    else:
        form = await request.form()
        video_filename = form.get("video_filename") or form.get("file_name") or ""
        video_url = form.get("video_url") or ""
        aspect_ratio = form.get("aspect_ratio") or None
        subtitles_str = form.get("subtitles", "[]")
        styles_str = form.get("styles", "{}")
        req_width = form.get("video_width")
        req_height = form.get("video_height")
        req_preview_w = form.get("preview_width")
        req_preview_h = form.get("preview_height")
        try:
            subtitles_raw = json.loads(subtitles_str) if isinstance(subtitles_str, str) else subtitles_str
        except Exception:
            subtitles_raw = []
        try:
            styles_raw = json.loads(styles_str) if isinstance(styles_str, str) else styles_str
        except Exception:
            styles_raw = {}

    logger.info(f"render-video: aspect_ratio={aspect_ratio!r}")

    # Extract target filename from either video_filename or video_url
    clean_filename = ""
    if video_filename and video_filename != "sample_video.mp4":
        clean_filename = os.path.basename(video_filename)
    elif video_url:
        clean_filename = os.path.basename(video_url.split("?")[0])

    if not clean_filename or clean_filename == "sample_video.mp4":
        # Check if there is any recent in_*.mp4 or prev_*.mp4 in temp_storage
        if os.path.exists(TEMP_DIR):
            existing_vids = [
                f for f in os.listdir(TEMP_DIR)
                if (f.startswith("in_") or f.startswith("prev_")) and f.endswith(".mp4")
            ]
            if existing_vids:
                existing_vids.sort(key=lambda x: os.path.getmtime(os.path.join(TEMP_DIR, x)), reverse=True)
                clean_filename = existing_vids[0]

    if not clean_filename:
        raise HTTPException(status_code=400, detail="video_filename or video_url is required")

    # 1. First attempt to resolve input video from local storage
    input_video_path = None
    scratch_input_file = None

    # Check directly by clean_filename or video_filename if available locally
    if clean_filename:
        direct_local = os.path.join(TEMP_DIR, clean_filename).replace("\\", "/")
        if os.path.exists(direct_local):
            input_video_path = direct_local

    if not input_video_path and video_filename and os.path.exists(video_filename):
        input_video_path = video_filename.replace("\\", "/")

    # Check for stem match in temp_storage (e.g. matching timestamp in in_* or prev_*)
    if not input_video_path and clean_filename and os.path.exists(TEMP_DIR):
        stem = clean_filename.replace("in_", "").replace("prev_", "").replace("out_", "").replace("subtitled_", "").split(".")[0]
        if stem:
            candidates = []
            for fname in os.listdir(TEMP_DIR):
                if stem in fname and fname.endswith(".mp4"):
                    full_p = os.path.join(TEMP_DIR, fname).replace("\\", "/")
                    candidates.append(full_p)
            if candidates:
                # Prefer in_* (original high-res) over prev_* or other
                in_candidates = [c for c in candidates if "in_" in os.path.basename(c)]
                input_video_path = in_candidates[0] if in_candidates else candidates[0]

    # 2. If not found locally and video_url is a remote URL, download it with a timeout
    is_loopback_url = any(host in video_url for host in ["localhost:8000", "127.0.0.1:8000"])
    if not input_video_path and video_url and (video_url.startswith("http://") or video_url.startswith("https://")) and not is_loopback_url:
        job_id_scratch = int(time.time() * 1000)
        scratch_input_file = os.path.join(TEMP_DIR, f"scratch_render_{job_id_scratch}.mp4").replace("\\", "/")
        try:
            import urllib.request
            logger.info(f"Downloading source video from cloud for rendering: {video_url}")
            req = urllib.request.Request(video_url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"})
            def _download_stream():
                with urllib.request.urlopen(req, timeout=30) as resp, open(scratch_input_file, "wb") as out_f:
                    shutil.copyfileobj(resp, out_f)
            await asyncio.to_thread(_download_stream)
            input_video_path = scratch_input_file
        except Exception as dl_err:
            logger.error(f"Failed to fetch cloud video {video_url}: {dl_err}")
            cleanup_files(scratch_input_file)
            raise HTTPException(status_code=400, detail=f"Failed to download video from cloud for rendering: {dl_err}")

    # Fallback to the most recent mp4 in temp_storage if still not found
    if not input_video_path and os.path.exists(TEMP_DIR):
        existing_vids = [
            f for f in os.listdir(TEMP_DIR)
            if (f.startswith("in_") or f.startswith("prev_")) and f.endswith(".mp4")
        ]
        if existing_vids:
            existing_vids.sort(key=lambda x: os.path.getmtime(os.path.join(TEMP_DIR, x)), reverse=True)
            input_video_path = os.path.join(TEMP_DIR, existing_vids[0]).replace("\\", "/")

    if not input_video_path or not os.path.exists(input_video_path):
        raise HTTPException(status_code=404, detail=f"Input video '{clean_filename}' not found on server.")

    job_id = int(time.time() * 1000)
    ass_file_path = os.path.join(TEMP_DIR, f"sub_{job_id}.ass").replace("\\", "/")
    output_video_path = os.path.join(TEMP_DIR, f"out_{job_id}.mp4").replace("\\", "/")

    try:
        # Probe exact video width and height from input video
        real_width, real_height = probe_video_dimensions(input_video_path)
        # Compute canvas dimensions matching requested aspect_ratio (e.g. 16:9, 9:16, 1:1)
        canvas_w, canvas_h = compute_canvas_dimensions(real_width, real_height, aspect_ratio)
        logger.info(f"render-video: real={real_width}x{real_height}, aspect_ratio={aspect_ratio!r}, canvas={canvas_w}x{canvas_h}")

        # 1. Convert JSON subtitles to .ass file with canvas dimensions
        ass_content = generate_ass_content(
            subtitles=subtitles_raw,
            styles=styles_raw,
            video_width=canvas_w,
            video_height=canvas_h,
            preview_width=req_preview_w,
            preview_height=req_preview_h
        )
        with open(ass_file_path, "w", encoding="utf-8") as f:
            f.write(ass_content)

        # 2. Run FFmpeg with libass filter asynchronously in thread pool so it does NOT freeze server
        # Escape colons (C\:) so FFmpeg filtergraph parser does not interpret drive letter as option separator
        safe_ass_path = ass_file_path.replace("\\", "/").replace(":", "\\:")

        # If canvas differs from video aspect ratio/size, letterbox/pillarbox to canvas before burning ASS
        if canvas_w != real_width or canvas_h != real_height:
            filter_str = f"scale={canvas_w}:{canvas_h}:force_original_aspect_ratio=decrease,pad={canvas_w}:{canvas_h}:(ow-iw)/2:(oh-ih)/2:color=black,setsar=1,ass='{safe_ass_path}'"
        else:
            filter_str = f"ass='{safe_ass_path}'"

        burn_cmd = [
            'ffmpeg', '-y',
            '-i', input_video_path,
            '-vf', filter_str,
            '-c:v', 'libx264',
            '-preset', 'veryfast',
            '-crf', '22',
            '-c:a', 'copy',
            output_video_path
        ]

        def _run_burn():
            return subprocess.run(burn_cmd, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)

        await asyncio.to_thread(_run_burn)

        # 3. Schedule cleanup of temp files:
        # - ass_file and scratch_input_file cleaned immediately
        # - output_video_path cleaned after 30 seconds delay to ensure client finishes downloading
        # - trigger stale files purge in background
        background_tasks.add_task(cleanup_files, ass_file_path, scratch_input_file)
        background_tasks.add_task(cleanup_files, output_video_path, delay=30.0)
        background_tasks.add_task(cleanup_stale_temp_storage)

        return FileResponse(
            output_video_path,
            media_type="video/mp4",
            filename=f"subtitled_{clean_filename}"
        )

    except subprocess.CalledProcessError as e:
        cleanup_files(ass_file_path, output_video_path, scratch_input_file)
        err_msg = e.stderr.decode('utf-8', errors='ignore') if e.stderr else str(e)
        logger.error(f"FFmpeg render error: {err_msg}")
        raise HTTPException(status_code=500, detail=f"FFmpeg render error: {err_msg}")
    except Exception as e:
        cleanup_files(ass_file_path, output_video_path, scratch_input_file)
        logger.error(f"Render video error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/process-video")
async def process_video(
    background_tasks: BackgroundTasks, 
    file: UploadFile = File(...),
    engine: Optional[str] = Form(None)
):
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
        transcribe_audio(temp_audio, srt_file, engine=engine)
        safe_srt_path = srt_file.replace('\\', '/')
        subprocess.run(['ffmpeg', '-y', '-i', input_video, '-vf', f"subtitles='{safe_srt_path}'", output_video], check=True)

        background_tasks.add_task(cleanup_files, input_video, temp_audio, srt_file)
        return FileResponse(output_video, media_type="video/mp4", filename=f"subtitled_{file.filename}")

    except Exception as e:
        cleanup_files(input_video, temp_audio, srt_file, output_video)
        return {"error": str(e)}


class LinkRequest(BaseModel):
    url: str
    engine: Optional[str] = None

@router.post("/process-link")
async def process_link(
    request: LinkRequest,
    background_tasks: BackgroundTasks
):
    """
    Endpoint 3:
    - Accepts JSON with a video URL.
    - Downloads the video using yt-dlp to temp_storage.
    - Extracts audio and calls transcribe_audio.
    - Returns video_url and subtitles (same format as /extract-audio).
    """
    job_id = int(time.time() * 1000)
    input_video = os.path.join(TEMP_DIR, f"in_{job_id}.mp4").replace("\\", "/")
    temp_audio = os.path.join(TEMP_DIR, f"aud_{job_id}.m4a").replace("\\", "/")

    try:
        # 1. โหลดวิดีโอจากลิงก์ด้วย yt-dlp และดึงชื่อคลิปต้นทางจริง
        video_title = ""
        ydl_opts = {
            'format': 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/mp4',
            'outtmpl': input_video,
            'quiet': True,
            'no_warnings': True,
        }
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(request.url, download=True)
            if info:
                video_title = info.get('title') or ""

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

        # 3. Generate browser-compatible H.264 preview video and thumbnail poster
        preview_video = os.path.join(TEMP_DIR, f"prev_{job_id}.mp4").replace("\\", "/")
        try:
            create_web_preview(input_video, preview_video)
            preview_filename = os.path.basename(preview_video)
        except Exception as pe:
            logger.warning(f"Preview transcoding warning: {pe}, using original file")
            preview_filename = os.path.basename(input_video)

        thumbnail_file = os.path.join(TEMP_DIR, f"thumb_{job_id}.jpg").replace("\\", "/")
        thumbnail_filename = ""
        try:
            create_thumbnail(input_video if os.path.exists(input_video) else preview_video, thumbnail_file)
            thumbnail_filename = os.path.basename(thumbnail_file)
        except Exception as te:
            logger.warning(f"Thumbnail generation warning: {te}")

        # 4. ถอดเสียงด้วย transcribe_audio (groq หรือ whisperx)
        from app.services.ai_services import transcribe_audio
        subtitles = transcribe_audio(temp_audio, engine=request.engine)

        filename_only = os.path.basename(input_video)

        # 5. Upload compressed preview and thumbnail to Supabase Storage
        video_url = f"/temp_storage/{preview_filename}"
        thumbnail_url = f"/temp_storage/{thumbnail_filename}" if thumbnail_filename else ""

        uploaded_to_cloud = False
        try:
            actual_preview_file = preview_video if os.path.exists(preview_video) else input_video
            if os.path.exists(actual_preview_file):
                uploaded_video_url = upload_to_supabase_storage(
                    actual_preview_file,
                    f"prev_{job_id}.mp4",
                    bucket_name="videos",
                    content_type="video/mp4"
                )
                video_url = uploaded_video_url
                uploaded_to_cloud = True

            if thumbnail_file and os.path.exists(thumbnail_file):
                uploaded_thumb_url = upload_to_supabase_storage(
                    thumbnail_file,
                    f"thumb_{job_id}.jpg",
                    bucket_name="videos",
                    content_type="image/jpeg"
                )
                thumbnail_url = uploaded_thumb_url
        except Exception as sup_err:
            logger.warning(f"Supabase storage upload warning (link download): {sup_err}")

        # Always clean up raw video and extracted audio immediately to save local disk
        files_to_clean = [input_video, temp_audio]
        if uploaded_to_cloud:
            files_to_clean.extend([preview_video, thumbnail_file])

        background_tasks.add_task(cleanup_files, *files_to_clean)

        return {
            "success": True,
            "job_id": job_id,
            "title": video_title,
            "video_url": video_url,
            "thumbnail_url": thumbnail_url,
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


@router.post("/delete-media")
async def delete_media(payload: DeleteMediaRequest):
    """
    Purges preview video and thumbnail files from Supabase Storage bucket ('videos')
    and any local copies in temp_storage.
    """
    to_delete_storage: List[str] = list(payload.paths or [])

    def extract_filename(url: str) -> Optional[str]:
        if not url:
            return None
        clean = url.split("?")[0].split("#")[0].strip()
        import re
        match = re.search(r"/videos/([^/?#]+)$", clean)
        if match:
            return match.group(1)
        base = os.path.basename(clean)
        if base.startswith(("prev_", "thumb_")):
            return base
        return None

    for url in (payload.urls or []):
        fn = extract_filename(url)
        if fn:
            to_delete_storage.append(fn)

        # Also purge any local files residing in temp_storage
        clean_url = url.split("?")[0].split("#")[0].strip()
        if "/temp_storage/" in clean_url or clean_url.startswith("temp_storage/"):
            local_name = os.path.basename(clean_url)
            local_path = os.path.join(TEMP_DIR, local_name)
            if os.path.exists(local_path):
                try:
                    os.remove(local_path)
                    logger.info(f"Removed local temp_storage file: {local_path}")
                except Exception as ex:
                    logger.warning(f"Could not remove local file {local_path}: {ex}")

    # Remove duplicates
    unique_storage_files = list(dict.fromkeys(to_delete_storage))

    removed_results = []
    if unique_storage_files:
        try:
            removed_results = delete_from_supabase_storage(unique_storage_files, bucket_name="videos")
            logger.info(f"Purged from Supabase Storage: {unique_storage_files} -> {removed_results}")
        except Exception as e:
            logger.error(f"Error purging from Supabase Storage: {e}")
            raise HTTPException(status_code=500, detail=f"Storage delete failed: {str(e)}")

    return {
        "success": True,
        "deleted_storage_files": unique_storage_files,
        "details": removed_results
    }

