import os
import re
import logging
import unicodedata
from functools import lru_cache
from itertools import accumulate
from typing import List, Dict, Any

from app.core.config import settings

from faster_whisper import WhisperModel, BatchedInferencePipeline
from pythainlp.tokenize import word_tokenize

logger = logging.getLogger("ai_services")

def format_timestamp(seconds: float) -> str:
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    millisecs = int((seconds - int(seconds)) * 1000)
    return f"{hours:02d}:{minutes:02d}:{secs:02d},{millisecs:03d}"

def _no_stop(word: str) -> str:
    """Drop sentence-final full stops / ellipses ("world." -> "world", "." -> ""); keeps 3.5, example.com and ? ! ,"""
    return re.sub(r"[.。…]+$", "", word)

def _latin(ch: str) -> bool:
    return ch.isascii() and ch.isalnum()

def _wordy(ch: str) -> bool:
    return ch.isalnum() or unicodedata.category(ch).startswith("M")  # letters, digits, Thai vowel/tone marks

def _join(words: List[str]) -> str:
    """Join words into subtitle text: no spaces between Thai words, a space wherever a Latin word meets another word
    ("Hello world", "รูป AI นี้"). Whisper's own spacing is lost when words are stripped, so rebuild it."""
    out = ""
    for w in words:
        if out and (_latin(out[-1]) or _latin(w[0])) and (_wordy(out[-1]) or out[-1] in ".,!?;:)") and _wordy(w[0]):
            out += " "
        out += w
    return out

def _thai_words(raw: List[tuple]) -> List[tuple]:
    """Whisper emits sub-word pieces [(text_with_leading_space, start, end)]: regroup into real Thai/Latin words,
    timed from their first/last piece. Spaces stay in the text we tokenize, so "Let's go" keeps its word break."""
    owner = [k for k, (t, _, _) in enumerate(raw) for _ in t]
    out, pos = [], 0
    for tok in word_tokenize("".join(t for t, _, _ in raw), engine="newmm"):
        if tok.strip() and pos < len(owner):
            out.append((tok.strip(), raw[owner[pos]][1], raw[owner[min(pos + len(tok), len(owner)) - 1]][2]))
        pos += len(tok)
    return out

def write_srt(subtitles: List[Dict[str, Any]], srt_path: str) -> None:
    with open(srt_path, "w", encoding="utf-8") as f:
        for sub in subtitles:
            f.write(f"{sub['id']}\n{format_timestamp(sub['start'])} --> {format_timestamp(sub['end'])}\n{sub['text']}\n\n")

