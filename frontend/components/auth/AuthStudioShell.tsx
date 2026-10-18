'use client'

import React from 'react'
import Link from 'next/link'
import ZaiZubLogo from '@/components/logo/Logo-v3'
import InteractiveDots from '@/components/landing/InteractiveDots'
import type { Lang } from '@/components/landing/copy'
import { useLanguage } from '@/components/providers/LanguageProvider'

interface AuthStudioShellProps {
  mode: 'login' | 'register' | 'forgot-password'
  children: (lang: Lang) => React.ReactNode
}

/* ============================================================================
   20 DISTINCT CAPTION STYLE CARDS (5 PER COLUMN × 4 COLUMNS)
   - Balanced card dimensions (p-5, rounded-[22px], 20.5px–24px caption type)
     with tight inter-card spacing (gap-3.5 / 14px).
   - Every card has its own unique card surface, color palette, border treatment,
     and layout (no repetitive inner black boxes).
   - Every card is a 100% real Video Caption Style showing a multi-word caption
     phrase with active-word highlighting + Font, Size, Style & Animation metadata.
   ============================================================================ */

const HARD_STROKE =
  '0 3px 0 #000000, -1.5px -1.5px 0 #000000, 1.5px -1.5px 0 #000000, -1.5px 1.5px 0 #000000, 1.5px 1.5px 0 #000000'

function ColumnOneSet({ lang }: { lang: Lang }) {
  return (
    <>
      {/* 1. TIKTOK VIRAL — Obsidian + Yellow Left Accent Bar + 3D Bounced Word */}
      <div className="rounded-[22px] bg-[#141222] border border-white/[0.09] border-l-4 border-l-[#facc15] p-5 shadow-[0_16px_36px_rgba(0,0,0,0.6)]">
        <div className="flex items-center justify-between mb-2.5">
          <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#facc15]">
            TIKTOK VIRAL // 64PX
          </span>
          <span className="rounded bg-[#facc15]/15 border border-[#facc15]/30 px-2 py-0.5 font-mono text-[9.5px] font-semibold text-[#facc15]">
            SPRING BOUNCE
          </span>
        </div>
        <div
          className="my-1.5 text-[22.5px] uppercase leading-[1.2] tracking-wide text-white"
          style={{
            fontFamily: "'Archivo Black', 'Chonburi', sans-serif",
            textShadow: HARD_STROKE,
          }}
        >
          {lang === 'en' ? (
            <>
              VIRAL CAPTIONS THAT{' '}
              <span className="inline-block mx-1 -translate-y-0.5 scale-105 text-[#facc15]">
                STOP THE SCROLL
              </span>{' '}
              FAST.
            </>
          ) : (
            <>
              วิธีทำคลิปสั้นให้{' '}
              <span className="inline-block mx-1 -translate-y-0.5 scale-105 text-[#facc15]">
                คนหยุดดู
              </span>{' '}
              จนจบคลิป
            </>
          )}
        </div>
        <div className="mt-3 pt-2.5 border-t border-white/[0.07] flex items-center justify-between font-mono text-[10px] text-[#8c879e]">
          <span>Archivo Black · Bold + 4px Outline</span>
          <span>00:00.8 → 00:02.9</span>
        </div>
      </div>

      {/* 2. ALI ABDAAL STUDIO — Warm Burgundy Frosted Gradient + Glowing Active Word */}
      <div className="rounded-[22px] bg-gradient-to-br from-[#2b1829] via-[#1d1424] to-[#130f1c] border border-rose-300/20 p-5 text-center shadow-[0_16px_36px_rgba(0,0,0,0.6)]">
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-rose-200/70 block mb-2.5">
          ALI ABDAAL STUDIO // 58PX SERIF
        </span>
        <p
          className="italic text-[20.5px] leading-[1.38] text-[#f4f2f8] mb-3"
          style={{ fontFamily: "'Playfair Display', 'Pridi', Georgia, serif" }}
        >
          {lang === 'en' ? (
            <>
              “One small daily habit that{' '}
              <span className="inline-block mx-1 not-italic font-bold rounded-lg bg-white/[0.12] border border-[#fde047]/45 px-2 py-0.5 text-[#fde047] shadow-[0_0_16px_rgba(253,224,71,0.3)]">
                changed
              </span>{' '}
              my entire life.”
            </>
          ) : (
            <>
              “นิสัยเล็กๆ เพียงหนึ่งอย่าง{' '}
              <span className="inline-block mx-1 not-italic font-bold rounded-lg bg-white/[0.12] border border-[#fde047]/45 px-2 py-0.5 text-[#fde047] shadow-[0_0_16px_rgba(253,224,71,0.3)]">
                ที่เปลี่ยนชีวิต
              </span>{' '}
              ไปตลอดกาล”
            </>
          )}
        </p>
        <span className="inline-block rounded-full bg-white/[0.06] border border-white/[0.1] px-2.5 py-0.5 font-mono text-[9.5px] text-rose-200/80">
          Italic · Frosted Box · Slide Up
        </span>
      </div>

      {/* 3. HIGHLIGHTER MARKER — Solid Bright Yellow Card + Handwritten Script + Dark Pop Box */}
      <div className="rounded-[22px] bg-[#fef08a] border border-[#fde047] p-5 text-[#1c1917] shadow-[0_16px_36px_rgba(0,0,0,0.6)]">
        <div className="flex items-center justify-between mb-2">
          <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#854d0e]">
            HIGHLIGHTER MARKER // 62PX
          </span>
          <span className="font-mono text-[9.5px] font-bold bg-[#1c1917]/10 px-2 py-0.5 rounded text-[#713f12]">
            MARKER POP
          </span>
        </div>
        <p
          className="font-bold text-[25px] leading-[1.22] text-[#1c1917] my-1"
          style={{ fontFamily: "'Caveat', 'Mali', cursive" }}
        >
          {lang === 'en' ? (
            <>
              Highlight every{' '}
              <span className="inline-block mx-1 -rotate-2 rounded-lg bg-[#1c1917] text-[#fef08a] px-2.5 py-0.5 shadow-[0_3px_0_rgba(0,0,0,0.28)]">
                key moment
              </span>{' '}
              so viewers never swipe!
            </>
          ) : (
            <>
              ไฮไลท์ทุก{' '}
              <span className="inline-block mx-1 -rotate-2 rounded-lg bg-[#1c1917] text-[#fef08a] px-2.5 py-0.5 shadow-[0_3px_0_rgba(0,0,0,0.28)]">
                คำพูดสำคัญ
              </span>{' '}
              ด้วยฟอนต์ลายมือสุดคิ้วท์!
            </>
          )}
        </p>
        <div className="mt-2.5 font-mono text-[10px] font-semibold text-[#854d0e]/80">
          Caveat / Mali Script · Word Box · Bounce
        </div>
      </div>

      {/* 4. CYBER TYPEWRITER — Deep Emerald Card + Monospace Caret + Dimmed Future Words */}
      <div className="rounded-[22px] bg-[#061a17] border border-emerald-400/30 p-5 shadow-[0_16px_36px_rgba(0,0,0,0.6)]">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-emerald-400">
              TYPEWRITER SYNC // 56PX
            </span>
          </div>
          <span className="font-mono text-[9.5px] text-emerald-300/70">
            GHOST TYPE
          </span>
        </div>
        <div className="font-mono text-[17.5px] font-bold leading-relaxed my-1">
          {lang === 'en' ? (
            <>
              <span className="text-emerald-50">Transcribe every </span>
              <span className="inline-block rounded bg-emerald-400/20 border border-emerald-400/50 px-1.5 py-0.5 text-emerald-300">
                spoken_word
              </span>
              <span className="inline-block w-1.5 h-4 ml-1 align-middle bg-emerald-400" />
              <span className="text-emerald-400/30"> in 3 seconds</span>
            </>
          ) : (
            <>
              <span className="text-emerald-50">ถอดเสียงพูด </span>
              <span className="inline-block rounded bg-emerald-400/20 border border-emerald-400/50 px-1.5 py-0.5 text-emerald-300">
                ตรงทุกคำพูด
              </span>
              <span className="inline-block w-1.5 h-4 ml-1 align-middle bg-emerald-400" />
              <span className="text-emerald-400/30"> อัตโนมัติ</span>
            </>
          )}
        </div>
        <div className="mt-2.5 font-mono text-[10px] text-emerald-400/70">
          JetBrains Mono · Progressive Reveal · Caret
        </div>
      </div>

      {/* 5. DANGER RED HOOK — Crimson Left Stripe + Underlined Red Shake Word */}
      <div className="rounded-[22px] bg-[#181118] border border-rose-500/25 border-l-4 border-l-[#ef4444] p-5 shadow-[0_16px_36px_rgba(0,0,0,0.6)]">
        <div className="flex items-center justify-between mb-2">
          <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#f87171]">
            DANGER RED HOOK // 66PX
          </span>
          <span className="rounded bg-rose-500/15 border border-rose-500/30 px-2 py-0.5 font-mono text-[9.5px] font-semibold text-rose-300">
            IMPACT SHAKE
          </span>
        </div>
        <div
          className="text-[21.5px] uppercase leading-[1.2] tracking-wide text-white my-0.5"
          style={{
            fontFamily: "'Archivo Black', 'Kanit', sans-serif",
            textShadow: HARD_STROKE,
          }}
        >
          {lang === 'en' ? (
            <>
              STOP! DO NOT MAKE{' '}
              <span
                className="inline-block mx-1 rotate-1 scale-105 text-[#ef4444] underline decoration-2 underline-offset-4"
                style={{
                  filter: 'drop-shadow(0 0 10px rgba(239,68,68,0.75))',
                }}
              >
                THIS MISTAKE
              </span>{' '}
              ON REELS
            </>
          ) : (
            <>
              คำเตือน! ห้ามทำ{' '}
              <span
                className="inline-block mx-1 rotate-1 scale-105 text-[#ef4444] underline decoration-2 underline-offset-4"
                style={{
                  filter: 'drop-shadow(0 0 10px rgba(239,68,68,0.75))',
                }}
              >
                สิ่งนี้เด็ดขาด
              </span>{' '}
              บนคลิปสั้น
            </>
          )}
        </div>
      </div>
    </>
  )
}

