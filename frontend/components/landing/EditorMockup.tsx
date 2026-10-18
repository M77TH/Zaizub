"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Lang } from "./copy";
import { editorMockupCopy } from "./copy";

interface EditorMockupProps {
  lang: Lang;
}

type AspectRatio = "9:16" | "16:9" | "1:1";
type PositionMode = "bottom" | "center" | "top";
type AnimationMode = "bounce" | "pop" | "typing" | "shake" | "slide-up" | "pill-expand";
type WordRevealMode = "progressive" | "full-line";
type IntroAnimationMode = "spring-wave" | "snap-wave" | "ghost-type" | "impact-drop" | "slide-up" | "capsule-pop" | "none";
type IntroTimingMode = "audio-synced" | "stagger-wave" | "block" | "none";

interface TemplateItem {
  id: string;
  name: string;
  previewBefore: { en: string; th: string };
  previewHighlight: { en: string; th: string };
  previewAfter: { en: string; th: string };
  demoTokens?: { en: string[]; th: string[] };
  font: string;
  fontSize: number;
  textColor: string; // The highlight accent color
  baseTextColor?: string;
  shadowColor: string;
  shadowThickness: number;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  uppercase?: boolean;
  wordBadge?: boolean;
  badgeBgColor?: string;
  badgeTextColor?: string;
  isGradient?: boolean;
  gradientColors?: string;
  isHighlighter?: boolean;
  highlighterColor?: string;
  isFrosted?: boolean;
  shadow: boolean;
  outline: boolean;
  hasBoxBg?: boolean;
  boxBgColor?: string;
  boxOpacity?: number;
  animation: AnimationMode;
  introAnimation: IntroAnimationMode;
  introTiming: IntroTimingMode;
  wordReveal: WordRevealMode;
  stylesCurrentWord: boolean;
}

const TEMPLATES_LIST: TemplateItem[] = [
  {
    id: "tiktok-viral",
    name: "TikTok Viral",
    previewBefore: { en: "Viral captions that", th: "วิธีทำคลิปให้" },
    previewHighlight: { en: "stop the scroll", th: "คนหยุดดู" },
    previewAfter: { en: "", th: "จนจบ" },
    demoTokens: {
      en: ["How", "to", "get", "1M", "views", "fast"],
      th: ["วิธีทำคลิป", "ให้คนดูจบ", "100%", "ทันที"],
    },
    font: "Kanit",
    fontSize: 64,
    textColor: "#facc15",
    baseTextColor: "#ffffff",
    shadowColor: "#000000",
    shadowThickness: 4,
    bold: true,
    italic: false,
    underline: false,
    uppercase: false,
    shadow: true,
    outline: true,
    hasBoxBg: false,
    boxBgColor: "#000000",
    boxOpacity: 0,
    animation: "bounce",
    introAnimation: "spring-wave",
    introTiming: "audio-synced",
    wordReveal: "progressive",
    stylesCurrentWord: true,
  },
  {
    id: "mrbeast-badge",
    name: "MrBeast Badge",
    previewBefore: { en: "Watch until", th: "ดูให้จบ" },
    previewHighlight: { en: "the secret trick", th: "เทคนิคลับนี้" },
    previewAfter: { en: "revealed", th: "ปังแน่นอน" },
    demoTokens: {
      en: ["The", "secret", "hack", "top", "creators", "use"],
      th: ["เทคนิคลับ", "ที่ครีเอเตอร์", "ตัวท็อป", "แอบใช้"],
    },
    font: "Kanit",
    fontSize: 66,
    textColor: "#22c55e",
    baseTextColor: "#ffffff",
    shadowColor: "#000000",
    shadowThickness: 4,
    bold: true,
    italic: false,
    underline: false,
    uppercase: false,
    wordBadge: true,
    badgeBgColor: "#22c55e",
    badgeTextColor: "#000000",
    shadow: true,
    outline: true,
    hasBoxBg: false,
    boxBgColor: "#000000",
    boxOpacity: 0,
    animation: "pop",
    introAnimation: "snap-wave",
    introTiming: "audio-synced",
    wordReveal: "progressive",
    stylesCurrentWord: true,
  },
  {
    id: "submagic-karaoke",
    name: "Karaoke Glow",
    previewBefore: { en: "Word by word", th: "ไฮไลท์คำ" },
    previewHighlight: { en: "neon bloom highlight", th: "เรืองแสงไซเบอร์" },
    previewAfter: { en: "", th: "สไตล์ AI" },
    demoTokens: {
      en: ["Sing", "every", "word", "with", "neon", "glow"],
      th: ["ร้องตามได้ทันที", "เรืองแสงไซเบอร์", "สไตล์", "AI"],
    },
    font: "Prompt",
    fontSize: 62,
    textColor: "#22d3ee",
    baseTextColor: "#ffffff",
    shadowColor: "#22d3ee",
    shadowThickness: 5,
    bold: true,
    italic: false,
    underline: false,
    shadow: true,
    outline: true,
    hasBoxBg: false,
    boxBgColor: "#000000",
    boxOpacity: 0,
    animation: "typing",
    introAnimation: "ghost-type",
    introTiming: "audio-synced",
    wordReveal: "progressive",
    stylesCurrentWord: true,
  },
  {
    id: "danger-hook",
    name: "Danger Red Hook",
    previewBefore: { en: "Stop scrolling now", th: "หยุดเลื่อนดูสิ่งนี้" },
    previewHighlight: { en: "watch until the end", th: "ห้ามพลาดคลิปนี้" },
    previewAfter: { en: "or regret it", th: "ต้องดูให้จบ" },
    demoTokens: {
      en: ["Stop!", "Do", "not", "make", "this", "mistake"],
      th: ["คำเตือน:", "ห้ามทำแบบนี้", "บนคลิป", "เด็ดขาด!"],
    },
    font: "Kanit",
    fontSize: 66,
    textColor: "#ef4444",
    baseTextColor: "#ffffff",
    shadowColor: "#000000",
    shadowThickness: 4,
    bold: true,
    italic: false,
    underline: false,
    uppercase: false,
    shadow: true,
    outline: true,
    hasBoxBg: false,
    boxBgColor: "#000000",
    boxOpacity: 0,
    animation: "shake",
    introAnimation: "impact-drop",
    introTiming: "audio-synced",
    wordReveal: "progressive",
    stylesCurrentWord: true,
  },
  {
    id: "ali-abdaal",
    name: "Ali Abdaal Studio",
    previewBefore: { en: "Aesthetic studio", th: "สตูดิโอคลีนๆ" },
    previewHighlight: { en: "thoughtful storytelling", th: "เรียบหรู น่าเชื่อถือ" },
    previewAfter: { en: "style", th: "สบายตา" },
    demoTokens: {
      en: ["1", "habit", "that", "changed", "my", "life"],
      th: ["นิสัย 1 อย่าง", "ที่เปลี่ยนชีวิต", "ของผม", "ไปตลอดกาล"],
    },
    font: "Noto Sans Thai",
    fontSize: 58,
    textColor: "#fde047",
    baseTextColor: "#ffffff",
    shadowColor: "#000000",
    shadowThickness: 2,
    bold: true,
    italic: false,
    underline: false,
    isFrosted: true,
    shadow: true,
    outline: false,
    hasBoxBg: true,
    boxBgColor: "rgba(255, 255, 255, 0.08)",
    boxOpacity: 0.85,
    animation: "slide-up",
    introAnimation: "none",
    introTiming: "none",
    wordReveal: "full-line",
    stylesCurrentWord: true,
  },
  {
    id: "clean-minimal",
    name: "Minimal Clean",
    previewBefore: { en: "Clean & aesthetic", th: "สไตล์มินิมอล" },
    previewHighlight: { en: "modern storytelling", th: "เรียบหรู คมชัด" },
    previewAfter: { en: "", th: "สบายตา" },
    demoTokens: {
      en: ["Clean", "modern", "aesthetic", "for", "viral", "clips"],
      th: ["เรียบหรู", "คมชัด", "สบายตา", "ทุกช็อต"],
    },
    font: "Noto Sans Thai",
    fontSize: 56,
    textColor: "#ffffff",
    baseTextColor: "#ffffff",
    shadowColor: "#000000",
    shadowThickness: 2,
    bold: true,
    italic: false,
    underline: false,
    shadow: true,
    outline: false,
    hasBoxBg: false,
    boxBgColor: "#000000",
    boxOpacity: 0,
    animation: "slide-up",
    introAnimation: "slide-up",
    introTiming: "stagger-wave",
    wordReveal: "full-line",
    stylesCurrentWord: false,
  },
];

