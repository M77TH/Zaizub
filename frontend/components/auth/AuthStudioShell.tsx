'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import ZaiZubLogo from '@/components/logo/Logo-v3'
import type { Lang } from '@/components/landing/copy'

interface AuthStudioShellProps {
  mode: 'login' | 'register'
  children: (lang: Lang) => React.ReactNode
}

const TEXT_COLOR_SWATCHES = [
  { hex: '#FFFFFF', name: 'White' },
  { hex: '#FACC15', name: 'Yellow' },
  { hex: '#8B5CF6', name: 'Violet' },
  { hex: '#22D3EE', name: 'Cyan' },
  { hex: '#22C55E', name: 'Emerald' },
  { hex: '#EC4899', name: 'Pink' },
  { hex: '#FB923C', name: 'Orange' },
]

const BG_COLOR_SWATCHES = [
  { id: 'none', label: 'None', hex: 'transparent' },
  { id: 'black', label: 'Black', hex: '#0a0a0a' },
  { id: 'violet', label: 'Violet', hex: '#2e1065' },
  { id: 'navy', label: 'Navy', hex: '#0f172a' },
]

const FONT_OPTIONS = ['Noto Sans', 'Kanit', 'Prompt', 'Geist'] as const
type FontName = typeof FONT_OPTIONS[number]

interface WireframeCaption {
  id: string
  time: string
  words: { en: string; th: string }[]
}

const WIREFRAME_CARDS: WireframeCaption[] = [
  {
    id: 'c1',
    time: '00:01',
    words: [
      { en: 'AI', th: 'ตรวจจับ' },
      { en: 'Speech', th: 'เสียงพูด' },
      { en: 'Detect', th: 'อัตโนมัติ' },
    ],
  },
  {
    id: 'c2',
    time: '00:03',
    words: [
      { en: 'Viral', th: 'แคปชั่น' },
      { en: 'captions', th: 'ไวรัล' },
      { en: 'in', th: 'ใน' },
      { en: 'seconds', th: 'เสี้ยววิ' },
    ],
  },
  {
    id: 'c3',
    time: '00:06',
    words: [
      { en: 'Smart', th: 'ไฮไลท์' },
      { en: 'keyword', th: 'คำ' },
      { en: 'highlight', th: 'สำคัญ' },
    ],
  },
  {
    id: 'c4',
    time: '00:09',
    words: [
      { en: 'Apply', th: 'ปรับสไตล์' },
      { en: 'kinetic', th: 'แอนิเมชั่น' },
      { en: 'presets', th: 'ทันสมัย' },
    ],
  },
  {
    id: 'c5',
    time: '00:12',
    words: [
      { en: 'Export', th: 'ส่งออก' },
      { en: '4K', th: '4K' },
      { en: 'MP4', th: 'MP4' },
      { en: 'SRT', th: 'SRT' },
    ],
  },
  {
    id: 'c6',
    time: '00:15',
    words: [
      { en: 'Sync', th: 'ซิงค์' },
      { en: 'audio', th: 'เสียง' },
      { en: 'waveform', th: 'แม่นยำ' },
    ],
  },
]

// 3 continuous cycles for seamless infinite conveyor carousel
const ALL_CARDS = [...WIREFRAME_CARDS, ...WIREFRAME_CARDS, ...WIREFRAME_CARDS]

