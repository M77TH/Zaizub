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

def transcribe_audio_whisperx(
    audio_path: str, 
    srt_path: str = None, 
    model_name: str = "large-v3", 
    batch_size: int = 8
) -> List[Dict[str, Any]]:
    subtitles: List[Dict[str, Any]] = []
    device = "cuda" if torch.cuda.is_available() else "cpu"
    compute_type = "float16" if device == "cuda" else "int8"

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

        # 4. จัดกลุ่มคำลงกรอบเวลา (ปรับให้ตัดคำถี่ขึ้น)
        subtitle_id = 1
        max_words_per_sub = 2      # ปรับจาก 4 เป็น 2 เพื่อให้ซับเด้งถี่ขึ้น ดูตรงปากมากขึ้น
        max_duration_per_sub = 1.0 # เพิ่มเงื่อนไข: บังคับตัดซับใหม่หากเวลาเกิน 1 วินาที กันซับค้างบนจอนานไป

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

            # ถมเวลาคำที่ตกหล่น (Interpolation)
            for i, w in enumerate(words):
                if not is_valid_num(w.get("start")):
                    w["start"] = words[i-1]["end"] if (i > 0 and is_valid_num(words[i-1].get("end"))) else seg_start
                if not is_valid_num(w.get("end")):
                    w["end"] = words[i+1]["start"] if (i + 1 < len(words) and is_valid_num(words[i+1].get("start"))) else seg_end

            current_chunk = []
            current_start = None

            for w in words:
                word_text = w.get("word", "").strip()
                if not word_text:
                    continue

                if current_start is None:
                    current_start = w.get("start", seg_start)

                current_chunk.append(word_text)
                current_end = w.get("end", seg_end)
                current_duration = float(current_end) - float(current_start)

                # ตัดรอบเมื่อจำนวนคำครบ หรือเวลาเกินระยะที่กำหนด
                if len(current_chunk) >= max_words_per_sub or current_duration >= max_duration_per_sub:
                    subtitles.append({
                        "id": subtitle_id,
                        "start": round(float(current_start), 2),
                        "end": round(float(current_end), 2),
                        "text": "".join(current_chunk)
                    })
                    subtitle_id += 1
                    current_chunk = []
                    current_start = None

            # เก็บตกคำที่เหลือใน chunk สุดท้ายของ segment
            if current_chunk:
                c_start = current_start if current_start is not None else seg_start
                c_end = words[-1].get("end", seg_end)
                subtitles.append({
                    "id": subtitle_id,
                    "start": round(float(c_start), 2),
                    "end": round(float(c_end if is_valid_num(c_end) else seg_end), 2),
                    "text": "".join(current_chunk)
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
