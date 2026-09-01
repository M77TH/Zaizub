import re
from typing import List, Dict, Any

def hex_to_ass_color(hex_color: str, opacity: float = 1.0) -> str:
    """
    Converts a CSS hex color (#RRGGBB or #RGB) + opacity (0.0 to 1.0)
    to ASS &HAABBGGRR& format.
    In ASS:
    - AA is alpha (00 = 100% opaque, FF = 100% transparent)
    - BB is Blue
    - GG is Green
    - RR is Red
    """
    if not hex_color:
        hex_color = "#FFFFFF"
    
    clean_hex = hex_color.lstrip("#")
    if len(clean_hex) == 3:
        clean_hex = "".join([c * 2 for c in clean_hex])
    elif len(clean_hex) != 6:
        clean_hex = "FFFFFF"

    try:
        r = int(clean_hex[0:2], 16)
        g = int(clean_hex[2:4], 16)
        b = int(clean_hex[4:6], 16)
    except ValueError:
        r, g, b = 255, 255, 255

    # In ASS, 00 = completely opaque, FF = completely transparent
    opacity = max(0.0, min(1.0, float(opacity)))
    alpha = int(round((1.0 - opacity) * 255))
    alpha = max(0, min(255, alpha))

    return f"&H{alpha:02X}{b:02X}{g:02X}{r:02X}&"

def format_ass_timestamp(seconds: float) -> str:
    """
    Converts float seconds into ASS timestamp format: H:MM:SS.cs
    (where cs is centiseconds, 2 digits)
    """
    total_seconds = max(0.0, float(seconds))
    hours = int(total_seconds // 3600)
    minutes = int((total_seconds % 3600) // 60)
    secs = int(total_seconds % 60)
    centisecs = int(round((total_seconds - int(total_seconds)) * 100))
    if centisecs >= 100:
        centisecs = 99

    return f"{hours}:{minutes:02d}:{secs:02d}.{centisecs:02d}"

def generate_ass_content(
    subtitles: List[Dict[str, Any]],
    styles: Dict[str, Any] = None,
    video_width: int = 1920,
    video_height: int = 1080
) -> str:
    """
    Generates a full .ass subtitle file string based on subtitle segments and user styles.
    """
    if styles is None:
        styles = {}

    font_family = styles.get("font_family") or "Noto Sans Thai"
    font_size = int(styles.get("font_size", 60))
    bold = -1 if styles.get("bold", False) else 0
    italic = -1 if styles.get("italic", False) else 0
    underline = -1 if styles.get("underline", False) else 0

    text_color_hex = styles.get("text_color", "#FFFFFF")
    shadow_color_hex = styles.get("shadow_color", "#000000")
    bg_color_hex = styles.get("bg_color", "#000000")
    bg_opacity = float(styles.get("bg_opacity", 0.0))
    has_shadow = bool(styles.get("shadow", True))
    has_outline = bool(styles.get("outline", False))

    shadow_thickness = int(styles.get("shadow_thickness", 2)) if has_shadow else 0
    outline_thickness = 2 if has_outline else (1 if not has_shadow else 0)

    # Position: "bottom", "center", "custom" / "top"
    position = styles.get("position", "bottom").lower()
    if position == "center":
        alignment = 5
        margin_v = 0
    elif position in ("top", "custom"):
        alignment = 8
        margin_v = 60
    else:  # default bottom
        alignment = 2
        margin_v = 60

    # Border style:
    # 1 = outline + shadow
    # 3 = opaque box (background box)
    if bg_opacity > 0.1:
        border_style = 3
        outline_thickness = int(styles.get("padding_y", 12)) // 2
    else:
        border_style = 1

    primary_colour = hex_to_ass_color(text_color_hex, 1.0)
    secondary_colour = "&H000000FF&"
    outline_colour = hex_to_ass_color(shadow_color_hex, 1.0)
    back_colour = hex_to_ass_color(bg_color_hex, bg_opacity) if bg_opacity > 0 else hex_to_ass_color(shadow_color_hex, 0.8)

    animation = (styles.get("animation") or "none").lower()

    # Determine animation tag for dialog
    anim_tag = ""
    if animation == "fade":
        anim_tag = "{\\fad(250,150)}"
    elif animation == "pop":
        anim_tag = "{\\t(0,180,\\fscx112\\fscy112)\\t(180,300,\\fscx100\\fscy100)}"
    elif animation == "typewriter":
        anim_tag = "{\\q2}"

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
        f"Style: Default,{font_family},{font_size},{primary_colour},{secondary_colour},{outline_colour},{back_colour},{bold},{italic},{underline},0,100,100,0,0,{border_style},{outline_thickness},{shadow_thickness},{alignment},30,30,{margin_v},1",
        "",
        "[Events]",
        "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text"
    ]

    for sub in subtitles:
        start_sec = float(sub.get("start", 0.0))
        end_sec = float(sub.get("end", 0.0))
        if end_sec <= start_sec:
            end_sec = start_sec + 2.0

        start_ts = format_ass_timestamp(start_sec)
        end_ts = format_ass_timestamp(end_sec)
        raw_text = str(sub.get("text", "")).strip()

        # Handle newlines in ASS: replace \n with \N
        text_escaped = raw_text.replace("\r\n", "\\N").replace("\n", "\\N")
        dialogue_text = f"{anim_tag}{text_escaped}"
        lines.append(f"Dialogue: 0,{start_ts},{end_ts},Default,,0,0,0,,{dialogue_text}")

    return "\n".join(lines) + "\n"