function ColumnTwoSet({ lang }: { lang: Lang }) {
  return (
    <>
      {/* 1. KARAOKE GLOW — Deep Cyber Teal Card + Neon Active Word + Dimmed Upcoming */}
      <div className="rounded-[22px] bg-[#061821] border border-[#22d3ee]/40 p-5 shadow-[0_16px_36px_rgba(0,0,0,0.65),inset_0_0_24px_rgba(34,211,238,0.06)]">
        <div className="flex items-center justify-between mb-2.5">
          <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#22d3ee]">
            [KARAOKE_GLOW] // 62PX
          </span>
          <span className="h-2.5 w-2.5 rounded-full bg-[#22d3ee] shadow-[0_0_10px_#22d3ee]" />
        </div>
        <div
          className="text-[22px] font-bold uppercase tracking-wider leading-[1.22] my-1"
          style={{ fontFamily: "'Chakra Petch', 'Space Grotesk', sans-serif" }}
        >
          {lang === 'en' ? (
            <>
              <span className="text-white">SING EVERY </span>
              <span
                className="inline-block mx-1.5 scale-105 text-[#22d3ee]"
                style={{
                  textShadow:
                    '0 0 14px #22d3ee, 0 0 28px rgba(34,211,238,0.9)',
                }}
              >
                WORD
              </span>
              <span className="text-white/30"> WITH NEON GLOW</span>
            </>
          ) : (
            <>
              <span className="text-white">ไฮไลท์คำร้อง </span>
              <span
                className="inline-block mx-1.5 scale-105 text-[#22d3ee]"
                style={{
                  textShadow:
                    '0 0 14px #22d3ee, 0 0 28px rgba(34,211,238,0.9)',
                }}
              >
                เรืองแสงไซเบอร์
              </span>
              <span className="text-white/30"> ตรงจังหวะ</span>
            </>
          )}
        </div>
        <p className="mt-2.5 font-mono text-[10px] uppercase tracking-wider text-[#22d3ee]/75">
          Chakra Petch · Neon Bloom · Audio-Synced
        </p>
      </div>

      {/* 2. MINIMAL CLEAN — Solid Crisp White Card + Ultra-Wide Syne + Violet Pill Word */}
      <div className="rounded-[22px] bg-[#f8f7fc] border border-white p-5 text-[#09080f] shadow-[0_20px_48px_rgba(0,0,0,0.7)]">
        <div className="flex items-center justify-between mb-2">
          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">
            MINIMAL CLEAN // SYNE 60PX
          </span>
          <span className="rounded bg-zinc-900/10 px-2 py-0.5 font-mono text-[9.5px] font-bold text-zinc-700">
            STAGGER RISE
          </span>
        </div>
        <div
          className="text-[22.5px] font-extrabold uppercase tracking-wider leading-[1.18] text-[#09080f] my-1"
          style={{ fontFamily: "'Syne', 'Chonburi', sans-serif" }}
        >
          {lang === 'en' ? (
            <>
              CLEAN MODERN{' '}
              <span className="inline-block mx-1 -translate-y-0.5 rounded-lg bg-[#8b5cf6] px-2.5 py-0.5 text-white shadow-[0_4px_14px_rgba(139,92,246,0.45)]">
                CAPTIONS
              </span>{' '}
              FOR CLIPS
            </>
          ) : (
            <>
              ซับมินิมอล{' '}
              <span className="inline-block mx-1 -translate-y-0.5 rounded-lg bg-[#8b5cf6] px-2.5 py-0.5 text-white shadow-[0_4px_14px_rgba(139,92,246,0.45)]">
                เรียบหรูคมชัด
              </span>{' '}
              ทุกช็อต
            </>
          )}
        </div>
        <div className="mt-2.5 font-mono text-[10px] text-zinc-500">
          Syne ExtraBold · High Contrast · Pill Accent
        </div>
      </div>

      {/* 3. EDITORIAL SERIF CAPTION — Italic Serif + Bold Underlined Active Phrase */}
      <div className="rounded-[22px] bg-[#181628] border border-white/[0.09] p-5 shadow-[0_16px_36px_rgba(0,0,0,0.6)]">
        <div className="flex items-center justify-between mb-2">
          <span className="font-mono text-[10px] uppercase tracking-widest text-[#a78bfa]">
            EDITORIAL SERIF // 58PX
          </span>
          <span className="font-mono text-[10px] text-[#8c879e]">FADE IN</span>
        </div>
        <p
          className="italic text-[20.5px] leading-[1.36] text-[#f4f2f8] my-1"
          style={{ fontFamily: "'Playfair Display', 'Trirong', Georgia, serif" }}
        >
          {lang === 'en' ? (
            <>
              “Captions are not just what is spoken—they are how{' '}
              <span className="not-italic font-bold text-[#c4b5fd] underline decoration-[#8b5cf6] decoration-2 underline-offset-4">
                every word feels
              </span>{' '}
              on screen.”
            </>
          ) : (
            <>
              “ซับไตเติลไม่ใช่แค่สิ่งที่พูด แต่คือ{' '}
              <span className="not-italic font-bold text-[#c4b5fd] underline decoration-[#8b5cf6] decoration-2 underline-offset-4">
                อารมณ์ของทุกคำ
              </span>{' '}
              บนหน้าจอ”
            </>
          )}
        </p>
        <div className="mt-3 pt-2.5 border-t border-white/[0.07] flex items-center justify-between text-[10.5px] text-[#8c879e]">
          <span>Playfair / Trirong · Italic + Underline</span>
          <span className="font-mono text-[#a78bfa]">00:03.2 → 00:06.1</span>
        </div>
      </div>

      {/* 4. GRADIENT AURORA — Deep Violet Card + Rose-Violet Gradient Active Word */}
      <div className="rounded-[22px] bg-[#161226] border border-purple-400/25 p-5 shadow-[0_16px_36px_rgba(0,0,0,0.6)]">
        <div className="flex items-center justify-between mb-2">
          <span className="font-mono text-[10px] font-semibold uppercase tracking-widest text-purple-300">
            GRADIENT AURORA // 64PX
          </span>
          <span className="rounded bg-pink-500/15 border border-pink-400/30 px-2 py-0.5 font-mono text-[9.5px] font-semibold text-pink-300">
            CAPSULE POP
          </span>
        </div>
        <div
          className="text-[21.5px] font-extrabold uppercase tracking-tight leading-[1.22] text-white my-1"
          style={{
            fontFamily: "'Space Grotesk', 'Prompt', sans-serif",
            textShadow: HARD_STROKE,
          }}
        >
          {lang === 'en' ? (
            <>
              TURN RAW CLIPS INTO{' '}
              <span
                className="inline-block mx-1.5 scale-105 bg-gradient-to-r from-[#c084fc] via-[#f472b6] to-[#fb7185] bg-clip-text text-transparent"
                style={{
                  textShadow: 'none',
                  filter: 'drop-shadow(0 0 10px rgba(244,114,182,0.75))',
                }}
              >
                VIRAL SHORTS
              </span>{' '}
              FAST
            </>
          ) : (
            <>
              เปลี่ยนคลิปดิบให้{' '}
              <span
                className="inline-block mx-1.5 scale-105 bg-gradient-to-r from-[#c084fc] via-[#f472b6] to-[#fb7185] bg-clip-text text-transparent"
                style={{
                  textShadow: 'none',
                  filter: 'drop-shadow(0 0 10px rgba(244,114,182,0.75))',
                }}
              >
                ติดฟีดไวรัล
              </span>{' '}
              ในพริบตา
            </>
          )}
        </div>
        <div className="mt-2.5 font-mono text-[10px] text-[#8c879e]">
          Space Grotesk · Gradient Word + 4px Stroke
        </div>
      </div>

      {/* 5. PODCAST AMBER — Warm Espresso Studio Card + Amber Badge Highlight */}
      <div className="rounded-[22px] bg-[#18130e] border border-amber-400/25 p-5 shadow-[0_16px_36px_rgba(0,0,0,0.6)]">
        <div className="flex items-center justify-between mb-2">
          <span className="font-mono text-[10px] font-semibold uppercase tracking-widest text-[#fbbf24]">
            PODCAST WARM // 60PX
          </span>
          <span className="font-mono text-[9.5px] text-amber-300/75">
            WARM GLOW
          </span>
        </div>
        <p
          className="text-[20px] font-semibold text-white leading-[1.35] my-0.5"
          style={{ fontFamily: "'Pridi', 'Playfair Display', serif" }}
        >
          {lang === 'en' ? (
            <>
              Clip your best{' '}
              <span className="inline-block mx-1 rounded-md bg-[#fbbf24] text-[#18130e] px-2 py-0.5 font-bold shadow-[0_2px_12px_rgba(251,191,36,0.45)]">
                interview hooks
              </span>{' '}
              with warm studio captions.
            </>
          ) : (
            <>
              ตัดช่วงไฮไลท์{' '}
              <span className="inline-block mx-1 rounded-md bg-[#fbbf24] text-[#18130e] px-2 py-0.5 font-bold shadow-[0_2px_12px_rgba(251,191,36,0.45)]">
                พอดแคสต์เด็ดๆ
              </span>{' '}
              ด้วยซับโทนอบอุ่นสบายตา
            </>
          )}
        </p>
      </div>
    </>
  )
}

