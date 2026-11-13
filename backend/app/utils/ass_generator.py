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

    def build_ass_style(style_name: str, s_map: Dict[str, Any]) -> str:
        f_family = s_map.get("font_family") or "Kanit"
        raw_font_size = float(s_map.get("font_size", 56))
        f_size = max(8.0, round(libass_font_size(f_family, raw_font_size * scale_h), 1))

        bld = -1 if s_map.get("bold", True) else 0
        ita = -1 if s_map.get("italic", False) else 0
        und = -1 if s_map.get("underline", False) else 0

        txt_col = str(s_map.get("text_color") or "#FFFFFF")
        shd_col = str(s_map.get("shadow_color") or "#000000")
        out_col = str(s_map.get("outline_color") or shd_col or "#000000")
        bg_col = str(s_map.get("bg_color") or "#000000")
        _, _, _, bg_eff_op = parse_color_rgba(bg_col, float(s_map.get("bg_opacity", 0.0)))

        has_shd = bool(s_map.get("shadow", False))
        has_out = bool(s_map.get("outline", False))
        preset_mode = str(s_map.get("preset_mode") or "default").lower()

        raw_out_thick = float(s_map.get("outline_thickness", 3.0 if has_out else 0.0))
        raw_shd_thick = float(s_map.get("shadow_thickness", 2.0 if has_shd else 0.0))
        letter_spacing = round(float(s_map.get("letter_spacing", 0.0)) * scale_h, 1)

        if bg_eff_op > 0.05:
            brd_style = 3
            padding_y = float(s_map.get("padding_y", 8.0))
            out_thick = max(4.0, round(padding_y * scale_h * 1.15, 1))
            shd_thick = 0.0
            pri_c = hex_to_ass_color(txt_col, 1.0)
            sec_c = "&H000000FF&"
            out_c = hex_to_ass_color(bg_col, bg_eff_op)
            bak_c = hex_to_ass_color(bg_col, bg_eff_op)
        else:
            brd_style = 1
            pri_c = hex_to_ass_color(txt_col, 1.0)
            sec_c = "&H000000FF&"
            if preset_mode == "karaoke":
                out_thick = round(max(2.5, raw_out_thick) * scale_h, 1)
                shd_thick = round(max(1.0, raw_shd_thick) * scale_h, 1) if has_shd else 0.0
                out_c = hex_to_ass_color(txt_col, 0.55)
                bak_c = hex_to_ass_color("#000000", 0.65)
            else:
                out_thick = round(max(0.5, raw_out_thick) * scale_h, 1) if has_out else 0.0
                shd_thick = round(max(0.5, raw_shd_thick) * scale_h, 1) if has_shd else 0.0
                out_c = hex_to_ass_color(out_col, 1.0) if has_out else "&HFF000000&"
                bak_c = hex_to_ass_color(shd_col, 0.72) if has_shd else "&HFF000000&"

        return (
            f"Style: {style_name},{f_family},{f_size},{pri_c},{sec_c},{out_c},{bak_c},"
            f"{bld},{ita},{und},0,100,100,{letter_spacing},0,{brd_style},{out_thick},{shd_thick},5,20,20,20,1"
        )

    lines.append(build_ass_style("Default", styles))

    custom_styles_map: Dict[Any, str] = {}
    for sub in subtitles:
        sub_style = sub.get("style")
        if sub_style and isinstance(sub_style, dict):
            s_id = f"Style_{sub.get('id', len(custom_styles_map) + 1)}"
            custom_styles_map[sub.get("id")] = s_id
            lines.append(build_ass_style(s_id, {**styles, **sub_style}))

    lines.append("")
    lines.append("[Events]")
    lines.append("Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text")

    def build_anim_override(anim: str, pixel_x: int, pixel_y: int, allow_entry: bool, allow_exit: bool) -> Tuple[str, str]:
        """Returns (position_tag, animation_tag)."""
        offset_y = max(12, int(round(28 * scale_h)))
        if anim == "slide-up" and allow_entry:
            pos = rf"{{\an5\move({pixel_x},{pixel_y + offset_y},{pixel_x},{pixel_y},0,240)}}"
        else:
            pos = rf"{{\an5\pos({pixel_x},{pixel_y})}}"

        tags: List[str] = []
        if anim == "fade":
            fad_in = 200 if allow_entry else 0
            fad_out = 150 if allow_exit else 0
            if fad_in or fad_out:
                tags.append(rf"\fad({fad_in},{fad_out})")
        elif anim == "pop" and allow_entry:
            tags.append(r"\t(0,150,\fscx110\fscy110)\t(150,260,\fscx100\fscy100)")
        elif anim == "bounce" and allow_entry:
            tags.append(r"\t(0,140,\fscx116\fscy116)\t(140,260,\fscx95\fscy95)\t(260,360,\fscx100\fscy100)")
        elif anim == "slide-up" and allow_entry:
            tags.append(r"\fad(160,0)")
        elif anim == "shake" and allow_entry:
            tags.append(r"\t(0,70,\frz-2.5)\t(70,140,\frz2.5)\t(140,210,\frz-1.5)\t(210,280,\frz0)")
        elif anim == "typewriter":
            tags.append(r"\q2")

        anim_str = f"{{{''.join(tags)}}}" if tags else ""
        return pos, anim_str

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
        preset_mode = str(eff_style.get("preset_mode") or "default").lower()
        raw_word_hl = eff_style.get("word_highlight")
        if raw_word_hl is None:
            word_highlight = preset_mode in ("tiktok", "badge", "karaoke", "danger", "frosted", "warm")
        else:
            word_highlight = bool(raw_word_hl)

        tokens = normalize_segment_word_tokens(sub, raw_text, start_sec, end_sec, uppercase=uppercase)

        # Multi-word highlight / karaoke / badge / typewriter path
        if (word_highlight or anim == "typewriter") and len(tokens) > 1:
            wrapped_lines = wrap_word_tokens(tokens, inner_box_pixel_width, css_px_size, bold=is_bold)
            active_bgr = hex_to_ass_bgr(str(eff_style.get("text_color") or "#FACC15"))
            base_bgr = hex_to_ass_bgr(str(eff_style.get("base_text_color") or "#FFFFFF"))
            badge_bgr = hex_to_ass_bgr(str(eff_style.get("badge_color") or eff_style.get("text_color") or "#22C55E"))

            _, _, _, eff_bg_op = parse_color_rgba(
                str(eff_style.get("bg_color") or "#000000"),
                float(eff_style.get("bg_opacity", 0.0)),
            )
            has_bg_box = eff_bg_op > 0.05

            out_col = str(eff_style.get("outline_color") or eff_style.get("shadow_color") or "#000000")
            base_out_bgr = hex_to_ass_bgr(out_col)
            has_out = bool(eff_style.get("outline", True))
            base_bord = round(float(eff_style.get("outline_thickness", 3.0)) * scale_h, 1) if has_out else 0.0
            badge_bord = round(max(4.0, 5.5 * scale_h), 1)
            glow_bord = round(max(3.0, 4.0 * scale_h), 1)

            flat_tokens = [tok for ln in wrapped_lines for tok in ln]
            flat_total = len(flat_tokens)
            for active_idx in range(flat_total):
                cur_tok = flat_tokens[active_idx]
                w_start_ts = format_ass_timestamp(cur_tok["start"])
                w_end_ts = format_ass_timestamp(cur_tok["end"])
                if w_end_ts == w_start_ts:
                    continue

                allow_entry = active_idx == 0
                allow_exit = active_idx == flat_total - 1
                pos_tag, anim_tag = build_anim_override(anim, pixel_x, pixel_y, allow_entry, allow_exit)

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

                        if anim == "typewriter" and idx > active_idx:
                            continue

                        if word_highlight:
                            if idx == active_idx:
                                if has_bg_box:
                                    part = rf"{{\1c{active_bgr}\1a&H00&\fscx106\fscy106}}{w_txt}{{\r{assigned_style}}}"
                                elif preset_mode == "badge":
                                    part = rf"{{\1c&H000000&\1a&H00&\3c{badge_bgr}\bord{badge_bord}\shad0\fscx106\fscy106}}{w_txt}{{\r{assigned_style}}}"
                                elif preset_mode == "karaoke":
                                    part = rf"{{\1c{active_bgr}\1a&H00&\3c{active_bgr}\bord{glow_bord}\blur4\fscx106\fscy106}}{w_txt}{{\r{assigned_style}}}"
                                else:
                                    part = rf"{{\1c{active_bgr}\1a&H00&\3c{base_out_bgr}\bord{base_bord}\fscx106\fscy106}}{w_txt}{{\r{assigned_style}}}"
                            else:
                                alpha_tag = r"\1a&H88&" if (preset_mode == "karaoke" and idx > active_idx) else r"\1a&H00&"
                                if has_bg_box:
                                    part = rf"{{\1c{base_bgr}{alpha_tag}\fscx100\fscy100}}{w_txt}"
                                else:
                                    part = rf"{{\1c{base_bgr}{alpha_tag}\3c{base_out_bgr}\bord{base_bord}\blur0\fscx100\fscy100}}{w_txt}"
                        else:
                            part = w_txt

                        if prev_raw_word is not None and needs_space_between_words(prev_raw_word, raw_word):
                            line_parts.append(" ")
                        line_parts.append(part)
                        prev_raw_word = raw_word

                    if line_parts:
                        rendered_lines.append("".join(line_parts))

                if rendered_lines:
                    full_text = r"\N".join(rendered_lines)
                    lines.append(
                        f"Dialogue: 0,{w_start_ts},{w_end_ts},{assigned_style},,{margin_lr},{margin_lr},20,,{pos_tag}{anim_tag}{full_text}"
                    )
        else:
            start_ts = format_ass_timestamp(start_sec)
            end_ts = format_ass_timestamp(end_sec)
            pos_tag, anim_tag = build_anim_override(anim, pixel_x, pixel_y, True, True)
            glow_tag = r"{\blur3}" if preset_mode == "karaoke" else ""
            display_raw = raw_text.upper() if uppercase else raw_text
            if (
                tokens
                and len(tokens) >= 3
                and sum(1 for t in tokens if _THAI_SCRIPT_RE.search(str(t["word"]))) >= 3
                and display_raw == " ".join(str(t["word"]) for t in tokens)
            ):
                display_raw = join_subtitle_words([str(t["word"]) for t in tokens])
            wrapped_text = wrap_thai_text(display_raw, css_px_size, inner_box_pixel_width, bold=is_bold)
            lines.append(
                f"Dialogue: 0,{start_ts},{end_ts},{assigned_style},,{margin_lr},{margin_lr},20,,{pos_tag}{anim_tag}{glow_tag}{wrapped_text}"
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
