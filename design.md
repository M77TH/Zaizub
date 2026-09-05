# Zaizub Design System & UI Style Guide (`design.md`)

> **Design Language**: Cyber-Dark Studio / Neon Obsidian Glass  
> **Target Experience**: High-end, creator-focused, ultra-responsive video workstation  
> **Use Case**: Copy-pasteable tokens, UI recipes, and aesthetic rules to build any page across Zaizub with 100% visual consistency.

---

## 1. Aesthetic Identity & "The Feeling"

Zaizub's visual signature is defined by **four core feelings**:

1. **Obsidian Studio Atmosphere**: Deep, fatigue-free dark surfaces (`#07060a`, `#0c0b11`, `#13121b`) layered with subtle border lines (`#1c1a28`) instead of heavy shadows.
2. **Neon Purple Energy**: Electric violet and lavender highlights (`#7c3aed`, `#8b5cf6`, `#c4b5fd`, `#2d2250`) that draw immediate focus to active states and primary CTAs.
3. **Tactile Micro-Interactions**: Instant feedback with subtle click scaling (`active:scale-95`), soft glow halos (`shadow-glow`), smooth dropdown fades, and springy badge pops.
4. **Clean Typography & Spacing**: Crisp contrast between bright white primary text (`#ffffff` / `#f4f2f8`) and muted zinc captions (`#a19cb0`), balanced with rounded modern geometry (`rounded-xl`, `rounded-2xl`).

---

## 2. Color Palette & Design Tokens

### 2.1 Surface Layers (Z-Index Background Hierarchy)

Use this hierarchy to create realistic depth across pages:

| Layer | Hex / Class | Purpose & Usage |
| :--- | :--- | :--- |
| **Layer 0 (Canvas Base)** | `#07060a` / `#0a0a0a` | Full-page background, canvas behind panels. |
| **Layer 1 (Bars & Panels)** | `#0c0b11` / `#100e16` | Top navigation headers, footer transport bars, side navigation docks. |
| **Layer 2 (Sidebar / Drawer)**| `#13121b` | Main side panels (Transcript panel, Inspector panel, Settings drawers). |
| **Layer 3 (Cards & Inputs)** | `#1a1827` / `#17141f` | Interactive item cards, textareas, search boxes, tab containers. |
| **Layer 4 (Popovers & Modals)**| `#13121b` / `#1e1b2e` | Dropdown menus, tooltips, dialogs (`backdrop-blur-md border border-[#1c1a28]`). |

### 2.2 Borders & Dividers
- **Default Divider**: `border-[#1c1a28]` or `border-white/[0.08]`
- **Subtle Surface Line**: `border-white/[0.04]`
- **Active / Focused Border**: `border-[#7c3aed]` or `border-purple-500/50`
- **Hover Border**: `hover:border-white/20`

### 2.3 Brand Accents & State Colors

```css
/* Primary Violet / Purple */
--accent-primary:  #7c3aed;  /* bg-[#7c3aed] - Primary buttons & sliders */
--accent-hover:    #6d28d9;  /* hover:bg-[#6d28d9] */
--accent-soft:     #2d2250;  /* bg-[#2d2250] - Selected pill / active tab background */
--accent-glow:     #8b5cf6;  /* text-[#8b5cf6] or glow box-shadow */
--accent-tint:     #c4b5fd;  /* text-[#c4b5fd] - Selected tab labels, icons */

/* Secondary & Accents */
--brand-yellow:    #facc15;  /* text-[#facc15] - POPULAR badges, key accents */
--brand-magenta:   #e94ea1;  /* text-[#e94ea1] - AI gradient sparkles */

/* Status Colors */
--status-success:  #22c55e;  /* bg-emerald-500 / text-emerald-400 - Saved / Active */
--status-warning:  #f59e0b;  /* bg-amber-500 / text-amber-400 - Unsaved changes dot */
--status-danger:   #ef4444;  /* bg-red-500 / text-red-400 - Delete / Destructive */
```

### 2.4 Typography & Text Tokens
- **Headings & Primary Text**: `#ffffff` / `#f4f2f8` (`text-white font-semibold`)
- **Secondary & Body Text**: `#a19cb0` / `#949494` (`text-gray-400`)
- **Muted / Hints / Metadata**: `#6b6779` / `#575757` (`text-gray-500 text-xs`)
- **Timecodes & Numbers**: Monospace tabular numbers (`font-mono tabular-nums text-white`)

---

## 3. Reusable UI Component Recipes

Copy and customize these exact Tailwind code patterns for new pages:

### 3.1 Buttons

#### Primary Action Button (Glow / Purple)
```tsx
<button className="flex items-center justify-center gap-2 rounded-xl bg-[#7c3aed] hover:bg-[#6d28d9] px-4 py-2 text-sm font-semibold text-white shadow-md shadow-purple-900/30 hover:shadow-purple-700/40 hover:brightness-110 active:scale-95 transition-all">
  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M5 12h14M12 5l7 7-7 7" />
  </svg>
  <span>สร้างโปรเจกต์ใหม่</span>
</button>
```