export default function AuthStudioShell({ mode, children }: AuthStudioShellProps) {
  const [lang, setLang] = useState<Lang>('en')
  const [activeColor, setActiveColor] = useState<string>('#8B5CF6')
  const [activeBg, setActiveBg] = useState<string>('#0a0a0a')
  const [activeFont, setActiveFont] = useState<FontName>('Kanit')
  const [activePos, setActivePos] = useState<'bottom' | 'center' | 'top'>('bottom')
  const [activeAnim, setActiveAnim] = useState<'none' | 'fade' | 'pop' | 'typewriter'>('pop')
  const [isBold, setIsBold] = useState<boolean>(true)
  const [isItalic, setIsItalic] = useState<boolean>(false)
  const [isPlaying, setIsPlaying] = useState<boolean>(true)

  // Carousel & preset presentation state: Second card (index 1) is active playing
  const [activeCardIdx, setActiveCardIdx] = useState<number>(1)
  const [cardProgress, setCardProgress] = useState<number>(0)
  const [isResetting, setIsResetting] = useState<boolean>(false)

  const stageRef = useRef<HTMLDivElement>(null)
  const modalCardRef = useRef<HTMLDivElement>(null)
  const leftCardsRef = useRef<HTMLDivElement>(null)

  // Timeline Carousel Animation Loop:
  // Second card plays its simple preset (progress 0 -> 100% and words highlight),
  // then after ending, smoothly moves next card up and loops infinitely!
  useEffect(() => {
    if (!isPlaying) return

    let startTime = performance.now()
    const DURATION = 2300 // 2.3s per active card
    let rafId: number
    let timeoutId: NodeJS.Timeout

    const tick = (now: number) => {
      const elapsed = now - startTime
      const p = Math.min(1, elapsed / DURATION)
      setCardProgress(p)

      if (p < 1) {
        rafId = requestAnimationFrame(tick)
      } else {
        // Active card finished: brief 200ms hold, then shift up to next card
        timeoutId = setTimeout(() => {
          setActiveCardIdx((prev) => {
            const next = prev + 1
            // When wrapping through the sequence seamlessly
            if (next === WIREFRAME_CARDS.length + 1) {
              setTimeout(() => {
                setIsResetting(true)
                setActiveCardIdx(1)
                requestAnimationFrame(() => {
                  requestAnimationFrame(() => {
                    setIsResetting(false)
                  })
                })
              }, 560)
            }
            return next
          })
          setCardProgress(0)
        }, 200)
      }
    }

    rafId = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(rafId)
      clearTimeout(timeoutId)
    }
  }, [isPlaying, activeCardIdx])

  // 3D Perspective Micro-Parallax (Subtle lerp loop with "less move")
  useEffect(() => {
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) return

    const state = {
      targetRotX: 0,
      targetRotY: 0,
      currentRotX: 0,
      currentRotY: 0,
      targetPx: 0,
      targetPy: 0,
      currentPx: 0,
      currentPy: 0,
      isHovered: false,
      isRunning: false,
      rafId: null as number | null,
    }

    const lerp = (start: number, end: number, factor: number) => start + (end - start) * factor

    const updateTransforms = () => {
      const factor = 0.08
      state.currentRotX = lerp(state.currentRotX, state.targetRotX, factor)
      state.currentRotY = lerp(state.currentRotY, state.targetRotY, factor)
      state.currentPx = lerp(state.currentPx, state.targetPx, factor)
      state.currentPy = lerp(state.currentPy, state.targetPy, factor)

      const isResting =
        !state.isHovered &&
        Math.abs(state.currentRotX) < 0.003 &&
        Math.abs(state.currentRotY) < 0.003 &&
        Math.abs(state.currentPx) < 0.005 &&
        Math.abs(state.currentPy) < 0.005

      if (isResting) {
        state.currentRotX = 0
        state.currentRotY = 0
        state.currentPx = 0
        state.currentPy = 0
        if (modalCardRef.current) {
          modalCardRef.current.style.transform = `translate3d(0px, 0px, 64px)`
        }
        if (leftCardsRef.current) {
          leftCardsRef.current.style.transform = `translate3d(0px, 0px, 8px)`
        }
      }

      // Base Stage: Tilts subtly in 3D perspective
      if (stageRef.current) {
        stageRef.current.style.transform = `rotateX(${state.currentRotX.toFixed(3)}deg) rotateY(${state.currentRotY.toFixed(3)}deg)`
      }

      // Floating Left Caption Cards: Minimal subtle float ("less move": Z: 8px, 0.35x)
      if (leftCardsRef.current) {
        leftCardsRef.current.style.transform = `translate3d(${(state.currentPx * 0.35).toFixed(2)}px, ${(state.currentPy * 0.35).toFixed(2)}px, 8px)`
      }

      // Elevated Foreground Login Card: Close to screen (Z: 64px) with amplified micro-parallax
      if (modalCardRef.current) {
        modalCardRef.current.style.transform = `translate3d(${(state.currentPx * 3.2).toFixed(2)}px, ${(state.currentPy * 3.2).toFixed(2)}px, 64px)`
      }

      if (isResting) {
        state.isRunning = false
        return
      }

      state.rafId = requestAnimationFrame(updateTransforms)
    }

    const startLoop = () => {
      if (!state.isRunning) {
        state.isRunning = true
        state.rafId = requestAnimationFrame(updateTransforms)
      }
    }

    const handlePointerMove = (e: PointerEvent) => {
      const stage = stageRef.current
      if (!stage) return

      const rect = stage.getBoundingClientRect()
      if (rect.width === 0 || rect.height === 0) return

      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2

      const nx = Math.max(-1.15, Math.min(1.15, (e.clientX - centerX) / (rect.width / 2)))
      const ny = Math.max(-1.15, Math.min(1.15, (e.clientY - centerY) / (rect.height / 2)))

      // Layer under tilts much less; login card moves the same
      const MAX_ROT_X = 0.55
      const MAX_ROT_Y = 0.7
      const MAX_PARALLAX_X = 4.2
      const MAX_PARALLAX_Y = 4.2

      state.isHovered = true
      state.targetRotX = -ny * MAX_ROT_X
      state.targetRotY = nx * MAX_ROT_Y
      state.targetPx = nx * MAX_PARALLAX_X
      state.targetPy = ny * MAX_PARALLAX_Y

      startLoop()
    }

    const handlePointerLeave = () => {
      state.isHovered = false
      state.targetRotX = 0
      state.targetRotY = 0
      state.targetPx = 0
      state.targetPy = 0
      startLoop()
    }

    window.addEventListener('pointermove', handlePointerMove, { passive: true })
    document.addEventListener('mouseleave', handlePointerLeave)

    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      document.removeEventListener('mouseleave', handlePointerLeave)
      if (state.rafId) {
        cancelAnimationFrame(state.rafId)
      }
    }
  }, [])

  return (
    <div className="relative min-h-screen w-full bg-[#07060a] text-ink flex items-center justify-center p-3 sm:p-6 lg:p-10 overflow-hidden select-none">
      {/* Top & Center Ambient Purple Glows */}
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_65%_42%_at_50%_0%,rgba(139,92,246,0.18)_0%,rgba(109,40,217,0.06)_45%,transparent_75%)]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_52%,rgba(139,92,246,0.11)_0%,transparent_58%)]"
        aria-hidden="true"
      />

      {/* 3D Perspective Viewport */}
      <div className="relative z-10 w-full max-w-[1240px] [perspective:2000px]">
        {/* Base Stage (Tilts gently in 3D perspective; flat panels live here) */}
        <div
          ref={stageRef}
          className="relative w-full rounded-3xl border border-white/[0.08] bg-[#0a0911]/90 shadow-[0_32px_100px_rgba(0,0,0,0.95),0_0_60px_rgba(124,58,237,0.08)] backdrop-blur-2xl p-4 sm:p-6 lg:p-8 will-change-transform [transform-style:preserve-3d]"
        >
          {/* Top specular hairline on container */}
          <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-purple-300/30 to-transparent" />

          {/* 3-Column Studio Grid: Left Mockup | Center Floating Login | Right Color/Styles */}
          <div className="relative grid grid-cols-1 lg:grid-cols-[310px_1fr_310px] xl:grid-cols-[330px_1fr_330px] gap-6 xl:gap-8 items-center [transform-style:preserve-3d]">
            {/* ============================================================
                LEFT SIDE: Wireframe Conveyor Timeline (Second Card Playing)
               ============================================================ */}
            <div
              ref={leftCardsRef}
              style={{ transform: 'translate3d(0px, 0px, 8px)' }}
              className="hidden lg:flex flex-col h-[570px] relative overflow-hidden will-change-transform [transform-style:preserve-3d] select-none rounded-2xl"
            >
              {/* Subtle top & bottom edge masks for infinite conveyor fade */}
              <div className="pointer-events-none absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-[#0a0911] to-transparent z-20" />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-[#0a0911] to-transparent z-20" />

              {/* Scrolling Conveyor Track */}
              <div
                className="flex flex-col gap-3 pt-2 will-change-transform"
                style={{
                  transform: `translateY(-${(activeCardIdx - 1) * 86}px)`,
                  transition: isResetting ? 'none' : 'transform 550ms cubic-bezier(0.16, 1, 0.3, 1)',
                }}
              >
                {ALL_CARDS.map((card, idx) => {
                  const isSecondCard = idx === activeCardIdx
                  const wordCount = card.words.length
                  const currentWordIdx = Math.min(
                    wordCount - 1,
                    Math.floor(cardProgress * wordCount)
                  )

                  return (
                    <div
                      key={`${card.id}-${idx}`}
                      style={{
                        transform: isSecondCard ? 'translateZ(6px)' : 'translateZ(0)',
                      }}
                      className={`w-full h-[74px] rounded-xl px-3.5 py-2.5 flex flex-col justify-between transition-all duration-300 ${
                        isSecondCard
                          ? 'bg-gradient-to-b from-[#1b1433]/95 to-[#120e24]/95 border border-purple-500/40 shadow-[0_0_24px_rgba(139,92,246,0.22),0_12px_32px_rgba(0,0,0,0.85)] z-10'
                          : 'bg-[#0d0b18]/65 border border-white/[0.06] hover:border-white/[0.12] shadow-[0_8px_20px_rgba(0,0,0,0.5)]'
                      } ${
                        idx < activeCardIdx - 1
                          ? 'opacity-20'
                          : idx === activeCardIdx - 1
                          ? 'opacity-40'
                          : idx === activeCardIdx
                          ? 'opacity-100'
                          : idx === activeCardIdx + 1
                          ? 'opacity-75'
                          : idx === activeCardIdx + 2
                          ? 'opacity-60'
                          : idx === activeCardIdx + 3
                          ? 'opacity-45'
                          : 'opacity-25'
                      }`}
                    >
                      {/* Top Wireframe Row: Timecode + Status */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 font-mono text-[10px]">
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              isSecondCard ? 'bg-purple-400 animate-pulse' : 'bg-white/20'
                            }`}
                          />
                          <span className={isSecondCard ? 'text-purple-300 font-semibold' : 'text-white/35'}>
                            {card.time}
                          </span>
                        </div>

                        {isSecondCard ? (
                          <span className="text-[9px] font-mono text-purple-300 bg-purple-500/20 border border-purple-500/35 px-1.5 py-0.2 rounded uppercase tracking-wider">
                            {lang === 'en' ? 'Live' : 'สด'}
                          </span>
                        ) : (
                          <div className="flex items-center gap-1">
                            <span className="h-1 w-4 rounded-full bg-white/[0.08]" />
                            <span className="h-1 w-2 rounded-full bg-white/[0.05]" />
                          </div>
                        )}
                      </div>

                      {/* Middle Row: Wireframe Word Boxes ("box box box") */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {card.words.map((w, wIdx) => {
                          const isCurrent = isSecondCard && wIdx === currentWordIdx
                          const isPast = isSecondCard && wIdx < currentWordIdx
                          const isHighlighted = isCurrent || isPast

                          return (
                            <span
                              key={wIdx}
                              style={{
                                color: isHighlighted ? activeColor : 'rgba(255, 255, 255, 0.45)',
                                backgroundColor:
                                  isHighlighted && activeBg !== 'transparent'
                                    ? activeBg
                                    : isHighlighted
                                    ? 'rgba(139, 92, 246, 0.16)'
                                    : 'rgba(255, 255, 255, 0.03)',
                                borderColor: isHighlighted
                                  ? `${activeColor}55`
                                  : 'rgba(255, 255, 255, 0.07)',
                                fontFamily: isSecondCard ? activeFont : undefined,
                                fontWeight: isBold ? 600 : 400,
                                fontStyle: isItalic ? 'italic' : 'normal',
                                textShadow: isCurrent ? `0 0 14px ${activeColor}80` : 'none',
                              }}
                              className={`h-[22px] px-2 rounded-md border text-[11px] font-mono flex items-center transition-all duration-200 ${
                                isCurrent
                                  ? 'scale-105 shadow-xs ring-1 ring-purple-400/30'
                                  : isPast
                                  ? 'opacity-90'
                                  : 'opacity-60'
                              }`}
                            >
                              {lang === 'en' ? w.en : w.th}
                            </span>
                          )
                        })}
                      </div>

                      {/* Bottom Row: Active Progress Bar vs Inactive Skeleton Line */}
                      {isSecondCard ? (
                        <div className="h-1 w-full rounded-full bg-white/[0.08] overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-75 ease-linear"
                            style={{ width: `${cardProgress * 100}%` }}
                          />
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <span className="h-1 w-12 rounded-full bg-white/[0.06]" />
                          <span className="h-1 w-16 rounded-full bg-white/[0.03]" />
                          <span className="h-1 w-8 rounded-full bg-white/[0.03]" />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* ============================================================
                CENTER COLUMN: Floating Elevated Login Card
               ============================================================ */}
            <div className="relative flex items-center justify-center py-2 [transform-style:preserve-3d]">
              <div
                ref={modalCardRef}
                style={{ transform: 'translate3d(0px, 0px, 64px)' }}
                className="relative w-full max-w-[390px] rounded-[24px] bg-[#0e0c19]/98 border border-white/[0.14] p-6 sm:p-8 shadow-[0_40px_110px_rgba(0,0,0,0.98),0_0_70px_rgba(139,92,246,0.3)] backdrop-blur-2xl will-change-transform [transform-style:preserve-3d] transition-shadow duration-300"
              >
                {/* Top & Right Specular Edge Highlights */}
                <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                <div className="pointer-events-none absolute inset-y-8 right-0 w-px bg-gradient-to-b from-transparent via-purple-300/25 to-transparent" />

                {/* Back to Home & Language Switcher */}
                <Link
                  href="/"
                  className="group absolute top-4 left-4 z-10 flex h-7 w-7 items-center justify-center rounded-lg text-ink-faint hover:text-white hover:bg-white/[0.06] transition-colors"
                  aria-label={lang === 'en' ? 'Back to Zaizub' : 'กลับหน้าหลัก Zaizub'}
                  title={lang === 'en' ? 'Back to Zaizub' : 'กลับหน้าหลัก Zaizub'}
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
                    className="transition-transform group-hover:-translate-x-0.5"
                  >
                    <path d="M19 12H5M12 19l-7-7 7-7" />
                  </svg>
                </Link>

                <div className="absolute top-4 right-4 z-10">
                  <div className="flex items-center rounded-lg border border-white/[0.08] bg-[#12101e] p-0.5">
                    <button
                      type="button"
                      onClick={() => setLang('en')}
                      className={`rounded-md px-2 py-0.5 text-[10.5px] font-semibold transition-colors cursor-pointer ${
                        lang === 'en'
                          ? 'bg-[#2d2250] text-purple-200 border border-purple-500/30 shadow-xs'
                          : 'text-ink-muted hover:text-white'
                      }`}
                    >
                      EN
                    </button>
                    <button
                      type="button"
                      onClick={() => setLang('th')}
                      className={`rounded-md px-2 py-0.5 text-[10.5px] font-semibold transition-colors cursor-pointer ${
                        lang === 'th'
                          ? 'bg-[#2d2250] text-purple-200 border border-purple-500/30 shadow-xs'
                          : 'text-ink-muted hover:text-white'
                      }`}
                    >
                      TH
                    </button>
                  </div>
                </div>

                {/* Brand Logo Tile */}
                <div className="flex flex-col items-center text-center mb-6">
                  <Link
                    href="/"
                    className="group relative flex h-12 w-12 items-center justify-center rounded-2xl bg-[#171429] border border-white/[0.12] shadow-[0_8px_20px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.12)] mb-4 transition-transform duration-200 hover:scale-105"
                    aria-label="Zaizub Home"
                  >
                    <ZaiZubLogo size={28} />
                  </Link>

                  <h1 className="font-display text-xl sm:text-[22px] font-bold tracking-tight text-white">
                    {mode === 'login'
                      ? lang === 'en'
                        ? 'Sign in to Zaizub'
                        : 'เข้าสู่ระบบ Zaizub'
                      : lang === 'en'
                        ? 'Create your account'
                        : 'สร้างบัญชี Zaizub'}
                  </h1>
                  <p className="text-xs text-ink-muted mt-1">
                    {mode === 'login'
                      ? lang === 'en'
                        ? 'Continue to your AI subtitle workspace'
                        : 'เข้าสู่สตูดิโอตัดต่อซับไตเติ้ล AI ของคุณ'
                      : lang === 'en'
                        ? 'Start auto-subtitling your videos for free'
                        : 'เริ่มต้นสร้างซับไตเติ้ลอัตโนมัติได้ฟรีทันที'}
                  </p>
                </div>

                {/* Form Content injected from LoginForm or RegisterForm */}
                {children(lang)}
              </div>
            </div>

            {/* ============================================================
                RIGHT SIDE: Color Panel (Top) & Styles Panel (Bottom)
               ============================================================ */}
            <div className="hidden lg:flex flex-col gap-4 h-[570px] justify-between [transform:translateZ(0)]">
              {/* TOP: Color Panel */}
              <div className="rounded-2xl bg-[#0c0a16]/95 border border-white/[0.09] p-4 shadow-[0_18px_45px_rgba(0,0,0,0.75)] backdrop-blur-xl">
                <div className="flex items-center justify-between pb-2.5 border-b border-white/[0.07] mb-3">
                  <span className="font-display text-xs font-bold text-white tracking-tight">
                    {lang === 'en' ? 'Color & Highlight' : 'สีตัวอักษรและไฮไลท์'}
                  </span>
                  <span className="font-mono text-[9.5px] text-purple-300 bg-purple-500/15 border border-purple-500/25 px-1.5 py-0.5 rounded-md">
                    {activeColor}
                  </span>
                </div>

                {/* Text Color Swatches */}
                <div className="mb-3">
                  <span className="block text-[10.5px] text-ink-muted font-medium mb-1.5">
                    {lang === 'en' ? 'Text color' : 'สีตัวอักษร'}
                  </span>
                  <div className="flex items-center justify-between gap-1.5">
                    {TEXT_COLOR_SWATCHES.map((s) => {
                      const isSelected = activeColor === s.hex
                      return (
                        <button
                          key={s.hex}
                          type="button"
                          onClick={() => setActiveColor(s.hex)}
                          style={{ backgroundColor: s.hex }}
                          className={`h-6 w-6 rounded-md transition-all cursor-pointer ${
                            isSelected
                              ? 'ring-2 ring-white ring-offset-2 ring-offset-[#0e0c19] scale-110 shadow-xs'
                              : 'opacity-70 hover:opacity-100 hover:scale-105'
                          }`}
                          title={s.name}
                        />
                      )
                    })}
                  </div>
                </div>

                {/* Word Background Box */}
                <div>
                  <span className="block text-[10.5px] text-ink-muted font-medium mb-1.5">
                    {lang === 'en' ? 'Word background' : 'พื้นหลัง'}
                  </span>
                  <div className="grid grid-cols-4 gap-1.5">
                    {BG_COLOR_SWATCHES.map((b) => {
                      const isSelected = activeBg === b.hex
                      return (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => setActiveBg(b.hex)}
                          className={`py-1 rounded-md text-[10px] font-medium transition-all cursor-pointer border ${
                            isSelected
                              ? 'bg-purple-500/25 border-purple-400 text-white'
                              : 'bg-white/[0.03] border-white/[0.07] text-ink-faint hover:text-white'
                          }`}
                        >
                          {b.label}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Opacity slider mockup */}
                <div className="mt-3 pt-2.5 border-t border-white/[0.06]">
                  <div className="flex items-center justify-between text-[10px] font-mono text-ink-muted mb-1">
                    <span>{lang === 'en' ? 'Opacity' : 'ความโปร่งใส'}</span>
                    <span className="text-purple-300">85%</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/[0.08] rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-purple-500 to-[#a78bfa] w-[85%] rounded-full" />
                  </div>
                </div>
              </div>

              {/* BOTTOM: Styles & Animation Panel */}
              <div className="rounded-2xl bg-[#0c0a16]/95 border border-white/[0.09] p-4 shadow-[0_18px_45px_rgba(0,0,0,0.75)] backdrop-blur-xl">
                <div className="flex items-center justify-between pb-2.5 border-b border-white/[0.07] mb-3">
                  <span className="font-display text-xs font-bold text-white tracking-tight">
                    {lang === 'en' ? 'Style & Format' : 'สไตล์และรูปแบบ'}
                  </span>
                  <span className="font-mono text-[9.5px] text-purple-300 bg-white/[0.05] border border-white/[0.08] px-1.5 py-0.5 rounded-md">
                    52px
                  </span>
                </div>

                {/* Font Selector Pills */}
                <div className="mb-3">
                  <span className="block text-[10.5px] text-ink-muted font-medium mb-1.5">
                    {lang === 'en' ? 'Font' : 'ฟอนต์'}
                  </span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {FONT_OPTIONS.map((f) => {
                      const isSelected = activeFont === f
                      return (
                        <button
                          key={f}
                          type="button"
                          onClick={() => setActiveFont(f)}
                          className={`py-1 px-2 rounded-lg text-[10.5px] font-semibold transition-all cursor-pointer border ${
                            isSelected
                              ? 'bg-purple-500/25 border-purple-400 text-white shadow-xs'
                              : 'bg-white/[0.03] border-white/[0.06] text-ink-faint hover:text-white'
                          }`}
                        >
                          {f}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Typography Format B / I */}
                <div className="mb-3 flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setIsBold((b) => !b)}
                    className={`flex-1 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer border ${
                      isBold
                        ? 'bg-purple-500/25 border-purple-400 text-white'
                        : 'bg-white/[0.03] border-white/[0.06] text-ink-faint hover:text-white'
                    }`}
                  >
                    B
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsItalic((i) => !i)}
                    className={`flex-1 py-1 rounded-md text-[11px] italic font-semibold transition-all cursor-pointer border ${
                      isItalic
                        ? 'bg-purple-500/25 border-purple-400 text-white'
                        : 'bg-white/[0.03] border-white/[0.06] text-ink-faint hover:text-white'
                    }`}
                  >
                    I
                  </button>
                  {/* Position Segmented Control */}
                  {(['bottom', 'center', 'top'] as const).map((pos) => {
                    const isSelected = activePos === pos
                    const label =
                      pos === 'bottom'
                        ? lang === 'en' ? 'Bottom' : 'ล่าง'
                        : pos === 'center'
                        ? lang === 'en' ? 'Center' : 'กลาง'
                        : lang === 'en' ? 'Top' : 'บน'
                    return (
                      <button
                        key={pos}
                        type="button"
                        onClick={() => setActivePos(pos)}
                        className={`flex-1 py-1 rounded-md text-[10px] font-medium transition-all cursor-pointer border ${
                          isSelected
                            ? 'bg-purple-500/25 border-purple-400 text-white'
                            : 'bg-white/[0.03] border-white/[0.06] text-ink-faint hover:text-white'
                        }`}
                      >
                        {label}
                      </button>
                    )
                  })}
                </div>

                {/* Animation Presets matching Image 3 */}
                <div>
                  <span className="block text-[10.5px] text-ink-muted font-medium mb-1.5">
                    {lang === 'en' ? 'Animation' : 'แอนิเมชัน'}
                  </span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { id: 'none', en: 'None', th: 'ไม่มี' },
                      { id: 'fade', en: 'Fade In/Out', th: 'Fade In/Out' },
                      { id: 'pop', en: 'Pop / Zoom', th: 'Pop / Zoom' },
                      { id: 'typewriter', en: 'Typewriter', th: 'พิมพ์ดีด' },
                    ].map((anim) => {
                      const isSelected = activeAnim === anim.id
                      return (
                        <button
                          key={anim.id}
                          type="button"
                          onClick={() => setActiveAnim(anim.id as typeof activeAnim)}
                          className={`py-1 px-1.5 rounded-lg text-[10px] font-semibold transition-all cursor-pointer border text-center ${
                            isSelected
                              ? 'bg-gradient-to-r from-purple-500/30 to-indigo-500/20 border-purple-400 text-white shadow-[0_0_12px_rgba(139,92,246,0.25)]'
                              : 'bg-white/[0.03] border-white/[0.06] text-ink-faint hover:text-white'
                          }`}
                        >
                          {lang === 'en' ? anim.en : anim.th}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