function ColumnThreeSet({ lang }: { lang: Lang }) {
  return (
    <>
      {/* 1. MRBEAST BADGE — Light Dashed Ticket Card + Tilted Green Word Badge */}
      <div className="rounded-[22px] bg-[#eceaf4] border-2 border-dashed border-[#8b5cf6]/40 p-5 text-[#0c0a14] shadow-[0_16px_36px_rgba(0,0,0,0.6)]">
        <div className="flex items-center justify-between font-mono text-[10px] text-zinc-500 mb-2">
          <span>STYLE: MRBEAST BADGE</span>
          <span>MITR // 66PX</span>
        </div>
        <div
          className="text-[21px] font-extrabold uppercase tracking-tight leading-[1.22] text-[#0c0a14] my-1.5"
          style={{ fontFamily: "'Space Grotesk', 'Mitr', sans-serif" }}
        >
          {lang === 'en' ? (
            <>
              THE{' '}
              <span className="inline-block mx-1.5 -rotate-2 scale-105 rounded-md bg-[#22c55e] px-2.5 py-0.5 text-black shadow-[0_3px_0_#000]">
                SECRET HACK
              </span>{' '}
              TOP CREATORS USE
            </>
          ) : (
            <>
              เปิดเผย{' '}
              <span className="inline-block mx-1.5 -rotate-2 scale-105 rounded-md bg-[#22c55e] px-2.5 py-0.5 text-black shadow-[0_3px_0_#000]">
                เทคนิคลับ
              </span>{' '}
              ที่ครีเอเตอร์แอบใช้
            </>
          )}
        </div>
        <div className="pt-2.5 mt-2 border-t border-zinc-300 flex items-center justify-between font-mono text-[10px] text-zinc-600">
          <span>BOLD + WORD BADGE</span>
          <span>ANIM: SNAP POP</span>
        </div>
      </div>

      {/* 2. BRUSH SCRIPT LYRIC — Deep Ocean Cyan Card + Flowing Brush Font */}
      <div className="rounded-[22px] bg-[#071924] border border-cyan-400/25 p-5 shadow-[0_16px_36px_rgba(0,0,0,0.6)]">
        <div className="flex items-center justify-between mb-2">
          <span className="font-mono text-[10px] uppercase tracking-widest text-[#38bdf8]">
            BRUSH LYRIC // PATTAYA 60PX
          </span>
          <span className="font-mono text-[9.5px] text-cyan-300/75">
            SMOOTH WAVE
          </span>
        </div>
        <p
          className="text-[23px] leading-[1.34] text-white/95 my-1"
          style={{ fontFamily: "'Pattaya', 'Charm', cursive" }}
        >
          {lang === 'en' ? (
            <>
              “Every spoken phrase{' '}
              <span className="inline-block mx-1.5 scale-105 text-[#38bdf8] underline decoration-cyan-400/60 underline-offset-4 drop-shadow-[0_0_10px_rgba(56,189,248,0.65)]">
                timed to the exact
              </span>{' '}
              millisecond.”
            </>
          ) : (
            <>
              “พริ้วไหวทุกคำพูด{' '}
              <span className="inline-block mx-1.5 scale-105 text-[#38bdf8] underline decoration-cyan-400/60 underline-offset-4 drop-shadow-[0_0_10px_rgba(56,189,248,0.65)]">
                ซิงค์ตรงจังหวะเสียง
              </span>{' '}
              ระดับมิลลิวินาที”
            </>
          )}
        </p>
        <div className="mt-2 text-right font-mono text-[10px] text-[#38bdf8]/75">
          Pattaya Brush · Underline + Glow
        </div>
      </div>

      {/* 3. ZAIZUB VIOLET PILL — Chonburi Display + Signature Violet Word Badge */}
      <div className="rounded-[22px] bg-[#151324] border border-purple-400/25 p-5 shadow-[0_16px_36px_rgba(0,0,0,0.6)]">
        <div className="flex items-center justify-between mb-2">
          <span className="font-mono text-[10px] uppercase tracking-wider text-[#a78bfa]">
            ZAIZUB PILL // CHONBURI 62PX
          </span>
          <span className="rounded bg-purple-500/20 px-2 py-0.5 font-mono text-[9.5px] text-purple-200">
            PILL EXPAND
          </span>
        </div>
        <div
          className="text-[21px] font-bold text-white leading-[1.3] my-1"
          style={{
            fontFamily: "'Chonburi', 'Syne', sans-serif",
            textShadow: '0 2px 4px rgba(0,0,0,0.8)',
          }}
        >
          {lang === 'en' ? (
            <>
              Auto transcribe{' '}
              <span
                className="inline-block mx-1 -translate-y-0.5 rounded-lg bg-gradient-to-r from-[#8b5cf6] to-[#6d28d9] px-2.5 py-0.5 text-white shadow-[0_4px_14px_rgba(139,92,246,0.55),0_2px_0_#000]"
                style={{ textShadow: 'none' }}
              >
                Word-by-Word
              </span>{' '}
              in seconds
            </>
          ) : (
            <>
              ถอดเสียงซับไทย{' '}
              <span
                className="inline-block mx-1 -translate-y-0.5 rounded-lg bg-gradient-to-r from-[#8b5cf6] to-[#6d28d9] px-2.5 py-0.5 text-white shadow-[0_4px_14px_rgba(139,92,246,0.55),0_2px_0_#000]"
                style={{ textShadow: 'none' }}
              >
                สวยคมชัดไม่ตกขอบ
              </span>{' '}
              อัตโนมัติ
            </>
          )}
        </div>
        <div className="mt-2.5 font-mono text-[10px] text-[#8c879e]">
          Chonburi Display · Capsule Badge · Shadow
        </div>
      </div>

      {/* 4. PASTEL CREATOR PILL — Soft Pastel Pink Card + Rounded Rose Pill Word */}
      <div className="rounded-[22px] bg-[#fdf2f8] border border-pink-200 p-5 text-[#1f121b] shadow-[0_16px_36px_rgba(0,0,0,0.6)]">
        <div className="flex items-center justify-between mb-2">
          <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-pink-600">
            PASTEL VLOG // MALI 58PX
          </span>
          <span className="rounded-full bg-pink-500/15 px-2 py-0.5 font-mono text-[9.5px] font-bold text-pink-700">
            BOUNCE
          </span>
        </div>
        <div
          className="text-[21px] font-bold leading-[1.28] text-[#1f121b] my-1"
          style={{ fontFamily: "'Syne', 'Mali', sans-serif" }}
        >
          {lang === 'en' ? (
            <>
              Aesthetic daily vlog with{' '}
              <span className="inline-block mx-1 rotate-1 rounded-full bg-pink-500 px-3 py-0.5 text-white shadow-[0_3px_10px_rgba(236,72,153,0.45)]">
                soft word pills
              </span>
            </>
          ) : (
            <>
              แต่งซับคลิป Vlog โทนหวานด้วย{' '}
              <span className="inline-block mx-1 rotate-1 rounded-full bg-pink-500 px-3 py-0.5 text-white shadow-[0_3px_10px_rgba(236,72,153,0.45)]">
                ป้ายคำพาสเทล
              </span>
            </>
          )}
        </div>
      </div>

      {/* 5. CINEMA BOX SUBTITLE — Classic Documentary Subtitle Bar + Amber Active Word */}
      <div className="rounded-[22px] bg-[#111018] border border-white/[0.09] p-5 shadow-[0_16px_36px_rgba(0,0,0,0.6)]">
        <div className="flex items-center justify-between mb-2">
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#8c879e]">
            CINEMA SUBTITLE // SARABUN 56PX
          </span>
          <span className="font-mono text-[9.5px] text-amber-400/80">
            FULL LINE
          </span>
        </div>
        <p className="text-[19.5px] font-medium text-[#f4f2f8] leading-snug my-0.5">
          {lang === 'en' ? (
            <>
              Every frame tells a{' '}
              <span className="font-extrabold text-[#fbbf24] underline decoration-[#fbbf24]/60 decoration-2 underline-offset-4">
                deeper story
              </span>{' '}
              with cinema-grade subtitles.
            </>
          ) : (
            <>
              ถ่ายทอดทุกอารมณ์ด้วย{' '}
              <span className="font-extrabold text-[#fbbf24] underline decoration-[#fbbf24]/60 decoration-2 underline-offset-4">
                ซับไตเติลภาพยนตร์
              </span>{' '}
              คมชัดทุกเฟรม
            </>
          )}
        </p>
      </div>
    </>
  )
}

