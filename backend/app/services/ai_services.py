import os
import math
import logging
import warnings
from functools import lru_cache
from typing import List, Dict, Any

# Suppress harmless deprecation warnings from transformers (e.g. gradient_checkpointing in Wav2Vec2/WhisperX)
warnings.filterwarnings("ignore", message=r".*gradient_checkpointing.*", category=UserWarning)

from app.core.config import settings

try:
    from faster_whisper import WhisperModel, BatchedInferencePipeline
except ImportError:
    WhisperModel = None

try:
    from pythainlp.tokenize import word_tokenize
except ImportError:
    word_tokenize = None

logger = logging.getLogger("ai_services")

def format_timestamp(seconds: float) -> str:
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    millisecs = int((seconds - int(seconds)) * 1000)
    return f"{hours:02d}:{minutes:02d}:{secs:02d},{millisecs:03d}"

def is_valid_num(val: Any) -> bool:
    if val is None:
        return False
    try:
        return not math.isnan(float(val))
    except (ValueError, TypeError):
        return False

def transcribe_audio_groq(
    audio_path: str,
    srt_path: str = None
) -> List[Dict[str, Any]]:
    """
    Fast cloud transcription using Groq API (whisper-large-v3).
    Segments are processed with Thai word tokenization and natural subtitle grouping.
    """
    subtitles: List[Dict[str, Any]] = []
    
    if not settings.GROQ_API_KEY:
        logger.error("GROQ_API_KEY is not set in environment or .env file.")
        return [{"id": 1, "start": 0.0, "end": 2.0, "text": "กรุณาตั้งค่า GROQ_API_KEY ในไฟล์ .env"}]

    try:
        from groq import Groq
        client = Groq(api_key=settings.GROQ_API_KEY)

        logger.info("Transcribing audio with Groq API (whisper-large-v3)...")
        with open(audio_path, "rb") as file:
            transcription = client.audio.transcriptions.create(
                file=(os.path.basename(audio_path), file.read()),
                model="whisper-large-v3",
                response_format="verbose_json",
                language="th",
                temperature=0.0
            )

        raw_segments = getattr(transcription, "segments", None) or []
        subtitle_id = 1

        for seg in raw_segments:
            seg_dict = seg if isinstance(seg, dict) else seg.__dict__
            text = (seg_dict.get("text") or "").strip()
            if not text:
                continue

            seg_start = float(seg_dict.get("start", 0.0))
            seg_end = float(seg_dict.get("end", seg_start + 1.5))
            seg_duration = max(0.2, seg_end - seg_start)

            # Tokenize Thai words if pythainlp is available
            if word_tokenize:
                words = [w.strip() for w in word_tokenize(text, engine="newmm") if w.strip()]
            else:
                words = [w for w in text.split(" ") if w]

            if not words:
                continue

            # Calculate word-level timestamps
            word_time = seg_duration / len(words)
            words_data = []
            for w_idx, w in enumerate(words):
                w_start = seg_start + (w_idx * word_time)
                w_end = min(seg_end, w_start + word_time)
                words_data.append({
                    "word": w,
                    "start": round(float(w_start), 2),
                    "end": round(float(w_end), 2)
                })

            # Group words into natural sentence subtitle chunks (~8-10 words per subtitle or ~3s)
            chunk_size = 8 if len(words) > 10 else len(words)
            total_chunks = (len(words) + chunk_size - 1) // chunk_size
            chunk_time = seg_duration / total_chunks

            for idx, i in enumerate(range(0, len(words), chunk_size)):
                chunk = words[i:i + chunk_size]
                chunk_words_data = words_data[i:i + chunk_size]
                chunk_text = "".join(chunk) if word_tokenize else " ".join(chunk)
                c_start = chunk_words_data[0]["start"] if chunk_words_data else (seg_start + (idx * chunk_time))
                c_end = chunk_words_data[-1]["end"] if chunk_words_data else min(seg_end, c_start + chunk_time)

                subtitles.append({
                    "id": subtitle_id,
                    "start": round(float(c_start), 2),
                    "end": round(float(c_end), 2),
                    "text": chunk_text,
                    "words": chunk_words_data
                })
                subtitle_id += 1

    except Exception as e:
        logger.exception(f"Error in Groq transcription: {e}")
        subtitles = [{"id": 1, "start": 0.0, "end": 2.0, "text": f"Groq Error: {str(e)}"}]

    if not subtitles:
        subtitles = [{"id": 1, "start": 0.0, "end": 2.0, "text": "ไม่พบเสียงพูดในคลิป"}]

    if srt_path:
        with open(srt_path, "w", encoding="utf-8") as f:
            for sub in subtitles:
                start_ts = format_timestamp(sub["start"])
                end_ts = format_timestamp(sub["end"])
                f.write(f"{sub['id']}\n{start_ts} --> {end_ts}\n{sub['text']}\n\n")

    return subtitles


