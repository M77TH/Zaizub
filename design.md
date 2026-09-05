# Zaizub Video Subtitle Editor — Design & Architecture Specification (`design.md`)

> **Product**: Zaizub AI Video Subtitle Studio  
> **Workspace Path**: `frontend/app/(Account)/editor`  
> **Tech Stack**: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, FastAPI Backend, Groq API (`whisper-large-v3`), FFmpeg.

---

## 1. Executive Summary & Design Vision

**Zaizub Editor** is a web-based, professional video subtitle editor built specifically for short-form creators (TikTok, YouTube Shorts, Reels) and long-form content producers. It marries AI-powered speech-to-text transcription with interactive subtitle styling, dynamic word-length re-grouping, frame-accurate timing adjustment, and direct video rendering.

### Core Visual Philosophy
- **Dark Cyber & Slate Aesthetic**: High-contrast, fatigue-free dark theme with deep purples (`#7c3aed`), dark obsidian backgrounds (`#0c0b11`, `#13121b`), and slate borders (`#1c1a28`).
- **Zero-Flicker & Zero-Latency**: Optimized history management (50-state bounded stack), instant pointer-drag coordinate calculations, and smooth virtualized scroll behavior.
- **Thai Typography First-Class Support**: Curated typography engine supporting 17+ Google Thai fonts and custom `.ttf`/`.otf` font upload with live browser preview via `FontFace` API.

---

## 2. Layout & Workspace Blueprint

The editor workspace is organized into a modular **3-panel desktop layout** with an adaptive mobile single-view switcher.

```
+----------------------------------------------------------------------------------------------------+
|  TOP HEADER: Project Name | Word Length | Aspect Ratio | Speed | Undo/Redo | Save | Export | Render  |
+------------------------------------+------------------------------------+------------------+-------+
|  LEFT PANEL: Transcript & Timing   |  CENTER STAGE: Video Preview       |  RIGHT PANEL:    | TABS  |
|                                    |                                    |  Style Inspector | DOCK  |
|  - Search & Hit Counter            |  - Video Canvas (16:9 / 9:16 / 1:1)|  - Global vs     | [🎨]  |
|  - Sync Follow Playhead            |  - Interactive Subtitle Overlay    |    Segment Scope | Style |
|  - Word / Segment Cards            |    (Drag & Resize X/Y %, Width)    |  - Font Picker   |       |
|  - Inline Text Editor              |  - Dynamic Alignment Center Guide  |  - Color & Alpha | [📑]  |
|  - Split / Merge / Shift Timing    +------------------------------------+  - Box & Shadow  | Tmpl  |
|  - Batch Delete Mode               |  TRANSPORT BAR: Scrubber | Controls|  - Animations    |       |
+------------------------------------+------------------------------------+------------------+-------+
```

---

## 3. Component Hierarchy & Module Breakdown

