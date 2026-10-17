'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import ZaiZubLogo from '@/components/logo/Logo-v3'
import type { Lang } from '@/components/landing/copy'
import { useLanguage } from '@/components/providers/LanguageProvider'

interface AuthStudioShellProps {
  mode: 'login' | 'register'
  children: (lang: Lang) => React.ReactNode
}

interface ShowcaseTemplate {
  id: string
  code: string
  name: string
  font: string
  size: string
  accentHex: string
  modeLabel: string
  tokens: {
    en: string[]
    th: string[]
  }
  highlightIdx: number
  styleType: 'viral-yellow' | 'mrbeast-badge' | 'karaoke-glow' | 'danger-hook' | 'clean-minimal'
}

// Real templates referenced directly from EditorMockup.tsx
const SHOWCASE_TEMPLATES: ShowcaseTemplate[] = [
  {
    id: 'tiktok-viral',
    code: 'TPL-01 // VIRAL',
    name: 'TikTok Viral',
    font: 'Kanit ExtraBold',
    size: '64px',
    accentHex: '#facc15',
    modeLabel: 'SPRING WAVE • 9:16',
    tokens: {
      en: ['How', 'to', 'get', '1M', 'views', 'fast'],
      th: ['วิธีทำคลิป', 'ให้คนดูจบ', '100%', 'ทันที'],
    },
    highlightIdx: 3,
    styleType: 'viral-yellow',
  },
  {
    id: 'mrbeast-badge',
    code: 'TPL-02 // BADGE',
    name: 'MrBeast Badge',
    font: 'Kanit Black',
    size: '66px',
    accentHex: '#22c55e',
    modeLabel: 'SNAP POP • 9:16',
    tokens: {
      en: ['The', 'secret', 'hack', 'top', 'creators'],
      th: ['เทคนิคลับ', 'ที่ครีเอเตอร์', 'ตัวท็อป', 'แอบใช้'],
    },
    highlightIdx: 2,
    styleType: 'mrbeast-badge',
  },
  {
    id: 'submagic-karaoke',
    code: 'TPL-03 // BLOOM',
    name: 'Karaoke Glow',
    font: 'Prompt Bold',
    size: '62px',
    accentHex: '#22d3ee',
    modeLabel: 'NEON BLOOM • 9:16',
    tokens: {
      en: ['Sing', 'every', 'word', 'with', 'glow'],
      th: ['ไฮไลท์คำ', 'เรืองแสง', 'ไซเบอร์', 'AI'],
    },
    highlightIdx: 1,
    styleType: 'karaoke-glow',
  },
  {
    id: 'danger-hook',
    code: 'TPL-04 // HOOK',
    name: 'Danger Red Hook',
    font: 'Kanit Black',
    size: '66px',
    accentHex: '#ef4444',
    modeLabel: 'IMPACT DROP • 9:16',
    tokens: {
      en: ['Stop!', 'Do', 'not', 'make', 'this', 'mistake'],
      th: ['คำเตือน:', 'ห้ามทำแบบนี้', 'บนคลิป', 'เด็ดขาด!'],
    },
    highlightIdx: 2,
    styleType: 'danger-hook',
  },
  {
    id: 'clean-minimal',
    code: 'TPL-05 // CLEAN',
    name: 'Minimal Clean',
    font: 'Noto Sans Thai',
    size: '56px',
    accentHex: '#ffffff',
    modeLabel: 'CLEAN SLIDE • 9:16',
    tokens: {
      en: ['Clean', 'modern', 'aesthetic', 'viral', 'clips'],
      th: ['เรียบหรู', 'คมชัด', 'สบายตา', 'ทุกช็อต'],
    },
    highlightIdx: 1,
    styleType: 'clean-minimal',
  },
]

const TIMELINE_CAPTIONS = [
  {
    id: '01',
    time: '00:00.4 — 00:02.8',
    en: 'Viral captions that stop the scroll',
    th: 'วิธีทำคลิปให้คนหยุดดูจนจบ',
  },
  {
    id: '02',
    time: '00:02.8 — 00:05.6',
    en: 'Auto-synced word by word in seconds',
    th: 'ถอดเสียงตรงทุกคำอัตโนมัติในไม่กี่วินาที',
  },
  {
    id: '03',
    time: '00:05.6 — 00:08.9',
    en: 'Export 1080p 60fps ready for TikTok',
    th: 'ส่งออก 1080p 60fps พร้อมลงโซเชียล',
  },
]

