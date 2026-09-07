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

from typing import List, Dict, Any, Optional

def is_thai_combining_char(ch: str) -> bool:
    """Returns True if character is a Thai combining mark (vowel or tone mark) with 0 advance width."""
    code = ord(ch)
    return code == 0x0E31 or (0x0E34 <= code <= 0x0E3A) or (0x0E47 <= code <= 0x0E4E)

def get_thai_text_width(text: str, font_size: float) -> float:
    """Calculates approximate visual advance width in pixels."""
    base_chars = sum(0 if is_thai_combining_char(c) else 1 for c in text)
    return base_chars * (font_size * 0.52)

def wrap_thai_text(text: str, font_size: float, max_width: float) -> str:
    """
    Wraps Thai and multilingual text cleanly using pythainlp word boundary tokenization.
    Preserves existing user line breaks (\n) and inserts \\N where a line exceeds max_width.
    """
    if not text:
        return ""
    
    try:
        import pythainlp
        has_pythainlp = True
    except ImportError:
        has_pythainlp = False

    paragraphs = text.replace('\r\n', '\n').split('\n')
    result_lines = []
    
    for p in paragraphs:
        clean_p = p.strip()
        if not clean_p:
            continue
        
        # If line already fits within max_width, keep it as-is
        if get_thai_text_width(clean_p, font_size) <= max_width:
            result_lines.append(clean_p)
            continue
            
        # Tokenize into words
        if has_pythainlp:
            try:
                words = pythainlp.word_tokenize(clean_p, engine='newmm')
            except Exception:
                words = clean_p.split(' ')
        else:
            words = clean_p.split(' ')
            
        cur_line = []
        cur_w = 0.0
        for w in words:
            ww = get_thai_text_width(w, font_size)
            if cur_w + ww > max_width and cur_line:
                result_lines.append(''.join(cur_line))
                cur_line = [w]
                cur_w = ww
            else:
                cur_line.append(w)
                cur_w += ww
                
        if cur_line:
            result_lines.append(''.join(cur_line))
            
    return r'\N'.join(result_lines)

