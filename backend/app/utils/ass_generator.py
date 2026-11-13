import os
import json
import re
import unicodedata
from typing import List, Dict, Any, Optional, Tuple

# Bundled fonts (backend/fonts) are handed to libass via `fontsdir`; the editor's fonts don't exist on the server otherwise.
FONTS_DIR = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "fonts"))
try:
    with open(os.path.join(FONTS_DIR, "metrics.json"), encoding="utf-8") as _f:
        _LINE_HEIGHT = {k.lower(): v for k, v in json.load(_f).items()}
except OSError:
    _LINE_HEIGHT = {}


def libass_font_size(family: str, css_px: float) -> float:
    """libass sizes text by line height (winAscent+winDescent), CSS by em, so a bare number draws 40-80% smaller.
    Scale by the font's measured factor so exported glyphs match the editor preview. Unknown fonts: unchanged."""
    return css_px * _LINE_HEIGHT.get((family or "").lower(), 1.0)


def parse_color_rgba(color_str: Optional[str], opacity: float = 1.0) -> Tuple[int, int, int, float]:
    """
    Parses CSS #RGB, #RRGGBB, rgb(r,g,b), or rgba(r,g,b,a) into (r, g, b, effective_opacity).
    """
    try:
        base_opacity = max(0.0, min(1.0, float(opacity)))
    except (TypeError, ValueError):
        base_opacity = 1.0

    if not color_str or not isinstance(color_str, str):
        return 255, 255, 255, base_opacity

    s = color_str.strip()
    rgba_match = re.match(
        r"^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})(?:\s*,\s*([\d.]+))?\s*\)$",
        s,
        re.IGNORECASE,
    )
    if rgba_match:
        r = max(0, min(255, int(rgba_match.group(1))))
        g = max(0, min(255, int(rgba_match.group(2))))
        b = max(0, min(255, int(rgba_match.group(3))))
        rgba_alpha = float(rgba_match.group(4)) if rgba_match.group(4) is not None else 1.0
        eff_op = max(0.0, min(1.0, base_opacity * max(0.0, min(1.0, rgba_alpha))))
        return r, g, b, eff_op

    clean_hex = s.lstrip("#")
    if len(clean_hex) == 3:
        clean_hex = "".join([c * 2 for c in clean_hex])
    if len(clean_hex) == 6:
        try:
            r = int(clean_hex[0:2], 16)
            g = int(clean_hex[2:4], 16)
            b = int(clean_hex[4:6], 16)
            return r, g, b, base_opacity
        except ValueError:
            pass

    return 255, 255, 255, base_opacity


def hex_to_ass_color(color_str: Optional[str], opacity: float = 1.0) -> str:
    """
    Converts CSS #RRGGBB, #RGB, or rgba(...) + opacity (0.0 to 1.0) to ASS &HAABBGGRR& format.
    In ASS: AA 00 = 100% opaque, FF = 100% transparent.
    """
    r, g, b, eff_op = parse_color_rgba(color_str, opacity)
    alpha = max(0, min(255, int(round((1.0 - eff_op) * 255))))
    return f"&H{alpha:02X}{b:02X}{g:02X}{r:02X}&"


def hex_to_ass_bgr(color_str: Optional[str]) -> str:
    """Converts CSS color into ASS inline override color &HBBGGRR& (used with \\1c, \\3c, \\4c)."""
    r, g, b, _ = parse_color_rgba(color_str, 1.0)
    return f"&H{b:02X}{g:02X}{r:02X}&"


def opacity_to_ass_alpha(opacity: float) -> str:
    """Converts [0.0..1.0] opacity to ASS inline alpha &HAA&."""
    eff_op = max(0.0, min(1.0, float(opacity)))
    alpha = max(0, min(255, int(round((1.0 - eff_op) * 255))))
    return f"&H{alpha:02X}&"