export default function AuthStudioShell({ mode, children }: AuthStudioShellProps) {
  const { lang, setLang } = useLanguage()
  const searchParams = useSearchParams()
  const next = searchParams.get('next')

  const loginHref =
    next && next !== '/my-video' ? `/login?next=${encodeURIComponent(next)}` : '/login'
  const registerHref =
    next && next !== '/my-video' ? `/register?next=${encodeURIComponent(next)}` : '/register'

  const [activeTplIdx, setActiveTplIdx] = useState(0)
  const [activeWordIdx, setActiveWordIdx] = useState(0)
  const [activeTimelineIdx, setActiveTimelineIdx] = useState(1)

  const currentTpl = SHOWCASE_TEMPLATES[activeTplIdx] || SHOWCASE_TEMPLATES[0]
  const currentTokens = currentTpl.tokens[lang] || currentTpl.tokens.en

  // Cycle word-by-word highlight & templates smoothly like EditorMockup.tsx
  useEffect(() => {
    const wordTimer = setInterval(() => {
      setActiveWordIdx((prev) => {
        const nextWord = prev + 1
        if (nextWord >= currentTokens.length) {
          return 0
        }
        return nextWord
      })
    }, 650)

    return () => clearInterval(wordTimer)
  }, [currentTokens.length])

  useEffect(() => {
    const tplTimer = setInterval(() => {
      setActiveTplIdx((prev) => (prev + 1) % SHOWCASE_TEMPLATES.length)
      setActiveTimelineIdx((prev) => (prev + 1) % TIMELINE_CAPTIONS.length)
      setActiveWordIdx(0)
    }, 4200)

    return () => clearInterval(tplTimer)
  }, [])

  return (
    <div className="relative h-screen max-h-screen w-full bg-[#07060a] text-white flex items-center justify-center p-0 sm:p-4 lg:p-6 overflow-hidden select-none">
      {/* Ambient Background Lighting */}
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_75%_55%_at_25%_30%,rgba(124,58,237,0.18)_0%,rgba(88,28,135,0.06)_45%,transparent_75%)]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_75%,rgba(139,92,246,0.10)_0%,transparent_55%)]"
        aria-hidden="true"
      />

      {/* Main Split-Screen Studio Container (Matches Reference 1 Layout + Reference 2 Layered Cards) */}
      <div className="relative z-10 w-full max-w-[1220px] h-full sm:h-auto sm:max-h-[94vh] lg:h-[min(720px,calc(100dvh-2.5rem))] sm:rounded-[28px] border-0 sm:border border-white/[0.09] bg-[#0b0914] shadow-[0_40px_120px_rgba(0,0,0,0.95),0_0_80px_rgba(124,58,237,0.12)] overflow-hidden grid grid-cols-1 lg:grid-cols-[46%_54%] xl:grid-cols-[47%_53%]">
        {/* ====================================================================
            LEFT PANEL: Violet Studio Showcase + Tilted Layered Editor Cards
            + Seamless Concave Notched Tab Switcher (Login / Register)
           ==================================================================== */}
        <div className="hidden lg:flex relative flex-col justify-between overflow-hidden bg-gradient-to-br from-[#120a24] via-[#0b0718] to-[#06040e] p-7 xl:p-9 border-r border-white/[0.08]">
          {/* Ambient Violet Radial Floor Glow matching Landing Page Features.tsx */}
          <div
            className="pointer-events-none absolute inset-0 opacity-100"
            style={{
              background:
                'radial-gradient(85% 70% at 30% 28%, rgba(139, 92, 246, 0.22) 0%, rgba(109, 40, 217, 0.08) 48%, transparent 78%), radial-gradient(75% 65% at 80% 80%, rgba(167, 139, 250, 0.14) 0%, rgba(76, 29, 149, 0.10) 52%, transparent 82%)',
            }}
          />

          {/* Exact 2:1 Isometric Floor Cross-Grid & Chevrons matching Landing Page Features.tsx */}
          <svg
            className="pointer-events-none absolute inset-0 h-full w-full opacity-35"
            viewBox="0 0 600 800"
            fill="none"
          >
            <g stroke="rgba(255, 255, 255, 0.04)" strokeWidth="1">
              <line x1="-100" y1="200" x2="700" y2="-200" />
              <line x1="-100" y1="360" x2="700" y2="-40" />
              <line x1="-100" y1="520" x2="700" y2="120" />
              <line x1="-100" y1="680" x2="700" y2="280" />
              <line x1="-100" y1="840" x2="700" y2="440" />

              <line x1="700" y1="200" x2="-100" y2="-200" />
              <line x1="700" y1="360" x2="-100" y2="-40" />
              <line x1="700" y1="520" x2="-100" y2="120" />
              <line x1="700" y1="680" x2="-100" y2="280" />
              <line x1="700" y1="840" x2="-100" y2="440" />
            </g>
            {/* Subtle Isometric Chevrons matching Features.tsx */}
            <path d="M 40 400 L 32 404.5 L 40 409" stroke="#a78bfa" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.45" />
            <path d="M 540 400 L 548 404.5 L 540 409" stroke="#a78bfa" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.45" />
            <path d="M 292 60 L 298 56 L 304 60" stroke="#a78bfa" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.45" />
            <path d="M 292 740 L 298 744.5 L 304 740" stroke="#a78bfa" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.45" />
          </svg>

          {/* Top Left Header: Back to Home & Studio Badge */}
          <div className="relative z-20 flex items-center justify-between">
            <Link
              href="/"
              className="group inline-flex items-center gap-2.5 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 px-3.5 py-1.5 backdrop-blur-md transition-all"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-purple-300 transition-transform group-hover:-translate-x-0.5"
              >
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              <span className="text-xs font-medium tracking-wide text-white/90">
                {lang === 'en' ? 'Back to Studio' : 'กลับหน้าหลัก'}
              </span>
            </Link>

            <span className="font-mono text-[10px] uppercase tracking-widest text-purple-200/80 bg-white/[0.05] border border-white/[0.1] px-2.5 py-1 rounded-full backdrop-blur-md">
              AI SUBTITLE ENGINE
            </span>
          </div>

          {/* ================================================================
              DENSE 3x3 MULTI-LAYERED FROSTED-GLASS CARD MOSAIC (Reference 2)
              Tilted -10deg with real template & editor assets from EditorMockup.tsx
             ================================================================ */}
          <div className="relative z-10 my-auto -mx-8 h-[480px] flex items-center justify-center pointer-events-none">
            <div
              className="relative w-[650px] h-[520px] shrink-0 pointer-events-auto transition-transform duration-700 ease-out"
              style={{
                transform: 'rotate(-10deg) scale(0.80)',
                transformOrigin: 'center center',
              }}
            >
              {/* ------------------------------------------------------------
                  CARD 1 (Top-Left): Real Template Card - MrBeast Badge (TPL-02)
                 ------------------------------------------------------------ */}
              <div className="absolute -top-6 -left-10 w-[230px] z-12 rounded-2xl border border-white/20 bg-[#150f2c]/85 backdrop-blur-xl p-3.5 shadow-[0_16px_36px_rgba(0,0,0,0.55)]">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-mono text-[8.5px] uppercase tracking-wider text-purple-300/80 font-semibold">
                    DOC ID: TPL-02 // BADGE
                  </span>
                  <span className="font-mono text-[8.5px] font-bold text-emerald-300 bg-emerald-500/20 border border-emerald-400/30 px-1.5 py-0.2 rounded">
                    SNAP POP
                  </span>
                </div>
                <h5 className="text-[12px] font-bold text-white tracking-tight mb-2">
                  MrBeast Badge
                </h5>
                <div className="rounded-lg bg-[#090714] border border-white/10 p-2 text-center text-[11px] font-bold leading-tight">
                  <span className="text-white/80">The secret </span>
                  <span className="inline-block bg-[#22c55e] text-black font-extrabold px-1.5 py-0.5 rounded shadow-[0_0_8px_rgba(34,197,94,0.6)]">
                    hack top
                  </span>
                  <span className="text-white/80"> creators use</span>
                </div>
                <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-white/[0.08] font-mono text-[8.5px] text-purple-200/70">
                  <span>Kanit Black • 66px</span>
                  <span className="text-emerald-400">95% ACC</span>
                </div>
              </div>

              {/* ------------------------------------------------------------
                  CARD 2 (Top-Center): Video File & Whisper Transcription Card
                 ------------------------------------------------------------ */}
              <div className="absolute -top-10 left-[210px] w-[235px] z-14 rounded-2xl border border-white/20 bg-[#161130]/90 backdrop-blur-xl p-3.5 shadow-[0_20px_45px_rgba(0,0,0,0.6)]">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-mono text-[8.5px] uppercase tracking-wider text-purple-200/80 font-semibold">
                    SOURCE MEDIA // MP4
                  </span>
                  <span className="font-mono text-[8.5px] font-bold text-emerald-300 bg-emerald-500/20 border border-emerald-400/30 px-1.5 py-0.2 rounded">
                    1080P • 60FPS
                  </span>
                </div>
                <div className="rounded-xl bg-[#0b0818]/90 border border-white/10 p-2.5">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-white mb-1.5">
                    <span className="truncate">demo_viral_clip.mp4</span>
                    <span className="font-mono text-[9.5px] text-purple-300">95% SYNC</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-white/15 overflow-hidden">
                    <div className="h-full w-[95%] rounded-full bg-gradient-to-r from-[#a78bfa] via-[#c084fc] to-[#34d399]" />
                  </div>
                </div>
                <div className="flex items-center justify-between mt-2 font-mono text-[8.5px] text-purple-200/60">
                  <span>Whisper Large-v3</span>
                  <span className="text-purple-300">EN / TH BILINGUAL</span>
                </div>
              </div>

              {/* ------------------------------------------------------------
                  CARD 3 (Top-Right): Real Template Card - Karaoke Glow (TPL-03)
                 ------------------------------------------------------------ */}
              <div className="absolute -top-4 left-[465px] w-[215px] z-11 rounded-2xl border border-white/15 bg-white/[0.06] backdrop-blur-xl p-3.5 shadow-[0_16px_36px_rgba(0,0,0,0.5)]">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-mono text-[8.5px] uppercase tracking-wider text-purple-300/80 font-semibold">
                    DOC ID: TPL-03
                  </span>
                  <span className="font-mono text-[8.5px] font-bold text-cyan-300 bg-cyan-500/20 border border-cyan-400/30 px-1.5 py-0.2 rounded">
                    BLOOM
                  </span>
                </div>
                <h5 className="text-[12px] font-bold text-white tracking-tight mb-2">
                  Karaoke Glow
                </h5>
                <div className="rounded-lg bg-[#080614] border border-white/10 p-2 text-center text-[11px] font-bold">
                  <span className="text-white/80">Sing every </span>
                  <span className="text-[#22d3ee] drop-shadow-[0_0_8px_#22d3ee]">
                    word with glow
                  </span>
                </div>
                <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-white/[0.08] font-mono text-[8.5px] text-purple-200/70">
                  <span>Prompt Bold • 62px</span>
                  <span className="text-cyan-300">AUDIO-SYNCED</span>
                </div>
              </div>

              {/* ------------------------------------------------------------
                  CARD 4 (Middle-Left Dark Card): Subtitle Timeline Queue + Rail
                  Matches Reference 2 Left Dark Card
                 ------------------------------------------------------------ */}
              <div className="absolute top-[120px] -left-16 w-[245px] z-18 rounded-2xl border border-purple-300/20 bg-[#0d091e]/95 backdrop-blur-2xl shadow-[0_24px_55px_rgba(0,0,0,0.75)] overflow-hidden flex">
                {/* Left Icon Strip */}
                <div className="w-9 border-r border-white/10 bg-black/40 flex flex-col items-center py-3 gap-3 text-purple-200/75">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-purple-500/25 text-purple-200 border border-purple-400/30">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <rect x="3" y="4" width="18" height="16" rx="2" />
                      <line x1="7" y1="15" x2="17" y2="15" />
                    </svg>
                  </span>
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg hover:bg-white/10">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                    </svg>
                  </span>
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg hover:bg-white/10">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <path d="M12 2v20M17 5v14M7 5v14" />
                    </svg>
                  </span>
                </div>

                {/* Subtitle Cue Stack */}
                <div className="flex-1 p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[8.5px] uppercase tracking-wider text-purple-200/80 font-semibold">
                      MODULE 1: TIMELINE
                    </span>
                    <span className="text-white/40 text-xs leading-none">•••</span>
                  </div>

                  {TIMELINE_CAPTIONS.map((item, idx) => {
                    const isCurrent = idx === activeTimelineIdx
                    return (
                      <div
                        key={item.id}
                        className={`rounded-lg px-2.5 py-1.5 border transition-all duration-300 ${
                          isCurrent
                            ? 'bg-purple-500/30 border-purple-300/50 shadow-sm'
                            : 'bg-black/25 border-white/10 opacity-70'
                        }`}
                      >
                        <div className="flex items-center justify-between font-mono text-[8px] text-purple-200/90">
                          <span>#{item.id}</span>
                          <span>{item.time}</span>
                        </div>
                        <p className="text-[9.5px] font-medium text-white truncate mt-0.5">
                          {lang === 'en' ? item.en : item.th}
                        </p>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* ------------------------------------------------------------
                  CARD 5 (CENTER HERO - ELEVATED WITH 2 OFFSET BACKING PLATES)
                  Displays Active Live Word-by-Word Animated Subtitle Studio
                 ------------------------------------------------------------ */}
              <div className="absolute top-[90px] left-[185px] w-[280px] z-30">
                {/* Back Frosted Glass Plate 1 (Offset -24px, +28px) */}
                <div
                  className="pointer-events-none absolute -left-6 top-7 w-full h-full rounded-2xl border border-white/15 bg-white/[0.05] backdrop-blur-md shadow-[0_20px_50px_rgba(0,0,0,0.6)]"
                  aria-hidden="true"
                />
                {/* Back Frosted Glass Plate 2 (Offset -12px, +14px) */}
                <div
                  className="pointer-events-none absolute -left-3 top-3.5 w-full h-full rounded-2xl border border-purple-300/25 bg-purple-500/[0.08] backdrop-blur-lg shadow-[0_24px_55px_rgba(0,0,0,0.7)]"
                  aria-hidden="true"
                />

                {/* Main Elevated Hero Surface */}
                <div className="relative rounded-2xl border border-white/35 bg-gradient-to-br from-[#231846]/96 via-[#160f30]/98 to-[#0d081f]/98 p-4 shadow-[0_32px_75px_rgba(4,2,14,0.92),0_0_40px_rgba(139,92,246,0.22),inset_0_1px_0_rgba(255,255,255,0.4)] backdrop-blur-2xl">
                  {/* Specular Header */}
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-mono text-[8.5px] uppercase tracking-widest text-purple-300/90 font-semibold">
                        {currentTpl.code}
                      </p>
                      <h4 className="text-sm font-bold text-white tracking-tight mt-0.5">
                        {currentTpl.name}
                      </h4>
                    </div>
                    <span className="text-white/50 font-bold text-xs leading-none select-none">
                      ⋮
                    </span>
                  </div>

                  {/* Live Animated Word-by-Word Preview Box */}
                  <div className="rounded-xl bg-[#080512] border border-white/15 px-3 py-3.5 mb-2.5 flex items-center justify-center min-h-[64px] shadow-inner">
                    <div className="flex flex-wrap items-center justify-center gap-1.5 text-center">
                      {currentTokens.map((token, idx) => {
                        const isActiveWord = idx === activeWordIdx
                        let wordStyle: React.CSSProperties = {
                          color: '#ffffff',
                          textShadow: '0 2px 0 #000000',
                        }

                        if (isActiveWord) {
                          if (currentTpl.styleType === 'viral-yellow') {
                            wordStyle = {
                              color: '#facc15',
                              textShadow:
                                '0 2.5px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000',
                              transform: 'scale(1.08)',
                            }
                          } else if (currentTpl.styleType === 'mrbeast-badge') {
                            wordStyle = {
                              color: '#000000',
                              backgroundColor: '#22c55e',
                              padding: '1px 6px',
                              borderRadius: '5px',
                              boxShadow: '0 2px 10px rgba(34,197,94,0.55), 0 1.5px 0 #000',
                              textShadow: 'none',
                              transform: 'scale(1.06)',
                            }
                          } else if (currentTpl.styleType === 'danger-hook') {
                            wordStyle = {
                              color: '#ef4444',
                              textShadow: '0 2px 0 #000, 0 0 12px rgba(239,68,68,0.7)',
                              transform: 'scale(1.08)',
                              textDecoration: 'underline',
                              textDecorationColor: '#ef4444',
                            }
                          } else if (currentTpl.styleType === 'clean-minimal') {
                            wordStyle = {
                              color: '#ffffff',
                              backgroundColor: 'rgba(255, 255, 255, 0.16)',
                              padding: '1px 6px',
                              borderRadius: '5px',
                              boxShadow: '0 0 12px rgba(255,255,255,0.25)',
                              textShadow: '0 1px 2px #000',
                              transform: 'scale(1.04)',
                            }
                          } else {
                            wordStyle = {
                              color: '#22d3ee',
                              textShadow:
                                '0 0 10px #22d3ee, 0 0 20px rgba(34,211,238,0.85), 0 1.5px 3px #000',
                              transform: 'scale(1.06)',
                            }
                          }
                        }

                        return (
                          <span
                            key={`${currentTpl.id}-${idx}`}
                            style={wordStyle}
                            className="text-[12.5px] font-extrabold tracking-tight transition-all duration-200 inline-block"
                          >
                            {token}
                          </span>
                        )
                      })}
                    </div>
                  </div>

                  {/* 5 Real Template Selector Pills */}
                  <div className="flex items-center gap-1 mb-2.5">
                    {SHOWCASE_TEMPLATES.map((tpl, idx) => {
                      const isSel = idx === activeTplIdx
                      return (
                        <button
                          key={tpl.id}
                          type="button"
                          onClick={() => {
                            setActiveTplIdx(idx)
                            setActiveWordIdx(0)
                          }}
                          className={`flex-1 py-1 px-1 rounded-md font-mono text-[8px] font-semibold transition-all cursor-pointer border truncate ${
                            isSel
                              ? 'bg-purple-500/35 border-purple-300/70 text-white shadow-xs'
                              : 'bg-white/[0.04] border-white/[0.08] text-white/55 hover:text-white'
                          }`}
                        >
                          {tpl.name.split(' ')[0]}
                        </button>
                      )
                    })}
                  </div>

                  {/* Structured Typography & Status Footer */}
                  <div className="space-y-1.5 pt-2 border-t border-white/10">
                    <div className="flex items-center justify-between font-mono text-[8.5px]">
                      <span className="text-purple-200/60 uppercase">Typography:</span>
                      <span className="font-bold text-white">{currentTpl.font} • {currentTpl.size}</span>
                    </div>
                    <div className="pt-1 border-t border-white/[0.08] flex items-center justify-between font-mono text-[8.5px]">
                      <span className="text-emerald-300 font-bold flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        {currentTpl.modeLabel}
                      </span>
                      <span className="font-extrabold text-purple-200 bg-purple-500/20 border border-purple-300/30 px-1.5 py-0.2 rounded">
                        95% ACC
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ------------------------------------------------------------
                  CARD 6 (Middle-Right Dark Card): Aspect Ratio & Multi-Ratio Canvas
                 ------------------------------------------------------------ */}
              <div className="absolute top-[115px] left-[485px] w-[230px] z-17 rounded-2xl border border-purple-300/20 bg-[#0e0a20]/95 backdrop-blur-2xl p-4 shadow-[0_24px_55px_rgba(0,0,0,0.7)]">
                <div className="flex items-center justify-between mb-2">
                  <span className="inline-flex h-5 w-6 items-center justify-center rounded bg-purple-400/20 border border-purple-300/30 text-purple-200 font-mono text-[9px] font-bold">
                    Aa
                  </span>
                  <span className="font-mono text-[8.5px] uppercase tracking-widest text-purple-300/80">
                    MODULE 2: CANVAS
                  </span>
                </div>

                <p className="font-mono text-[8.5px] uppercase tracking-wider text-purple-300/70">
                  SAFE ZONE OVERLAY:
                </p>
                <p className="text-xs font-bold text-white tracking-tight mt-0.5 mb-2.5">
                  9:16 • 16:9 • 1:1 PREVIEW
                </p>

                {/* Aspect Ratio Pills */}
                <div className="grid grid-cols-3 gap-1.5 mb-3">
                  {(['9:16', '16:9', '1:1'] as const).map((ratio, rIdx) => (
                    <div
                      key={ratio}
                      className={`py-1 rounded-lg font-mono text-[9px] font-bold text-center border ${
                        rIdx === 0
                          ? 'bg-purple-500/30 border-purple-300/70 text-white'
                          : 'bg-white/[0.04] border-white/10 text-white/55'
                      }`}
                    >
                      {ratio}
                    </div>
                  ))}
                </div>

                <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                  <div>
                    <p className="font-mono text-[8px] uppercase tracking-wider text-purple-200/60">
                      PALETTE:
                    </p>
                    <p className="font-mono text-[9.5px] font-bold text-white mt-0.5">
                      VIRAL PRESETS
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    {['#facc15', '#22c55e', '#22d3ee', '#ef4444'].map((hex) => (
                      <span
                        key={hex}
                        style={{ backgroundColor: hex }}
                        className="h-2.5 w-2.5 rounded-full ring-1 ring-white/40"
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* ------------------------------------------------------------
                  CARD 7 (Bottom-Left): Real Template Card - Danger Red Hook (TPL-04)
                 ------------------------------------------------------------ */}
              <div className="absolute top-[295px] -left-8 w-[225px] z-15 rounded-2xl border border-white/20 bg-[#160f28]/85 backdrop-blur-xl p-3.5 shadow-[0_18px_40px_rgba(0,0,0,0.55)]">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-mono text-[8.5px] uppercase tracking-wider text-purple-300/80 font-semibold">
                    DOC ID: TPL-04 // HOOK
                  </span>
                  <span className="font-mono text-[8.5px] font-bold text-red-300 bg-red-500/20 border border-red-400/30 px-1.5 py-0.2 rounded">
                    IMPACT
                  </span>
                </div>
                <h5 className="text-[12px] font-bold text-white tracking-tight mb-2">
                  Danger Red Hook
                </h5>
                <div className="rounded-lg bg-[#090614] border border-white/10 p-2 text-center text-[11px] font-bold leading-tight">
                  <span className="text-white/80">Stop scrolling! </span>
                  <span className="text-[#ef4444] underline decoration-2 decoration-[#ef4444] drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]">
                    watch until end
                  </span>
                </div>
                <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-white/[0.08] font-mono text-[8.5px] text-purple-200/70">
                  <span>Kanit Black • 66px</span>
                  <span className="text-red-400">VIRAL RETENTION</span>
                </div>
              </div>

              {/* ------------------------------------------------------------
                  CARD 8 (Bottom-Center): AI Speech Extraction & Equalizer
                 ------------------------------------------------------------ */}
              <div className="absolute top-[345px] left-[200px] w-[245px] z-22 rounded-2xl border border-white/20 bg-[#150f2c]/90 backdrop-blur-xl p-3 shadow-[0_20px_45px_rgba(0,0,0,0.6)]">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-[8.5px] uppercase tracking-wider text-purple-200/80 font-semibold">
                    WHISPER AI ENGINE // v3
                  </span>
                  <span className="font-mono text-[8.5px] font-bold text-emerald-300 bg-emerald-500/20 border border-emerald-400/30 px-1.5 py-0.2 rounded">
                    95% ACCURACY
                  </span>
                </div>
                <div className="rounded-xl bg-[#090614] border border-white/10 p-2.5 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-semibold text-white">Voice Isolation</p>
                    <p className="font-mono text-[8.5px] text-purple-300/80 mt-0.5">0.02s Latency • 48kHz</p>
                  </div>
                  {/* Dynamic Equalizer Bars matching landing page */}
                  <div className="flex items-end gap-1 h-5">
                    <span className="w-1 bg-[#8b5cf6] rounded-full h-3 animate-pulse" />
                    <span className="w-1 bg-[#a78bfa] rounded-full h-5 animate-pulse [animation-delay:150ms]" />
                    <span className="w-1 bg-[#c4b5fd] rounded-full h-2 animate-pulse [animation-delay:300ms]" />
                    <span className="w-1 bg-[#8b5cf6] rounded-full h-4 animate-pulse [animation-delay:450ms]" />
                    <span className="w-1 bg-[#34d399] rounded-full h-5 animate-pulse [animation-delay:200ms]" />
                  </div>
                </div>
              </div>

              {/* ------------------------------------------------------------
                  CARD 9 (Bottom-Right): Live Timeline Scrubber & Video Waveform
                 ------------------------------------------------------------ */}
              <div className="absolute top-[310px] left-[465px] w-[220px] z-16 rounded-2xl border border-white/20 bg-[#150f2a]/85 backdrop-blur-xl p-3 shadow-[0_18px_40px_rgba(0,0,0,0.5)]">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-tr from-[#7c3aed] to-[#8b5cf6] text-white shadow-md">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                      <polygon points="6 4 20 12 6 20 6 4" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between text-[9.5px] font-semibold text-white mb-1">
                      <span className="truncate">Live Video Sync</span>
                      <span className="font-mono text-[8.5px] text-purple-200">0:04 / 0:15</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-black/40 overflow-hidden">
                      <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-[#8b5cf6] to-[#ddd6fe]" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Left Footer (Matches Reference 1 Copyright Footer) */}
          <div className="relative z-20 flex items-center justify-between text-[11px] text-purple-200/70">
            <span>© {new Date().getFullYear()} ZaiZub AI Studio</span>
            <span className="font-mono text-[10px] text-purple-200/60">
              TH / EN • 95% ACCURACY
            </span>
          </div>
        </div>

        {/* ====================================================================
            RIGHT PANEL: Minimalist Centered Auth Form (Matches Reference 1)
           ==================================================================== */}
        <div className="relative flex flex-col justify-between bg-[#0b0914] px-6 py-5 sm:px-10 sm:py-6 lg:px-12 xl:px-16 overflow-x-hidden overflow-y-auto lg:overflow-hidden [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {/* Subtle Top-Right Ambient Violet Glow (contained to prevent horizontal overflow) */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
            <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-purple-600/10 blur-3xl" />
          </div>

          {/* Top Bar: Mobile Back Link + Mode Switcher + Language Toggle */}
          <div className="relative z-10 flex items-center justify-between">
            <Link
              href="/"
              className="lg:invisible inline-flex items-center gap-2 text-xs font-medium text-white/60 hover:text-white transition-colors"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              <span>{lang === 'en' ? 'Home' : 'หน้าหลัก'}</span>
            </Link>

            <div className="flex items-center gap-2.5">
              {/* Mode Switcher Pills (Login / Sign Up) */}
              <div className="flex items-center rounded-full bg-white/[0.05] border border-white/[0.09] p-0.5 text-xs">
                <Link
                  href={loginHref}
                  className={`px-3 py-1 rounded-full font-medium transition-all ${
                    mode === 'login'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  {lang === 'en' ? 'Login' : 'เข้าสู่ระบบ'}
                </Link>
                <Link
                  href={registerHref}
                  className={`px-3 py-1 rounded-full font-medium transition-all ${
                    mode === 'register'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  {lang === 'en' ? 'Sign up' : 'สมัครสมาชิก'}
                </Link>
              </div>

              {/* EN / TH Language Toggle */}
              <button
                type="button"
                onClick={() => setLang(lang === 'en' ? 'th' : 'en')}
                className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] px-3 py-1 font-mono text-[11px] font-semibold text-purple-200 transition-colors cursor-pointer"
                title={lang === 'en' ? 'Switch to Thai' : 'เปลี่ยนเป็นภาษาอังกฤษ'}
              >
                <span className={lang === 'en' ? 'text-white' : 'text-white/40'}>EN</span>
                <span className="text-white/25">/</span>
                <span className={lang === 'th' ? 'text-white' : 'text-white/40'}>TH</span>
              </button>
            </div>
          </div>

          {/* Center Form Block (Matches Reference 1 Logo + Wordmark + Clean Inputs) */}
          <div className="relative z-10 my-auto w-full max-w-[350px] mx-auto py-2">
            {/* Brand Emblem & Wordmark (Like Hexagonal Emblem + 'Zeit' in Reference 1) */}
            <div className="flex flex-col items-center text-center mb-5">
              <Link
                href="/"
                className="group relative flex h-14 w-14 items-center justify-center rounded-[18px] bg-gradient-to-b from-[#231942] to-[#130d26] border border-purple-300/35 shadow-[0_12px_30px_rgba(0,0,0,0.75),0_0_24px_rgba(139,92,246,0.28),inset_0_1px_0_rgba(255,255,255,0.25)] mb-3 transition-transform duration-300 hover:scale-105"
                aria-label="ZaiZub Home"
              >
                <ZaiZubLogo size={34} />
              </Link>

              <span className="font-display text-2xl sm:text-[26px] font-extrabold tracking-tight bg-gradient-to-r from-white via-purple-200 to-[#a78bfa] bg-clip-text text-transparent">
                ZaiZub
              </span>
              <p className="text-xs text-[#9d98aa] mt-0.5">
                {mode === 'login'
                  ? lang === 'en'
                    ? 'Sign in to your AI subtitle workspace'
                    : 'เข้าสู่ระบบเพื่อจัดการซับไตเติลวิดีโอของคุณ'
                  : lang === 'en'
                  ? 'Create your free AI subtitle studio account'
                  : 'สร้างบัญชีเพื่อเริ่มทำซับไตเติล AI ฟรี'}
              </p>
            </div>

            {/* Injected Login or Register Form */}
            {children(lang)}
          </div>

          {/* Bottom Right Version Tag (Matches Reference 1 'V 0.0.1' corner label) */}
          <div className="relative z-10 flex items-center justify-between text-[11px] font-mono text-white/30 pt-2">
            <span className="lg:invisible">© ZaiZub</span>
            <span>v1.0 • STUDIO</span>
          </div>
        </div>
      </div>
    </div>
  )
}