@lru_cache(maxsize=1)
def _load_model():
    # Load once per process; reloading per request was most of the latency.
    # ctranslate2 ships its own CUDA kernels, so this works even when torch lacks them (RTX 50xx).
    import ctranslate2
    gpu = ctranslate2.get_cuda_device_count() > 0
    # Pascal (GTX 10xx) has no fast fp16, so take the best type this GPU actually supports
    supported = ctranslate2.get_supported_compute_types("cuda" if gpu else "cpu")
    compute = next(c for c in ("float16", "int8_float16", "int8_float32", "int8") if c in supported)
    model = WhisperModel(
        settings.WHISPER_MODEL if gpu else "small",
        device="cuda" if gpu else "cpu",
        compute_type=compute,
    )
    return BatchedInferencePipeline(model)


def transcribe_audio_whisperx(audio_path: str, srt_path: str = None) -> List[Dict[str, Any]]:
    """Thai-tuned faster-whisper, batched, with built-in word timestamps (no wav2vec2 align pass)."""
    subtitles: List[Dict[str, Any]] = []
    try:
        if WhisperModel is None:
            raise ImportError("faster_whisper is not installed in the environment.")
        segments, _ = _load_model().transcribe(
            audio_path,
            language="th",
            batch_size=8,
            word_timestamps=True,
            vad_filter=True,
            vad_parameters=dict(min_silence_duration_ms=500, speech_pad_ms=200),
            beam_size=5,
            temperature=0.0,
            condition_on_previous_text=False,
        )

        # Group words into subtitle chunks (<= 8 words or 3.5s)
        chunk: List[Dict[str, Any]] = []

        def flush():
            if chunk:
                subtitles.append({
                    "id": len(subtitles) + 1,
                    "start": chunk[0]["start"],
                    "end": chunk[-1]["end"],
                    "text": "".join(w["word"] for w in chunk),
                    "words": list(chunk),
                })
                chunk.clear()

        for seg in segments:
            for w in seg.words or []:
                if not w.word.strip():
                    continue
                chunk.append({"word": w.word.strip(), "start": round(w.start, 2), "end": round(w.end, 2)})
                if len(chunk) >= 8 or chunk[-1]["end"] - chunk[0]["start"] >= 3.5:
                    flush()
            flush()  # never merge across segments/pauses

    except Exception as e:
        logger.exception(f"Error executing transcription pipeline: {e}")
        subtitles = [{"id": 1, "start": 0.0, "end": 2.0, "text": f"Error: {str(e)}"}]

    if not subtitles:
        subtitles = [{"id": 1, "start": 0.0, "end": 2.0, "text": "ไม่พบเสียงพูดในคลิป"}]

    if srt_path:
        with open(srt_path, "w", encoding="utf-8") as f:
            for sub in subtitles:
                f.write(f"{sub['id']}\n{format_timestamp(sub['start'])} --> {format_timestamp(sub['end'])}\n{sub['text']}\n\n")

    return subtitles


def transcribe_audio(
    audio_path: str,
    srt_path: str = None,
    engine: str = None
) -> List[Dict[str, Any]]:
    """
    Unified transcription dispatcher.
    Selects between 'whisperx' and 'groq' based on argument or MODEL setting.
    """
    selected_engine = (engine or settings.MODEL or "groq").lower().strip()

    if selected_engine == "whisperx":
        logger.info("Using WhisperX transcription engine.")
        return transcribe_audio_whisperx(audio_path, srt_path)
    else:
        logger.info("Using Groq API transcription engine.")
        return transcribe_audio_groq(audio_path, srt_path)