function ColumnFourSet({ lang }: { lang: Lang }) {
  return (
    <>
      {/* 1. HORMOZI IMPACT — Emerald Left Bar + Uppercase 3D Stroke + Green Pop Box */}
      <div className="rounded-[22px] bg-[#101917] border border-emerald-400/25 border-l-4 border-l-[#34d399] p-5 shadow-[0_16px_36px_rgba(0,0,0,0.6)]">
        <div className="flex items-center justify-between mb-2">
          <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#34d399]">
            HORMOZI IMPACT // 68PX
          </span>
          <span className="font-mono text-[9.5px] text-emerald-300/80">
            UPPER STROKE
          </span>
        </div>
        <div
          className="text-[22px] uppercase leading-[1.2] tracking-wide text-white my-1"
          style={{
            fontFamily: "'Archivo Black', 'Chonburi', sans-serif",
            textShadow: HARD_STROKE,
          }}
        >
          {lang === 'en' ? (
            <>
              HOLD VIEWER{' '}
              <span
                className="inline-block mx-1.5 -translate-y-0.5 scale-105 rounded-md bg-[#34d399] px-2 py-0.5 text-[#051814]"
                style={{
                  textShadow: 'none',
                  boxShadow: '0 3px 0 #000000',
                }}
              >
                RETENTION
              </span>{' '}
              3X LONGER
            </>
          ) : (
            <>
              ดึงสายตาคนดู{' '}
              <span
                className="inline-block mx-1.5 -translate-y-0.5 scale-105 rounded-md bg-[#34d399] px-2 py-0.5 text-[#051814]"
                style={{
                  textShadow: 'none',
                  boxShadow: '0 3px 0 #000000',
                }}
              >
                ให้อยู่หมัด
              </span>{' '}
              จนจบคลิป
            </>
          )}
        </div>
        <div className="mt-2.5 font-mono text-[10px] text-[#8c879e]">
          Uppercase · 4px Black Stroke · Word Badge
        </div>
      </div>

      {/* 2. HANDWRITTEN VLOG SCRIPT — Plum Card + Caveat/Itim Script + Tilted Pill */}
      <div className="rounded-[22px] bg-[#1a1528] border border-purple-300/20 p-5 shadow-[0_16px_36px_rgba(0,0,0,0.6)]">
        <div className="flex items-center justify-between mb-2">
          <span className="font-mono text-[10px] uppercase tracking-wider text-purple-300">
            VLOG SCRIPT // ITIM 60PX
          </span>
          <span className="rounded bg-purple-500/20 px-2 py-0.5 font-mono text-[9.5px] text-purple-200">
            SLIDE UP
          </span>
        </div>
        <p
          className="text-[25px] font-bold leading-[1.2] text-[#f4f2f8] my-1"
          style={{ fontFamily: "'Caveat', 'Itim', cursive" }}
        >
          {lang === 'en' ? (
            <>
              Spend a day in Tokyo with{' '}
              <span className="inline-block mx-1 -rotate-2 rounded-lg bg-[#c084fc]/25 border border-[#c084fc]/50 px-2.5 py-0.5 text-[#f3e8ff]">
                handwritten
              </span>{' '}
              captions!
            </>
          ) : (
            <>
              พาทัวร์คาเฟ่โตเกียวด้วย{' '}
              <span className="inline-block mx-1 -rotate-2 rounded-lg bg-[#c084fc]/25 border border-[#c084fc]/50 px-2.5 py-0.5 text-[#f3e8ff]">
                ซับฟอนต์ลายมือ
              </span>{' '}
              สุดน่ารัก!
            </>
          )}
        </p>
      </div>

      {/* 3. STREETWEAR MINT POP — Crisp Light Mint Card + Dark Pop Badge */}
      <div className="rounded-[22px] bg-[#ecfdf5] border border-emerald-200 p-5 text-[#062419] shadow-[0_16px_36px_rgba(0,0,0,0.6)]">
        <div className="flex items-center justify-between mb-2">
          <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-emerald-700">
            MINT POP // KANIT 64PX
          </span>
          <span className="rounded bg-emerald-900/10 px-2 py-0.5 font-mono text-[9.5px] font-bold text-emerald-800">
            SNAP POP
          </span>
        </div>
        <div
          className="text-[21px] font-black uppercase tracking-tight leading-[1.22] text-[#062419] my-1"
          style={{ fontFamily: "'Space Grotesk', 'Kanit', sans-serif" }}
        >
          {lang === 'en' ? (
            <>
              EDIT SHORT CLIPS{' '}
              <span className="inline-block mx-1 -rotate-1 rounded-md bg-[#062419] text-[#34d399] px-2.5 py-0.5 shadow-[0_3px_0_#10b981]">
                10X FASTER
              </span>{' '}
              WITH AI
            </>
          ) : (
            <>
              ตัดต่อคลิปสั้น{' '}
              <span className="inline-block mx-1 -rotate-1 rounded-md bg-[#062419] text-[#34d399] px-2.5 py-0.5 shadow-[0_3px_0_#10b981]">
                เร็วขึ้น 10 เท่า
              </span>{' '}
              ด้วยซับ AI
            </>
          )}
        </div>
      </div>

      {/* 4. NEON MAGENTA PULSE — Dark Magenta Card + Glowing Pink Active Word */}
      <div className="rounded-[22px] bg-[#1c0d1b] border border-pink-500/35 p-5 shadow-[0_16px_36px_rgba(0,0,0,0.65)]">
        <div className="flex items-center justify-between mb-2">
          <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#f472b6]">
            [NEON_PULSE] // 64PX
          </span>
          <span className="h-2.5 w-2.5 rounded-full bg-[#f472b6] shadow-[0_0_10px_#f472b6]" />
        </div>
        <div
          className="text-[21.5px] font-bold uppercase tracking-wider leading-[1.22] my-1"
          style={{ fontFamily: "'Chakra Petch', 'Space Grotesk', sans-serif" }}
        >
          {lang === 'en' ? (
            <>
              <span className="text-white">TURN CLIPS INTO </span>
              <span
                className="inline-block mx-1.5 scale-105 text-[#f472b6]"
                style={{
                  textShadow:
                    '0 0 14px #f472b6, 0 0 28px rgba(244,114,182,0.9)',
                }}
              >
                HIGH-VIEW
              </span>
              <span className="text-white/30"> REELS</span>
            </>
          ) : (
            <>
              <span className="text-white">ปั้นคลิปสั้นให้ </span>
              <span
                className="inline-block mx-1.5 scale-105 text-[#f472b6]"
                style={{
                  textShadow:
                    '0 0 14px #f472b6, 0 0 28px rgba(244,114,182,0.9)',
                }}
              >
                ยอดวิวพุ่ง
              </span>
              <span className="text-white/30"> ทุกแพลตฟอร์ม</span>
            </>
          )}
        </div>
        <div className="mt-2.5 font-mono text-[10px] text-pink-300/70">
          Chakra Petch · Pink Glow · Karaoke Sync
        </div>
      </div>

      {/* 5. WARM CREAM EDITORIAL — Warm Cream Card + Serif Italic + Amber Highlight Box */}
      <div className="rounded-[22px] bg-[#faf5e8] border border-amber-200/80 p-5 text-[#1c1917] shadow-[0_16px_36px_rgba(0,0,0,0.6)]">
        <div className="flex items-center justify-between mb-2">
          <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-amber-800">
            STORYBOOK SERIF // 58PX
          </span>
          <span className="font-mono text-[9.5px] font-semibold text-amber-900/70">
            WORD REVEAL
          </span>
        </div>
        <p
          className="italic text-[20.5px] leading-[1.34] text-[#1c1917]"
          style={{ fontFamily: "'Playfair Display', 'Pridi', Georgia, serif" }}
        >
          {lang === 'en' ? (
            <>
              “Great storytelling starts with{' '}
              <span className="inline-block mx-1 not-italic font-extrabold rounded bg-[#f59e0b] text-black px-2 py-0.5 shadow-sm">
                crystal-clear
              </span>{' '}
              word timing.”
            </>
          ) : (
            <>
              “การเล่าเรื่องที่ดี เริ่มต้นด้วย{' '}
              <span className="inline-block mx-1 not-italic font-extrabold rounded bg-[#f59e0b] text-black px-2 py-0.5 shadow-sm">
                จังหวะซับที่เป๊ะ
              </span>{' '}
              ทุกคำพูด”
            </>
          )}
        </p>
      </div>
    </>
  )
}

