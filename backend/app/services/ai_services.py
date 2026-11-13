import os
import re
import logging
import unicodedata
from functools import lru_cache
from itertools import accumulate
from typing import List, Dict, Any, Optional

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

_THAI_CHAR_RE = re.compile(r"[\u0E00-\u0E7F]")
_DEPENDENT_THAI_START_RE = re.compile(r"^[\u0E30-\u0E3A\u0E45-\u0E4E]")
_STRICT_TRAILING_PUNCT_RE = re.compile(r"^[.,!?;:%…)”’\]ๆฯ]+$")
_STRICT_CONTRACTION_RE = re.compile(r"^['’](?:t|s|re|ve|ll|d|m)$", re.IGNORECASE)
_ANY_ATTACHING_FRAGMENT_RE = re.compile(r"^(?:['’][A-Za-z]+|[.,!?;:%…)”’\]\"'ๆฯ-]+)$")
_OPENING_WRAPPER_RE = re.compile(r'^[(\["“‘\'{]+$')
_THAI_LEADING_VOWEL_TAIL_RE = re.compile(r"[\u0E40-\u0E44]$")
_ASCII_WORD_PIECE_RE = re.compile(r"^[A-Za-z0-9'’_-]+$")
_DIGIT_PUNCT_TAIL_RE = re.compile(r"\d[.,/:]$")


def _glue_word_fragments(items: List[tuple], source_text: Optional[str] = None) -> List[tuple]:
    """Coalesce sub-word pieces, contractions, trailing punctuation, and Thai nominalizer/mark fragments."""
    out: List[tuple] = []
    cursor = 0
    prev_end_idx = -1

    for raw_tok, start, end in items:
        tok = (raw_tok or "").strip()
        if not tok:
            continue

        contiguous = False
        curr_end_idx = -1
        if source_text is not None:
            idx = source_text.find(tok, cursor)
            if idx != -1:
                if prev_end_idx != -1:
                    gap = source_text[prev_end_idx:idx]
                    contiguous = not any(ch.isspace() for ch in gap)
                curr_end_idx = idx + len(tok)
                cursor = curr_end_idx

        should_glue = False
        if out:
            prev_tok, prev_start, prev_end = out[-1]
            # Unconditional guards: tokens that cannot stand alone on their own card
            if (
                _DEPENDENT_THAI_START_RE.match(tok)
                or _STRICT_TRAILING_PUNCT_RE.match(tok)
                or _STRICT_CONTRACTION_RE.match(tok)
                or (len(prev_tok) == 1 and _THAI_LEADING_VOWEL_TAIL_RE.match(prev_tok) and _THAI_CHAR_RE.match(tok[0]))
            ):
                should_glue = True
            elif contiguous:
                if (
                    _OPENING_WRAPPER_RE.match(prev_tok)
                    or _ANY_ATTACHING_FRAGMENT_RE.match(tok)
                    or (_THAI_LEADING_VOWEL_TAIL_RE.search(prev_tok) and _THAI_CHAR_RE.match(tok[0]))
                    or (prev_tok in ("การ", "ความ") and _THAI_CHAR_RE.match(tok[0]) and not _STRICT_TRAILING_PUNCT_RE.match(tok))
                    or (_ASCII_WORD_PIECE_RE.match(prev_tok) and _ASCII_WORD_PIECE_RE.match(tok))
                    or (_DIGIT_PUNCT_TAIL_RE.search(prev_tok) and tok[:1].isdigit())
                ):
                    should_glue = True

            if should_glue:
                out[-1] = (prev_tok + tok, prev_start, max(prev_end, end))
                prev_end_idx = curr_end_idx
                continue

        out.append((tok, start, end))
        prev_end_idx = curr_end_idx

    return out


def _merge_english_words(raw: List[tuple]) -> List[tuple]:
    """Merge Whisper BPE sub-word pieces into full words using leading whitespace as the word boundary."""
    merged: List[tuple] = []
    source_parts: List[str] = []

    for piece, start, end in raw:
        if not piece or not piece.strip():
            continue
        source_parts.append(piece)
        clean = piece.strip()
        has_leading_space = piece[:1].isspace()
        if merged and not has_leading_space:
            prev_tok, prev_start, prev_end = merged[-1]
            merged[-1] = (prev_tok + clean, prev_start, max(prev_end, end))
        else:
            merged.append((clean, start, end))

    return _glue_word_fragments(merged, source_text="".join(source_parts))


