# Project Rules & Design Guidelines

## UI & Design System Rules: Clean, Minimal, Premium (No AI Slop)

### 1. Aesthetic & Brand Philosophy
- **Tier 1 SaaS Quality**: The design must feel as clean, minimal, and premium as Linear, Raycast, and Vercel.
- **Unified Visual Identity**: Must strictly match the visual language of the preceding sections (`Hero.tsx` and `EditorMockup.tsx`):
  - Obsidian Dark Theme: Deep black/zinc background (`#07060a`, `#0a0b0f`), dark translucent glass cards (`bg-surface/80`, `bg-[#0e0c19]/90`), hairline borders (`border-white/[0.06]` to `border-white/[0.12]`).
  - Brand Palette: Signature Zaizub violet/purple (`#8b5cf6`, `#a78bfa`, `#6d28d9`) as the primary accent, paired with crisp white text and muted zinc secondary labels (`#a19cb0`, `#6b6779`).

### 2. Strict Prohibition: "No AI Slop"
- **No Random Emojis**: Never use emoji icons (e.g. 🎬, ⏱️, ⚡, 🎤, 🔇, ♪, ◎, ►) inside cards or badges. Use clean, professional monochrome SVG line icons or sleek text pills.
- **No Fake Badge Inflation**: Avoid cluttering cards with meaningless marketing metrics (e.g., "100% Speech Isolated", "0 Drift Detected", "Viral Score: 98/100", "99.8% Sync"). Keep UI elements grounded, realistic, and reflective of actual video editor functionality.
- **No Rainbow Neon Overload**: Avoid competing bright neon colors across every card. Restrict color accents to purposeful status highlights within the dark-glass theme.
- **No Tacky Gradients & Bloat**: Avoid thick borders, heavy rainbow outlines, or excessive drop shadows. Use subtle 1px borders, smooth backdrop blur, and generous breathing room.

### 3. Component Architecture & Interactions
- **Typography Hierarchy**: Use `font-display` for headlines with tight tracking (`tracking-tight`), `font-mono` for precise millisecond timestamps, and clean body text with high legibility.
- **Smooth, Intentional Micro-interactions**: Smooth height expansion, crisp hover outlines, and responsive feedback without jarring layout shifts.