def generate_ass_content(
    subtitles: List[Dict[str, Any]],
    styles: Dict[str, Any] = None,
    video_width: int = 1080,
    video_height: int = 1920,
    preview_width: Optional[float] = None,
    preview_height: Optional[float] = None
) -> str:
    """
    Generates a full .ass subtitle file string based on subtitle segments and user styles.
    Accurately maps preview coordinates (custom_x, custom_y in %, box_width in %, font_size)
    into ASS tags so the rendered output is pixel-accurate to the editor preview.
    """
    if styles is None:
        styles = {}

    # Ensure valid canvas dimensions
    video_width = int(video_width) if video_width and int(video_width) > 0 else 1080
    video_height = int(video_height) if video_height and int(video_height) > 0 else 1920

    # Reference video height that the frontend uses when computing preview font size:
    # frontend: computedFontSize = font_size * (containerH / refVideoH)
    # where refVideoH = 1920 for 9:16, else 1080
    ratio = video_width / max(1, video_height)
    if ratio < 0.9:
        ref_video_h = 1920.0
        default_prev_h = 550.0
    else:
        ref_video_h = 1080.0
        default_prev_h = 450.0

    eff_prev_h = float(preview_height) if preview_height and float(preview_height) > 100 else default_prev_h

    # The frontend renders: preview_font_size = font_size * (eff_prev_h / ref_video_h)
    # To get the correct rendered font size on the full video:
    # rendered_font_size = font_size * (video_height / ref_video_h)
    # which equals: preview_font_size * (video_height / eff_prev_h)
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
        "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding"
    ]

    # Generate style block helper
    def build_ass_style(style_name: str, s_map: Dict[str, Any]) -> str:
        f_family = s_map.get("font_family") or "Noto Sans Thai"
        raw_font_size = float(s_map.get("font_size", 52))

        # Scale font to video canvas height using the same ratio as the frontend preview
        f_size = max(8, int(round(raw_font_size * scale_h)))

        bld = -1 if s_map.get("bold", True) else 0
        ita = -1 if s_map.get("italic", False) else 0
        und = -1 if s_map.get("underline", False) else 0

        txt_col = s_map.get("text_color", "#FFFFFF")
        shd_col = s_map.get("shadow_color", "#000000")
        bg_col = s_map.get("bg_color", "#000000")
        bg_op = float(s_map.get("bg_opacity", 0.0))
        has_shd = bool(s_map.get("shadow", False))
        has_out = bool(s_map.get("outline", False))

        shd_thick = max(1, int(round(float(s_map.get("shadow_thickness", 2)) * scale_h))) if has_shd else 0
        out_thick = max(1, int(round(1.5 * scale_h))) if has_out else (1 if not has_shd else 0)

        # Border style: 1 = outline/shadow, 3 = opaque background box
        if bg_op > 0.05:
            brd_style = 3
            padding_y = float(s_map.get("padding_y", 10))
            out_thick = max(2, int(round(padding_y * scale_h)))
            shd_thick = 0
            pri_c = hex_to_ass_color(txt_col, 1.0)
            sec_c = "&H000000FF&"
            # For BorderStyle 3, OutlineColour is the background box color with opacity!
            out_c = hex_to_ass_color(bg_col, bg_op)
            bak_c = hex_to_ass_color(bg_col, bg_op)
        else:
            brd_style = 1
            shd_thick = max(1, int(round(float(s_map.get("shadow_thickness", 2)) * scale_h))) if has_shd else 0
            out_thick = max(1, int(round(1.5 * scale_h))) if has_out else (1 if not has_shd else 0)
            pri_c = hex_to_ass_color(txt_col, 1.0)
            sec_c = "&H000000FF&"
            out_c = hex_to_ass_color(shd_col, 1.0) if has_out else "&H00000000&"
            bak_c = hex_to_ass_color(shd_col, 0.8) if has_shd else "&H00000000&"

        # Default alignment 5 (middle-center) when using \pos coordinates
        return f"Style: {style_name},{f_family},{f_size},{pri_c},{sec_c},{out_c},{bak_c},{bld},{ita},{und},0,100,100,0,0,{brd_style},{out_thick},{shd_thick},5,20,20,20,1"

    # 1. Global Default Style
    lines.append(build_ass_style("Default", styles))

    # 2. Individual Subtitle Custom Styles (if a subtitle segment has custom style)
    custom_styles_map = {}
    for sub in subtitles:
        sub_style = sub.get("style")
        if sub_style and isinstance(sub_style, dict):
            s_id = f"Style_{sub.get('id', len(custom_styles_map)+1)}"
            custom_styles_map[sub.get("id")] = s_id
            lines.append(build_ass_style(s_id, {**styles, **sub_style}))

    lines.append("")
    lines.append("[Events]")
    lines.append("Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text")

    for sub in subtitles:
        start_sec = float(sub.get("start", 0.0))
        end_sec = float(sub.get("end", 0.0))
        if end_sec <= start_sec:
            end_sec = start_sec + 2.0

        start_ts = format_ass_timestamp(start_sec)
        end_ts = format_ass_timestamp(end_sec)
        raw_text = str(sub.get("text", "")).strip()
        if not raw_text:
            continue

        eff_style = {**styles, **(sub.get("style") or {})}
        assigned_style = custom_styles_map.get(sub.get("id"), "Default")

        # Position calculation:
        # custom_x (default 50%), custom_y (default based on position: bottom=82%, center=50%, top/custom=12%)
        pos_mode = eff_style.get("position", "bottom")
        default_y = 50.0 if pos_mode == "center" else (12.0 if pos_mode in ("top", "custom") else 82.0)
        pct_x = float(eff_style.get("custom_x") if eff_style.get("custom_x") is not None else 50.0)
        pct_y = float(eff_style.get("custom_y") if eff_style.get("custom_y") is not None else default_y)

        pixel_x = int(round((pct_x / 100.0) * video_width))
        pixel_y = int(round((pct_y / 100.0) * video_height))

        # Margin/box_width calculation:
        box_w = float(eff_style.get("box_width") or 86.0)
        box_margin_pct = max(2.0, (100.0 - box_w) / 2.0)
        margin_lr = int(round((box_margin_pct / 100.0) * video_width))
        max_box_pixel_width = max(100.0, (box_w / 100.0) * video_width)

        # Animation tag
        anim = (eff_style.get("animation") or "none").lower()
        anim_tag = ""
        if anim == "fade":
            anim_tag = r"{\fad(250,150)}"
        elif anim == "pop":
            anim_tag = r"{\t(0,180,\fscx112\fscy112)\t(180,300,\fscx100\fscy100)}"
        elif anim == "typewriter":
            anim_tag = r"{\q2}"

        # Position tag: \an5 ensures anchor is true center, matching preview transform: translate(-50%, -50%)
        pos_tag = rf"{{\an5\pos({pixel_x},{pixel_y})}}"

        # Get style-specific font size for wrapping (same formula as build_ass_style)
        raw_fs = float(eff_style.get("font_size", 52))
        cur_f_size = max(8, int(round(raw_fs * scale_h)))

        # Smart Thai word wrapping so text respects box_width and never overflows screen
        padding_x = float(eff_style.get("padding_x", 16))
        inner_box_pixel_width = max(80.0, max_box_pixel_width - (2.0 * padding_x * scale_h))
        wrapped_text = wrap_thai_text(raw_text, cur_f_size, inner_box_pixel_width)
        dialogue_text = f"{pos_tag}{anim_tag}{wrapped_text}"

        lines.append(f"Dialogue: 0,{start_ts},{end_ts},{assigned_style},,{margin_lr},{margin_lr},20,,{dialogue_text}")

    return "\n".join(lines) + "\n"


def compute_canvas_dimensions(real_w: int, real_h: int, aspect_ratio: Optional[str] = None) -> tuple[int, int]:
    """
    Computes standard, even canvas dimensions matching the target aspect ratio.
    Ensures width and height are divisible by 2 for H.264/yuv420p compatibility.
    """
    real_w = real_w - (real_w % 2) if real_w and real_w > 0 else 1080
    real_h = real_h - (real_h % 2) if real_h and real_h > 0 else 1920

    if not aspect_ratio or str(aspect_ratio).strip().lower() == "original":
        return real_w, real_h

    ar = str(aspect_ratio).strip().lower()

    if ar == "16:9":
        # 16:9 landscape canvas
        # If already ~16:9 (within 3% tolerance), keep native
        if abs(real_w / max(1, real_h) - 16 / 9) < 0.03:
            return real_w, real_h
        if max(real_w, real_h) >= 1440:
            return (1920, 1080)
        return (1280, 720)

    if ar == "9:16":
        # 9:16 portrait canvas
        if abs(real_w / max(1, real_h) - 9 / 16) < 0.03:
            return real_w, real_h
        if max(real_w, real_h) >= 1440:
            return (1080, 1920)
        return (720, 1280)

    if ar in ("1:1", "square"):
        # 1:1 square canvas
        if abs(real_w / max(1, real_h) - 1.0) < 0.03:
            return real_w, real_h
        if max(real_w, real_h) >= 1000:
            return (1080, 1080)
        return (720, 720)

    return real_w, real_h