def format_ass_timestamp(seconds: float) -> str:
    """
    Converts float seconds into ASS timestamp format: H:MM:SS.cs (centiseconds, 2 digits).
    """
    total_seconds = max(0.0, float(seconds))
    hours = int(total_seconds // 3600)
    minutes = int((total_seconds % 3600) // 60)
    secs = int(total_seconds % 60)
    centisecs = int(round((total_seconds - int(total_seconds)) * 100))
    if centisecs >= 100:
        secs += 1
        centisecs = 0
        if secs >= 60:
            minutes += 1
            secs = 0
            if minutes >= 60:
                hours += 1
                minutes = 0
    return f"{hours}:{minutes:02d}:{secs:02d}.{centisecs:02d}"


def escape_ass_text(text: str) -> str:
    """Escapes ASS override braces so literal user braces don't break tags."""
    return (text or "").replace("{", r"\{").replace("}", r"\}")


def is_thai_combining_char(ch: str) -> bool:
    """Returns True if character is a Thai combining mark (vowel or tone mark) with 0 advance width."""
    code = ord(ch)
    return code == 0x0E31 or (0x0E34 <= code <= 0x0E3A) or (0x0E47 <= code <= 0x0E4E)


def get_thai_text_width(text: str, css_font_size: float, bold: bool = True) -> float:
    """Calculates approximate visual advance width in CSS pixels."""
    factor = 0.56 if bold else 0.50
    base_chars = sum(0 if is_thai_combining_char(c) else 1 for c in text)
    return base_chars * (css_font_size * factor)


_THAI_SCRIPT_RE = re.compile(r"[\u0E00-\u0E7F]")


def _is_ascii_alnum(ch: str) -> bool:
    return ch.isascii() and ch.isalnum()


def _is_wordy_char(ch: str) -> bool:
    return ch.isalnum() or unicodedata.category(ch).startswith("M")


def needs_space_between_words(prev: str, curr: str) -> bool:
    """True only when a space belongs between adjacent tokens (never between consecutive Thai words)."""
    if not prev or not curr:
        return False
    last_ch = prev[-1]
    first_ch = curr[0]
    return (
        (_is_ascii_alnum(last_ch) or _is_ascii_alnum(first_ch))
        and (_is_wordy_char(last_ch) or last_ch in ".,!?;:)")
        and _is_wordy_char(first_ch)
    )


def join_subtitle_words(words: List[str]) -> str:
    """Joins word tokens into natural multilingual subtitle text (no spaces between Thai words)."""
    out = ""
    for raw in words:
        w = (raw or "").strip()
        if not w:
            continue
        if not out:
            out = w
        else:
            out += f" {w}" if needs_space_between_words(out, w) else w
    return out


_ASS_THAI_CHAR_RE = re.compile(r"[\u0E00-\u0E7F]")
_ASS_DEPENDENT_THAI_START_RE = re.compile(r"^[\u0E30-\u0E3A\u0E45-\u0E4E]")
_ASS_STRICT_TRAILING_PUNCT_RE = re.compile(r"^[.,!?;:%…)”’\]ๆฯ]+$")
_ASS_STRICT_CONTRACTION_RE = re.compile(r"^['’](?:t|s|re|ve|ll|d|m)$", re.IGNORECASE)
_ASS_ANY_ATTACHING_FRAGMENT_RE = re.compile(r"^(?:['’][A-Za-z]+|[.,!?;:%…)”’\]\"'ๆฯ-]+)$")
_ASS_OPENING_WRAPPER_RE = re.compile(r'^[(\["“‘\'{]+$')
_ASS_THAI_LEADING_VOWEL_TAIL_RE = re.compile(r"[\u0E40-\u0E44]$")
_ASS_ASCII_WORD_PIECE_RE = re.compile(r"^[A-Za-z0-9'’_-]+$")
_ASS_DIGIT_PUNCT_TAIL_RE = re.compile(r"\d[.,/:]$")


def _glue_contiguous_chunk_tokens(parts: List[str]) -> List[str]:
    """Merge sub-word pieces within a single non-whitespace chunk so no word or mark splits mid-word."""
    out: List[str] = []
    for raw_part in parts:
        tok = (raw_part or "").strip()
        if not tok:
            continue
        if out:
            prev = out[-1]
            if (
                _ASS_OPENING_WRAPPER_RE.match(prev)
                or _ASS_DEPENDENT_THAI_START_RE.match(tok)
                or _ASS_ANY_ATTACHING_FRAGMENT_RE.match(tok)
                or (_ASS_THAI_LEADING_VOWEL_TAIL_RE.search(prev) and _ASS_THAI_CHAR_RE.match(tok[0]))
                or (prev in ("การ", "ความ") and _ASS_THAI_CHAR_RE.match(tok[0]) and not _ASS_STRICT_TRAILING_PUNCT_RE.match(tok))
                or (_ASS_ASCII_WORD_PIECE_RE.match(prev) and _ASS_ASCII_WORD_PIECE_RE.match(tok))
                or (_ASS_DIGIT_PUNCT_TAIL_RE.search(prev) and tok[:1].isdigit())
            ):
                out[-1] = prev + tok
                continue
        out.append(tok)
    return out


def _glue_strict_trailing_tokens(tokens: List[str]) -> List[str]:
    """Prevent standalone Thai marks, contractions, or trailing punctuation from splitting onto separate cards/lines."""
    out: List[str] = []
    for tok in tokens:
        if out and (
            _ASS_DEPENDENT_THAI_START_RE.match(tok)
            or _ASS_STRICT_TRAILING_PUNCT_RE.match(tok)
            or _ASS_STRICT_CONTRACTION_RE.match(tok)
            or (len(out[-1]) == 1 and _ASS_THAI_LEADING_VOWEL_TAIL_RE.match(out[-1]) and _ASS_THAI_CHAR_RE.match(tok[0]))
        ):
            out[-1] = out[-1] + tok
        else:
            out.append(tok)
    return out


def _tokenize_fallback(text: str) -> List[str]:
    cleaned = (text or "").strip()
    if not cleaned:
        return []

    has_pythainlp = False
    word_tokenize_fn = None
    try:
        from pythainlp.tokenize import word_tokenize as _wt
        has_pythainlp = True
        word_tokenize_fn = _wt
    except ImportError:
        pass

    chunks = [c for c in re.split(r"\s+", cleaned) if c]
    tokens: List[str] = []
    for chunk in chunks:
        if has_pythainlp and word_tokenize_fn and _THAI_SCRIPT_RE.search(chunk) and len(chunk) > 2:
            try:
                parts = [w.strip() for w in word_tokenize_fn(chunk, engine="newmm") if w.strip()]
                if parts:
                    tokens.extend(_glue_contiguous_chunk_tokens(parts))
                    continue
            except Exception:
                pass
        tokens.append(chunk)
    return _glue_strict_trailing_tokens(tokens)


def _coalesce_word_tokens(valid_words: List[Dict[str, Any]], display_text: str) -> List[Dict[str, Any]]:
    """Coalesce Whisper/sub-word timing entries against whole words so ASS highlights and wraps never cut words."""
    if len(valid_words) <= 1:
        return valid_words

    target_tokens = _tokenize_fallback(display_text)
    if target_tokens:
        aligned: List[Dict[str, Any]] = []
        wi = 0
        matched_all = True
        for target in target_tokens:
            t_compact = re.sub(r"\s+", "", target)
            if not t_compact:
                continue
            acc = ""
            start_idx = wi
            found = False
            while wi < len(valid_words):
                acc += re.sub(r"\s+", "", valid_words[wi]["word"])
                wi += 1
                if acc == t_compact:
                    aligned.append({
                        "word": target,
                        "start": valid_words[start_idx]["start"],
                        "end": max(w["end"] for w in valid_words[start_idx:wi]),
                    })
                    found = True
                    break
                if len(acc) > len(t_compact):
                    break
            if not found:
                matched_all = False
                break
        if matched_all and wi == len(valid_words) and aligned:
            return aligned

    # Fallback: coalesce adjacent fragments using source display_text whitespace boundaries
    out: List[Dict[str, Any]] = []
    cursor = 0
    prev_end_idx = -1
    for w in valid_words:
        tok = w["word"]
        contiguous = False
        curr_end_idx = -1
        idx = display_text.find(tok, cursor)
        if idx != -1:
            if prev_end_idx != -1:
                gap = display_text[prev_end_idx:idx]
                contiguous = not any(ch.isspace() for ch in gap)
            curr_end_idx = idx + len(tok)
            cursor = curr_end_idx

        should_glue = False
        if out:
            prev_tok = out[-1]["word"]
            if (
                _ASS_DEPENDENT_THAI_START_RE.match(tok)
                or _ASS_STRICT_TRAILING_PUNCT_RE.match(tok)
                or _ASS_STRICT_CONTRACTION_RE.match(tok)
                or (len(prev_tok) == 1 and _ASS_THAI_LEADING_VOWEL_TAIL_RE.match(prev_tok) and _ASS_THAI_CHAR_RE.match(tok[0]))
            ):
                should_glue = True
            elif contiguous and (
                _ASS_OPENING_WRAPPER_RE.match(prev_tok)
                or _ASS_ANY_ATTACHING_FRAGMENT_RE.match(tok)
                or (_ASS_THAI_LEADING_VOWEL_TAIL_RE.search(prev_tok) and _ASS_THAI_CHAR_RE.match(tok[0]))
                or (prev_tok in ("การ", "ความ") and _ASS_THAI_CHAR_RE.match(tok[0]) and not _ASS_STRICT_TRAILING_PUNCT_RE.match(tok))
                or (_ASS_ASCII_WORD_PIECE_RE.match(prev_tok) and _ASS_ASCII_WORD_PIECE_RE.match(tok))
                or (_ASS_DIGIT_PUNCT_TAIL_RE.search(prev_tok) and tok[:1].isdigit())
            ):
                should_glue = True

            if should_glue:
                out[-1] = {
                    "word": prev_tok + tok,
                    "start": out[-1]["start"],
                    "end": max(out[-1]["end"], w["end"]),
                }
                prev_end_idx = curr_end_idx
                continue

        out.append(dict(w))
        prev_end_idx = curr_end_idx

    return out


def wrap_thai_text(text: str, css_font_size: float, max_width: float, bold: bool = True) -> str:
    """
    Wraps Thai and multilingual text cleanly using CSS font pixel sizing.
    Preserves existing user line breaks (\\n) and inserts \\N where a line exceeds max_width.
    """
    if not text:
        return ""

    paragraphs = text.replace("\r\n", "\n").split("\n")
    result_lines: List[str] = []

    for p in paragraphs:
        clean_p = p.strip()
        if not clean_p:
            continue

        if get_thai_text_width(clean_p, css_font_size, bold=bold) <= max_width:
            result_lines.append(escape_ass_text(clean_p))
            continue

        words = _tokenize_fallback(clean_p)
        if not words:
            continue

        cur_line: List[str] = []
        cur_w = 0.0
        space_w = css_font_size * 0.28

        for w in words:
            ww = get_thai_text_width(w, css_font_size, bold=bold)
            add_space = bool(cur_line and needs_space_between_words(cur_line[-1], w))
            needed = ww + (space_w if add_space else 0.0)
            if cur_w + needed > max_width and cur_line:
                result_lines.append(escape_ass_text(join_subtitle_words(cur_line)))
                cur_line = [w]
                cur_w = ww
            else:
                cur_line.append(w)
                cur_w += needed

        if cur_line:
            result_lines.append(escape_ass_text(join_subtitle_words(cur_line)))

    return r"\N".join(result_lines)


def wrap_word_tokens(
    tokens: List[Dict[str, Any]],
    max_width: float,
    css_font_size: float,
    bold: bool = True,
) -> List[List[Dict[str, Any]]]:
    """
    Groups timed word tokens into wrapped lines matching VideoPlayer spacing rules.
    """
    if not tokens:
        return []

    lines: List[List[Dict[str, Any]]] = []
    cur_line: List[Dict[str, Any]] = []
    cur_w = 0.0
    gap_w = css_font_size * 0.28

    for tok in tokens:
        word_str = str(tok.get("word", "")).strip()
        if not word_str:
            continue
        ww = get_thai_text_width(word_str, css_font_size, bold=bold)
        prev_word = str(cur_line[-1].get("word", "")).strip() if cur_line else ""
        add_gap = bool(cur_line and needs_space_between_words(prev_word, word_str))
        needed = ww + (gap_w if add_gap else 0.0)
        if cur_w + needed > max_width and cur_line:
            lines.append(cur_line)
            cur_line = [tok]
            cur_w = ww
        else:
            cur_line.append(tok)
            cur_w += needed

    if cur_line:
        lines.append(cur_line)

    return lines


def normalize_segment_word_tokens(
    sub: Dict[str, Any],
    raw_text: str,
    start_sec: float,
    end_sec: float,
    uppercase: bool = False,
) -> List[Dict[str, Any]]:
    """
    Builds contiguous word tokens within [start_sec, end_sec] from sub['words'] or raw_text.
    Contiguous bounds ensure multi-word ASS Dialogue events never flicker between words.
    """
    display_text = raw_text.upper() if uppercase else raw_text
    raw_words = sub.get("words")

    parsed_tokens: List[Dict[str, Any]] = []
    if isinstance(raw_words, list) and len(raw_words) > 0:
        cleaned_text_compact = re.sub(r"\s+", "", display_text)
        valid_words = []
        for w in raw_words:
            if not isinstance(w, dict):
                continue
            w_str = str(w.get("word", "")).strip()
            if not w_str:
                continue
            if uppercase:
                w_str = w_str.upper()
            valid_words.append({
                "word": w_str,
                "start": float(w.get("start", start_sec)),
                "end": float(w.get("end", end_sec)),
            })

        joined_words_compact = re.sub(r"\s+", "", "".join(w["word"] for w in valid_words))
        if valid_words and joined_words_compact == cleaned_text_compact:
            valid_words = _coalesce_word_tokens(valid_words, display_text)
            n = len(valid_words)
            for idx, w in enumerate(valid_words):
                w_start = start_sec if idx == 0 else max(start_sec, min(end_sec - 0.03, w["start"]))
                if idx == n - 1:
                    w_end = end_sec
                else:
                    next_start = max(w_start + 0.04, min(end_sec - 0.02, valid_words[idx + 1]["start"]))
                    w_end = next_start
                parsed_tokens.append({"word": w["word"], "start": w_start, "end": w_end})

    if not parsed_tokens:
        parts = _tokenize_fallback(display_text)
        if not parts:
            return []
        if len(parts) == 1:
            return [{"word": parts[0], "start": start_sec, "end": end_sec}]

        weights = [max(2, len(p)) for p in parts]
        total_w = float(sum(weights))
        total_dur = max(0.2, end_sec - start_sec)
        cursor = start_sec
        for idx, p in enumerate(parts):
            is_last = idx == len(parts) - 1
            w_start = cursor
            if is_last:
                w_end = end_sec
            else:
                slice_dur = total_dur * (weights[idx] / total_w)
                w_end = min(end_sec - 0.02, w_start + max(0.05, slice_dur))
            cursor = w_end
            parsed_tokens.append({"word": p, "start": w_start, "end": w_end})

    return parsed_tokens


def _clamp01(value: float) -> float:
    return max(0.0, min(1.0, float(value)))


def _cubic_bezier_ease(p1x: float, p1y: float, p2x: float, p2y: float, u: float) -> float:
    """Evaluates a CSS cubic-bezier(p1x, p1y, p2x, p2y) easing curve at normalized time u in [0, 1]."""
    u = _clamp01(u)
    if u <= 0.0:
        return 0.0
    if u >= 1.0:
        return 1.0
    lo, hi = 0.0, 1.0
    for _ in range(16):
        mid = 0.5 * (lo + hi)
        omt = 1.0 - mid
        bx = 3.0 * (omt * omt * mid * p1x + omt * mid * mid * p2x) + mid * mid * mid
        if bx < u:
            lo = mid
        else:
            hi = mid
    t = 0.5 * (lo + hi)
    omt = 1.0 - t
    return 3.0 * (omt * omt * t * p1y + omt * t * t * p2y) + t * t * t


def _format_cs_timestamp(cs: int) -> str:
    """Formats non-negative integer centiseconds to ASS H:MM:SS.cs."""
    cs = max(0, int(cs))
    total_secs, centisecs = divmod(cs, 100)
    hours, rem_secs = divmod(total_secs, 3600)
    minutes, secs = divmod(rem_secs, 60)
    return f"{hours}:{minutes:02d}:{secs:02d}.{centisecs:02d}"


def _is_neon_glow_style(s_map: Dict[str, Any]) -> bool:
    """Mirrors VideoPlayer.tsx isNeonGlow check (karaoke preset or chromatic shadow matching text color)."""
    preset_mode = str(s_map.get("preset_mode") or "default").lower()
    if preset_mode == "karaoke":
        return True
    has_shd = bool(s_map.get("shadow", False))
    txt_col = str(s_map.get("text_color") or "#FFFFFF").strip().lower()
    shd_col = str(s_map.get("shadow_color") or "#000000").strip().lower()
    return has_shd and shd_col == txt_col and shd_col not in ("#ffffff", "#000000")


# Keyframes for CSS capShakeAlert (450ms loop): (dx_sign, dy_sign, ass_frz_deg).
# ASS \frz rotates counter-clockwise for positive angles, opposite CSS rotate().
_SHAKE_KEYFRAMES: Tuple[Tuple[float, float, float], ...] = (
    (0.0, 0.0, 0.0),
    (-1.0, 1.0, 1.5),
    (1.0, -1.0, -1.5),
    (-1.0, -1.0, 1.0),
    (1.0, 1.0, -1.0),
)
_SHAKE_PHASE_SEC = 0.09  # 450ms / 5 phases


def _get_anim_sample_times(anim: str, seg_dur: float) -> List[float]:
    """Returns segment-relative sample times (seconds) covering keyframes & easing curves."""
    if anim == "fade":
        pts = [0.06, 0.14, 0.22, 0.30]
    elif anim == "pop":
        pts = [0.06, 0.12, 0.21, 0.28, 0.35]
    elif anim == "bounce":
        pts = [0.07, 0.15, 0.275, 0.34, 0.4125, 0.48, 0.55]
    elif anim == "slide-up":
        pts = [0.07, 0.16, 0.28, 0.42, 0.55]
    elif anim == "typewriter":
        pts = [0.07, 0.14, 0.22]
    elif anim == "shake":
        pts = []
        k = 1
        while k * _SHAKE_PHASE_SEC < seg_dur:
            pts.append(round(k * _SHAKE_PHASE_SEC, 4))
            k += 1
        return pts
    else:
        return []
    return [t for t in pts if t < seg_dur]


def _eval_anim_state(
    anim: str,
    rel_sec: float,
    css_px_size: float,
    stage_to_canvas: float,
    mid_rel_sec: float,
) -> Tuple[float, float, float, float, float]:
    """
    Evaluates animation transforms at segment-relative time `rel_sec` matching frontend globals.css.
    Returns (alpha_mult [0..1], dx_px, dy_px, scale_mult, ass_frz_deg).
    """
    t = max(0.0, float(rel_sec))

    if anim == "fade":
        # .anim-fade -> subFadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)
        dur = 0.30
        if t >= dur:
            return 1.0, 0.0, 0.0, 1.0, 0.0
        e = _cubic_bezier_ease(0.16, 1.0, 0.3, 1.0, t / dur)
        fade_dy = 4.0 * stage_to_canvas
        return _clamp01(e), 0.0, fade_dy * (1.0 - e), 0.98 + 0.02 * e, 0.0

    if anim == "pop":
        # .anim-pop -> subPopIn 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275)
        if t >= 0.35:
            return 1.0, 0.0, 0.0, 1.0, 0.0
        if t < 0.21:
            u = t / 0.21
            e = _cubic_bezier_ease(0.175, 0.885, 0.32, 1.275, u)
            return _clamp01(e), 0.0, 0.0, 0.85 + 0.21 * e, 0.0
        u = (t - 0.21) / 0.14
        e = _cubic_bezier_ease(0.175, 0.885, 0.32, 1.275, u)
        return 1.0, 0.0, 0.0, 1.06 - 0.06 * e, 0.0

    if anim == "bounce":
        # .cap-enter-bounce -> capEnterBounce 0.55s cubic-bezier(0.22, 1, 0.36, 1)
        if t >= 0.55:
            return 1.0, 0.0, 0.0, 1.0, 0.0
        if t < 0.275:
            e = _cubic_bezier_ease(0.22, 1.0, 0.36, 1.0, t / 0.275)
            return _clamp01(e), 0.0, (0.80 - 1.05 * e) * css_px_size, 0.60 + 0.64 * e, 0.0
        if t < 0.4125:
            e = _cubic_bezier_ease(0.22, 1.0, 0.36, 1.0, (t - 0.275) / 0.1375)
            return 1.0, 0.0, (-0.25 + 0.29 * e) * css_px_size, 1.24 - 0.28 * e, 0.0
        e = _cubic_bezier_ease(0.22, 1.0, 0.36, 1.0, (t - 0.4125) / 0.1375)
        return 1.0, 0.0, (0.04 - 0.04 * e) * css_px_size, 0.96 + 0.04 * e, 0.0

    if anim == "slide-up":
        # .cap-enter-rise -> capEnterRise 0.55s cubic-bezier(0.16, 1, 0.3, 1)
        dur = 0.55
        if t >= dur:
            return 1.0, 0.0, 0.0, 1.0, 0.0
        e = _cubic_bezier_ease(0.16, 1.0, 0.3, 1.0, t / dur)
        return _clamp01(e), 0.0, 0.85 * css_px_size * (1.0 - e), 1.0, 0.0

    if anim == "typewriter":
        # .cap-enter-type -> capEnterType 0.22s ease-out
        dur = 0.22
        if t >= dur:
            return 1.0, 0.0, 0.0, 1.0, 0.0
        e = _cubic_bezier_ease(0.0, 0.0, 0.58, 1.0, t / dur)
        return _clamp01(e), 0.0, 0.12 * css_px_size * (1.0 - e), 1.0, 0.0

    if anim == "shake":
        # .cap-phrase-shake -> capShakeAlert 0.45s ease-in-out infinite
        k_bin = max(0, int(mid_rel_sec // _SHAKE_PHASE_SEC))
        u = _clamp01((t - k_bin * _SHAKE_PHASE_SEC) / _SHAKE_PHASE_SEC)
        e = _cubic_bezier_ease(0.42, 0.0, 0.58, 1.0, u)
        p0 = _SHAKE_KEYFRAMES[k_bin % 5]
        p1 = _SHAKE_KEYFRAMES[(k_bin + 1) % 5]
        sx = 3.0 * stage_to_canvas
        sy = 1.0 * stage_to_canvas
        dx = (p0[0] + (p1[0] - p0[0]) * e) * sx
        dy = (p0[1] + (p1[1] - p0[1]) * e) * sy
        rot = p0[2] + (p1[2] - p0[2]) * e
        return 1.0, dx, dy, 1.0, rot

    return 1.0, 0.0, 0.0, 1.0, 0.0


def generate_ass_content(
    subtitles: List[Dict[str, Any]],
    styles: Dict[str, Any] = None,
    video_width: int = 1080,
    video_height: int = 1920,
    preview_width: Optional[float] = None,
    preview_height: Optional[float] = None,
) -> str:
    """
    Generates a full .ass subtitle file string based on subtitle segments and user styles.
    Accurately mirrors VideoPlayer.tsx styling, scaling, word-by-word highlights, presets,
    and animations so rendered MP4 output matches the preview stage 1:1.
    """
    if styles is None:
        styles = {}

    video_width = int(video_width) if video_width and int(video_width) > 0 else 1080
    video_height = int(video_height) if video_height and int(video_height) > 0 else 1920

    # Match VideoPlayer.tsx: referenceVideoH = 1920 for 9:16, else 1080
    ratio = video_width / max(1, video_height)
    ref_video_h = 1920.0 if ratio < 0.9 else 1080.0
    scale_h = video_height / ref_video_h

    # Scale preview CSS pixel animations (e.g. capShakeAlert ±3px, subFadeIn 4px) to PlayRes canvas pixels
    if preview_height and float(preview_height) > 0:
        stage_to_canvas = max(1.0, min(6.0, float(video_height) / float(preview_height)))
    else:
        stage_to_canvas = max(1.0, video_height / 560.0)

    lines = [
        "[Script Info]",
        "Title: Zaizub Auto Subtitles",
        "ScriptType: v4.00+",
        "WrapStyle: 0",
        "ScaledBorderAndShadow: yes",
        "YCbCr Matrix: None",
        f"PlayResX: {video_width}",
        f"PlayResY: {video_height}",
        "",
        "[V4+ Styles]",
        "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding",
    ]

    def resolve_style_metrics(s_map: Dict[str, Any]) -> Dict[str, Any]:
        txt_col = str(s_map.get("text_color") or "#FFFFFF")
        base_txt_col = str(s_map.get("base_text_color") or "#FFFFFF")
        shd_col = str(s_map.get("shadow_color") or "#000000")
        out_col = str(s_map.get("outline_color") or shd_col or "#000000")
        badge_col = str(s_map.get("badge_color") or txt_col or "#22C55E")
        bg_col = str(s_map.get("bg_color") or "#000000")
        _, _, _, bg_eff_op = parse_color_rgba(bg_col, float(s_map.get("bg_opacity", 0.0)))

        has_shd = bool(s_map.get("shadow", False))
        has_out = bool(s_map.get("outline", False))
        preset_mode = str(s_map.get("preset_mode") or "default").lower()
        is_neon = _is_neon_glow_style(s_map)

        raw_out_thick = float(s_map.get("outline_thickness", 3.0 if has_out else 0.0))
        raw_shd_thick = float(s_map.get("shadow_thickness", 3.0 if has_shd else 0.0))
        has_bg_box = bg_eff_op > 0.05

        text_out_thick = round(max(0.5, raw_out_thick) * scale_h, 1) if has_out else 0.0
        text_shd_thick = round(max(0.5, raw_shd_thick) * scale_h, 1) if has_shd else 0.0
        text_out_c = hex_to_ass_color(out_col, 1.0) if has_out else "&HFF000000&"
        text_bak_c = hex_to_ass_color(shd_col, 0.72) if has_shd else "&HFF000000&"
        text_out_bgr = hex_to_ass_bgr(out_col)
        text_shd_bgr = hex_to_ass_bgr(shd_col)
        text_out_op = 1.0 if has_out else 0.0
        text_shd_op = 0.72 if has_shd else 0.0

        if has_bg_box:
            brd_style = 3
            padding_y = float(s_map.get("padding_y", 8.0))
            out_thick = max(4.0, round(padding_y * scale_h * 1.15, 1))
            shd_thick = 0.0
            out_c = hex_to_ass_color(bg_col, bg_eff_op)
            bak_c = hex_to_ass_color(bg_col, bg_eff_op)
            base_out_bgr = hex_to_ass_bgr(bg_col)
            base_shd_bgr = hex_to_ass_bgr(bg_col)
            style_out_op = bg_eff_op
            style_shd_op = bg_eff_op
        elif is_neon:
            brd_style = 1
            out_thick = round(max(2.5, raw_out_thick) * scale_h, 1)
            shd_thick = round(max(1.0, raw_shd_thick) * scale_h, 1) if has_shd else 0.0
            out_c = hex_to_ass_color(txt_col, 0.55)
            bak_c = hex_to_ass_color("#000000", 0.65)
            base_out_bgr = hex_to_ass_bgr(txt_col)
            base_shd_bgr = "&H000000&"
            style_out_op = 0.55
            style_shd_op = 0.65 if has_shd else 0.0
        else:
            brd_style = 1
            out_thick = text_out_thick
            shd_thick = text_shd_thick
            out_c = text_out_c
            bak_c = text_bak_c
            base_out_bgr = text_out_bgr
            base_shd_bgr = text_shd_bgr
            style_out_op = text_out_op
            style_shd_op = text_shd_op

        return {
            "txt_col": txt_col,
            "base_txt_col": base_txt_col,
            "badge_col": badge_col,
            "active_bgr": hex_to_ass_bgr(txt_col),
            "base_bgr": hex_to_ass_bgr(base_txt_col),
            "badge_bgr": hex_to_ass_bgr(badge_col),
            "base_out_bgr": base_out_bgr,
            "base_shd_bgr": base_shd_bgr,
            "out_c": out_c,
            "bak_c": bak_c,
            "brd_style": brd_style,
            "out_thick": out_thick,
            "shd_thick": shd_thick,
            "style_out_op": style_out_op,
            "style_shd_op": style_shd_op,
            "text_out_thick": text_out_thick,
            "text_shd_thick": text_shd_thick,
            "text_out_c": text_out_c,
            "text_bak_c": text_bak_c,
            "text_out_bgr": text_out_bgr,
            "text_shd_bgr": text_shd_bgr,
            "text_out_op": text_out_op,
            "text_shd_op": text_shd_op,
            "has_bg_box": has_bg_box,
            "has_out": has_out,
            "has_shd": has_shd,
            "is_neon": is_neon,
            "preset_mode": preset_mode,
        }

    def build_ass_styles(style_name: str, s_map: Dict[str, Any]) -> List[str]:
        f_family = s_map.get("font_family") or "Kanit"
        raw_font_size = float(s_map.get("font_size", 56))
        f_size = max(8.0, round(libass_font_size(f_family, raw_font_size * scale_h), 1))

        bld = -1 if s_map.get("bold", True) else 0
        ita = -1 if s_map.get("italic", False) else 0
        und = -1 if s_map.get("underline", False) else 0
        letter_spacing = round(float(s_map.get("letter_spacing", 0.0)) * scale_h, 1)

        m = resolve_style_metrics(s_map)
        pri_c = hex_to_ass_color(m["txt_col"], 1.0)
        sec_c = "&H000000FF&"

        out = [
            f"Style: {style_name},{f_family},{f_size},{pri_c},{sec_c},{m['out_c']},{m['bak_c']},"
            f"{bld},{ita},{und},0,100,100,{letter_spacing},0,{m['brd_style']},{m['out_thick']},{m['shd_thick']},5,20,20,20,1"
        ]
        if m["has_bg_box"]:
            out.append(
                f"Style: {style_name}_Text,{f_family},{f_size},{pri_c},{sec_c},{m['text_out_c']},{m['text_bak_c']},"
                f"{bld},{ita},{und},0,100,100,{letter_spacing},0,1,{m['text_out_thick']},{m['text_shd_thick']},5,20,20,20,1"
            )
        return out

    lines.extend(build_ass_styles("Default", styles))

    custom_styles_map: Dict[Any, str] = {}
    for sub in subtitles:
        sub_style = sub.get("style")
        if sub_style and isinstance(sub_style, dict):
            s_id = f"Style_{sub.get('id', len(custom_styles_map) + 1)}"
            custom_styles_map[sub.get("id")] = s_id
            lines.extend(build_ass_styles(s_id, {**styles, **sub_style}))

    lines.append("")
    lines.append("[Events]")
    lines.append("Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text")

    def format_alpha_block(
        f0: float,
        o0: float,
        s0: float,
        f1: float,
        o1: float,
        s1: float,
        slice_ms: int,
    ) -> str:
        a1_0, a3_0, a4_0 = opacity_to_ass_alpha(f0), opacity_to_ass_alpha(o0), opacity_to_ass_alpha(s0)
        a1_1, a3_1, a4_1 = opacity_to_ass_alpha(f1), opacity_to_ass_alpha(o1), opacity_to_ass_alpha(s1)
        part = rf"\1a{a1_0}\3a{a3_0}\4a{a4_0}"
        if (a1_1, a3_1, a4_1) != (a1_0, a3_0, a4_0):
            part += rf"\t(0,{slice_ms},\1a{a1_1}\3a{a3_1}\4a{a4_1})"
        return part

    for sub in subtitles:
        start_sec = float(sub.get("start", 0.0))
        end_sec = float(sub.get("end", 0.0))
        if end_sec <= start_sec:
            end_sec = start_sec + 2.0

        raw_text = str(sub.get("text", "")).strip()
        if not raw_text:
            continue

        eff_style = {**styles, **(sub.get("style") or {})}
        assigned_style = custom_styles_map.get(sub.get("id"), "Default")
        m = resolve_style_metrics(eff_style)

        pos_mode = eff_style.get("position", "bottom")
        default_y = 50.0 if pos_mode == "center" else (12.0 if pos_mode in ("top", "custom") else 82.0)
        pct_x = float(eff_style.get("custom_x") if eff_style.get("custom_x") is not None else 50.0)
        pct_y = float(eff_style.get("custom_y") if eff_style.get("custom_y") is not None else default_y)

        pixel_x = int(round((pct_x / 100.0) * video_width))
        pixel_y = int(round((pct_y / 100.0) * video_height))

        box_w = float(eff_style.get("box_width") or 86.0)
        box_margin_pct = max(2.0, (100.0 - box_w) / 2.0)
        margin_lr = int(round((box_margin_pct / 100.0) * video_width))
        max_box_pixel_width = max(100.0, (box_w / 100.0) * video_width)

        raw_fs = float(eff_style.get("font_size", 56))
        css_px_size = max(8.0, raw_fs * scale_h)
        is_bold = bool(eff_style.get("bold", True))
        padding_x = float(eff_style.get("padding_x", 16))
        inner_box_pixel_width = max(80.0, max_box_pixel_width - (2.0 * padding_x * scale_h))

        uppercase = bool(eff_style.get("uppercase", False))
        anim = str(eff_style.get("animation") or "none").lower()
        preset_mode = m["preset_mode"]
        raw_word_hl = eff_style.get("word_highlight")
        if raw_word_hl is None:
            word_highlight = preset_mode in ("tiktok", "badge", "karaoke", "danger", "frosted", "warm")
        else:
            word_highlight = bool(raw_word_hl)

        tokens = normalize_segment_word_tokens(sub, raw_text, start_sec, end_sec, uppercase=uppercase)
        is_word_by_word = (word_highlight or anim == "typewriter") and len(tokens) > 1

        seg_cs0 = int(round(start_sec * 100))
        seg_cs1 = max(seg_cs0 + 1, int(round(end_sec * 100)))
        seg_dur = (seg_cs1 - seg_cs0) / 100.0

        # Precompute contiguous centisecond word intervals & wrapped line layout
        wrapped_lines: Optional[List[List[Dict[str, Any]]]] = None
        flat_tokens: List[Dict[str, Any]] = []
        token_start_cs: List[int] = []
        static_wrapped_text = ""

        if is_word_by_word:
            wrapped_lines = wrap_word_tokens(tokens, inner_box_pixel_width, css_px_size, bold=is_bold)
            flat_tokens = [tok for ln in wrapped_lines for tok in ln]
            n_tok = len(flat_tokens)
            seg_span_cs = seg_cs1 - seg_cs0
            prev_cs = seg_cs0
            for idx, tok in enumerate(flat_tokens):
                if idx == 0:
                    w_cs = seg_cs0
                elif seg_span_cs >= n_tok:
                    raw_cs = int(round(float(tok["start"]) * 100))
                    w_cs = max(prev_cs + 1, min(seg_cs1 - (n_tok - idx), raw_cs))
                else:
                    w_cs = seg_cs0 + int((idx * seg_span_cs) // n_tok)
                token_start_cs.append(w_cs)
                prev_cs = w_cs
        else:
            display_raw = raw_text.upper() if uppercase else raw_text
            if (
                tokens
                and len(tokens) >= 3
                and sum(1 for t in tokens if _THAI_SCRIPT_RE.search(str(t["word"]))) >= 3
                and display_raw == " ".join(str(t["word"]) for t in tokens)
            ):
                display_raw = join_subtitle_words([str(t["word"]) for t in tokens])
            static_wrapped_text = wrap_thai_text(display_raw, css_px_size, inner_box_pixel_width, bold=is_bold)

        # Partition segment timeline at both word boundaries and animation keyframe steps
        cuts = {seg_cs0, seg_cs1}
        for w_cs in token_start_cs:
            if seg_cs0 < w_cs < seg_cs1:
                cuts.add(w_cs)
        for rel_t in _get_anim_sample_times(anim, seg_dur):
            c = seg_cs0 + int(round(rel_t * 100))
            if seg_cs0 < c < seg_cs1:
                cuts.add(c)

        sorted_cuts = sorted(cuts)
        badge_bord = round(max(4.0, 5.5 * scale_h), 1)
        glow_bord = round(max(3.0, 4.0 * scale_h), 1)
        inactive_glow_bord = round(max(2.0, float(eff_style.get("outline_thickness", 2.5 if m["has_out"] else 2.0))) * scale_h, 1)
        keep_lines_fixed = is_word_by_word or anim in ("pop", "bounce", "typewriter", "shake")

        for slice_idx in range(len(sorted_cuts) - 1):
            c0 = sorted_cuts[slice_idx]
            c1 = sorted_cuts[slice_idx + 1]
            if c1 <= c0:
                continue

            slice_ms = (c1 - c0) * 10
            rel0 = (c0 - seg_cs0) / 100.0
            rel1 = (c1 - seg_cs0) / 100.0
            mid_rel = 0.5 * (rel0 + rel1)

            a0, dx0, dy0, sc0, frz0 = _eval_anim_state(anim, rel0, css_px_size, stage_to_canvas, mid_rel)
            a1, dx1, dy1, sc1, frz1 = _eval_anim_state(anim, rel1, css_px_size, stage_to_canvas, mid_rel)

            x0, y0 = int(round(pixel_x + dx0)), int(round(pixel_y + dy0))
            x1, y1 = int(round(pixel_x + dx1)), int(round(pixel_y + dy1))

            ctrl_tags: List[str] = [r"\an5"]
            if keep_lines_fixed:
                ctrl_tags.append(r"\q2")
            if x0 != x1 or y0 != y1:
                ctrl_tags.append(rf"\move({x0},{y0},{x1},{y1},0,{slice_ms})")
            else:
                ctrl_tags.append(rf"\pos({x0},{y0})")

            frz0_r = round(frz0, 2)
            frz1_r = round(frz1, 2)
            if abs(frz0_r) > 0.01 or abs(frz1_r) > 0.01:
                ctrl_tags.append(rf"\frz{frz0_r:g}")
                if abs(frz1_r - frz0_r) > 0.01:
                    ctrl_tags.append(rf"\t(0,{slice_ms},\frz{frz1_r:g})")

            start_ts = _format_cs_timestamp(c0)
            end_ts = _format_cs_timestamp(c1)
            head_tag = f"{{{''.join(ctrl_tags)}}}"

            if is_word_by_word and wrapped_lines is not None:
                active_idx = 0
                for t_i, w_cs in enumerate(token_start_cs):
                    if w_cs <= c0:
                        active_idx = t_i
                    else:
                        break

                if m["has_bg_box"]:
                    # Two-layer split avoids BorderStyle=3 double-darkened overlap seams on scaled active words
                    # and preserves crisp outline/shadow on top of the translucent background box.
                    box_sc0 = round(sc0 * 100.0, 1)
                    box_sc1 = round(sc1 * 100.0, 1)
                    box_scale = rf"\fscx{box_sc0:g}\fscy{box_sc0:g}"
                    if abs(box_sc1 - box_sc0) > 0.1:
                        box_scale += rf"\t(0,{slice_ms},\fscx{box_sc1:g}\fscy{box_sc1:g})"
                    vis_box_alpha = format_alpha_block(0.0, a0 * m["style_out_op"], a0 * m["style_shd_op"], 0.0, a1 * m["style_out_op"], a1 * m["style_shd_op"], slice_ms)
                    hid_box_alpha = r"\1a&HFF&\3a&HFF&\4a&HFF&"

                    box_lines: List[str] = []
                    txt_lines: List[str] = []
                    running_idx = 0
                    for ln in wrapped_lines:
                        box_parts: List[str] = []
                        txt_parts: List[str] = []
                        prev_raw_word: Optional[str] = None
                        for tok in ln:
                            idx = running_idx
                            running_idx += 1
                            raw_word = str(tok["word"])
                            w_txt = escape_ass_text(raw_word)

                            is_hidden_tw = anim == "typewriter" and idx > active_idx
                            is_word_active = word_highlight and idx == active_idx

                            word_scale = 1.06 if is_word_active else 1.0
                            ws0 = round(word_scale * sc0 * 100.0, 1)
                            ws1 = round(word_scale * sc1 * 100.0, 1)
                            scale_tag = rf"\fscx{ws0:g}\fscy{ws0:g}"
                            if abs(ws1 - ws0) > 0.1:
                                scale_tag += rf"\t(0,{slice_ms},\fscx{ws1:g}\fscy{ws1:g})"

                            tok_fill_op = 0.0 if is_hidden_tw else 1.0
                            tok_out_op = 0.0 if is_hidden_tw else m["text_out_op"]
                            tok_shd_op = 0.0 if is_hidden_tw else m["text_shd_op"]
                            alpha_tag = format_alpha_block(
                                a0 * tok_fill_op, a0 * tok_out_op, a0 * tok_shd_op,
                                a1 * tok_fill_op, a1 * tok_out_op, a1 * tok_shd_op,
                                slice_ms,
                            )
                            fg_bgr = m["active_bgr"] if (is_word_active or not word_highlight) else m["base_bgr"]
                            color_tag = rf"\1c{fg_bgr}\3c{m['text_out_bgr']}\4c{m['text_shd_bgr']}\bord{m['text_out_thick']}\shad{m['text_shd_thick']}\blur0"

                            if prev_raw_word is not None and needs_space_between_words(prev_raw_word, raw_word):
                                box_sp_alpha = hid_box_alpha if is_hidden_tw else vis_box_alpha
                                box_parts.append(f"{{{box_scale}{box_sp_alpha}}} ")
                                sp_scale = rf"\fscx{box_sc0:g}\fscy{box_sc0:g}"
                                if abs(box_sc1 - box_sc0) > 0.1:
                                    sp_scale += rf"\t(0,{slice_ms},\fscx{box_sc1:g}\fscy{box_sc1:g})"
                                sp_alpha = format_alpha_block(
                                    a0 * tok_fill_op, a0 * tok_out_op, a0 * tok_shd_op,
                                    a1 * tok_fill_op, a1 * tok_out_op, a1 * tok_shd_op,
                                    slice_ms,
                                )
                                txt_parts.append(
                                    rf"{{\3c{m['text_out_bgr']}\4c{m['text_shd_bgr']}\bord{m['text_out_thick']}\shad{m['text_shd_thick']}\blur0{sp_scale}{sp_alpha}}} "
                                )

                            box_parts.append(f"{{{box_scale}{hid_box_alpha if is_hidden_tw else vis_box_alpha}}}{w_txt}")
                            txt_parts.append(f"{{{color_tag}{scale_tag}{alpha_tag}}}{w_txt}")
                            prev_raw_word = raw_word

                        if box_parts:
                            box_lines.append("".join(box_parts))
                        if txt_parts:
                            txt_lines.append("".join(txt_parts))

                    if box_lines and txt_lines:
                        box_body = r"\N".join(box_lines)
                        txt_body = r"\N".join(txt_lines)
                        lines.append(
                            f"Dialogue: 0,{start_ts},{end_ts},{assigned_style},,{margin_lr},{margin_lr},20,,{head_tag}{box_body}"
                        )
                        lines.append(
                            f"Dialogue: 1,{start_ts},{end_ts},{assigned_style}_Text,,{margin_lr},{margin_lr},20,,{head_tag}{txt_body}"
                        )
                    continue

                rendered_lines: List[str] = []
                running_idx = 0
                for ln in wrapped_lines:
                    line_parts: List[str] = []
                    prev_raw_word: Optional[str] = None
                    for tok in ln:
                        idx = running_idx
                        running_idx += 1
                        raw_word = str(tok["word"])
                        w_txt = escape_ass_text(raw_word)

                        is_hidden_tw = anim == "typewriter" and idx > active_idx
                        is_word_active = word_highlight and idx == active_idx
                        is_future_karaoke = word_highlight and preset_mode == "karaoke" and idx > active_idx

                        # Determine token visual properties cleanly without \r resets (preserves line \frz)
                        word_scale = 1.06 if is_word_active else 1.0
                        ws0 = round(word_scale * sc0 * 100.0, 1)
                        ws1 = round(word_scale * sc1 * 100.0, 1)
                        scale_tag = rf"\fscx{ws0:g}\fscy{ws0:g}"
                        if abs(ws1 - ws0) > 0.1:
                            scale_tag += rf"\t(0,{slice_ms},\fscx{ws1:g}\fscy{ws1:g})"

                        if is_hidden_tw:
                            tok_fill_op = 0.0
                            tok_out_op = 0.0
                            tok_shd_op = 0.0
                        else:
                            dim_mult = 0.45 if is_future_karaoke else 1.0
                            tok_fill_op = dim_mult
                            if is_word_active and preset_mode == "badge":
                                tok_out_op = 1.0 * dim_mult
                                tok_shd_op = 0.0
                            elif is_word_active and m["is_neon"]:
                                tok_out_op = 0.65 * dim_mult
                                tok_shd_op = (0.65 if m["has_shd"] else 0.0) * dim_mult
                            elif not is_word_active and word_highlight and m["is_neon"]:
                                tok_out_op = 0.45 * dim_mult
                                tok_shd_op = (0.55 if m["has_shd"] else 0.0) * dim_mult
                            else:
                                tok_out_op = m["style_out_op"] * dim_mult
                                tok_shd_op = m["style_shd_op"] * dim_mult

                        alpha_tag = format_alpha_block(
                            a0 * tok_fill_op,
                            a0 * tok_out_op,
                            a0 * tok_shd_op,
                            a1 * tok_fill_op,
                            a1 * tok_out_op,
                            a1 * tok_shd_op,
                            slice_ms,
                        )

                        if word_highlight:
                            if is_word_active:
                                if preset_mode == "badge":
                                    color_tag = rf"\1c&H000000&\3c{m['badge_bgr']}\4c&H000000&\bord{badge_bord}\shad0\blur0"
                                elif m["is_neon"]:
                                    color_tag = rf"\1c{m['active_bgr']}\3c{m['active_bgr']}\4c&H000000&\bord{glow_bord}\shad{m['shd_thick']}\blur4"
                                else:
                                    color_tag = rf"\1c{m['active_bgr']}\3c{m['base_out_bgr']}\4c{m['base_shd_bgr']}\bord{m['out_thick']}\shad{m['shd_thick']}\blur0"
                            else:
                                if m["is_neon"]:
                                    color_tag = rf"\1c{m['base_bgr']}\3c{m['active_bgr']}\4c&H000000&\bord{inactive_glow_bord}\shad{m['shd_thick']}\blur3"
                                else:
                                    color_tag = rf"\1c{m['base_bgr']}\3c{m['base_out_bgr']}\4c{m['base_shd_bgr']}\bord{m['out_thick']}\shad{m['shd_thick']}\blur0"
                        else:
                            # Typewriter with word_highlight=False: preserve primary text_color and style appearance
                            if m["is_neon"]:
                                color_tag = rf"\1c{m['active_bgr']}\3c{m['active_bgr']}\4c&H000000&\bord{m['out_thick']}\shad{m['shd_thick']}\blur3"
                            else:
                                color_tag = rf"\1c{m['active_bgr']}\3c{m['base_out_bgr']}\4c{m['base_shd_bgr']}\bord{m['out_thick']}\shad{m['shd_thick']}\blur0"

                        if prev_raw_word is not None and needs_space_between_words(prev_raw_word, raw_word):
                            sp_mult = 0.0 if is_hidden_tw else (0.45 if is_future_karaoke else 1.0)
                            sp_alpha = format_alpha_block(
                                a0 * sp_mult,
                                a0 * m["style_out_op"] * sp_mult,
                                a0 * m["style_shd_op"] * sp_mult,
                                a1 * sp_mult,
                                a1 * m["style_out_op"] * sp_mult,
                                a1 * m["style_shd_op"] * sp_mult,
                                slice_ms,
                            )
                            sp_sc0 = round(sc0 * 100.0, 1)
                            sp_sc1 = round(sc1 * 100.0, 1)
                            sp_scale = rf"\fscx{sp_sc0:g}\fscy{sp_sc0:g}"
                            if abs(sp_sc1 - sp_sc0) > 0.1:
                                sp_scale += rf"\t(0,{slice_ms},\fscx{sp_sc1:g}\fscy{sp_sc1:g})"
                            line_parts.append(
                                rf"{{\3c{m['base_out_bgr']}\4c{m['base_shd_bgr']}\bord{m['out_thick']}\shad{m['shd_thick']}\blur0{sp_scale}{sp_alpha}}} "
                            )

                        line_parts.append(f"{{{color_tag}{scale_tag}{alpha_tag}}}{w_txt}")
                        prev_raw_word = raw_word

                    if line_parts:
                        rendered_lines.append("".join(line_parts))

                body_text = r"\N".join(rendered_lines)
                if body_text:
                    lines.append(
                        f"Dialogue: 0,{start_ts},{end_ts},{assigned_style},,{margin_lr},{margin_lr},20,,{head_tag}{body_text}"
                    )
            else:
                body_text = static_wrapped_text
                if body_text:
                    scale_tags: List[str] = []
                    if abs(sc0 - 1.0) > 0.002 or abs(sc1 - 1.0) > 0.002:
                        s0_pct = round(sc0 * 100.0, 1)
                        s1_pct = round(sc1 * 100.0, 1)
                        scale_tags.append(rf"\fscx{s0_pct:g}\fscy{s0_pct:g}")
                        if abs(s1_pct - s0_pct) > 0.1:
                            scale_tags.append(rf"\t(0,{slice_ms},\fscx{s1_pct:g}\fscy{s1_pct:g})")

                    if m["has_bg_box"] and (m["has_out"] or m["has_shd"]):
                        box_ctrl = ctrl_tags + scale_tags + [
                            format_alpha_block(0.0, a0 * m["style_out_op"], a0 * m["style_shd_op"], 0.0, a1 * m["style_out_op"], a1 * m["style_shd_op"], slice_ms)
                        ]
                        txt_ctrl = ctrl_tags + scale_tags
                        if a0 < 0.999 or a1 < 0.999 or m["text_out_op"] < 0.999 or m["text_shd_op"] < 0.999:
                            txt_ctrl.append(
                                format_alpha_block(a0, a0 * m["text_out_op"], a0 * m["text_shd_op"], a1, a1 * m["text_out_op"], a1 * m["text_shd_op"], slice_ms)
                            )
                        lines.append(
                            f"Dialogue: 0,{start_ts},{end_ts},{assigned_style},,{margin_lr},{margin_lr},20,,{{{''.join(box_ctrl)}}}{body_text}"
                        )
                        lines.append(
                            f"Dialogue: 1,{start_ts},{end_ts},{assigned_style}_Text,,{margin_lr},{margin_lr},20,,{{{''.join(txt_ctrl)}}}{body_text}"
                        )
                    else:
                        full_ctrl = ctrl_tags + scale_tags
                        if a0 < 0.999 or a1 < 0.999:
                            full_ctrl.append(
                                format_alpha_block(
                                    a0,
                                    a0 * m["style_out_op"],
                                    a0 * m["style_shd_op"],
                                    a1,
                                    a1 * m["style_out_op"],
                                    a1 * m["style_shd_op"],
                                    slice_ms,
                                )
                            )
                        if m["is_neon"] and not m["has_bg_box"]:
                            full_ctrl.append(r"\blur3")
                        lines.append(
                            f"Dialogue: 0,{start_ts},{end_ts},{assigned_style},,{margin_lr},{margin_lr},20,,{{{''.join(full_ctrl)}}}{body_text}"
                        )

    return "\n".join(lines) + "\n"


def compute_canvas_dimensions(real_w: int, real_h: int, aspect_ratio: Optional[str] = None) -> tuple[int, int]:
    """
    Computes standard, even Full-HD canvas dimensions matching the target aspect ratio.
    Ensures width and height are divisible by 2 for H.264/yuv420p compatibility and crisp
    1080p/1920p burned-in subtitle typography.
    """
    real_w = real_w - (real_w % 2) if real_w and real_w > 0 else 1080
    real_h = real_h - (real_h % 2) if real_h and real_h > 0 else 1920

    if not aspect_ratio or str(aspect_ratio).strip().lower() == "original":
        return real_w, real_h

    ar = str(aspect_ratio).strip().lower()

    if ar == "16:9":
        if abs(real_w / max(1, real_h) - 16 / 9) < 0.03 and real_h >= 1080:
            return real_w, real_h
        return (1920, 1080)

    if ar == "9:16":
        if abs(real_w / max(1, real_h) - 9 / 16) < 0.03 and real_h >= 1440:
            return real_w, real_h
        return (1080, 1920)

    if ar in ("1:1", "square"):
        if abs(real_w / max(1, real_h) - 1.0) < 0.03 and real_h >= 1080:
            return real_w, real_h
        return (1080, 1080)

    return real_w, real_h