def _thai_words(raw: List[tuple]) -> List[tuple]:
    """Whisper emits sub-word pieces [(text_with_leading_space, start, end)]: regroup into real Thai/Latin words,
    timed from their first/last piece. Spaces stay in the text we tokenize, so "Let's go" keeps its word break."""
    if not word_tokenize:
        return _merge_english_words(raw)
    joined = "".join(t for t, _, _ in raw)
    owner = [k for k, (t, _, _) in enumerate(raw) for _ in t]
    out, pos = [], 0
    for tok in word_tokenize(joined, engine="newmm"):
        if tok.strip() and pos < len(owner):
            out.append((tok.strip(), raw[owner[pos]][1], raw[owner[min(pos + len(tok), len(owner)) - 1]][2]))
        pos += len(tok)
    return _glue_word_fragments(out, source_text=joined)

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

            # Tokenize Thai/English words cleanly without cutting contractions, numbers, or sub-word fragments
            if word_tokenize:
                raw_tokens = [(w.strip(), 0.0, 0.0) for w in word_tokenize(text, engine="newmm") if w.strip()]
            else:
                raw_tokens = [(w, 0.0, 0.0) for w in text.split(" ") if w]

            words = [t for t, _, _ in _glue_word_fragments(raw_tokens, source_text=text)]
            words = [c for w in words if (c := _no_stop(w))]
            if not words:
                continue

            # Distribute segment duration proportionally by token length so longer words stay synced
            weights = [max(2, len(w)) for w in words]
            total_weight = float(sum(weights) or len(words) or 1)
            cursor = float(seg_start)
            words_data = []
            for w_idx, w in enumerate(words):
                w_dur = float(seg_duration) * (weights[w_idx] / total_weight)
                w_end = float(seg_end) if w_idx == len(words) - 1 else min(float(seg_end), cursor + w_dur)
                w_start = round(cursor, 2)
                w_end = round(max(w_start, w_end), 2)
                words_data.append({
                    "word": w,
                    "start": w_start,
                    "end": w_end,
                })
                cursor = w_end

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


def _group_timed_words(
    words: List[tuple],
    max_words: int = 8,
    max_dur: float = 3.5,
    pause_gap: float = 0.55,
    min_start: float = 0.0,
) -> List[Dict[str, Any]]:
    """Group `(text, start, end)` tokens into synced subtitle chunks.

    Enforces monotonic word timestamps and flushes *before* appending whenever
    adding the next word crosses a natural silence pause or card limit.
    """
    chunks: List[Dict[str, Any]] = []
    current: List[Dict[str, Any]] = []
    prev_start = float(min_start)

    def flush() -> None:
        if not current:
            return
        chunks.append({
            "start": current[0]["start"],
            "end": current[-1]["end"],
            "text": _join([w["word"] for w in current]),
            "words": list(current),
        })
        current.clear()

    for raw_text, raw_start, raw_end in words:
        cleaned = _no_stop(raw_text)
        if not cleaned:
            continue
        w_start = round(max(prev_start, float(raw_start)), 2)
        w_end = round(max(w_start + 0.08, float(raw_end)), 2)
        prev_start = w_start

        if current and (
            len(current) >= max_words
            or (w_start - current[-1]["end"]) > pause_gap
            or (w_end - current[0]["start"]) > max_dur
        ):
            flush()

        current.append({"word": cleaned, "start": w_start, "end": w_end})

    flush()
    return chunks


def detect_language(audio_path: str, audio=None) -> str:
    """Language code of the audio. Uses the general model: the Thai fine-tune calls English 'th' about half the time."""
    if audio is None:
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
        from faster_whisper.audio import decode_audio
        from faster_whisper.vad import VadOptions, get_speech_timestamps

        audio = decode_audio(audio_path, sampling_rate=16000)
        lang = (language or "").strip().lower()
        if lang in ("", "auto"):
            lang = detect_language(audio_path, audio=audio)
        thai = lang == "th"

        # Isolate voiced clips on the real 16kHz timeline instead of stitching silences via collect_chunks,
        # which prevents cross-silence word drift and DTW boundary teleportation while keeping batch_size=8.
        vad_opts = VadOptions(max_speech_duration_s=14.5, min_silence_duration_ms=400, speech_pad_ms=200)
        raw_clips = get_speech_timestamps(audio, vad_opts, sampling_rate=16000)
        if not raw_clips:
            logger.info("no speech detected by VAD")
        else:
            clips_sec = [
                {"start": round(c["start"] / 16000.0, 6), "end": round(c["end"] / 16000.0, 6)}
                for c in raw_clips
            ]
            segments, info = _load_model(settings.WHISPER_MODEL if thai else settings.WHISPER_MODEL_GENERAL).transcribe(
                audio,
                language=lang,
                batch_size=8,
                chunk_length=15,  # 30s chunks make Thai decoding stop early and drop the middle
                word_timestamps=True,
                vad_filter=False,
                clip_timestamps=clips_sec,
                beam_size=5,
                temperature=0.0,
                condition_on_previous_text=False,
                initial_prompt=(settings.WHISPER_PROMPT if thai else settings.WHISPER_PROMPT_EN if lang == "en" else "") or None,
            )

            min_word_start = 0.0
            for seg in segments:
                logger.info(f"transcribed {seg.end:.0f}/{info.duration:.0f}s")
                raw = [(w.word, w.start, w.end) for w in seg.words or [] if w.word.strip()]
                words = _thai_words(raw) if thai else _merge_english_words(raw)
                seg_chunks = _group_timed_words(words, min_start=min_word_start)
                for chunk_data in seg_chunks:
                    subtitles.append({"id": len(subtitles) + 1, **chunk_data})
                    min_word_start = max(min_word_start, chunk_data["words"][-1]["start"])

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