| Component | File Path | Core Responsibilities |
| :--- | :--- | :--- |
| **`EditorWorkspace`** | [`EditorWorkspace.tsx`](file:///c:/Users/ongch/Desktop/zaizub/frontend/components/editor/EditorWorkspace.tsx) | Master state manager, panel resizing, undo/redo stack, media playback sync, keyboard shortcuts, backend rendering dispatch. |
| **`EditorHeader`** | [`EditorHeader.tsx`](file:///c:/Users/ongch/Desktop/zaizub/frontend/components/editor/EditorHeader.tsx) | Top navigation, aspect ratio switcher, playback speed, word length re-chunking menu, save/render triggers. |
| **`TranscriptPanel`** | [`TranscriptPanel.tsx`](file:///c:/Users/ongch/Desktop/zaizub/frontend/components/editor/TranscriptPanel.tsx) | Transcript list with auto-scroll sync, inline text input, timestamp adjustments, segment split/merge, search filter. |
| **`VideoPlayer`** | [`VideoPlayer.tsx`](file:///c:/Users/ongch/Desktop/zaizub/frontend/components/editor/VideoPlayer.tsx) | HTML5 Video player, aspect ratio container, interactive draggable/resizable subtitle overlay, snapping guide. |
| **`TransportControls`** | [`TransportControls.tsx`](file:///c:/Users/ongch/Desktop/zaizub/frontend/components/editor/TransportControls.tsx) | Timeline scrubber bar, timecode display (`00:00 / 00:00`), Play/Pause toggle, ±5s/±15s jumps, volume slider, fullscreen. |
| **`StylePanel`** | [`StylePanel.tsx`](file:///c:/Users/ongch/Desktop/zaizub/frontend/components/editor/StylePanel.tsx) | Subtitle inspector with scope toggle ("ทั้งคลิป" vs "เฉพาะส่วน"), typography, font size, shadows, backgrounds, animations. |
| **`TemplatePanel`** | [`TemplatePanel.tsx`](file:///c:/Users/ongch/Desktop/zaizub/frontend/components/editor/TemplatePanel.tsx) | Preset style catalogue (TikTok Bold, Minimal Clean, Dark Box, Neon Cyber, Pastel Glow, etc.). |
| **`FontSelector`** | [`FontSelector.tsx`](file:///c:/Users/ongch/Desktop/zaizub/frontend/components/editor/FontSelector.tsx) | Custom searchable font dropdown with Thai Google Fonts preview and custom font file upload. |
| **`EditorTabs`** | [`EditorTabs.tsx`](file:///c:/Users/ongch/Desktop/zaizub/frontend/components/editor/EditorTabs.tsx) | 48px vertical dock switcher between Style Inspector and Template Gallery. |

---

## 4. Key Functional Features & Logic

### 4.1 Word Length & Intelligent Regrouping (`regroupSubtitles`)
Located in [`types.ts`](file:///c:/Users/ongch/Desktop/zaizub/frontend/components/editor/types.ts#L100-L199), this allows one-click transformation between:
- **Normal Mode (`normal`)**: Natural sentence length (~12 words per card) split by punctuation or sentence ends.
- **Short Mode (`short`)**: Punchy TikTok/Shorts style (~3 words per card).
- **Custom Mode (`custom`)**: User-defined word count (1 to 20 words per subtitle card).
- **Audio Pause Detection**: Groups split automatically if a speech gap > 0.8s occurs.

### 4.2 Two-Level Styling Architecture (Global vs Segment Override)
1. **Global Styles (`globalStyles`)**: Applied to all subtitle segments by default.
2. **Segment Override (`segment.style`)**: When a specific segment is selected in "เฉพาะส่วน" mode, edits apply only to that segment.
3. **Reset to Global (`handleResetToGlobal`)**: Clears segment-specific style overrides with one click.

### 4.3 Frame-Accurate Undo/Redo Engine
- 50-item bounded history array stored in synchronized `historyRef` and `historyIndexRef` to prevent state lags during fast typing or dragging.
- Instant debounced flushing when Undo/Redo is triggered.

### 4.4 Interactive On-Screen Subtitle Manipulation
- **Drag-to-Position**: Click & drag subtitle on the video player to reposition `custom_x` and `custom_y` (percentage-based `0-100%`).
- **Resize Handle**: Drag horizontal handle to adjust subtitle bounding box width (`box_width`).
- **Center Snapping Guide**: Visual dashed purple line when subtitle crosses center X (48% - 52%).

### 4.5 Responsive Panel Resizing & Persistence
- Drag handles between Left Panel / Video Player / Right Panel.
- Persisted to `localStorage` (`zaizub_left_panel_width`, `zaizub_right_panel_width`).
- Adaptive defaults based on screen resolution (1600px+ widescreen vs 1366px laptop vs tablet).

---

## 5. Visual Design Tokens & Styling System

### 5.1 Color Palette
```css
/* Backgrounds */
--bg-app:        #0a0a0a;  /* Deepest base */
--bg-header:     #0c0b11;  /* Header & transport controls */
--bg-panel:      #13121b;  /* Sidebar panels */
--bg-card:       #1a1827;  /* Active cards, inputs */
--border-color:  #1c1a28;  /* Subtle dividers */

/* Brand & Accents */
--accent-purple: #7c3aed;  /* Primary brand purple */
--accent-hover:  #6d28d9;  /* Button hover state */
--accent-soft:   #2d2250;  /* Active tab / badge background */
--text-accent:   #c4b5fd;  /* Light purple typography */

/* Status & Feedback */
--danger:        #ef4444;  /* Delete & warnings */
--success:       #22c55e;  /* Saved / Success */
--warning:       #f59e0b;  /* Unsaved changes dot */
```

### 5.2 Typography System
- **UI Fonts**: Inter / Noto Sans Thai / System Sans-Serif
- **Timecodes & Numbers**: Monospace tabular numbers (`font-mono tabular-nums`)
- **Subtitle Fonts**:
  - *Modern Sans*: Kanit, Prompt, Anuphan, Krub, Mitr
  - *Classic & Formal*: Sarabun, Trirong, Pridi
  - *Display / Trendy*: Chonburi, Itim, Mali, Chakra Petch, Pattaya, Charm

### 5.3 Micro-Animations
- `subFadeIn`: Smooth 0.3s cubic bezier entry (`opacity: 0 -> 1`, `translateY: 4px -> 0`).
- `subPopIn`: Punchy 0.35s bounce scale (`scale: 0.85 -> 1.06 -> 1.0`).

---

## 6. Keyboard Shortcuts

| Shortcut | Action | Scope |
| :--- | :--- | :--- |
| `Space` | Play / Pause Video | Global (when not typing in textarea) |
| `Ctrl + Z` / `Cmd + Z` | Undo last change | Global |
| `Ctrl + Y` / `Ctrl + Shift + Z` | Redo change | Global |
| `Arrow Left` / `Arrow Right` | Seek -5s / +5s | Global |
| `Shift + Arrow Left / Right` | Seek -15s / +15s | Global |
| `Enter` (at cursor) | Split subtitle segment at cursor index | Inside transcript textarea |
| `Backspace` (at start of text) | Merge current segment with previous segment | Inside transcript textarea |

---

## 7. Backend & API Integration

- **Speech-to-Text Transcription**: `POST /api/transcribe`
  - Engine: Groq API (`whisper-large-v3`) + PyThaiNLP `newmm` tokenization.
- **Video Export / Rendering**: `POST /api/render-video`
  - Encodes styled ASS/SRT subtitles onto the MP4 stream using FFmpeg with GPU acceleration or Libx264.
- **SRT File Generation**: Client-side `.srt` parser and exporter for external editing workflows.
