import os
import math
import logging
from typing import List, Dict, Any
import torch
import whisperx
from app.core.config import settings

try:
    from faster_whisper import WhisperModel
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

            # Group words into clean short subtitle chunks (3-5 words per subtitle or ~1.5 - 2.5s)
            chunk_size = 4 if len(words) > 5 else len(words)
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


def transcribe_audio_whisperx(
    audio_path: str, 
    srt_path: str = None, 
    model_name: str = None, 
    batch_size: int = 8
) -> List[Dict[str, Any]]:
    subtitles: List[Dict[str, Any]] = []
    device = "cuda" if torch.cuda.is_available() else "cpu"
    compute_type = "float16" if device == "cuda" else "int8"
    if model_name is None:
        model_name = "large-v3" if device == "cuda" else "base"

    try:
        if WhisperModel is None:
            raise ImportError("faster_whisper is not installed in the environment.")

        # 1. ถอดเสียงด้วย Faster-Whisper พร้อมบังคับบริบทและลดการเดาสุ่ม
        logger.info(f"Transcribing full audio with Faster-Whisper '{model_name}'...")
        fw_model = WhisperModel(model_name, device=device, compute_type=compute_type)
        segments_raw, _ = fw_model.transcribe(
            audio_path, 
            vad_filter=True,
            vad_parameters=dict(
                min_silence_duration_ms=4000, 
                speech_pad_ms=400             
            ),
            beam_size=5,
            temperature=[0.0, 0.2, 0.4],
            condition_on_previous_text=True
        )

        # 2. แปลงผลลัพธ์ให้อยู่ในรูปแบบ Segment Dict พร้อมตัดคำไทย
        segments = []
        for s in segments_raw:
            text = s.text.strip()
            if not text:
                continue
            
            if word_tokenize:
                tokens = [t.strip() for t in word_tokenize(text, engine="newmm") if t.strip()]
                text_formatted = " ".join(tokens)
            else:
                text_formatted = text

            segments.append({
                "start": float(s.start),
                "end": float(s.end),
                "text": text_formatted
            })

        # 3. ทำ Forced Alignment ด้วย Wav2Vec2 เพื่อล็อกเวลาระดับคำ
        logger.info("Aligning text with Wav2Vec2 via WhisperX...")
        align_model_name = "airesearch/wav2vec2-large-xlsr-53-th"
        model_a, metadata = whisperx.load_align_model(
            language_code="th", device=device, model_name=align_model_name
        )
        
        audio = whisperx.load_audio(audio_path)
        aligned_result = whisperx.align(
            segments, model_a, metadata, audio, device, return_char_alignments=False
        )
        aligned_segments = aligned_result.get("segments", [])

        # 4. จัดกลุ่มคำลงกรอบเวลา
        subtitle_id = 1
        max_words_per_sub = 2
        max_duration_per_sub = 1.0

        for seg in aligned_segments:
            seg_start = float(seg.get("start", 0.0))
            seg_end = float(seg.get("end", 0.0))
            words = seg.get("words", [])

            if not words:
                clean_text = seg.get("text", "").replace(" ", "")
                if clean_text:
                    subtitles.append({
                        "id": subtitle_id,
                        "start": round(seg_start, 2),
                        "end": round(seg_end, 2),
                        "text": clean_text
                    })
                    subtitle_id += 1
                continue

            for i, w in enumerate(words):
                if not is_valid_num(w.get("start")):
                    w["start"] = words[i-1]["end"] if (i > 0 and is_valid_num(words[i-1].get("end"))) else seg_start
                if not is_valid_num(w.get("end")):
                    w["end"] = words[i+1]["start"] if (i + 1 < len(words) and is_valid_num(words[i+1].get("start"))) else seg_end

            current_chunk = []
            current_words_data = []
            current_start = None

            for w in words:
                word_text = w.get("word", "").strip()
                if not word_text:
                    continue

                w_start = float(w.get("start", seg_start))
                w_end = float(w.get("end", seg_end))

                if current_start is None:
                    current_start = w_start

                current_chunk.append(word_text)
                current_words_data.append({
                    "word": word_text,
                    "start": round(w_start, 2),
                    "end": round(w_end, 2)
                })
                current_end = w_end
                current_duration = float(current_end) - float(current_start)

                if len(current_chunk) >= max_words_per_sub or current_duration >= max_duration_per_sub:
                    subtitles.append({
                        "id": subtitle_id,
                        "start": round(float(current_start), 2),
                        "end": round(float(current_end), 2),
                        "text": "".join(current_chunk),
                        "words": current_words_data
                    })
                    subtitle_id += 1
                    current_chunk = []
                    current_words_data = []
                    current_start = None

            if current_chunk:
                c_start = current_start if current_start is not None else seg_start
                c_end = words[-1].get("end", seg_end)
                subtitles.append({
                    "id": subtitle_id,
                    "start": round(float(c_start), 2),
                    "end": round(float(c_end if is_valid_num(c_end) else seg_end), 2),
                    "text": "".join(current_chunk),
                    "words": current_words_data
                })
                subtitle_id += 1

    except Exception as e:
        logger.exception(f"Error executing transcription pipeline: {e}")

    if not subtitles:
        subtitles = [{"id": 1, "start": 0.0, "end": 2.0, "text": "เกิดข้อผิดพลาดในการรันระบบ"}]

    if srt_path:
        with open(srt_path, "w", encoding="utf-8") as f:
            for sub in subtitles:
                start_ts = format_timestamp(sub["start"])
                end_ts = format_timestamp(sub["end"])
                f.write(f"{sub['id']}\n{start_ts} --> {end_ts}\n{sub['text']}\n\n")

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