const hexToRgba = (hex: string, alpha: number) => {
  if (!hex) return `rgba(255, 255, 255, ${alpha})`;
  const clean = hex.replace("#", "");
  if (clean.length === 6) {
    const r = parseInt(clean.substring(0, 2), 16);
    const g = parseInt(clean.substring(2, 4), 16);
    const b = parseInt(clean.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  if (clean.length === 3) {
    const r = parseInt(clean[0] + clean[0], 16);
    const g = parseInt(clean[1] + clean[1], 16);
    const b = parseInt(clean[2] + clean[2], 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  return hex;
};

const getContrastTextColor = (hex: string) => {
  if (!hex) return "#000000";
  const clean = hex.replace("#", "");
  if (clean.length === 6) {
    const r = parseInt(clean.substring(0, 2), 16);
    const g = parseInt(clean.substring(2, 4), 16);
    const b = parseInt(clean.substring(4, 6), 16);
    const yiq = (r * 299 + g * 587 + b * 114) / 1000;
    return yiq >= 135 ? "#000000" : "#ffffff";
  }
  return "#000000";
};

const TEMPLATE_DEMO_TOKENS: Record<Lang, string[]> = {
  en: ["Make", "clips", "go", "viral", "with", "Zaizub"],
  th: ["ทำคลิป", "ให้ติดฟีด", "ด้วย", "Zaizub"],
};

const formatTimeStr = (sec: number) => {
  const mins = Math.floor(sec / 60);
  const secs = Math.floor(sec % 60);
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
};

type SampleCaption = (typeof editorMockupCopy)["en"]["sampleCaptions"][number];

const captionThresholdsCache = new WeakMap<SampleCaption, number[]>();

function getCaptionThresholds(caption: SampleCaption): number[] {
  const cached = captionThresholdsCache.get(caption);
  if (cached) return cached;

  const tokens = caption.tokens || caption.text.split(" ");
  const duration = caption.endSec - caption.startSec;
  const weights: number[] =
    caption.tokenWeights ||
    tokens.map((token, idx) => {
      const clean = token.toLowerCase().replace(/[^a-zก-๙0-9]/g, "");
      const isFastWord = [
        "the", "a", "an", "that", "this", "to", "for", "with", "and", "or", "in", "on", "at", "by",
        "ที่", "และ", "ใน", "บน", "กับ", "ให้", "ของ",
      ].includes(clean);
      let w = isFastWord ? 0.8 : Math.max(1.2, Math.min(3.5, clean.length * 0.4));
      if (idx === tokens.length - 1) w *= 1.35;
      return w;
    });

  const totalWeight = weights.reduce((acc, w) => acc + w, 0);
  let accum = 0;
  const activeDuration = Math.max(0.4, duration - 0.22);
  const thresholds = tokens.map((_, i) => {
    accum += (weights[i] / totalWeight) * activeDuration;
    return accum;
  });

  captionThresholdsCache.set(caption, thresholds);
  return thresholds;
}

function computeWordIndexForCaption(caption: SampleCaption, timeSec: number): number {
  const tokens = caption.tokens || caption.text.split(" ");
  if (!tokens.length) return 0;
  if (timeSec <= caption.startSec) return 0;
  if (timeSec >= caption.endSec) return tokens.length - 1;

  const elapsed = timeSec - caption.startSec;
  const thresholds = getCaptionThresholds(caption);
  for (let i = 0; i < thresholds.length; i++) {
    if (elapsed < thresholds[i]) {
      return i;
    }
  }
  return -1;
}

const INITIAL_TIME_SEC = 2.4;

export default function EditorMockup({ lang }: EditorMockupProps) {
  const t = editorMockupCopy[lang];

  // Dynamic editable captions list
  const captionsList = t.sampleCaptions;

  // Track whether EditorMockup is in viewport to pause background timers when offscreen
  const [isInView, setIsInView] = useState<boolean>(false);

  // Editor states mirroring real VideoEditorPage
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("9:16");
  const [activeCardId, setActiveCardId] = useState<number>(2); // 2nd card active by default
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isSyncOn] = useState<boolean>(true);
  const [speed] = useState<number>(1);
  const durationSec = captionsList.length > 0 ? captionsList[captionsList.length - 1].endSec : 11.8;
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("tiktok-viral");

  // High-frequency time lives in a ref; React state only updates when the spoken word/caption changes
  const currentTimeRef = useRef<number>(INITIAL_TIME_SEC);
  const lastWholeSecRef = useRef<number>(Math.floor(INITIAL_TIME_SEC));
  const loopCycleRef = useRef<number>(0);
  const desktopProgressFillRef = useRef<HTMLDivElement>(null);
  const mobileProgressFillRef = useRef<HTMLDivElement>(null);
  const desktopTimeTextRef = useRef<HTMLSpanElement>(null);
  const mobileTimeTextRef = useRef<HTMLSpanElement>(null);

  const [playbackState, setPlaybackState] = useState(() => {
    const initialCap = t.sampleCaptions[1] || t.sampleCaptions[0];
    return {
      playingCaptionId: initialCap.id,
      wordIndex: computeWordIndexForCaption(initialCap, INITIAL_TIME_SEC),
      loopCycle: 0,
    };
  });
  const playbackStateRef = useRef(playbackState);

  // Active Subtitle Styles (matching real SubtitleStyle)
  const [fontFamily, setFontFamily] = useState<string>("Kanit");
  const [fontSize, setFontSize] = useState<number>(64);
  const [textColor, setTextColor] = useState<string>("#facc15");
  const [baseTextColor, setBaseTextColor] = useState<string>("#ffffff");
  const [isBold, setIsBold] = useState<boolean>(true);
  const [isItalic, setIsItalic] = useState<boolean>(false);
  const [isUnderline, setIsUnderline] = useState<boolean>(false);
  const [isUppercase, setIsUppercase] = useState<boolean>(false);
  const [hasWordBadge, setHasWordBadge] = useState<boolean>(false);
  const [badgeBgColor, setBadgeBgColor] = useState<string>("#22c55e");
  const [, setBadgeTextColor] = useState<string>("#000000");
  const [isGradient, setIsGradient] = useState<boolean>(false);
  const [gradientColors, setGradientColors] = useState<string>("linear-gradient(135deg, #c084fc 0%, #f43f5e 100%)");
  const [isHighlighter, setIsHighlighter] = useState<boolean>(false);
  const [highlighterColor, setHighlighterColor] = useState<string>("#fef08a");
  const [isFrosted, setIsFrosted] = useState<boolean>(false);
  const [hasShadow, setHasShadow] = useState<boolean>(true);
  const [hasOutline, setHasOutline] = useState<boolean>(true);
  const [shadowColor, setShadowColor] = useState<string>("#000000");
  const [shadowThickness, setShadowThickness] = useState<number>(4);
  const [hasBoxBg, setHasBoxBg] = useState<boolean>(false);
  const [boxBgColor, setBoxBgColor] = useState<string>("#000000");
  const [boxOpacity, setBoxOpacity] = useState<number>(0);
  const [position] = useState<PositionMode>("bottom");
  const [animation, setAnimation] = useState<AnimationMode>("bounce");
  const [introAnimation, setIntroAnimation] = useState<IntroAnimationMode>("spring-wave");
  const [introTiming, setIntroTiming] = useState<IntroTimingMode>("audio-synced");
  const [wordReveal, setWordReveal] = useState<WordRevealMode>("progressive");
  const [stylesCurrentWord, setStylesCurrentWord] = useState<boolean>(true);
  const [uploadState, setUploadState] = useState<"idle" | "uploaded">("idle");
  const [uploadPercent, setUploadPercent] = useState<number>(0);
  const uploadTimersRef = useRef<NodeJS.Timeout[]>([]);
  const uploadPercentRef = useRef<number>(0);
  const isUploading = uploadState === "uploaded" && uploadPercent < 100;

  // Interactive Render Simulation State
  const [isRendering, setIsRendering] = useState<boolean>(false);
  const [renderProgress, setRenderProgress] = useState<number>(0);
  const [showRenderModal, setShowRenderModal] = useState<boolean>(false);
  const renderTimersRef = useRef<NodeJS.Timeout[]>([]);

  // Auth state for render modal CTA ("Caption Your Video for Free") — checked lazily when modal opens
  const router = useRouter();
  const [ctaHref, setCtaHref] = useState<string>("/login");

  useEffect(() => {
    if (!showRenderModal) return;
    try {
      const supabase = createClient();
      supabase.auth
        .getUser()
        .then(({ data }) => {
          setCtaHref(data?.user ? "/my-video" : "/login");
        })
        .catch(() => {});
    } catch {
      // fallback
    }
  }, [showRenderModal]);

  const handleCtaClick = useCallback(async (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    try {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        router.push("/my-video");
      } else {
        router.push("/login");
      }
    } catch {
      router.push("/login");
    }
  }, [router]);

  const handleRenderClick = useCallback(() => {
    if (isRendering) return;
    setIsRendering(true);
    setRenderProgress(14);

    renderTimersRef.current.forEach(clearTimeout);
    const t1 = setTimeout(() => setRenderProgress(38), 240);
    const t2 = setTimeout(() => setRenderProgress(65), 580);
    const t3 = setTimeout(() => setRenderProgress(88), 980);
    const t4 = setTimeout(() => setRenderProgress(100), 1320);
    const t5 = setTimeout(() => {
      setIsRendering(false);
      setShowRenderModal(true);
    }, 1650);

    renderTimersRef.current = [t1, t2, t3, t4, t5];
  }, [isRendering]);

  const sectionRef = useRef<HTMLElement>(null);
  const cardListRef = useRef<HTMLDivElement>(null);

  // IntersectionObserver + Page Visibility to pause playback when offscreen or tab hidden
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    let isIntersecting = false;

    const syncVisibility = () => {
      setIsInView(isIntersecting && !document.hidden);
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        isIntersecting = entry.isIntersecting;
        syncVisibility();
      },
      { rootMargin: "100px 0px", threshold: 0.05 }
    );

    io.observe(section);
    document.addEventListener("visibilitychange", syncVisibility);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", syncVisibility);
    };
  }, []);

  const handleUploadClick = useCallback(() => {
    if (uploadState === "idle") {
      setUploadState("uploaded");
      setUploadPercent(0);
      uploadPercentRef.current = 0;
      uploadTimersRef.current.forEach(clearTimeout);
      const t1 = setTimeout(() => {
        setUploadPercent(32);
        uploadPercentRef.current = 32;
      }, 120);
      const t2 = setTimeout(() => {
        setUploadPercent(68);
        uploadPercentRef.current = 68;
      }, 350);
      const t3 = setTimeout(() => {
        setUploadPercent(92);
        uploadPercentRef.current = 92;
      }, 620);
      const t4 = setTimeout(() => {
        setUploadPercent(100);
        uploadPercentRef.current = 100;
      }, 900);
      uploadTimersRef.current = [t1, t2, t3, t4];
    } else if (uploadPercentRef.current >= 100) {
      uploadTimersRef.current.forEach(clearTimeout);
      uploadPercentRef.current = 0;
      setUploadPercent(0);
      setUploadState("idle");
    }
  }, [uploadState]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowRenderModal(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      uploadTimersRef.current.forEach(clearTimeout);
      renderTimersRef.current.forEach(clearTimeout);
    };
  }, []);

  // Imperative DOM sync for progress bars using GPU scaleX (zero layout reflow, zero React re-renders)
  const syncProgressDom = useCallback(
    (timeSec: number, forceTimeText = false) => {
      const ratio = Math.min(1, Math.max(0, timeSec / durationSec));
      const transformValue = `scaleX(${ratio.toFixed(4)})`;
      if (desktopProgressFillRef.current) {
        desktopProgressFillRef.current.style.transform = transformValue;
      }
      if (mobileProgressFillRef.current) {
        mobileProgressFillRef.current.style.transform = transformValue;
      }
      const wholeSec = Math.floor(timeSec);
      if (forceTimeText || wholeSec !== lastWholeSecRef.current) {
        lastWholeSecRef.current = wholeSec;
        const formatted = formatTimeStr(timeSec);
        if (desktopTimeTextRef.current) {
          desktopTimeTextRef.current.textContent = `${formatted} / ${formatTimeStr(durationSec)}`;
        }
        if (mobileTimeTextRef.current) {
          mobileTimeTextRef.current.textContent = formatted;
        }
      }
    },
    [durationSec]
  );

  const syncPlaybackToTime = useCallback(
    (timeSec: number, cycle: number, forceTimeText = false) => {
      currentTimeRef.current = timeSec;
      syncProgressDom(timeSec, forceTimeText);

      const cap =
        captionsList.find((c) => timeSec >= c.startSec && timeSec < c.endSec) ||
        (timeSec >= (captionsList[captionsList.length - 1]?.endSec ?? 0)
          ? captionsList[captionsList.length - 1]
          : captionsList[0]);

      if (!cap) return;
      const wIdx = computeWordIndexForCaption(cap, timeSec);

      const current = playbackStateRef.current;
      if (
        current.playingCaptionId !== cap.id ||
        current.wordIndex !== wIdx ||
        current.loopCycle !== cycle
      ) {
        const nextState = {
          playingCaptionId: cap.id,
          wordIndex: wIdx,
          loopCycle: cycle,
        };
        playbackStateRef.current = nextState;
        setPlaybackState(nextState);
      }
    },
    [captionsList, syncProgressDom]
  );

  // Live timeline progress simulation: pauses when offscreen/hidden, updates progress via GPU scaleX,
  // and only triggers React re-renders when the active spoken word or caption actually changes.
  useEffect(() => {
    if (!isPlaying || !isInView) return;
    const interval = setInterval(() => {
      let next = Math.round((currentTimeRef.current + 0.1 * speed) * 100) / 100;
      let cycle = loopCycleRef.current;
      if (next >= durationSec) {
        next = 0;
        cycle += 1;
        loopCycleRef.current = cycle;
      }
      syncPlaybackToTime(next, cycle);
    }, 100);
    return () => clearInterval(interval);
  }, [isPlaying, isInView, durationSec, speed, syncPlaybackToTime]);

  const playingCaption =
    captionsList.find((c) => c.id === playbackState.playingCaptionId) || captionsList[0];

  // Active caption for preview stage: follows playing caption when sync is enabled
  const activeCaption = isSyncOn
    ? playingCaption
    : captionsList.find((c) => c.id === activeCardId) || playingCaption;

  // Auto-scroll the active subtitle card strictly within the left panel only when clipped
  useEffect(() => {
    if (!isSyncOn || !cardListRef.current || !playingCaption?.id) return;
    const container = cardListRef.current;
    if (container.scrollHeight <= container.clientHeight) return;
    const activeEl = container.querySelector<HTMLElement>(
      `[data-card-id="${playingCaption.id}"]`
    );
    if (activeEl) {
      const top = activeEl.offsetTop;
      const bottom = top + activeEl.offsetHeight;
      const viewTop = container.scrollTop;
      const viewBottom = viewTop + container.clientHeight;

      if (top < viewTop) {
        container.scrollTop = Math.max(0, top - 8);
      } else if (bottom > viewBottom) {
        container.scrollTop = bottom - container.clientHeight + 8;
      }
    }
  }, [isSyncOn, playingCaption?.id]);

  // Apply real preset template (both visual styles and animation bundled together)
  const handleApplyTemplate = useCallback((tpl: TemplateItem) => {
    setSelectedTemplateId(tpl.id);
    setFontFamily(tpl.font);
    setFontSize(tpl.fontSize);
    setTextColor(tpl.textColor);
    setBaseTextColor(tpl.baseTextColor || "#ffffff");
    setIsBold(tpl.bold);
    setIsItalic(tpl.italic);
    setIsUnderline(tpl.underline);
    setIsUppercase(Boolean(tpl.uppercase));
    setHasWordBadge(Boolean(tpl.wordBadge));
    setBadgeBgColor(tpl.badgeBgColor || "#22c55e");
    setBadgeTextColor(tpl.badgeTextColor || "#000000");
    setIsGradient(Boolean(tpl.isGradient));
    setGradientColors(tpl.gradientColors || "linear-gradient(135deg, #c084fc 0%, #f43f5e 100%)");
    setIsHighlighter(Boolean(tpl.isHighlighter));
    setHighlighterColor(tpl.highlighterColor || "#fef08a");
    setIsFrosted(Boolean(tpl.isFrosted));
    setHasShadow(tpl.shadow);
    setHasOutline(tpl.outline);
    setShadowColor(tpl.shadowColor || "#000000");
    setShadowThickness(tpl.shadowThickness ?? 4);
    setHasBoxBg(Boolean(tpl.hasBoxBg));
    setBoxBgColor(tpl.boxBgColor || "#000000");
    setBoxOpacity(tpl.boxOpacity ?? (tpl.hasBoxBg ? 0.82 : 0));
    setAnimation(tpl.animation);
    setIntroAnimation(tpl.introAnimation);
    setIntroTiming(tpl.introTiming);
    setWordReveal(tpl.wordReveal);
    setStylesCurrentWord(tpl.stylesCurrentWord);
  }, []);

  const currentWordIndex =
    activeCaption.id === playingCaption.id ? playbackState.wordIndex : 0;

  const videoLoopCycle = playbackState.loopCycle;

  // Entrance animation class applied to each word when a caption line appears
  const enterClass =
    introAnimation === "spring-wave" || animation === "bounce"
      ? "cap-enter-bounce"
      : introAnimation === "snap-wave" || animation === "pop"
      ? "cap-enter-pop"
      : introAnimation === "ghost-type" || animation === "typing"
      ? "cap-enter-type"
      : introAnimation === "slide-up" || animation === "slide-up"
      ? "cap-enter-rise"
      : "cap-enter-pop";

  const colorPresets = ["#facc15", "#ffffff", "#22d3ee", "#ef4444", "#22c55e", "#ec4899"];

  const handleSelectTranscriptCard = useCallback(
    (cardId: number, startSec: number) => {
      setActiveCardId(cardId);
      syncPlaybackToTime(startSec, loopCycleRef.current, true);
    },
    [syncPlaybackToTime]
  );

  const handleTogglePlay = useCallback(() => {
    setIsPlaying((p) => !p);
  }, []);

  const handleCloseRenderModal = useCallback(() => {
    setShowRenderModal(false);
  }, []);

  const handleFontSizeChange = useCallback((size: number) => {
    setFontSize(size);
  }, []);

  const handleTextColorChange = useCallback((color: string) => {
    setTextColor(color);
    setBadgeBgColor(color);
  }, []);

  const handleAspectRatioChange = useCallback((ratio: AspectRatio) => {
    setAspectRatio(ratio);
  }, []);

  const handleScrub = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const ratio = Math.max(0, Math.min(1, clickX / rect.width));
      const targetTime = Math.round(ratio * durationSec * 100) / 100;
      syncPlaybackToTime(targetTime, loopCycleRef.current, true);
    },
    [durationSec, syncPlaybackToTime]
  );

  // Stable initial values: after mount the progress bar & timecode are driven imperatively,
  // so React must never re-write them on re-render.
  const initialTimeLabel = formatTimeStr(INITIAL_TIME_SEC);
  const initialProgressScale = Math.min(1, Math.max(0, INITIAL_TIME_SEC / durationSec));

  return (
    <section
      id="editor-mockup"
      ref={sectionRef}
      className="relative overflow-visible overflow-x-clip min-h-[calc(100svh-3.75rem)] min-h-[calc(100dvh-3.75rem)] min-h-[calc(100vh-3.75rem)] flex flex-col justify-center py-6 sm:py-8 lg:py-10 scroll-mt-16"
    >
      {/* Background ambient lighting - static native CSS background glow */}
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_45%,rgba(139,92,246,0.16)_0%,rgba(124,58,237,0.08)_30%,rgba(109,40,217,0.03)_55%,transparent_75%)]"
        aria-hidden
      />

      <div className="relative mx-auto max-w-5xl lg:max-w-[1080px] xl:max-w-6xl 2xl:max-w-7xl px-4 sm:px-6 lg:px-8 w-full">
        {/* RELATIVE WRAPPER FOR EDITOR + SURROUNDING FLOATING CARDS */}
        <div className="relative">
          <div className="relative">

          {/* 3. FLOATING CARD 1: Video File & AI Transcription Status */}
          <UploadCard
            uploadState={uploadState}
            uploadPercent={uploadPercent}
            durationSec={durationSec}
            showRenderModal={showRenderModal}
            lang={lang}
            isUploading={isUploading}
            onUploadClick={handleUploadClick}
            onCloseRenderModal={handleCloseRenderModal}
          />

          {/* 4. FLOATING CARD 2: Mini Player Controller */}
          <MiniPlayerCard
            isPlaying={isPlaying}
            initialTimeLabel={initialTimeLabel}
            durationSec={durationSec}
            initialProgressScale={initialProgressScale}
            showRenderModal={showRenderModal}
            lang={lang}
            desktopTimeTextRef={desktopTimeTextRef}
            desktopProgressFillRef={desktopProgressFillRef}
            onTogglePlay={handleTogglePlay}
            onScrub={handleScrub}
            onCloseRenderModal={handleCloseRenderModal}
          />

          {/* 5. FLOATING CARD 3: Styles Panel */}
          <StylesInspectorCard
            fontSize={fontSize}
            textColor={textColor}
            colorPresets={colorPresets}
            showRenderModal={showRenderModal}
            lang={lang}
            fontSizeLabel={t.fontSize}
            textColorLabel={t.textColor}
            onFontSizeChange={handleFontSizeChange}
            onTextColorChange={handleTextColorChange}
            onCloseRenderModal={handleCloseRenderModal}
          />

          {/* AUTHENTIC ZAIZUB EDITOR FRAME (Faithfully mirroring /editor page UI) */}
          <div className="relative z-10 overflow-hidden rounded-2xl sm:rounded-3xl border border-[#221e33] bg-[#0a090f] shadow-[0_30px_70px_-15px_rgba(0,0,0,0.9)] ring-1 ring-white/10 [contain:layout_paint] transform-gpu [backface-visibility:hidden]">
            {/* 1. TOP NAVBAR (Faithful replica of EditorHeader.tsx) */}
            <EditorHeader
              aspectRatio={aspectRatio}
              isRendering={isRendering}
              renderProgress={renderProgress}
              renderBtnText={t.renderBtn}
              renderingText={t.rendering || "Rendering..."}
              onAspectRatioChange={handleAspectRatioChange}
              onRenderClick={handleRenderClick}
            />

          {/* 2. MAIN WORKSPACE (Authentic 3-Column Layout from EditorWorkspace.tsx) */}
          <div className="flex flex-col lg:flex-row min-h-[460px] lg:h-[480px] xl:h-[510px] 2xl:h-[550px] relative w-full overflow-hidden">
            {/* LEFT COLUMN: Transcript / Subtitles Panel (Faithful replica of TranscriptPanel.tsx) */}
            <div className="w-full lg:w-[260px] xl:w-[290px] 2xl:w-[320px] flex-shrink-0 flex flex-col bg-[#0d0c14] border-b lg:border-b-0 lg:border-r border-[#1c1a28]">
              {/* Subtitle Card List */}
              <div
                ref={cardListRef}
                className="flex-1 overflow-y-auto p-2.5 space-y-2 no-scrollbar"
              >
                {captionsList.map((sub, index) => {
                  const isPlayingThis = sub.id === playingCaption.id;
                  const isSelected = sub.id === activeCaption.id;
                  const isCardPast = sub.endSec <= playingCaption.startSec;

                  return (
                    <TranscriptCard
                      key={sub.id}
                      sub={sub}
                      index={index}
                      isPlayingThis={isPlayingThis}
                      isSelected={isSelected}
                      isCardPast={isCardPast}
                      wordIndex={isPlayingThis ? playbackState.wordIndex : -1}
                      selectedTemplateId={selectedTemplateId}
                      fontFamily={fontFamily}
                      textColor={textColor}
                      baseTextColor={baseTextColor}
                      badgeBgColor={badgeBgColor}
                      hasWordBadge={hasWordBadge}
                      isFrosted={isFrosted}
                      hasBoxBg={hasBoxBg}
                      boxBgColor={boxBgColor}
                      boxOpacity={boxOpacity}
                      isBold={isBold}
                      isItalic={isItalic}
                      isUnderline={isUnderline}
                      hasOutline={hasOutline}
                      hasShadow={hasShadow}
                      stylesCurrentWord={stylesCurrentWord}
                      onSelect={handleSelectTranscriptCard}
                    />
                  );
                })}
              </div>
            </div>

            {/* CENTER COLUMN: Video Player + Transport Controls */}
            <div className="flex-1 flex flex-col bg-[#0a090f] overflow-hidden select-none relative">
              {/* Video Player Canvas Area */}
              <div className="flex-1 flex items-center justify-center p-2 sm:p-3 relative overflow-hidden min-h-[300px] sm:min-h-[325px] lg:min-h-[345px]">
                {/* Subtle dark canvas background grid */}
                <div
                  className="pointer-events-none absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.03)_1px,transparent_1px)] [background-size:16px_16px]"
                  aria-hidden
                />

                {/* Aspect-Ratio Adaptive Video Stage Card (Click to toggle play/pause) */}
                <div className="relative z-20">
                  <div
                    onClick={() => setIsPlaying((p) => !p)}
                    title={isPlaying ? (lang === "th" ? "คลิกเพื่อหยุดชั่วคราว" : "Click to pause") : (lang === "th" ? "คลิกเพื่อเล่น" : "Click to play")}
                    className={`group/stage relative overflow-hidden shadow-[0_24px_60px_rgba(0,0,0,0.9),inset_0_1px_0_0_rgba(255,255,255,0.2)] flex items-center justify-center border border-white/20 hover:border-white/30 bg-[#141022] cursor-pointer select-none [contain:layout_paint] ${
                      aspectRatio === "9:16"
                        ? "rounded-[1.8rem] sm:rounded-[2.2rem] h-[310px] w-[174px] sm:h-[345px] sm:w-[194px] lg:h-[370px] lg:w-[208px] xl:h-[395px] xl:w-[222px] 2xl:h-[415px] 2xl:w-[233px]"
                        : aspectRatio === "16:9"
                        ? "rounded-[1.5rem] h-[220px] w-[390px] max-w-[92vw] sm:h-[248px] sm:w-[440px] lg:h-[256px] lg:w-[455px] xl:h-[280px] xl:w-[498px] 2xl:h-[288px] xl:w-[512px]"
                        : "rounded-[1.8rem] h-[270px] w-[270px] sm:h-[320px] sm:w-[320px] lg:h-[350px] lg:w-[350px] xl:h-[390px] xl:w-[390px] 2xl:h-[420px] 2xl:w-[420px]"
                    }`}
                  >
                    {/* Studio video player backdrop */}
                    <div className="absolute inset-0 bg-gradient-to-b from-[#26203a] via-[#1a162b] to-[#120f20]" />
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_25%,rgba(255,255,255,0.07)_0%,transparent_70%)] pointer-events-none" />
                    <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_0%,rgba(0,0,0,0.35)_100%)] pointer-events-none" />

                    {/* PAUSE STAGE OVERLAY */}
                    {!isPlaying && (
                      <div className="absolute inset-0 z-30 flex flex-col items-center justify-center pointer-events-none select-none bg-black/45">
                        <div className="relative z-10 anim-pop-in">
                          <div className="relative flex h-13 w-13 sm:h-15 sm:w-15 items-center justify-center rounded-full bg-gradient-to-tr from-[#7c3aed] to-[#6d28d9] border border-white/30 text-white shadow-[0_12px_30px_rgba(0,0,0,0.85)] ring-2 ring-white/20">
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" className="ml-0.5 text-white">
                              <polygon points="6 3 20 12 6 21 6 3" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* SUBTITLE CONTAINER */}
                    <div
                      className="absolute left-1/2 -translate-x-1/2 w-[88%] z-20 select-none pointer-events-none"
                      style={{
                        top: position === "top" ? "12%" : position === "center" ? "45%" : undefined,
                        bottom:
                          position === "bottom"
                            ? aspectRatio === "16:9"
                              ? "8%"
                              : aspectRatio === "1:1"
                              ? "10%"
                              : "9.5%"
                            : undefined,
                      }}
                    >
                      {/* Live Subtitle Text with Running Word-by-Word Highlight */}
                      <div className="text-center py-1">
                        <div
                          key={`${activeCaption.id}-${selectedTemplateId}-${videoLoopCycle}`}
                          className={`items-center justify-center text-center ${
                            introTiming === "block" && introAnimation === "impact-drop"
                              ? "cap-intro-impact"
                              : introTiming === "block" && introAnimation === "capsule-pop"
                              ? "cap-intro-capsule"
                              : introTiming === "block" && introAnimation === "slide-up"
                              ? "cap-intro-slide-up"
                              : ""
                          }`}
                        >
                          <div
                            className={`items-center justify-center gap-x-2 sm:gap-x-2.5 gap-y-1.5 leading-tight text-center ${
                              isFrosted
                                ? "inline-flex flex-wrap rounded-2xl px-5 py-2.5 shadow-xl border border-white/20 bg-[#1e1b2e]/90"
                                : hasBoxBg && boxOpacity > 0
                                ? "inline-flex flex-wrap rounded-xl px-4 py-2 shadow-xl"
                                : "inline-flex flex-wrap"
                            }`}
                            style={{
                              backgroundColor:
                                isFrosted
                                  ? undefined
                                  : hasBoxBg && boxOpacity > 0 ? `rgba(0, 0, 0, ${boxOpacity})` : undefined,
                              fontFamily:
                                fontFamily === "Kanit"
                                  ? "Kanit, sans-serif"
                                  : fontFamily === "Prompt"
                                  ? "Prompt, sans-serif"
                                  : fontFamily === "Sarabun"
                                  ? "Sarabun, sans-serif"
                                  : "Noto Sans Thai, sans-serif",
                              fontSize: `${Math.round(fontSize * 0.28)}px`,
                              fontStyle: isItalic ? "italic" : "normal",
                              textDecoration: isUnderline ? "underline" : "none",
                              textTransform: isUppercase ? "uppercase" : "none",
                              letterSpacing: isUppercase ? "0.04em" : "normal",
                            }}
                          >
                            {(activeCaption.tokens || activeCaption.text.split(" ")).map((token, idx) => {
                              const isCurrent = idx === currentWordIndex;
                              const isKaraoke = selectedTemplateId === "submagic-karaoke";
                              const isWordBadgeActive = hasWordBadge || selectedTemplateId === "mrbeast-badge";
                              const isGradientActive = isGradient || selectedTemplateId === "gradient-aurora";
                              const isHighlighterActive = isHighlighter || selectedTemplateId === "highlighter-marker";
                              const isFrostedActive = isFrosted || selectedTemplateId === "ali-abdaal";
                              const isRevealed = (isKaraoke || isFrostedActive) ? true : wordReveal === "progressive" ? idx <= currentWordIndex : true;
                              const isTyping = animation === "typing";
                              const isShake = animation === "shake";
                              const isStaggerWave = selectedTemplateId === "clean-minimal";
                              const shouldAnimateEnter =
                                introAnimation !== "none" &&
                                (wordReveal === "progressive" || isStaggerWave) &&
                                !isKaraoke &&
                                !isFrostedActive;

                              return (
                                <StageWord
                                  key={idx}
                                  token={token}
                                  idx={idx}
                                  isCurrent={isCurrent}
                                  isRevealed={isRevealed}
                                  shouldAnimateEnter={shouldAnimateEnter}
                                  enterClass={enterClass}
                                  isStaggerWave={isStaggerWave}
                                  isTyping={isTyping}
                                  isShake={isShake}
                                  animation={animation}
                                  stylesCurrentWord={stylesCurrentWord}
                                  isWordBadgeActive={isWordBadgeActive}
                                  isHighlighterActive={isHighlighterActive}
                                  textColor={textColor}
                                  badgeBgColor={badgeBgColor}
                                  baseTextColor={baseTextColor}
                                  isGradientActive={isGradientActive}
                                  gradientColors={gradientColors}
                                  isFrostedActive={isFrostedActive}
                                  highlighterColor={highlighterColor}
                                  hasShadow={hasShadow}
                                  shadowColor={shadowColor}
                                  shadowThickness={shadowThickness}
                                  hasOutline={hasOutline}
                                  isBold={isBold}
                                  isKaraoke={isKaraoke}
                                  selectedTemplateId={selectedTemplateId}
                                  currentWordIndex={currentWordIndex}
                                />
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mobile Transport Controls Bar */}
              <MobileTransportBar
                isPlaying={isPlaying}
                initialTimeLabel={initialTimeLabel}
                durationSec={durationSec}
                initialProgressScale={initialProgressScale}
                mobileTimeTextRef={mobileTimeTextRef}
                mobileProgressFillRef={mobileProgressFillRef}
                onTogglePlay={handleTogglePlay}
                onScrub={handleScrub}
              />
            </div>

            {/* RIGHT COLUMN: Isolated Memoized Preset Templates Panel */}
            <TemplatePresetsPanel
              lang={lang}
              selectedTemplateId={selectedTemplateId}
              textColor={textColor}
              onApplyTemplate={handleApplyTemplate}
            />
          </div>
        </div>

          {/* EXPORT READY CONVERSION MODAL */}
          {showRenderModal && (
            <div
              className="absolute inset-0 z-50 rounded-2xl sm:rounded-3xl bg-black/85 anim-fade-in flex items-center justify-center p-3 sm:p-5"
              onClick={() => setShowRenderModal(false)}
            >
              <div
                onClick={(e) => e.stopPropagation()}
                className="relative w-full max-w-md rounded-2xl sm:rounded-3xl bg-[#0e0c19] border border-white/[0.14] hover:border-purple-400/50 p-5 sm:p-7 shadow-[0_32px_85px_rgba(0,0,0,0.95)] transition-colors duration-200 overflow-hidden text-center select-none group cursor-default"
              >
                {/* Decorative top ambient glow */}
                <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-52 h-52 rounded-full bg-purple-500/20 blur-3xl pointer-events-none" />

                {/* Close button */}
                <button
                  type="button"
                  onClick={() => setShowRenderModal(false)}
                  className="absolute top-3.5 right-3.5 h-7 w-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/[0.08] transition-colors z-20"
                  aria-label="Close"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>

                {/* Success Icon Badge */}
                <div className="relative z-10 mx-auto mb-3.5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500/25 to-indigo-500/15 border border-purple-500/40 text-purple-300 shadow-inner">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                </div>

                {/* Title & Invite Text */}
                <div className="relative z-10 mb-6">
                  <h3 className="text-lg sm:text-xl font-bold text-white mb-2 tracking-tight">
                    {t.renderCompleteTitle}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-300 leading-relaxed max-w-xs mx-auto">
                    {t.renderInviteText}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="relative z-10 space-y-2">
                  <Link
                    href={ctaHref}
                    onClick={handleCtaClick}
                    className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#7c3aed] via-[#6d28d9] to-[#5b21b6] hover:brightness-110 text-white font-bold text-xs sm:text-sm transition-all shadow-lg shadow-purple-900/40 active:scale-[0.98]"
                  >
                    <span>{t.renderTryFreeBtn}</span>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </Link>

                  <button
                    type="button"
                    onClick={() => setShowRenderModal(false)}
                    className="flex h-9 w-full items-center justify-center text-xs font-semibold text-gray-400 hover:text-white hover:bg-white/[0.04] rounded-lg transition-colors cursor-pointer"
                  >
                    {t.renderKeepEditingBtn}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
        </div>
      </div>
    </section>
  );
}

interface TranscriptCardProps {
  sub: SampleCaption;
  index: number;
  isPlayingThis: boolean;
  isSelected: boolean;
  isCardPast: boolean;
  wordIndex: number;
  selectedTemplateId: string;
  fontFamily: string;
  textColor: string;
  baseTextColor: string;
  badgeBgColor: string;
  hasWordBadge: boolean;
  isFrosted: boolean;
  hasBoxBg: boolean;
  boxBgColor: string;
  boxOpacity: number;
  isBold: boolean;
  isItalic: boolean;
  isUnderline: boolean;
  hasOutline: boolean;
  hasShadow: boolean;
  stylesCurrentWord: boolean;
  onSelect: (cardId: number, startSec: number) => void;
}

const TranscriptCard = React.memo(function TranscriptCard({
  sub,
  index,
  isPlayingThis,
  isSelected,
  isCardPast,
  wordIndex,
  selectedTemplateId,
  fontFamily,
  textColor,
  baseTextColor,
  badgeBgColor,
  hasWordBadge,
  isFrosted,
  hasBoxBg,
  boxBgColor,
  boxOpacity,
  isBold,
  isItalic,
  isUnderline,
  hasOutline,
  hasShadow,
  stylesCurrentWord,
  onSelect,
}: TranscriptCardProps) {
  const fontStack =
    fontFamily === "Kanit"
      ? "Kanit, sans-serif"
      : fontFamily === "Prompt"
      ? "Prompt, sans-serif"
      : fontFamily === "Sarabun"
      ? "Sarabun, sans-serif"
      : "Noto Sans Thai, sans-serif";

  return (
    <div
      data-card-id={sub.id}
      onClick={() => onSelect(sub.id, sub.startSec)}
      className={`relative rounded-2xl p-3 transition-colors duration-150 cursor-pointer overflow-hidden border ${
        isPlayingThis
          ? "bg-[#181528] border-purple-500/30 shadow-md"
          : isSelected
          ? "bg-[#141220] border-white/15"
          : "bg-[#100e1b] hover:bg-[#161324] border-white/[0.05]"
      }`}
    >
      <div className="flex items-center gap-1.5 mb-1.5">
        <span
          className={`text-xs tabular-nums font-bold ${
            isPlayingThis
              ? "text-purple-300"
              : isCardPast
              ? "text-white/60"
              : "text-white/35"
          }`}
        >
          #{index + 1}
        </span>
        {isPlayingThis && (
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 ml-0.5" />
        )}
      </div>

      {!isPlayingThis ? (
        <p
          className="text-xs leading-relaxed select-none font-medium"
          style={{
            color: isCardPast ? "rgba(255, 255, 255, 0.7)" : "rgba(255, 255, 255, 0.42)",
            fontFamily: fontStack,
            fontStyle: isItalic ? "italic" : "normal",
            textDecoration: isUnderline ? "underline" : "none",
          }}
        >
          {sub.text}
        </p>
      ) : (
        <p
          className={`text-xs leading-relaxed flex flex-wrap gap-x-1.5 gap-y-0.5 select-none ${
            isFrosted
              ? "rounded-lg px-2.5 py-1 border border-white/20 bg-white/[0.08] inline-flex"
              : hasBoxBg && boxOpacity > 0
              ? "rounded-lg px-2 py-1 inline-flex"
              : ""
          }`}
          style={{
            backgroundColor:
              !isFrosted && hasBoxBg && boxOpacity > 0
                ? boxBgColor || `rgba(0, 0, 0, ${boxOpacity})`
                : undefined,
            fontFamily: fontStack,
            fontStyle: isItalic ? "italic" : "normal",
            textDecoration: isUnderline ? "underline" : "none",
          }}
        >
          {(sub.tokens || sub.text.split(" ")).map((token, wIdx) => {
            const isWordActive = stylesCurrentWord && wIdx === wordIndex;
            const isKaraoke = selectedTemplateId === "submagic-karaoke";
            const isBadge = Boolean(hasWordBadge) || selectedTemplateId === "mrbeast-badge";

            let tokenShadow: string | undefined = undefined;
            let tokenColor: string;
            let tokenBg: string | undefined = undefined;
            let tokenPadding: string | undefined = undefined;
            let tokenRadius: string | undefined = undefined;
            let tokenBoxShadow: string | undefined = undefined;

            if (isKaraoke) {
              if (wIdx > wordIndex) {
                tokenColor = "rgba(255, 255, 255, 0.32)";
                tokenShadow = "none";
              } else if (wIdx < wordIndex) {
                tokenColor = "#ffffff";
                tokenShadow = `0 0 5px ${hexToRgba(textColor, 0.4)}, 0 1px 2px #000`;
              } else {
                tokenColor = textColor || "#22d3ee";
                tokenShadow = `0 0 10px ${textColor}, 0 0 18px ${hexToRgba(textColor, 0.95)}, 0 1px 2px #000`;
              }
            } else if (isBadge) {
              if (isWordActive) {
                const activeBadgeBg = selectedTemplateId === "mrbeast-badge" ? textColor : (badgeBgColor || textColor || "#22c55e");
                tokenColor = getContrastTextColor(activeBadgeBg);
                tokenBg = activeBadgeBg;
                tokenPadding = "1px 5px";
                tokenRadius = "4px";
                tokenBoxShadow = `0 1px 6px ${hexToRgba(activeBadgeBg, 0.55)}`;
                tokenShadow = "none";
              } else {
                tokenColor = baseTextColor || "#ffffff";
                tokenShadow = "0 2px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000";
              }
            } else if (isFrosted) {
              if (isWordActive) {
                tokenColor = textColor || "#fde047";
                tokenShadow = `0 0 8px ${hexToRgba(textColor, 0.85)}`;
              } else {
                tokenColor = "#ffffff";
                tokenShadow = "0 1px 2px rgba(0,0,0,0.6)";
              }
            } else if (selectedTemplateId === "danger-hook") {
              if (isWordActive) {
                tokenColor = textColor || "#ef4444";
                tokenShadow = `0 0 8px ${hexToRgba(textColor, 0.85)}, 0 2px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000`;
              } else {
                tokenColor = baseTextColor || "#ffffff";
                tokenShadow = "0 2px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000";
              }
            } else if (selectedTemplateId === "tiktok-viral") {
              if (isWordActive) {
                tokenColor = textColor || "#facc15";
                tokenShadow = "0 3px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000";
              } else {
                tokenColor = baseTextColor || "#ffffff";
                tokenShadow = "0 2px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000";
              }
            } else {
              tokenColor = isWordActive ? textColor : (baseTextColor || "#ffffff");
              tokenShadow = hasOutline || hasShadow ? "0 1.5px 3px rgba(0,0,0,0.8)" : undefined;
            }

            return (
              <span
                key={wIdx}
                className="cap-word-sm"
                data-active={isWordActive}
                style={{
                  color: tokenColor,
                  background: tokenBg,
                  padding: tokenPadding,
                  borderRadius: tokenRadius,
                  boxShadow: tokenBoxShadow,
                  textShadow: tokenShadow,
                  fontWeight: isWordActive ? 900 : isBold ? 850 : 500,
                }}
              >
                {token}
              </span>
            );
          })}
        </p>
      )}
    </div>
  );
});

interface TemplatePresetsPanelProps {
  lang: Lang;
  selectedTemplateId: string;
  textColor: string;
  onApplyTemplate: (tpl: TemplateItem) => void;
}

const TemplatePresetsPanel = React.memo(function TemplatePresetsPanel({
  lang,
  selectedTemplateId,
  textColor,
  onApplyTemplate,
}: TemplatePresetsPanelProps) {
  const demoTokens = TEMPLATE_DEMO_TOKENS[lang] || TEMPLATE_DEMO_TOKENS.en;

  return (
    <div className="w-full lg:w-[270px] xl:w-[305px] 2xl:w-[340px] flex-shrink-0 flex flex-col bg-[#0c0b11] border-t lg:border-t-0 lg:border-l border-[#1c1a28] p-2 sm:p-2.5 overflow-hidden select-none">
      {/* Templates List (Static zero-timer signature previews for instant responsiveness) */}
      <div className="flex-1 flex flex-col justify-between gap-1.5 sm:gap-2 min-h-0 overflow-y-auto no-scrollbar">
        {TEMPLATES_LIST.map((tpl) => {
          const isActive = selectedTemplateId === tpl.id;
          const cardTokens = tpl.demoTokens?.[lang] || demoTokens;
          const highlightIdx = Math.min(2, Math.max(0, cardTokens.length - 2));

          return (
            <button
              key={tpl.id}
              type="button"
              onClick={() => onApplyTemplate(tpl)}
              className={`group relative flex-1 flex flex-col justify-between rounded-xl px-2.5 py-1.5 transition-colors text-left active:scale-[0.99] cursor-pointer min-h-[62px] border-0 ${
                isActive
                  ? "bg-[#2d2250] text-white shadow-md"
                  : "bg-[#1a1827] hover:bg-[#221f33] text-gray-200"
              }`}
            >
              <div className="flex items-center justify-between w-full flex-shrink-0">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className={`font-semibold text-xs truncate ${isActive ? "text-white" : "text-gray-300"}`}>
                    {tpl.name}
                  </span>
                  {isActive && (
                    <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#7c3aed] text-white shadow-sm flex-shrink-0">
                      <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </span>
                  )}
                </div>
              </div>

              {/* Static Signature Template Preview Card */}
              <div className="flex flex-1 items-center justify-center rounded-lg bg-[#0c0b11] px-2 py-1.5 overflow-hidden my-0.5 min-h-[36px]">
                <div
                  className={`items-center justify-center gap-x-1 sm:gap-x-1.5 leading-tight text-center flex-nowrap ${
                    tpl.isFrosted
                      ? "inline-flex rounded-lg px-2.5 py-1 border border-white/20 bg-white/[0.08]"
                      : tpl.hasBoxBg && (tpl.boxOpacity ?? 0) > 0
                      ? "inline-flex rounded-lg px-2.5 py-1"
                      : "inline-flex"
                  }`}
                  style={{
                    backgroundColor:
                      tpl.isFrosted
                        ? undefined
                        : tpl.hasBoxBg && (tpl.boxOpacity ?? 0) > 0
                        ? `rgba(0, 0, 0, ${tpl.boxOpacity})`
                        : undefined,
                    fontFamily:
                      tpl.font === "Kanit"
                        ? "Kanit, sans-serif"
                        : tpl.font === "Prompt"
                        ? "Prompt, sans-serif"
                        : tpl.font === "Sarabun"
                        ? "Sarabun, sans-serif"
                        : "Noto Sans Thai, sans-serif",
                    fontSize: cardTokens.length > 5 ? "11.5px" : "12px",
                    fontStyle: tpl.italic ? "italic" : "normal",
                    textDecoration: tpl.underline ? "underline" : "none",
                    textTransform: tpl.uppercase ? "uppercase" : "none",
                    letterSpacing: tpl.uppercase ? "0.04em" : "normal",
                  }}
                >
                  {cardTokens.map((token, idx) => {
                    const isKaraoke = tpl.id === "submagic-karaoke";
                    const isBadge = Boolean(tpl.wordBadge) || tpl.id === "mrbeast-badge";
                    const isGradientTpl = Boolean(tpl.isGradient) || tpl.id === "gradient-aurora";
                    const isHighlighterTpl = Boolean(tpl.isHighlighter) || tpl.id === "highlighter-marker";
                    const isFrostedTpl = Boolean(tpl.isFrosted) || tpl.id === "ali-abdaal";
                    const isCurrent = idx === highlightIdx;
                    const isGlow =
                      isKaraoke ||
                      (tpl.shadow && tpl.shadowColor === tpl.textColor && tpl.textColor !== "#ffffff");

                    let tokenShadow: string | undefined = undefined;
                    let tokenColor = tpl.baseTextColor || "#ffffff";
                    let tokenBg: string | undefined = undefined;
                    let tokenPadding: string | undefined = undefined;
                    let tokenRadius: string | undefined = undefined;
                    let tokenBoxShadow: string | undefined = undefined;
                    let isTextGradient = false;

                    const isSelectedTpl = tpl.id === selectedTemplateId;
                    const activeHighlight = isSelectedTpl ? textColor : tpl.textColor || "#ffffff";

                    if (isKaraoke) {
                      if (idx > highlightIdx) {
                        tokenColor = "rgba(255, 255, 255, 0.32)";
                        tokenShadow = "none";
                      } else if (idx < highlightIdx) {
                        tokenColor = "#ffffff";
                        tokenShadow = `0 0 5px ${hexToRgba(activeHighlight, 0.35)}, 0 1px 2px #000`;
                      } else {
                        tokenColor = activeHighlight;
                        tokenShadow = `0 0 10px ${activeHighlight}, 0 0 18px ${hexToRgba(activeHighlight, 0.9)}, 0 1.5px 3px #000000`;
                      }
                    } else if (isBadge) {
                      if (isCurrent) {
                        const activeBadgeBg = isSelectedTpl
                          ? textColor
                          : tpl.badgeBgColor || tpl.textColor || "#22c55e";
                        tokenColor = getContrastTextColor(activeBadgeBg);
                        tokenBg = activeBadgeBg;
                        tokenPadding = "1px 5px";
                        tokenRadius = "4px";
                        tokenBoxShadow = `0 2px 6px ${hexToRgba(activeBadgeBg, 0.5)}, 0 1px 0 #000000`;
                        tokenShadow = "none";
                      } else {
                        tokenColor = tpl.baseTextColor || "#ffffff";
                        tokenShadow =
                          "0 3px 0 #000000, -1px -1px 0 #000000, 1px -1px 0 #000000, -1px 1px 0 #000000, 1px 1px 0 #000000";
                        tokenPadding = "1px 0";
                      }
                    } else if (tpl.id === "danger-hook") {
                      if (isCurrent) {
                        tokenColor = activeHighlight;
                        tokenShadow = `0 0 8px ${hexToRgba(activeHighlight, 0.85)}, 0 3px 0 #000000, -1px -1px 0 #000000, 1px -1px 0 #000000, -1px 1px 0 #000000, 1px 1px 0 #000000`;
                      } else {
                        tokenColor = tpl.baseTextColor || "#ffffff";
                        tokenShadow =
                          "0 2px 0 #000000, -1px -1px 0 #000000, 1px -1px 0 #000000, -1px 1px 0 #000000, 1px 1px 0 #000000";
                      }
                    } else if (isGradientTpl) {
                      if (isCurrent) {
                        isTextGradient = true;
                        tokenBg = tpl.gradientColors || "linear-gradient(135deg, #c084fc 0%, #f43f5e 100%)";
                        tokenColor = "transparent";
                        tokenShadow = "none";
                      } else {
                        tokenColor = "#ffffff";
                        tokenShadow =
                          "0 3px 0 #000000, -1px -1px 0 #000000, 1px -1px 0 #000000, -1px 1px 0 #000000, 1px 1px 0 #000000";
                      }
                    } else if (isHighlighterTpl) {
                      if (isCurrent) {
                        tokenColor = "#0f172a";
                        tokenBg = tpl.highlighterColor || "#fef08a";
                        tokenPadding = "1px 5px";
                        tokenRadius = "3px";
                        tokenBoxShadow = "0 1.5px 6px rgba(254, 240, 138, 0.6)";
                        tokenShadow = "none";
                      } else {
                        tokenColor = tpl.baseTextColor || "#ffffff";
                        tokenShadow =
                          "0 3px 0 #000000, -1px -1px 0 #000000, 1px -1px 0 #000000, -1px 1px 0 #000000, 1px 1px 0 #000000";
                        tokenPadding = "1px 0";
                      }
                    } else if (isFrostedTpl) {
                      if (isCurrent) {
                        tokenColor = activeHighlight;
                        tokenShadow = `0 0 8px ${hexToRgba(activeHighlight, 0.85)}`;
                      } else {
                        tokenColor = "#ffffff";
                        tokenShadow = "0 1px 2px rgba(0,0,0,0.6)";
                      }
                    } else if (isGlow) {
                      tokenShadow = (tpl.stylesCurrentWord ? isCurrent : true)
                        ? `0 0 10px ${activeHighlight}, 0 0 18px ${hexToRgba(activeHighlight, 0.6)}, 0 1.5px 3px #000000`
                        : "0 1.5px 3px rgba(0, 0, 0, 0.8)";
                      tokenColor = tpl.stylesCurrentWord
                        ? isCurrent
                          ? activeHighlight
                          : tpl.baseTextColor || "#ffffff"
                        : activeHighlight;
                    } else if (tpl.outline && tpl.shadow) {
                      tokenShadow = `0 ${tpl.shadowThickness ?? 4}px 0 ${tpl.shadowColor || "#000"}, -1px -1px 0 ${tpl.shadowColor || "#000"}, 1px -1px 0 ${tpl.shadowColor || "#000"}, -1px 1px 0 ${tpl.shadowColor || "#000"}, 1px 1px 0 ${tpl.shadowColor || "#000"}`;
                      tokenColor = tpl.stylesCurrentWord
                        ? isCurrent
                          ? activeHighlight
                          : tpl.baseTextColor || "#ffffff"
                        : activeHighlight;
                    } else if (tpl.outline) {
                      tokenShadow = `-1.5px -1.5px 0 ${tpl.shadowColor || "#000"}, 1.5px -1.5px 0 ${tpl.shadowColor || "#000"}, -1.5px 1.5px 0 ${tpl.shadowColor || "#000"}, 1.5px 1.5px 0 ${tpl.shadowColor || "#000"}`;
                      tokenColor = tpl.stylesCurrentWord
                        ? isCurrent
                          ? activeHighlight
                          : tpl.baseTextColor || "#ffffff"
                        : activeHighlight;
                    } else if (tpl.shadow) {
                      tokenShadow = `0 ${tpl.shadowThickness ?? 4}px ${(tpl.shadowThickness ?? 4) * 2}px ${tpl.shadowColor || "#000"}`;
                      tokenColor = tpl.stylesCurrentWord
                        ? isCurrent
                          ? activeHighlight
                          : tpl.baseTextColor || "#ffffff"
                        : activeHighlight;
                    } else {
                      tokenColor = tpl.stylesCurrentWord
                        ? isCurrent
                          ? activeHighlight
                          : tpl.baseTextColor || "#ffffff"
                        : activeHighlight;
                    }

                    const isWordActive = tpl.stylesCurrentWord && isCurrent;

                    return (
                      <span
                        key={idx}
                        className="relative inline-block"
                      >
                        <span
                          className="inline-block"
                          style={{
                            color: tokenColor,
                            background: tokenBg,
                            WebkitBackgroundClip: isTextGradient ? "text" : undefined,
                            WebkitTextFillColor: isTextGradient ? "transparent" : undefined,
                            padding: tokenPadding,
                            borderRadius: tokenRadius,
                            boxShadow: tokenBoxShadow,
                            textShadow: tokenShadow,
                            fontWeight: isWordActive ? 900 : tpl.bold ? 850 : 500,
                            transform: isWordActive ? "translateY(-1px) scale(1.08)" : undefined,
                          }}
                        >
                          {token}
                        </span>
                      </span>
                    );
                  })}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
});

interface UploadCardProps {
  uploadState: "idle" | "uploaded";
  uploadPercent: number;
  durationSec: number;
  showRenderModal: boolean;
  lang: Lang;
  isUploading: boolean;
  onUploadClick: () => void;
  onCloseRenderModal: () => void;
}

const UploadCard = React.memo(function UploadCard({
  uploadState,
  uploadPercent,
  durationSec,
  showRenderModal,
  lang,
  isUploading,
  onUploadClick,
  onCloseRenderModal,
}: UploadCardProps) {
  return (
    <div className="hidden md:block absolute -top-6 -left-2 lg:-top-8 lg:-left-3 xl:-top-10 xl:-left-6 z-30 transform-gpu [backface-visibility:hidden]">
      <div
        onClick={onUploadClick}
        role="button"
        tabIndex={isUploading ? -1 : 0}
        aria-disabled={isUploading}
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === " ") && !isUploading) {
            e.preventDefault();
            onUploadClick();
          }
        }}
        title={
          uploadState === "idle"
            ? (lang === "th" ? "คลิกเพื่อทดสอบอัปโหลดวิดีโอ" : "Click to test video upload")
            : isUploading
            ? (lang === "th" ? "กำลังอัปโหลดวิดีโอ..." : "Uploading video...")
            : (lang === "th" ? "คลิกเพื่อรีเซ็ตกลับสู่หน้าอัปโหลด" : "Click to reset to pre-upload")
        }
        className="relative flex flex-col w-56 lg:w-60 xl:w-68 h-[76px] lg:h-[82px] xl:h-[88px] rounded-2xl bg-[#0e0c19] border border-white/[0.12] p-2 sm:p-2.5 shadow-[0_20px_45px_rgba(0,0,0,0.85)] transition-transform duration-200 hover:scale-[1.02] hover:border-white/[0.22] select-none group cursor-pointer justify-center overflow-hidden"
      >
        <div
          onClick={(e) => {
            if (showRenderModal) {
              e.stopPropagation();
              onCloseRenderModal();
            }
          }}
          className={`absolute inset-0 z-40 rounded-2xl bg-black/80 transition-opacity duration-200 ${
            showRenderModal ? "opacity-100 pointer-events-auto cursor-pointer" : "opacity-0 pointer-events-none"
          }`}
        />
        {uploadState === "idle" ? (
          <div key="preupload" className="h-full w-full rounded-xl border border-dashed border-white/20 bg-white/[0.02] group-hover:border-purple-400/30 group-hover:bg-purple-500/[0.04] p-2.5 flex items-center gap-3 transition-colors duration-200 anim-pop-contained">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/15 border border-purple-500/25 text-purple-300 flex-shrink-0 group-hover:bg-purple-500/25 group-hover:border-purple-400/35 transition-colors">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 16V4m0 0L8 8m4-4 4 4M5 20h14" />
              </svg>
            </div>
            <div className="min-w-0 flex-1 text-left">
              <p className="text-[12px] font-semibold text-white truncate tracking-tight group-hover:text-purple-200 transition-colors">
                {lang === "th" ? "เลือกคลิปวิดีโอเพื่อตัดต่อ" : "Select video to caption"}
              </p>
              <p className="text-[10px] text-white/50 font-mono mt-0.5">
                MP4 • {lang === "th" ? "ไม่เกิน 50 MB" : "up to 50 MB"}
              </p>
            </div>
          </div>
        ) : (
          <div key="uploaded" className="h-full w-full flex flex-col justify-between p-1 anim-pop-contained">
            <div className="flex items-center gap-2.5">
              <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/15 border border-purple-500/25 text-purple-300 flex-shrink-0">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="18" height="18" x="3" y="3" rx="2" />
                  <path d="m9 8 6 4-6 4Z" fill="currentColor" fillOpacity="0.4" />
                </svg>
                <span className={`absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-500 text-black text-[8px] font-black shadow-sm transition-transform duration-200 ${
                  uploadPercent === 100 ? "scale-100" : "scale-0"
                }`}>
                  ✓
                </span>
              </div>

              <div className="min-w-0 flex-1 text-left">
                <div className="flex items-center justify-between gap-1">
                  <p className="text-[12px] font-semibold text-white truncate tracking-tight group-hover:text-purple-200 transition-colors">
                    demo.mp4
                  </p>
                  <span className="text-[9.5px] font-mono font-semibold text-[#c4b5fd] bg-white/[0.05] border border-white/[0.08] px-1.5 py-0.2 rounded">
                    1080p
                  </span>
                </div>
                <p className="text-[10px] text-white/50 font-mono mt-0.5">
                  18.6 MB • {formatTimeStr(durationSec)} • 60fps
                </p>
              </div>
            </div>

            <div className="mt-1">
              {uploadPercent < 100 && (
                <div className="flex justify-between items-center text-[10px] text-gray-300 mb-1">
                  <span className="text-[10px] text-white/60">
                    {lang === "th" ? "กำลังอัปโหลด..." : "Uploading..."}
                  </span>
                  <span className="tabular-nums font-semibold text-[#c4b5fd] font-mono text-[10px]">
                    {uploadPercent}%
                  </span>
                </div>
              )}
              <div className="w-full h-1 bg-white/[0.08] rounded-full overflow-hidden">
                <div
                  style={{ width: `${uploadPercent}%` }}
                  className="h-full bg-gradient-to-r from-accent via-magenta to-emerald-400 rounded-full transition-[width] duration-200 ease-out"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

interface MiniPlayerCardProps {
  isPlaying: boolean;
  initialTimeLabel: string;
  durationSec: number;
  initialProgressScale: number;
  showRenderModal: boolean;
  lang: Lang;
  desktopTimeTextRef: React.RefObject<HTMLSpanElement | null>;
  desktopProgressFillRef: React.RefObject<HTMLDivElement | null>;
  onTogglePlay: () => void;
  onScrub: (e: React.MouseEvent<HTMLDivElement>) => void;
  onCloseRenderModal: () => void;
}

const MiniPlayerCard = React.memo(function MiniPlayerCard({
  isPlaying,
  initialTimeLabel,
  durationSec,
  initialProgressScale,
  showRenderModal,
  lang,
  desktopTimeTextRef,
  desktopProgressFillRef,
  onTogglePlay,
  onScrub,
  onCloseRenderModal,
}: MiniPlayerCardProps) {
  return (
    <div className="hidden md:block absolute -bottom-2 left-3 lg:-bottom-2.5 lg:left-4 xl:-bottom-3 xl:left-5 z-30 transform-gpu [backface-visibility:hidden]">
      <div className="relative overflow-hidden flex items-center gap-2.5 sm:gap-3 w-56 lg:w-60 xl:w-68 rounded-2xl bg-[#0e0c19] border border-white/[0.12] p-2 sm:p-2.5 shadow-[0_20px_45px_rgba(0,0,0,0.85)] transition-transform duration-200 hover:scale-[1.02] hover:border-white/[0.22] select-none group">
        <div
          onClick={(e) => {
            if (showRenderModal) {
              e.stopPropagation();
              onCloseRenderModal();
            }
          }}
          className={`absolute inset-0 z-40 rounded-2xl bg-black/80 transition-opacity duration-200 ${
            showRenderModal ? "opacity-100 pointer-events-auto cursor-pointer" : "opacity-0 pointer-events-none"
          }`}
        />
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onTogglePlay();
          }}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-[#7c3aed] to-[#6d28d9] hover:from-[#8b5cf6] hover:to-[#7c3aed] text-white active:scale-95 transition-transform shadow-md shadow-purple-900/40 flex-shrink-0 cursor-pointer border-0 outline-none"
          title={isPlaying ? (lang === "th" ? "หยุดชั่วคราว" : "Pause") : (lang === "th" ? "เล่น" : "Play")}
        >
          {isPlaying ? (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="4" width="4" height="16" rx="1" />
              <rect x="14" y="4" width="4" height="16" rx="1" />
            </svg>
          ) : (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" className="ml-0.5">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          )}
        </button>

        <div className="min-w-0 flex-1 flex flex-col justify-center gap-1.5">
          <div className="flex items-center justify-between gap-1">
            <p className="text-xs font-bold text-white truncate flex items-center gap-1.5">
              <span className={`h-1.5 w-1.5 rounded-full ${isPlaying ? "bg-emerald-400" : "bg-gray-500"}`} />
              {lang === "th" ? "เล่นวิดีโอตัวอย่าง" : "Live Video Playback"}
            </p>
            <span
              ref={desktopTimeTextRef}
              className="font-mono text-[10.5px] text-purple-300 font-semibold tabular-nums flex-shrink-0"
            >
              {initialTimeLabel} / {formatTimeStr(durationSec)}
            </span>
          </div>

          <div
            onClick={onScrub}
            className="group/scrub relative flex items-center h-2 cursor-pointer"
            title={lang === "th" ? "คลิกเพื่อเลื่อนเวลา" : "Click to scrub time"}
          >
            <div className="w-full h-1 group-hover/scrub:h-1.5 transition-[height] rounded-full bg-white/[0.1] overflow-hidden relative">
              <div
                ref={desktopProgressFillRef}
                className="h-full w-full origin-left bg-gradient-to-r from-accent via-magenta to-emerald-400 rounded-full will-change-transform"
                style={{ transform: `scaleX(${initialProgressScale.toFixed(4)})` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

interface StylesInspectorCardProps {
  fontSize: number;
  textColor: string;
  colorPresets: string[];
  showRenderModal: boolean;
  lang: Lang;
  fontSizeLabel: string;
  textColorLabel: string;
  onFontSizeChange: (size: number) => void;
  onTextColorChange: (color: string) => void;
  onCloseRenderModal: () => void;
}

const StylesInspectorCard = React.memo(function StylesInspectorCard({
  fontSize,
  textColor,
  colorPresets,
  showRenderModal,
  lang,
  fontSizeLabel,
  textColorLabel,
  onFontSizeChange,
  onTextColorChange,
  onCloseRenderModal,
}: StylesInspectorCardProps) {
  return (
    <div className="hidden md:block absolute -bottom-5 -right-2 lg:-bottom-7 lg:-right-3 xl:-bottom-10 xl:-right-5 z-30 transform-gpu [backface-visibility:hidden]">
      <div className="relative overflow-hidden flex flex-col w-52 lg:w-56 xl:w-62 rounded-2xl bg-[#0e0c19] border border-white/[0.12] p-2.5 sm:p-3 shadow-[0_20px_45px_rgba(0,0,0,0.85)] transition-transform duration-200 hover:scale-[1.02] hover:border-white/[0.22] select-none group">
        <div
          onClick={(e) => {
            if (showRenderModal) {
              e.stopPropagation();
              onCloseRenderModal();
            }
          }}
          className={`absolute inset-0 z-40 rounded-2xl bg-black/80 transition-opacity duration-200 ${
            showRenderModal ? "opacity-100 pointer-events-auto cursor-pointer" : "opacity-0 pointer-events-none"
          }`}
        />
        <div className="flex items-center pb-2 mb-2 border-b border-white/[0.06]">
          <div className="flex items-center gap-1.5">
            <span className="flex h-5 w-5 items-center justify-center rounded-lg bg-purple-500/15 text-purple-300">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
            </span>
            <span className="text-[11px] font-bold text-white tracking-tight">
              {lang === "th" ? "สไตล์" : "Styles"}
            </span>
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center text-xs font-medium text-white mb-1.5">
            <span className="text-gray-300 text-[10px] flex items-center gap-1">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-purple-400">
                <path d="M4 7V4h16v3M9 20h6M12 4v16" />
              </svg>
              {fontSizeLabel}
            </span>
            <span className="tabular-nums font-semibold text-[#c4b5fd] bg-white/[0.05] border border-white/[0.08] px-1.5 py-0.2 rounded text-[10px]">
              {fontSize}px
            </span>
          </div>
          <input
            type="range"
            min="32"
            max="100"
            value={fontSize}
            onChange={(e) => onFontSizeChange(Number(e.target.value))}
            className="w-full h-1 bg-[#1d1a2c] rounded-lg appearance-none accent-purple-400 cursor-pointer border-0 outline-none"
          />
        </div>

        <div className="mt-2.5 pt-2 border-t border-white/[0.06]">
          <div className="flex justify-between items-center text-xs font-medium text-white mb-1">
            <span className="text-gray-300 text-[10px] flex items-center gap-1">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-pink-400">
                <circle cx="12" cy="12" r="10" />
              </svg>
              {textColorLabel}
            </span>
            <span className="font-mono text-[9px] text-gray-400 bg-white/[0.05] border border-white/[0.08] px-1.5 py-0.2 rounded">
              {textColor.toUpperCase()}
            </span>
          </div>
          <div className="flex items-center justify-between gap-1 pt-0.5">
            {colorPresets.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => onTextColorChange(c)}
                style={{ backgroundColor: c }}
                className={`h-4 w-4 rounded-full transition-transform border border-black/50 ${
                  textColor.toLowerCase() === c.toLowerCase()
                    ? "ring-1.5 ring-purple-400 ring-offset-1 ring-offset-[#0e0c19] scale-110 shadow-sm"
                    : "opacity-80 hover:opacity-100"
                }`}
                title={c}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});

interface EditorHeaderProps {
  aspectRatio: AspectRatio;
  isRendering: boolean;
  renderProgress: number;
  renderBtnText: string;
  renderingText: string;
  onAspectRatioChange: (ratio: AspectRatio) => void;
  onRenderClick: () => void;
}

const EditorHeader = React.memo(function EditorHeader({
  aspectRatio,
  isRendering,
  renderProgress,
  renderBtnText,
  renderingText,
  onAspectRatioChange,
  onRenderClick,
}: EditorHeaderProps) {
  return (
    <header className="relative flex h-12 items-center justify-between border-b border-[#1c1a28] bg-[#0c0b11] px-2.5 sm:px-4 select-none z-20">
      <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
        <Link
          href="/editor"
          className="flex h-8 w-8 items-center justify-center rounded-xl text-gray-400 hover:bg-[#1c1a29] hover:text-white transition-colors active:scale-95 flex-shrink-0"
          title="กลับสู่หน้าวิดีโอ"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </Link>
      </div>

      <div className="absolute left-1/2 -translate-x-1/2 flex items-center">
        <div className="flex items-center gap-1 rounded-xl bg-[#141222] p-1 border border-white/[0.08] shadow-[inset_0_1px_3px_rgba(0,0,0,0.5)] select-none">
          {([
            { ratio: "9:16" as const, icon: "vertical" },
            { ratio: "16:9" as const, icon: "horizontal" },
            { ratio: "1:1" as const, icon: "square" },
          ]).map(({ ratio, icon }) => {
            const isActive = aspectRatio === ratio;
            return (
              <button
                key={ratio}
                type="button"
                onClick={() => onAspectRatioChange(ratio)}
                className={`group flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors duration-150 active:scale-95 outline-none focus:outline-none focus:ring-0 focus-visible:outline-none border ${
                  isActive
                    ? "bg-[#2d2250] text-[#e9d5ff] border-purple-500/40 shadow-sm shadow-purple-950/40"
                    : "border-transparent text-gray-400 hover:text-gray-200 hover:bg-white/[0.04]"
                }`}
              >
                {icon === "vertical" && (
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={isActive ? "text-[#c4b5fd]" : "text-gray-400 group-hover:text-gray-300"}>
                    <rect x="7" y="2" width="10" height="20" rx="2.5" fill="currentColor" fillOpacity={isActive ? 0.15 : 0} />
                  </svg>
                )}
                {icon === "horizontal" && (
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={isActive ? "text-[#c4b5fd]" : "text-gray-400 group-hover:text-gray-300"}>
                    <rect x="2" y="5" width="20" height="14" rx="2.5" fill="currentColor" fillOpacity={isActive ? 0.15 : 0} />
                  </svg>
                )}
                {icon === "square" && (
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={isActive ? "text-[#c4b5fd]" : "text-gray-400 group-hover:text-gray-300"}>
                    <rect x="4" y="4" width="16" height="16" rx="2.5" fill="currentColor" fillOpacity={isActive ? 0.15 : 0} />
                  </svg>
                )}
                <span>{ratio}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
        <button
          type="button"
          onClick={onRenderClick}
          disabled={isRendering}
          className={`relative overflow-hidden flex h-8 items-center gap-1.5 sm:gap-2 rounded-xl text-white px-3 sm:px-4 text-xs font-semibold transition-colors active:scale-95 border cursor-pointer ${
            isRendering
              ? "bg-[#282046] border-purple-500/40 text-purple-200 shadow-inner"
              : "bg-gradient-to-r from-[#8b5cf6] via-[#7c3aed] to-[#6d28d9] hover:from-[#9061f9] hover:to-[#7c3aed] border-purple-400/40 shadow-[0_1px_2px_rgba(0,0,0,0.5)] active:shadow-none"
          }`}
        >
          {isRendering ? (
            <>
              <svg className="animate-spin h-3.5 w-3.5 text-purple-300" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
              <span>{renderProgress < 100 ? `${renderingText} ${renderProgress}%` : renderingText}</span>
            </>
          ) : (
            <>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              <span>{renderBtnText}</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
});

interface MobileTransportBarProps {
  isPlaying: boolean;
  initialTimeLabel: string;
  durationSec: number;
  initialProgressScale: number;
  mobileTimeTextRef: React.RefObject<HTMLSpanElement | null>;
  mobileProgressFillRef: React.RefObject<HTMLDivElement | null>;
  onTogglePlay: () => void;
  onScrub: (e: React.MouseEvent<HTMLDivElement>) => void;
}

const MobileTransportBar = React.memo(function MobileTransportBar({
  isPlaying,
  initialTimeLabel,
  durationSec,
  initialProgressScale,
  mobileTimeTextRef,
  mobileProgressFillRef,
  onTogglePlay,
  onScrub,
}: MobileTransportBarProps) {
  return (
    <div className="border-t border-[#1c1a28] bg-[#0c0b11] px-4 sm:px-6 py-3 select-none flex-shrink-0 flex items-center gap-3.5 md:hidden">
      <button
        type="button"
        onClick={onTogglePlay}
        className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#7c3aed] hover:bg-[#6d28d9] text-white active:scale-95 transition-transform shadow-md shadow-purple-900/30 flex-shrink-0 border-0 outline-none focus:outline-none"
        title={isPlaying ? "หยุดชั่วคราว" : "เล่น"}
      >
        {isPlaying ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="4" width="4" height="16" rx="1" />
            <rect x="14" y="4" width="4" height="16" rx="1" />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="ml-0.5">
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
        )}
      </button>

      <div className="flex-1 flex flex-col justify-center gap-1.5 min-w-0">
        <div
          onClick={onScrub}
          className="group relative flex items-center h-3 cursor-pointer py-0.5"
        >
          <div className="w-full h-1.5 group-hover:h-2 transition-[height] rounded-full bg-[#1a1826] overflow-hidden relative">
            <div
              ref={mobileProgressFillRef}
              className="h-full w-full origin-left bg-[#7c3aed] rounded-full will-change-transform"
              style={{ transform: `scaleX(${initialProgressScale.toFixed(4)})` }}
            />
          </div>
        </div>

        <div className="flex items-center gap-1 font-mono text-xs text-gray-400">
          <span ref={mobileTimeTextRef} className="text-white font-semibold">
            {initialTimeLabel}
          </span>
          <span className="text-gray-500">/</span>
          <span>{formatTimeStr(durationSec)}</span>
        </div>
      </div>
    </div>
  );
});

interface StageWordProps {
  token: string;
  idx: number;
  isCurrent: boolean;
  isRevealed: boolean;
  shouldAnimateEnter: boolean;
  enterClass: string;
  isStaggerWave: boolean;
  isTyping: boolean;
  isShake: boolean;
  animation: AnimationMode;
  stylesCurrentWord: boolean;
  isWordBadgeActive: boolean;
  isHighlighterActive: boolean;
  textColor: string;
  badgeBgColor?: string;
  baseTextColor?: string;
  isGradientActive: boolean;
  gradientColors?: string;
  isFrostedActive: boolean;
  highlighterColor?: string;
  hasShadow: boolean;
  shadowColor?: string;
  shadowThickness: number;
  hasOutline: boolean;
  isBold: boolean;
  isKaraoke: boolean;
  selectedTemplateId: string;
  currentWordIndex: number;
}

const StageWord = React.memo(function StageWord({
  token,
  idx,
  isCurrent,
  isRevealed,
  shouldAnimateEnter,
  enterClass,
  isStaggerWave,
  isTyping,
  isShake,
  animation,
  stylesCurrentWord,
  isWordBadgeActive,
  isHighlighterActive,
  textColor,
  badgeBgColor,
  baseTextColor,
  isGradientActive,
  gradientColors,
  isFrostedActive,
  highlighterColor,
  hasShadow,
  shadowColor,
  shadowThickness,
  hasOutline,
  isBold,
  isKaraoke,
  selectedTemplateId,
  currentWordIndex,
}: StageWordProps) {
  const isGlow =
    isKaraoke ||
    (hasShadow && shadowColor === textColor && textColor !== "#ffffff");

  let tokenShadow: string | undefined = undefined;
  let tokenColor = baseTextColor || "#ffffff";
  let tokenBg: string | undefined = undefined;
  let tokenPadding: string | undefined = undefined;
  let tokenRadius: string | undefined = undefined;
  let tokenBoxShadow: string | undefined = undefined;
  let isTextGradient = false;

  if (isKaraoke) {
    if (idx > currentWordIndex) {
      tokenColor = "rgba(255, 255, 255, 0.32)";
      tokenShadow = "none";
    } else if (idx < currentWordIndex) {
      tokenColor = "#ffffff";
      tokenShadow = `0 0 6px ${hexToRgba(textColor, 0.4)}, 0 1px 2px rgba(0, 0, 0, 0.8)`;
    } else {
      tokenColor = textColor || "#22d3ee";
      tokenShadow = `0 0 14px ${textColor}, 0 0 28px ${hexToRgba(textColor, 0.95)}, 0 2px 4px #000000`;
    }
  } else if (isWordBadgeActive) {
    if (isCurrent) {
      const activeBadgeBg = selectedTemplateId === "mrbeast-badge" ? textColor : (badgeBgColor || textColor || "#22c55e");
      tokenColor = getContrastTextColor(activeBadgeBg);
      tokenBg = activeBadgeBg;
      tokenPadding = "2px 8px";
      tokenRadius = "8px";
      tokenBoxShadow = `0 3px 14px ${hexToRgba(activeBadgeBg, 0.55)}, 0 2px 0 #000000`;
      tokenShadow = "none";
    } else {
      tokenColor = baseTextColor || "#ffffff";
      tokenShadow = "0 4px 0 #000000, -1px -1px 0 #000000, 1px -1px 0 #000000, -1px 1px 0 #000000, 1px 1px 0 #000000";
      tokenPadding = "2px 0";
    }
  } else if (selectedTemplateId === "danger-hook" || isShake) {
    if (isCurrent) {
      tokenColor = textColor || "#ef4444";
      tokenShadow = `0 0 12px ${hexToRgba(textColor, 0.85)}, 0 4px 0 #000000, -1px -1px 0 #000000, 1px -1px 0 #000000, -1px 1px 0 #000000, 1px 1px 0 #000000`;
    } else {
      tokenColor = baseTextColor || "#ffffff";
      tokenShadow = "0 3px 0 #000000, -1px -1px 0 #000000, 1px -1px 0 #000000, -1px 1px 0 #000000, 1px 1px 0 #000000";
    }
  } else if (isGradientActive) {
    if (isCurrent) {
      isTextGradient = true;
      tokenBg = gradientColors || "linear-gradient(135deg, #c084fc 0%, #f43f5e 100%)";
      tokenColor = "transparent";
      tokenShadow = "none";
    } else {
      tokenColor = "#ffffff";
      tokenShadow = "0 4px 0 #000000, -1px -1px 0 #000000, 1px -1px 0 #000000, -1px 1px 0 #000000, 1px 1px 0 #000000";
    }
  } else if (isHighlighterActive) {
    if (isCurrent) {
      tokenColor = "#0f172a";
      tokenBg = highlighterColor || "#fef08a";
      tokenPadding = "2px 8px";
      tokenRadius = "6px";
      tokenBoxShadow = "0 2px 10px rgba(254, 240, 138, 0.6), 0 1px 2px rgba(0,0,0,0.4)";
      tokenShadow = "none";
    } else {
      tokenColor = baseTextColor || "#ffffff";
      tokenShadow = "0 3px 0 #000000, -1px -1px 0 #000000, 1px -1px 0 #000000, -1px 1px 0 #000000, 1px 1px 0 #000000";
      tokenPadding = "2px 0";
    }
  } else if (isFrostedActive) {
    if (isCurrent) {
      tokenColor = textColor || "#fde047";
      tokenShadow = `0 0 14px ${hexToRgba(textColor, 0.85)}, 0 1px 2px rgba(0,0,0,0.8)`;
    } else {
      tokenColor = "#ffffff";
      tokenShadow = "0 1px 3px rgba(0,0,0,0.6)";
    }
  } else if (isGlow) {
    tokenShadow = (stylesCurrentWord ? isCurrent : true)
      ? `0 0 14px ${textColor}, 0 0 24px ${hexToRgba(textColor, 0.6)}, 0 2px 4px #000000`
      : "0 2px 4px rgba(0, 0, 0, 0.8)";
    tokenColor = stylesCurrentWord ? (isCurrent ? textColor : (baseTextColor || "#ffffff")) : textColor;
  } else if (hasOutline && hasShadow) {
    tokenShadow = `0 ${shadowThickness}px 0 ${shadowColor}, -1px -1px 0 ${shadowColor}, 1px -1px 0 ${shadowColor}, -1px 1px 0 ${shadowColor}, 1px 1px 0 ${shadowColor}`;
    tokenColor = stylesCurrentWord ? (isCurrent ? textColor : (baseTextColor || "#ffffff")) : textColor;
  } else if (hasOutline) {
    tokenShadow = `-1.5px -1.5px 0 ${shadowColor}, 1.5px -1.5px 0 ${shadowColor}, -1.5px 1.5px 0 ${shadowColor}, 1.5px 1.5px 0 ${shadowColor}`;
    tokenColor = stylesCurrentWord ? (isCurrent ? textColor : (baseTextColor || "#ffffff")) : textColor;
  } else if (hasShadow) {
    tokenShadow = `0 ${shadowThickness}px ${shadowThickness * 2}px ${shadowColor}`;
    tokenColor = stylesCurrentWord ? (isCurrent ? textColor : (baseTextColor || "#ffffff")) : textColor;
  } else {
    tokenColor = stylesCurrentWord ? (isCurrent ? textColor : (baseTextColor || "#ffffff")) : textColor;
  }

  const isWordActive = stylesCurrentWord && isCurrent;

  return (
    <span
      className={`relative inline-block ${
        isRevealed
          ? shouldAnimateEnter
            ? enterClass
            : ""
          : "opacity-0 pointer-events-none"
      }`}
      style={
        shouldAnimateEnter && isStaggerWave && !isTyping
          ? { animationDelay: `${idx * 65}ms` }
          : undefined
      }
    >
      <span
        className="cap-word"
        data-anim={isShake ? "shake" : stylesCurrentWord ? animation : undefined}
        data-badge={(isWordBadgeActive || isHighlighterActive) && isCurrent ? "true" : undefined}
        data-active={isWordActive}
        style={{
          color: tokenColor,
          background: tokenBg,
          WebkitBackgroundClip: isTextGradient ? "text" : undefined,
          WebkitTextFillColor: isTextGradient ? "transparent" : undefined,
          padding: tokenPadding,
          borderRadius: tokenRadius,
          boxShadow: tokenBoxShadow,
          textShadow: tokenShadow,
          fontWeight: (stylesCurrentWord && isCurrent) ? 900 : isBold ? 850 : 500,
        }}
      >
        {token}
      </span>
      {isTyping && isCurrent && (
        <span className="cap-caret" style={{ backgroundColor: textColor }} aria-hidden />
      )}
    </span>
  );
});