def transcribe_audio_groq(
    audio_path: str,
    srt_path: str = None,
    language: str = None
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
                **({"language": language} if language and language != "auto" else {}),
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

            words = [c for w in words if (c := _no_stop(w))]
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
                chunk_text = _join(chunk)
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
        write_srt(subtitles, srt_path)

    return subtitles


def _preload_cuda_libs():
    # ctranslate2 doesn't search pip's nvidia-* wheels (torch used to preload them), so load them by path.
    try:
        import ctypes, glob, nvidia
        for pat in ("cublas/lib/libcublasLt.so.12", "cublas/lib/libcublas.so.12", "cudnn/lib/libcudnn.so.9"):
            for f in glob.glob(os.path.join(nvidia.__path__[0], pat)):
                ctypes.CDLL(f, mode=ctypes.RTLD_GLOBAL)
    except Exception as e:  # no wheels -> rely on system CUDA
        logger.warning(f"CUDA preload skipped: {e}")


@lru_cache(maxsize=2)
def _load_model(name: str):
    _preload_cuda_libs()
    # Load once per process; reloading per request was most of the latency.
    # ctranslate2 ships its own CUDA kernels, so this works even when torch lacks them (RTX 50xx).
    import ctranslate2
    gpu = ctranslate2.get_cuda_device_count() > 0
    # Pascal (GTX 10xx) has no fast fp16, so take the best type this GPU actually supports
    supported = ctranslate2.get_supported_compute_types("cuda" if gpu else "cpu")
    compute = "float16" if "float16" in supported else "int8_float32"
    model = WhisperModel(
        name if gpu else "small",
        device="cuda" if gpu else "cpu",
        compute_type=compute,
    )
    return BatchedInferencePipeline(model)


def detect_language(audio_path: str) -> str:
    """Language code of the audio. Uses the general model: the Thai fine-tune calls English 'th' about half the time."""
    from faster_whisper.audio import decode_audio
    audio = decode_audio(audio_path, sampling_rate=16000)
    lang, prob, _ = _load_model(settings.WHISPER_MODEL_GENERAL).model.detect_language(
        audio, vad_filter=True, language_detection_segments=2)
    logger.info(f"detected language: {lang} ({prob:.2f})")
    return lang


def transcribe_audio_whisperx(audio_path: str, srt_path: str = None, language: str = None) -> List[Dict[str, Any]]:
    """Batched faster-whisper with built-in word timestamps. Thai -> Thai fine-tune; any other language -> general model.
    `language`: ISO code ("th", "en", ...) or None/"auto" to detect."""
    subtitles: List[Dict[str, Any]] = []
    try:
        lang = (language or "").strip().lower()
        if lang in ("", "auto"):
            lang = detect_language(audio_path)
        thai = lang == "th"
        segments, info = _load_model(settings.WHISPER_MODEL if thai else settings.WHISPER_MODEL_GENERAL).transcribe(
            audio_path,
            language=lang,
            batch_size=8,
            chunk_length=15,  # 30s chunks make Thai decoding stop early and drop the middle
            word_timestamps=True,
            vad_filter=True,
            vad_parameters=dict(min_silence_duration_ms=500, speech_pad_ms=200),
            beam_size=5,
            temperature=0.0,
            condition_on_previous_text=False,
            initial_prompt=(settings.WHISPER_PROMPT if thai else settings.WHISPER_PROMPT_EN if lang == "en" else "") or None,
        )

        # Group words into subtitle chunks (<= 8 words or 3.5s)
        chunk: List[Dict[str, Any]] = []

        def flush():
            if chunk:
                subtitles.append({
                    "id": len(subtitles) + 1,
                    "start": chunk[0]["start"],
                    "end": chunk[-1]["end"],
                    "text": _join([w["word"] for w in chunk]),
                    "words": list(chunk),
                })
                chunk.clear()

        for seg in segments:
            logger.info(f"transcribed {seg.end:.0f}/{info.duration:.0f}s")
            raw = [(w.word, w.start, w.end) for w in seg.words or [] if w.word.strip()]
            words = _thai_words(raw) if thai else [(t.strip(), a, b) for t, a, b in raw]
            words = [(c, a, b) for t, a, b in words if (c := _no_stop(t))]
            for text, start, end in words:
                chunk.append({"word": text, "start": round(start, 2), "end": round(end, 2)})
                if len(chunk) >= 8 or chunk[-1]["end"] - chunk[0]["start"] >= 3.5:
                    flush()
            flush()  # never merge across segments/pauses

    except Exception as e:
        logger.exception(f"Error executing transcription pipeline: {e}")
        subtitles = [{"id": 1, "start": 0.0, "end": 2.0, "text": f"Error: {str(e)}"}]

    if not subtitles:
        subtitles = [{"id": 1, "start": 0.0, "end": 2.0, "text": "ไม่พบเสียงพูดในคลิป"}]

    if srt_path:
        write_srt(subtitles, srt_path)

    return subtitles


def transcribe_audio(
    audio_path: str,
    srt_path: str = None,
    engine: str = None,
    language: str = None
) -> List[Dict[str, Any]]:
    """
    Unified transcription dispatcher.
    Selects between 'whisperx' and 'groq' based on argument or MODEL setting.
    """
    selected_engine = (engine or settings.MODEL or "groq").lower().strip()

    if selected_engine == "whisperx":
        logger.info("Using WhisperX transcription engine.")
        return transcribe_audio_whisperx(audio_path, srt_path, language)
    else:
        logger.info("Using Groq API transcription engine.")
        return transcribe_audio_groq(audio_path, srt_path, language)


if __name__ == "__main__":  # python -m app.services.ai_services
    assert [_no_stop(w) for w in ("world.", "...", "…", "3.5", "example.com", "Mr.", "ok?", "ครับ.")] == ["world", "", "", "3.5", "example.com", "Mr", "ok?", "ครับ"]
    assert _join(["Hello", "world."]) == "Hello world." and _join(["after", "all,", "and", "can"]) == "after all, and can"
    assert _join(["ฉัน", "ชอบ", "AI", "มาก"]) == "ฉันชอบ AI มาก"
    assert _join([t for t, _, _ in _thai_words([(" Let", 0, .2), ("'s", .2, .3), (" go", .3, .5), (" ไป", .5, .7), ("เที่ยว", .7, 1)])]) == "Let's go ไปเที่ยว"
    assert _join(["ที่", "นี่"]) == "ที่นี่" and _join(["ซึ่ง", "GTA"]) == "ซึ่ง GTA"
    print("ok")