#### Secondary / Surface Button
```tsx
<button className="flex items-center justify-center gap-2 rounded-xl border border-[#1c1a28] bg-[#1a1827] hover:bg-[#232035] hover:border-white/20 px-3.5 py-1.5 text-xs font-medium text-white/90 hover:text-white active:scale-95 transition-all">
  <span>ส่งออกไฟล์ SRT</span>
</button>
```

#### Ghost / Icon Button
```tsx
<button className="flex h-8 w-8 items-center justify-center rounded-xl text-gray-400 hover:text-white hover:bg-[#1c1a29] active:scale-95 transition-all" title="การตั้งค่า">
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
</button>
```

#### Destructive / Danger Button
```tsx
<button className="flex items-center justify-center gap-1.5 rounded-xl border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 px-3 py-1.5 text-xs font-semibold text-red-400 active:scale-95 transition-all">
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
  <span>ลบข้อมูล</span>
</button>
```

---

### 3.2 Cards & Surface Panels

#### Standard Interactive Card
```tsx
<div className="group relative rounded-2xl border border-[#1c1a28] bg-[#13121b] p-4 hover:border-purple-500/30 hover:bg-[#171524] transition-all">
  <div className="flex items-center justify-between mb-2">
    <h3 className="text-sm font-semibold text-white group-hover:text-purple-300 transition-colors">
      ชื่อโปรเจกต์
    </h3>
    <span className="rounded-md bg-[#2d2250] px-2 py-0.5 text-[10px] font-bold text-[#c4b5fd]">
      AI GENERATED
    </span>
  </div>
  <p className="text-xs text-gray-400 line-clamp-2">
    รายละเอียดวิดีโอและความยาวที่เกี่ยวข้อง
  </p>
</div>
```

#### Active Highlighted Card (e.g., Selected Subtitle or Template)
```tsx
<div className="relative rounded-xl border border-purple-500/60 bg-[#1e1933] p-3.5 shadow-lg shadow-purple-950/40 ring-1 ring-purple-500/30">
  <div className="flex items-center justify-between">
    <span className="text-xs font-mono font-medium text-purple-300">00:04 - 00:08</span>
    <div className="h-2 w-2 rounded-full bg-purple-400 animate-pulse" />
  </div>
  <p className="mt-2 text-sm font-medium text-white">ข้อความซับไตเติลที่เลือกอยู่</p>
</div>
```

---

### 3.3 Inputs, Search & Form Controls

#### Dark Search Input with Icon
```tsx
<div className="relative flex items-center w-full">
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="absolute left-3 text-gray-400 pointer-events-none">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
  <input
    type="text"
    placeholder="ค้นหาข้อความ หรือคำในวิดีโอ..."
    className="w-full h-9 rounded-xl border border-[#1c1a28] bg-[#1a1827] pl-9 pr-4 text-xs text-white placeholder-gray-500 outline-none focus:border-purple-500 focus:bg-[#1f1d2e] focus:ring-1 focus:ring-purple-500 transition-all"
  />
</div>
```

#### Dark Textarea for Content
```tsx
<textarea
  rows={3}
  placeholder="พิมพ์ข้อความที่นี่..."
  className="w-full resize-none rounded-xl border border-[#1c1a28] bg-[#1a1827] p-3 text-sm text-white placeholder-gray-500 outline-none focus:border-purple-500 focus:bg-[#1f1d2e] transition-all"
/>
```

#### Range Slider (Scrubber / Progress)
```tsx
<input
  type="range"
  min="0"
  max="100"
  defaultValue="40"
  className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-[#1c1a28] accent-[#7c3aed] hover:h-2 transition-all"
  style={{
    background: 'linear-gradient(to right, #7c3aed 40%, #1a1827 40%)'
  }}
/>
```

---

### 3.4 Segmented Controls & Tab Switchers

#### Pill Switcher (e.g., "ทั้งคลิป" vs "เฉพาะส่วน")
```tsx
<div className="flex items-center gap-1 rounded-xl bg-[#1a1827] p-1 border border-[#1c1a28]">
  <button className="rounded-lg bg-[#2d2250] px-3 py-1.5 text-xs font-semibold text-[#c4b5fd] shadow-sm transition-all">
    ทั้งคลิป
  </button>
  <button className="rounded-lg px-3 py-1.5 text-xs font-semibold text-gray-400 hover:text-white hover:bg-white/[0.04] transition-all">
    เฉพาะส่วน
  </button>
</div>
```

#### Vertical Dock Tabs (48px Width)
```tsx
<div className="flex w-12 flex-col items-center border-l border-[#1c1a28] bg-[#0c0b11] py-3 gap-2 select-none">
  {/* Active Icon */}
  <button className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#2d2250] text-[#c4b5fd] shadow-sm">
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="3" />
    </svg>
  </button>
  {/* Inactive Icon */}
  <button className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-[#1a1827] transition-all">
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <rect width="7" height="7" x="3" y="3" rx="1.5" />
      <rect width="7" height="7" x="14" y="3" rx="1.5" />
      <rect width="7" height="7" x="14" y="14" rx="1.5" />
      <rect width="7" height="7" x="3" y="14" rx="1.5" />
    </svg>
  </button>
</div>
```

