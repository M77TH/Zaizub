import os
import shutil
import subprocess
import time
import json
import logging
import asyncio
from typing import List, Optional
from pydantic import BaseModel
from fastapi import APIRouter, UploadFile, File, Form, Request, BackgroundTasks, HTTPException
from fastapi.responses import FileResponse
from app.utils.ass_generator import generate_ass_content, compute_canvas_dimensions
from app.core.supabase_client import upload_to_supabase_storage, delete_from_supabase_storage
import yt_dlp
from starlette.concurrency import run_in_threadpool

logger = logging.getLogger("video_routes")
router = APIRouter()

TEMP_DIR = "temp_storage"
os.makedirs(TEMP_DIR, exist_ok=True)

_last_id = 0
def _new_job_id() -> int:
    """Millisecond timestamp, bumped if two requests land in the same ms (single event loop, no lock needed)."""
    global _last_id
    _last_id = max(_last_id + 1, int(time.time() * 1000))
    return _last_id

# One GPU model: transcribe one clip at a time, others queue here instead of OOM-ing / racing
_gpu_lock = asyncio.Semaphore(1)

async def transcribe(audio_path: str, engine: Optional[str]):
    from app.services.ai_services import transcribe_audio
    async with _gpu_lock:
        return await run_in_threadpool(transcribe_audio, audio_path, engine=engine)

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


async def _transcribe_and_upload(job_id: int, input_video: str, engine: Optional[str], background_tasks: BackgroundTasks) -> dict:
    """Shared tail of /extract-audio and /process-link: audio, preview, thumbnail, transcribe, upload."""
    preview_video = os.path.join(TEMP_DIR, f"prev_{job_id}.mp4")
    thumbnail_file = os.path.join(TEMP_DIR, f"thumb_{job_id}.jpg")
    temp_audio = os.path.join(TEMP_DIR, f"aud_{job_id}.wav")
    try:
        logger.info('extracting audio')
        await asyncio.to_thread(subprocess.run, ['ffmpeg', '-y', '-i', input_video, '-vn', '-ac', '1', '-ar', '16000', temp_audio],
                                check=True, capture_output=True)

        async def media():
            # CPU/network work; overlaps with GPU transcription below
            nonlocal preview_video
            logger.info('creating preview and thumbnail')
            try:
                await asyncio.to_thread(create_web_preview, input_video, preview_video)
            except Exception as pe:
                logger.warning(f"Preview transcoding warning: {pe}, using original file")
                preview_video = input_video
            try:
                await asyncio.to_thread(create_thumbnail, input_video, thumbnail_file)
            except Exception as te:
                logger.warning(f"Thumbnail generation warning: {te}")
            urls = [f"/temp_storage/{os.path.basename(preview_video)}",
                    f"/temp_storage/{os.path.basename(thumbnail_file)}" if os.path.exists(thumbnail_file) else ""]
            logger.info('uploading preview and thumbnail')
            try:
                up = lambda f, n, ct: asyncio.to_thread(upload_to_supabase_storage, f, n, bucket_name="videos", content_type=ct)
                jobs = [up(preview_video, f"prev_{job_id}.mp4", "video/mp4")]
                if urls[1]:
                    jobs.append(up(thumbnail_file, f"thumb_{job_id}.jpg", "image/jpeg"))
                urls[:len(jobs)] = await asyncio.gather(*jobs)
                return urls, True
            except Exception as sup_err:
                logger.warning(f"Supabase storage upload warning (serving locally via temp_storage): {sup_err}")
                return urls, False

        logger.info('transcribing + preview in parallel')
        subtitles, ((video_url, thumbnail_url), uploaded) = await asyncio.gather(
            transcribe(temp_audio, engine), media())

        # Keep local preview/thumbnail only if the cloud upload failed
        background_tasks.add_task(cleanup_files, input_video, temp_audio, *([preview_video, thumbnail_file] if uploaded else []))
        logger.info(f'done in {(time.time() * 1000 - job_id) / 1000:.1f}s')
        return {
            "success": True,
            "job_id": job_id,
            "video_url": video_url,
            "thumbnail_url": thumbnail_url,
            "video_filename": os.path.basename(input_video),
            "subtitles": subtitles,
        }
    except Exception:
        cleanup_files(temp_audio, preview_video, thumbnail_file)
        raise

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
    job_id = _new_job_id()
    ext = os.path.splitext(file.filename or "")[1] or ".mp4"
    input_video = os.path.join(TEMP_DIR, f"in_{job_id}{ext}")
    try:
        with open(input_video, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        return await _transcribe_and_upload(job_id, input_video, engine, background_tasks)
    except Exception as e:
        cleanup_files(input_video)
        logger.error(f"Extract audio error: {e}")
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

    video_url = video_url or ""
    # Try the filename, then the url's basename (local preview survives when the cloud upload failed)
    names = [os.path.basename(n.split("?")[0]) for n in (video_filename, video_url) if n]
    if not names:
        raise HTTPException(status_code=400, detail="video_filename or video_url is required")
    clean_filename = names[0]

    input_video_path = next((p for p in (os.path.join(TEMP_DIR, n) for n in names) if os.path.isfile(p)), None)
    scratch_input_file = None
    if not input_video_path:
        # Local copy is deleted after upload, so fall back to the cloud URL
        if not video_url.startswith(("http://", "https://")):
            raise HTTPException(status_code=404, detail=f"Input video '{clean_filename}' not found on server.")
        scratch_input_file = os.path.join(TEMP_DIR, f"scratch_render_{_new_job_id()}.mp4")
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


    job_id = _new_job_id()
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
    job_id = _new_job_id()
    input_video = os.path.join(TEMP_DIR, f"in_{job_id}.mp4")
    try:
        ydl_opts = {
            'format': 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/mp4',
            'outtmpl': input_video,
            'quiet': True,
            'no_warnings': True,
        }
        logger.info('downloading video')
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(request.url, download=True)
        result = await _transcribe_and_upload(job_id, input_video, request.engine, background_tasks)
        result["title"] = (info or {}).get('title') or ""
        return result
    except Exception as e:
        cleanup_files(input_video)
        logger.error(f"Download/Process link error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to process video link: {e}")



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