export default function AuthStudioShell({ mode, children }: AuthStudioShellProps) {
  const { lang, setLang } = useLanguage()

  return (
    <div className="relative h-screen max-h-screen w-full bg-[#07060a] text-[#f4f2f8] overflow-hidden select-none grid grid-cols-1 lg:grid-cols-[52%_48%] xl:grid-cols-[53%_47%]">
      {/* Distinct display/serif/handwritten Google Fonts + GPU-accelerated -15deg diagonal loop */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Archivo+Black&family=Caveat:wght@600;700&family=Playfair+Display:ital,wght@0,700;1,400;1,600&family=Syne:wght@700;800&display=swap');

        @keyframes zaizubDiagUp {
          0% { transform: translate3d(0, 0%, 0); }
          100% { transform: translate3d(0, -50%, 0); }
        }
        @keyframes zaizubDiagDown {
          0% { transform: translate3d(0, -50%, 0); }
          100% { transform: translate3d(0, 0%, 0); }
        }
        .animate-diag-col-1 {
          animation: zaizubDiagUp 74s linear infinite;
          will-change: transform;
          backface-visibility: hidden;
        }
        .animate-diag-col-2 {
          animation: zaizubDiagDown 66s linear infinite;
          will-change: transform;
          backface-visibility: hidden;
        }
        .animate-diag-col-3 {
          animation: zaizubDiagUp 62s linear infinite;
          will-change: transform;
          backface-visibility: hidden;
        }
        .animate-diag-col-4 {
          animation: zaizubDiagDown 70s linear infinite;
          will-change: transform;
          backface-visibility: hidden;
        }
      `}</style>

      {/* ====================================================================
          LEFT SECTION: -15 Degree Moving Caption Style Showcase Wall
         ==================================================================== */}
      <div className="hidden lg:flex relative flex-col justify-between overflow-hidden bg-[#08070f] border-r border-white/[0.08]">
        {/* Subtle Background Grid & Ambient Violet Glow */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              'linear-gradient(to right, rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.025) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_45%_45%,rgba(139,92,246,0.16)_0%,rgba(109,40,217,0.06)_48%,transparent_75%)]"
          aria-hidden="true"
        />

        {/* ================================================================
            -15 DEGREE DIAGONAL MOVING CAPTION STYLES STAGE
            Balanced 1620px × 1760px 4-column stage with tight gap-3.5 (14px)
            spacing and mid-sized p-5 cards
           ================================================================ */}
        <div className="relative flex-1 overflow-hidden">
          <div
            className="pointer-events-none absolute left-1/2 top-1/2 w-[1620px] h-[1760px]"
            style={{
              transform: 'translate(-50%, -50%) rotate(-15deg)',
              transformOrigin: 'center center',
            }}
          >
            <div className="grid grid-cols-4 gap-3.5 items-start w-full">
              {/* Column 1 */}
              <div className="flex flex-col h-max animate-diag-col-1">
                <div className="flex flex-col gap-3.5 pb-3.5">
                  <ColumnOneSet lang={lang} />
                  <ColumnOneSet lang={lang} />
                </div>
                <div className="flex flex-col gap-3.5 pb-3.5" aria-hidden="true">
                  <ColumnOneSet lang={lang} />
                  <ColumnOneSet lang={lang} />
                </div>
              </div>

              {/* Column 2 */}
              <div className="flex flex-col h-max animate-diag-col-2">
                <div className="flex flex-col gap-3.5 pb-3.5">
                  <ColumnTwoSet lang={lang} />
                  <ColumnTwoSet lang={lang} />
                </div>
                <div className="flex flex-col gap-3.5 pb-3.5" aria-hidden="true">
                  <ColumnTwoSet lang={lang} />
                  <ColumnTwoSet lang={lang} />
                </div>
              </div>

              {/* Column 3 */}
              <div className="flex flex-col h-max animate-diag-col-3">
                <div className="flex flex-col gap-3.5 pb-3.5">
                  <ColumnThreeSet lang={lang} />
                  <ColumnThreeSet lang={lang} />
                </div>
                <div className="flex flex-col gap-3.5 pb-3.5" aria-hidden="true">
                  <ColumnThreeSet lang={lang} />
                  <ColumnThreeSet lang={lang} />
                </div>
              </div>

              {/* Column 4 */}
              <div className="flex flex-col h-max animate-diag-col-4">
                <div className="flex flex-col gap-3.5 pb-3.5">
                  <ColumnFourSet lang={lang} />
                  <ColumnFourSet lang={lang} />
                </div>
                <div className="flex flex-col gap-3.5 pb-3.5" aria-hidden="true">
                  <ColumnFourSet lang={lang} />
                  <ColumnFourSet lang={lang} />
                </div>
              </div>
            </div>
          </div>

          {/* Luminance damping layer so high-contrast showcase cards don't overpower the auth form */}
          <div
            className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-r from-black/25 via-black/10 to-black/35"
            aria-hidden="true"
          />

          {/* Smooth Edge Vignette Masks so diagonal cards fade cleanly into the frame */}
          <div
            className="pointer-events-none absolute inset-0 z-20"
            style={{
              background:
                'radial-gradient(circle at 50% 50%, transparent 45%, rgba(8, 7, 15, 0.82) 90%, #08070f 100%)',
            }}
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-16 z-20 bg-gradient-to-b from-[#08070f] to-transparent"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-20 z-20 bg-gradient-to-t from-[#08070f] to-transparent"
            aria-hidden="true"
          />
          {/* Linear edge mask on the right border to avoid abrupt card cropping */}
          <div
            className="pointer-events-none absolute inset-y-0 right-0 w-24 z-20 bg-gradient-to-l from-[#08070f] via-[#08070f]/80 to-transparent"
            aria-hidden="true"
          />
        </div>
      </div>

      {/* ====================================================================
          RIGHT SECTION: Unboxed, Spacious, Minimal Premium Auth Section
         ==================================================================== */}
      <div className="relative flex flex-col justify-between bg-[#07060a] px-6 py-6 sm:px-12 sm:py-8 lg:px-14 xl:px-20 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {/* Subtle Ambient Glow & Interactive Dots on Right Panel */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(60% 50% at 50% 42%, rgba(139, 92, 246, 0.12) 0%, rgba(109, 40, 217, 0.04) 50%, transparent 75%)',
          }}
          aria-hidden="true"
        />
        <div className="pointer-events-none absolute inset-0 opacity-50">
          <InteractiveDots />
        </div>

        {/* Top Navigation Row: Back to Home + EN / TH Toggle */}
        <div className="relative z-10 flex items-center justify-between">
          <Link
            href="/"
            className="group inline-flex items-center gap-2 text-xs font-medium text-[#8c879e] hover:text-[#f4f2f8] transition-colors"
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-transform duration-200 group-hover:-translate-x-0.5"
            >
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            <span>{lang === 'en' ? 'Back to Home' : 'กลับหน้าหลัก'}</span>
          </Link>

          {/* Accessible Segmented Language Switcher (WCAG AA Compliant) */}
          <div
            role="group"
            aria-label={lang === 'en' ? 'Select language' : 'เลือกภาษา'}
            className="inline-flex items-center rounded-lg bg-white/[0.04] p-0.5 border border-white/[0.08] text-xs font-medium shadow-inner"
          >
            <button
              type="button"
              onClick={() => setLang('en')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-mono transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50 cursor-pointer ${
                lang === 'en'
                  ? 'bg-white/[0.12] text-white font-semibold shadow-sm'
                  : 'text-zinc-300 hover:text-white'
              }`}
              aria-pressed={lang === 'en'}
            >
              EN
            </button>
            <span className="text-white/20 select-none text-[10px]" aria-hidden="true">
              |
            </span>
            <button
              type="button"
              onClick={() => setLang('th')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-mono transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50 cursor-pointer ${
                lang === 'th'
                  ? 'bg-white/[0.12] text-white font-semibold shadow-sm'
                  : 'text-zinc-300 hover:text-white'
              }`}
              aria-pressed={lang === 'th'}
            >
              TH
            </button>
          </div>
        </div>

        {/* Centered Unboxed Login Section (Bigger & More Spacious) */}
        <div className="relative z-10 my-auto w-full max-w-[420px] mx-auto py-6">
          {/* Brand Emblem & Header */}
          <div className="flex flex-col items-center text-center mb-8">
            <Link
              href="/"
              className="group relative flex h-13 w-13 items-center justify-center rounded-2xl bg-[#141122] border border-white/[0.1] shadow-[0_12px_28px_rgba(0,0,0,0.65),0_0_24px_rgba(139,92,246,0.2),inset_0_1px_0_rgba(255,255,255,0.12)] mb-5 transition-transform duration-200 hover:scale-105"
              aria-label="Zaizub Home"
            >
              <ZaiZubLogo size={28} />
            </Link>

            <h1 className="font-display text-[26px] sm:text-[28px] font-semibold tracking-[-0.025em] text-[#f4f2f8]">
              {mode === 'login'
                ? lang === 'en'
                  ? 'Welcome back'
                  : 'ยินดีต้อนรับกลับมา'
                : mode === 'register'
                  ? lang === 'en'
                    ? 'Create your account'
                    : 'สร้างบัญชีผู้ใช้ใหม่'
                  : lang === 'en'
                    ? 'Reset password'
                    : 'รีเซ็ตรหัสผ่าน'}
            </h1>
            <p className="text-[14px] text-[#8c879e] mt-1.5">
              {mode === 'login'
                ? lang === 'en'
                  ? 'Sign in to continue to your Zaizub workspace.'
                  : 'เข้าสู่ระบบเพื่อจัดการโปรเจกต์ซับไตเติลของคุณ'
                : mode === 'register'
                  ? lang === 'en'
                    ? 'Start generating AI subtitles in seconds.'
                    : 'เริ่มต้นสร้างซับไตเติล AI สำหรับวิดีโอของคุณ'
                  : lang === 'en'
                    ? 'Enter your email to receive recovery instructions.'
                    : 'กรอกอีเมลของคุณเพื่อรับลิงก์สำหรับตั้งรหัสผ่านใหม่'}
            </p>
          </div>

          {/* Form Content */}
          {children(lang)}
        </div>

        {/* Bottom Footer Row */}
        <div className="relative z-10 flex items-center justify-end text-xs text-[#6b6779]">
          <div className="flex items-center gap-3">
            <Link href="/" className="hover:text-[#a19cb0] transition-colors">
              {lang === 'en' ? 'Privacy' : 'ความเป็นส่วนตัว'}
            </Link>
            <span className="text-white/15">•</span>
            <Link href="/" className="hover:text-[#a19cb0] transition-colors">
              {lang === 'en' ? 'Terms' : 'ข้อกำหนด'}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