---

### 3.5 Dropdowns & Popovers

```tsx
<div className="relative inline-block text-left">
  {/* Trigger */}
  <button className="flex items-center gap-2 rounded-xl border border-[#1c1a28] bg-[#1a1827] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#221f33] transition-all">
    <span>ตัวเลือกความยาว</span>
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 9l6 6 6-6" />
    </svg>
  </button>

  {/* Popover Menu */}
  <div className="absolute left-0 mt-1.5 w-48 rounded-xl border border-[#1c1a28] bg-[#13121b]/95 backdrop-blur-md p-1.5 shadow-2xl shadow-black/80 z-50 animate-in fade-in zoom-in-95">
    <button className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium text-white hover:bg-[#221f33] transition-colors">
      <span>ปกติ (ทั้งประโยค)</span>
    </button>
    <button className="flex w-full items-center justify-between rounded-lg bg-[#2d2250] px-2.5 py-1.5 text-xs font-medium text-[#c4b5fd]">
      <span>สั้น (TikTok / Reels)</span>
      <span className="text-[10px] text-purple-300">~3 คำ</span>
    </button>
  </div>
</div>
```

---

### 3.6 Badges & Status Indicators

```tsx
{/* AI / Popular Purple Badge */}
<span className="inline-flex items-center gap-1 rounded-md bg-[#2d2250] px-2 py-0.5 text-[10px] font-bold text-[#c4b5fd]">
  POPULAR
</span>

{/* Unsaved Changes Indicator */}
<span className="inline-flex items-center gap-1.5 text-xs text-amber-400 font-medium">
  <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-ping" />
  มีการเปลี่ยนแปลง
</span>

{/* Saved Status Indicator */}
<span className="inline-flex items-center gap-1 text-xs text-emerald-400 font-medium">
  <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M20 6L9 17l-5-5" />
  </svg>
  บันทึกแล้ว
</span>
```

---

## 4. Layout Architecture Templates

### Template A: Studio / Multi-Panel Workspace (Like Editor)
```
+-------------------------------------------------------------------------------+
| Header: h-12 border-b border-[#1c1a28] bg-[#0c0b11]/95 backdrop-blur-md       |
+-------------------------------------------------------------------------------+
| [Left Sidebar: bg-[#13121b]] | [Center Stage: bg-[#07060a]] | [Right Drawer] |
+-------------------------------------------------------------------------------+
| Footer / Transport: border-t border-[#1c1a28] bg-[#0c0b11]                   |
+-------------------------------------------------------------------------------+
```

### Template B: Dashboard / Grid / Library Page
```tsx
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#07060a] text-white flex flex-col">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-[#1c1a28] bg-[#0c0b11]/80 backdrop-blur-md px-6">
        <div className="flex items-center gap-3">
          <div className="h-7 w-7 rounded-lg bg-[#7c3aed] flex items-center justify-center font-bold text-sm shadow-md shadow-purple-900/40">Z</div>
          <span className="font-bold text-base tracking-tight text-white">ZAIZUB</span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8 space-y-6">
        {children}
      </main>
    </div>
  );
}
```

---

## 5. Micro-Animations & CSS Classes

In `globals.css` / Tailwind, use these animations to make the UI feel alive:

```css
/* Fade in with gentle vertical rise */
@keyframes subFadeIn {
  from { opacity: 0; transform: translateY(4px) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

/* Punchy bounce pop-in */
@keyframes subPopIn {
  0% { opacity: 0; transform: scale(0.85); }
  60% { opacity: 1; transform: scale(1.06); }
  100% { opacity: 1; transform: scale(1); }
}

.anim-fade { animation: subFadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
.anim-pop  { animation: subPopIn 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
```

### Custom Minimal Scrollbars
Always add `.custom-scrollbar` to overflowing divs to avoid ugly OS scrollbars:
```tsx
<div className="h-full overflow-y-auto custom-scrollbar p-4 space-y-3">
  {/* Cards */}
</div>
```

---

## 6. Do's & Don'ts for Visual Consistency

| ✅ DO | ❌ DON'T |
| :--- | :--- |
| Use `#0c0b11` and `#13121b` with subtle `border-[#1c1a28]` | Don't use flat pure black `#000000` for all containers |
| Use `#7c3aed` for primary action buttons with `active:scale-95` | Don't use random blues, bright greens, or heavy borders |
| Use `rounded-xl` or `rounded-2xl` consistently for cards | Don't mix sharp `rounded-none` with high `rounded-3xl` |
| Use `font-mono tabular-nums` for timestamps & video numbers | Don't use variable-width fonts for timecodes (causes jitter) |
| Use `#2d2250` for active pill badges with `#c4b5fd` text | Don't use bright neon backgrounds that blind the user |
