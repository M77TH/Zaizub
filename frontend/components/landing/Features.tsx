"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { featuresCopy, type Lang } from "./copy";

// ============================================================================
// ULTRA-FAST GPU 3D TILT HOOK (Zero React Re-renders on Pointer Move)
// Uses requestAnimationFrame + direct DOM style mutation for 120fps smoothness
// ============================================================================
export const FeatureCardHoverContext = React.createContext<boolean>(false);

function useFast3DTilt(baseRotX = 0, baseRotY = 0, maxTilt = 2.5) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const tickRef = useRef<() => void>(() => {});
  const rectRef = useRef<DOMRect | null>(null);

  const stateRef = useRef({
    targetX: 0,
    targetY: 0,
    currentX: 0,
    currentY: 0,
    targetZ: 0,
    currentZ: 0,
    rafId: 0 as number,
    isHovered: false,
  });

  const tick = useCallback(() => {
    const s = stateRef.current;
    const ease = 0.12;

    s.currentX += (s.targetX - s.currentX) * ease;
    s.currentY += (s.targetY - s.currentY) * ease;
    s.currentZ += (s.targetZ - s.currentZ) * ease;

    if (stageRef.current) {
      const rx = baseRotX - s.currentY * maxTilt;
      const ry = baseRotY + s.currentX * maxTilt;
      const tz = s.currentZ;
      stageRef.current.style.transform = `rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) translateZ(${tz.toFixed(1)}px)`;
    }

    if (glowRef.current) {
      const gx = 28 + (s.currentX + 1) * 10;
      const gy = 24 + (s.currentY + 1) * 8;
      glowRef.current.style.background = `radial-gradient(80% 75% at ${gx.toFixed(1)}% ${gy.toFixed(1)}%, rgba(139, 92, 246, ${s.isHovered ? "0.20" : "0.14"}) 0%, rgba(76, 29, 149, 0.04) 55%, #0b0916 100%)`;
    }

    const stillMoving =
      Math.abs(s.targetX - s.currentX) > 0.002 ||
      Math.abs(s.targetY - s.currentY) > 0.002 ||
      Math.abs(s.targetZ - s.currentZ) > 0.02;

    if (stillMoving) {
      s.rafId = requestAnimationFrame(tickRef.current);
    } else {
      s.rafId = 0;
    }
  }, [baseRotX, baseRotY, maxTilt]);

  useEffect(() => {
    tickRef.current = tick;
  }, [tick]);

  const startLoop = useCallback(() => {
    if (!stateRef.current.rafId) {
      stateRef.current.rafId = requestAnimationFrame(tickRef.current);
    }
  }, []);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const el = containerRef.current;
      if (!el) return;
      const rect = rectRef.current || (rectRef.current = el.getBoundingClientRect());
      if (rect.width === 0 || rect.height === 0) return;

      const nx = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      const ny = ((e.clientY - rect.top) / rect.height - 0.5) * 2;

      stateRef.current.targetX = Math.max(-1, Math.min(1, nx));
      stateRef.current.targetY = Math.max(-1, Math.min(1, ny));
      stateRef.current.targetZ = 2.5;
      stateRef.current.isHovered = true;
      startLoop();
    },
    [startLoop]
  );

  const handlePointerEnter = useCallback(() => {
    if (containerRef.current) {
      rectRef.current = containerRef.current.getBoundingClientRect();
    }
    stateRef.current.isHovered = true;
    stateRef.current.targetZ = 2.5;
    startLoop();
  }, [startLoop]);

  const handlePointerLeave = useCallback(() => {
    rectRef.current = null;
    stateRef.current.isHovered = false;
    stateRef.current.targetX = 0;
    stateRef.current.targetY = 0;
    stateRef.current.targetZ = 0;
    startLoop();
  }, [startLoop]);

  useEffect(() => {
    const s = stateRef.current;
    return () => {
      if (s.rafId) cancelAnimationFrame(s.rafId);
    };
  }, []);

  const initialTransform = `rotateX(${baseRotX}deg) rotateY(${baseRotY}deg) translateZ(0px)`;

  return {
    containerRef,
    stageRef,
    glowRef,
    initialTransform,
    handlePointerMove,
    handlePointerEnter,
    handlePointerLeave,
  };
}

// Helper to generate a mathematically exact isometric rounded rhombus path
function isoRhombusPath(cx: number, cy: number, rx: number, ry: number, t = 0.14) {
  const xL = cx - rx;
  const xR = cx + rx;
  const yT = cy - ry;
  const yB = cy + ry;

  return [
    `M ${(cx - rx * t).toFixed(2)} ${(yT + ry * t).toFixed(2)}`,
    `Q ${cx} ${yT} ${(cx + rx * t).toFixed(2)} ${(yT + ry * t).toFixed(2)}`,
    `L ${(xR - rx * t).toFixed(2)} ${(cy - ry * t).toFixed(2)}`,
    `Q ${xR} ${cy} ${(xR - rx * t).toFixed(2)} ${(cy + ry * t).toFixed(2)}`,
    `L ${(cx + rx * t).toFixed(2)} ${(yB - ry * t).toFixed(2)}`,
    `Q ${cx} ${yB} ${(cx - rx * t).toFixed(2)} ${(yB - ry * t).toFixed(2)}`,
    `L ${(xL + rx * t).toFixed(2)} ${(cy + ry * t).toFixed(2)}`,
    `Q ${xL} ${cy} ${(xL + rx * t).toFixed(2)} ${(cy - ry * t).toFixed(2)}`,
    "Z",
  ].join(" ");
}

// ============================================================================
// 1. DROP & AUTO-TRANSCRIBE (Clean Obsidian & Violet Isometric 3-Layer Upload Box)
// ============================================================================
function UploadTranscribeGraphic() {
  const [activePulse, setActivePulse] = useState(false);

  // Centered Isometric Rhombus dimensions (2:1 projection ratio)
  const cx = 218;
  const rx = 126;
  const ry = 64;

  // 3 stacked plates Y centers (centered vertically in the stage)
  const yBottom = 138;
  const yMid = 122;
  const yTop = 106;

  return (
    <div
      onClick={() => setActivePulse((p) => !p)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setActivePulse((p) => !p);
        }
      }}
      className="relative w-full h-full flex items-center justify-center select-none cursor-pointer [transform-style:preserve-3d] group/iso1"
      title="Click to interact with 3D upload stack"
    >
      {/* PLANE 0 (Z: 2px) — Subtle Isometric Grid & Bottom Obsidian Glass Plate */}
      <svg
        className="w-[370px] sm:w-[400px] xl:w-[430px] h-auto max-h-full overflow-visible pointer-events-none"
        viewBox="0 0 436 225"
        fill="none"
        style={{ transform: "translateZ(2px)" }}
      >
        <defs>
          {/* Ambient Violet Floor Glow */}
          <radialGradient id="iso1FloorGlow" cx="50%" cy="54%" r="44%">
            <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.22" />
            <stop offset="60%" stopColor="#6d28d9" stopOpacity="0.06" />
            <stop offset="100%" stopColor="#07060a" stopOpacity="0" />
          </radialGradient>

          {/* Bottom Plate Obsidian Fill & Hairline Rim */}
          <linearGradient id="iso1BotFill" x1="92" y1="74" x2="344" y2="202" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#141122" stopOpacity="0.90" />
            <stop offset="50%" stopColor="#0e0c19" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#161226" stopOpacity="0.90" />
          </linearGradient>
          <linearGradient id="iso1BotStroke" x1="92" y1="138" x2="344" y2="202" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.10" />
            <stop offset="50%" stopColor="#8b5cf6" stopOpacity="0.42" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.10" />
          </linearGradient>
        </defs>

        {/* Soft Ambient Glow beneath stack */}
        <ellipse cx={cx} cy={142} rx={155} ry={74} fill="url(#iso1FloorGlow)" />

        {/* Subtle Hairline Isometric Floor Grid */}
        <g stroke="rgba(255, 255, 255, 0.05)" strokeWidth="1">
          <line x1="58" y1="162" x2="298" y2="42" />
          <line x1="88" y1="177" x2="328" y2="57" />
          <line x1="118" y1="192" x2="358" y2="72" />
          <line x1="148" y1="207" x2="388" y2="87" />

          <line x1="378" y1="162" x2="138" y2="42" />
          <line x1="348" y1="177" x2="108" y2="57" />
          <line x1="318" y1="192" x2="78" y2="72" />
          <line x1="288" y1="207" x2="48" y2="87" />
        </g>

        {/* Deep Shadow under Bottom Plate */}
        <path
          d={isoRhombusPath(cx, yBottom + 8, rx * 0.98, ry * 0.98, 0.14)}
          fill="rgba(2, 1, 6, 0.85)"
        />

        {/* LAYER 1: Bottom Obsidian Glass Plate */}
        <path
          d={isoRhombusPath(cx, yBottom + 2.5, rx, ry, 0.14)}
          fill="rgba(14, 12, 25, 0.9)"
          stroke="rgba(139, 92, 246, 0.22)"
          strokeWidth="1"
        />
        <path
          d={isoRhombusPath(cx, yBottom, rx, ry, 0.14)}
          fill="url(#iso1BotFill)"
          stroke="url(#iso1BotStroke)"
          strokeWidth="1.3"
        />
      </svg>

      {/* PLANE 1 (Z: 14px) — Middle Translucent Violet-Obsidian Glass Plate */}
      <svg
        className="pointer-events-none absolute w-[370px] sm:w-[400px] xl:w-[430px] h-auto max-h-full overflow-visible transition-transform duration-500 ease-out"
        viewBox="0 0 436 225"
        fill="none"
        style={{
          transform: `translateZ(${activePulse ? "20px" : "14px"})`,
        }}
      >
        <defs>
          <linearGradient id="iso1MidFill" x1="92" y1="58" x2="344" y2="186" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#1b1630" stopOpacity="0.72" />
            <stop offset="50%" stopColor="#120f20" stopOpacity="0.82" />
            <stop offset="100%" stopColor="#1e1836" stopOpacity="0.75" />
          </linearGradient>
          <linearGradient id="iso1MidStroke" x1="92" y1="122" x2="344" y2="186" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.35" />
            <stop offset="50%" stopColor="#c4b5fd" stopOpacity="0.65" />
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.35" />
          </linearGradient>
        </defs>

        {/* Glass Thickness Rim */}
        <path
          d={isoRhombusPath(cx, yMid + 2.5, rx, ry, 0.14)}
          fill="rgba(109, 40, 217, 0.14)"
          stroke="rgba(167, 139, 250, 0.25)"
          strokeWidth="1"
        />
        {/* Main Middle Plate */}
        <path
          d={isoRhombusPath(cx, yMid, rx, ry, 0.14)}
          fill="url(#iso1MidFill)"
          stroke="url(#iso1MidStroke)"
          strokeWidth="1.4"
        />
      </svg>

      {/* PLANE 2 (Z: 28px) — Top Frosted Dark-Glass Plate + Dashed Dropzone + 3D Upload Icon */}
      <svg
        className="pointer-events-none absolute w-[370px] sm:w-[400px] xl:w-[430px] h-auto max-h-full overflow-visible transition-transform duration-500 ease-out"
        viewBox="0 0 436 225"
        fill="none"
        style={{
          transform: `translateZ(${activePulse ? "38px" : "28px"})`,
        }}
      >
        <defs>
          <radialGradient id="iso1TopCenterGlow" cx="50%" cy="50%" r="54%">
            <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.28" />
            <stop offset="48%" stopColor="#1f1938" stopOpacity="0.68" />
            <stop offset="100%" stopColor="#120f22" stopOpacity="0.85" />
          </radialGradient>
          <linearGradient id="iso1TopStroke" x1="92" y1="42" x2="344" y2="170" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.22" />
            <stop offset="50%" stopColor="#ddd6fe" stopOpacity="0.80" />
            <stop offset="100%" stopColor="#a78bfa" stopOpacity="0.38" />
          </linearGradient>
          <filter id="iso1NeonGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Top Plate 3px Glass Thickness Edge */}
        <path
          d={isoRhombusPath(cx, yTop + 3, rx, ry, 0.14)}
          fill="rgba(109, 40, 217, 0.20)"
          stroke="rgba(167, 139, 250, 0.35)"
          strokeWidth="1.2"
        />

        {/* Top Frosted Glass Rhombus */}
        <path
          d={isoRhombusPath(cx, yTop, rx, ry, 0.14)}
          fill="url(#iso1TopCenterGlow)"
          stroke="url(#iso1TopStroke)"
          strokeWidth="1.5"
        />

        {/* Ghosted Lower Reflection of Inner Dashed Dropzone */}
        <path
          d={isoRhombusPath(cx, yTop + 5.5, 68, 35, 0.16)}
          stroke="rgba(167, 139, 250, 0.22)"
          strokeWidth="1.2"
          strokeDasharray="3 3.5"
        />

        {/* Primary Inner Dashed Dropzone Rhombus */}
        <path
          d={isoRhombusPath(cx, yTop, 68, 35, 0.16)}
          fill="rgba(139, 92, 246, 0.10)"
          stroke="rgba(255, 255, 255, 0.55)"
          strokeWidth="1.4"
          strokeDasharray="3 3.5"
        />

        {/* 3D Isometric Upload Arrow Icon (Foreshortened onto isometric plane) */}
        {/* Extruded 3D Violet Shadow Layer (+4px Y) */}
        <g
          transform={`translate(${cx}, ${yTop + 4}) scale(1, 0.52) rotate(-45)`}
          opacity="0.80"
        >
          <path
            d="M 0 12 V -14 M -11 -3 L 0 -14 L 11 -3"
            stroke="#7c3aed"
            strokeWidth="5.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M -18 6 V 16 C -18 18.5 -16 20.5 -13.5 20.5 H 13.5 C 16 20.5 18 18.5 18 16 V 6"
            stroke="#7c3aed"
            strokeWidth="5.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>

        {/* Crisp Glowing Top White-Lavender Upload Arrow */}
        <g
          transform={`translate(${cx}, ${yTop}) scale(1, 0.52) rotate(-45)`}
          filter="url(#iso1NeonGlow)"
        >
          <path
            d="M 0 12 V -14 M -11 -3 L 0 -14 L 11 -3"
            stroke="#ffffff"
            strokeWidth="4.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M -18 6 V 16 C -18 18.5 -16 20.5 -13.5 20.5 H 13.5 C 16 20.5 18 18.5 18 16 V 6"
            stroke="#f5f3ff"
            strokeWidth="4.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      </svg>
    </div>
  );
}

// ============================================================================
// 2. CARD-BY-CARD SUBTITLE EDITOR
// Exact 2:1 Isometric perspective (rotateX 60deg rotateZ -45deg) matching Card 1,
// same background cross-grid & chevrons, sharp corners, tall caption card size
// ============================================================================
interface DemoCardTemplate {
  id: number;
  headerWidth: string;
  wordWidths: [string, string, string];
}

const CARD_TEMPLATES: DemoCardTemplate[] = [
  { id: 0, headerWidth: "w-16", wordWidths: ["w-14", "w-22", "w-16"] },
  { id: 1, headerWidth: "w-20", wordWidths: ["w-18", "w-16", "w-24"] },
  { id: 2, headerWidth: "w-14", wordWidths: ["w-12", "w-28", "w-16"] },
  { id: 3, headerWidth: "w-18", wordWidths: ["w-22", "w-16", "w-20"] },
  { id: 4, headerWidth: "w-16", wordWidths: ["w-16", "w-24", "w-14"] },
  { id: 5, headerWidth: "w-20", wordWidths: ["w-18", "w-18", "w-20"] },
];

interface ConveyorItem {
  uid: number;
  template: DemoCardTemplate;
}

const SLOT_STYLES: Array<{
  y: number;
  z: number;
  scale: number;
  opacity: number;
}> = [
  { y: -76, z: 0, scale: 0.95, opacity: 0 },    // Slot 0: Exiting above frame
  { y: 0, z: 4, scale: 0.98, opacity: 0.50 },   // Slot 1: 1st visible card (top-left)
  { y: 76, z: 22, scale: 1.03, opacity: 1 },    // Slot 2: 2ND VISIBLE CARD (Highlighted Active!)
  { y: 152, z: 8, scale: 0.98, opacity: 0.72 }, // Slot 3: 3rd visible card
  { y: 228, z: 2, scale: 0.96, opacity: 0.38 }, // Slot 4: 4th visible card (bottom-right)
  { y: 304, z: 0, scale: 0.93, opacity: 0 },    // Slot 5: Entering below frame
];

function SubtitleEditorGraphic() {
  const rootRef = useRef<HTMLDivElement>(null);
  const isCardHovered = React.useContext(FeatureCardHoverContext);
  const [isSelfHovered, setIsSelfHovered] = useState(false);
  const isHovered = isCardHovered || isSelfHovered;

  const [isInView, setIsInView] = useState(false);
  const nextUidRef = useRef(6);
  const [items, setItems] = useState<ConveyorItem[]>(() =>
    CARD_TEMPLATES.slice(0, 6).map((template, idx) => ({
      uid: idx,
      template,
    }))
  );
  const [activeTokenIdx, setActiveTokenIdx] = useState(1);

  useEffect(() => {
    const el = rootRef.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setIsInView(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        setIsInView(Boolean(entries[0]?.isIntersecting));
      },
      { rootMargin: "150px 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const advanceConveyor = useCallback(() => {
    setItems((prev) => {
      const nextUid = nextUidRef.current++;
      const nextTemplate = CARD_TEMPLATES[nextUid % CARD_TEMPLATES.length];
      return [...prev.slice(1), { uid: nextUid, template: nextTemplate }];
    });
    setActiveTokenIdx(0);
  }, []);

  // Step the highlighted word squircle inside the 2nd card, then scroll the list up ONLY when hovered
  useEffect(() => {
    if (!isInView || !isHovered) return;

    const tokenTimer = window.setInterval(() => {
      setActiveTokenIdx((prev) => (prev < 2 ? prev + 1 : prev));
    }, 480);

    const scrollTimer = window.setInterval(() => {
      advanceConveyor();
    }, 1750);

    return () => {
      window.clearInterval(tokenTimer);
      window.clearInterval(scrollTimer);
    };
  }, [advanceConveyor, isInView, isHovered]);

  return (
    <div
      ref={rootRef}
      onPointerEnter={() => setIsSelfHovered(true)}
      onPointerLeave={() => setIsSelfHovered(false)}
      onClick={advanceConveyor}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          advanceConveyor();
        }
      }}
      className="relative w-full h-full flex items-center justify-center select-none cursor-pointer [transform-style:preserve-3d] group/iso2"
      title="Click to advance caption card list"
    >
      {/* PLANE 0 (Z: -80px) — Identical 2:1 Isometric Floor Cross-Grid & Ambient Violet Glow (Behind conveyor) */}
      <svg
        className="pointer-events-none absolute w-[440px] sm:w-[490px] xl:w-[540px] h-auto max-h-full overflow-visible -translate-y-2.5 sm:-translate-y-3"
        viewBox="0 0 540 230"
        fill="none"
        style={{ transform: "translateZ(-80px)" }}
      >
        <defs>
          {/* Ambient Violet Floor Glow */}
          <radialGradient id="iso2FloorGlow" cx="50%" cy="52%" r="48%">
            <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.22" />
            <stop offset="60%" stopColor="#6d28d9" stopOpacity="0.06" />
            <stop offset="100%" stopColor="#07060a" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Soft Ambient Glow beneath conveyor */}
        <ellipse cx="270" cy="115" rx="210" ry="90" fill="url(#iso2FloorGlow)" />

        {/* Subtle Hairline Isometric Floor Grid */}
        <g stroke="rgba(255, 255, 255, 0.05)" strokeWidth="1">
          <line x1="55" y1="148" x2="335" y2="8" />
          <line x1="85" y1="163" x2="365" y2="23" />
          <line x1="115" y1="178" x2="395" y2="38" />
          <line x1="145" y1="193" x2="425" y2="53" />
          <line x1="175" y1="208" x2="455" y2="68" />
          <line x1="205" y1="223" x2="485" y2="83" />

          <line x1="485" y1="148" x2="205" y2="8" />
          <line x1="455" y1="163" x2="175" y2="23" />
          <line x1="425" y1="178" x2="145" y2="38" />
          <line x1="395" y1="193" x2="115" y2="53" />
          <line x1="365" y1="208" x2="85" y2="68" />
          <line x1="335" y1="223" x2="55" y2="83" />
        </g>
      </svg>

      {/* True 2:1 Isometric Plane (Elevated in Z, calibrated width, perfectly centered with no clipping) */}
      <div
        className="relative w-[280px] sm:w-[305px] xl:w-[325px] h-[290px] [transform-style:preserve-3d] -translate-y-2.5 sm:-translate-y-3"
        style={{
          transform: "translateZ(40px) rotateX(60deg) rotateZ(-45deg)",
        }}
      >
        {/* Masked Viewport Frame so top exiting card & bottom entering card fade smoothly */}
        <div className="relative w-full h-full [transform-style:preserve-3d] [mask-image:linear-gradient(to_bottom,transparent_0%,black_9%,black_89%,transparent_100%)]">
          {items.map((item, slotIdx) => {
            const slot = SLOT_STYLES[slotIdx] || SLOT_STYLES[5];
            const isSecondCard = slotIdx === 2;

            return (
              <div
                key={item.uid}
                className={`absolute inset-x-1 h-[64px] sm:h-[66px] rounded-[7px] border px-3.5 flex items-center justify-between gap-3 will-change-transform transition-all duration-600 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                  isSecondCard
                    ? "border-purple-300/80 bg-gradient-to-r from-[#231a42]/95 via-[#181330]/95 to-[#140f28]/95"
                    : "border-white/[0.12] bg-[#100d1e]/92"
                }`}
                style={{
                  transform: `translate3d(0px, ${slot.y}px, ${slot.z}px) scale(${slot.scale})`,
                  opacity: slot.opacity,
                  boxShadow: isSecondCard
                    ? "-3px 3px 0px rgba(139, 92, 246, 0.55), -12px 12px 28px rgba(0, 0, 0, 0.92), 0 0 24px rgba(139, 92, 246, 0.30), inset 0 1px 0 rgba(255, 255, 255, 0.30)"
                    : "-2.5px 2.5px 0px rgba(139, 92, 246, 0.18), -8px 8px 18px rgba(0, 0, 0, 0.80), inset 0 1px 0 rgba(255, 255, 255, 0.08)",
                }}
              >
                {/* Left: Sharp-Cornered Tall Squircle Badge + Inner Circle */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div
                    className={`h-10 w-10 rounded-[5px] shrink-0 flex items-center justify-center border transition-colors duration-500 ${
                      isSecondCard
                        ? "border-purple-300/70 bg-purple-500/25 shadow-[0_0_14px_rgba(139,92,246,0.45)]"
                        : "border-white/[0.10] bg-white/[0.035]"
                    }`}
                  >
                    <span
                      className={`rounded-full transition-all duration-500 ${
                        isSecondCard
                          ? "h-3.5 w-3.5 bg-purple-200 shadow-[0_0_10px_#ddd6fe]"
                          : "h-2.5 w-2.5 bg-white/25"
                      }`}
                    />
                  </div>

                  {/* Middle: Taller, Sharp-Cornered Demo Info Bars */}
                  <div className="flex flex-col gap-2 min-w-0 flex-1">
                    {/* Top Metadata Row */}
                    <div className="flex items-center gap-2">
                      <span
                        className={`h-2 w-2 rounded-full transition-colors duration-500 ${
                          isSecondCard ? "bg-purple-400" : "bg-white/20"
                        }`}
                      />
                      <span
                        className={`h-2 ${item.template.headerWidth} rounded-[2.5px] transition-colors duration-500 ${
                          isSecondCard ? "bg-purple-200/60" : "bg-white/16"
                        }`}
                      />
                    </div>

                    {/* Bottom Caption Word Shapes */}
                    <div className="flex items-center gap-2">
                      {item.template.wordWidths.map((wClass, wIdx) => {
                        const isWordHighlighted = isSecondCard && wIdx === activeTokenIdx;
                        return (
                          <span
                            key={wIdx}
                            className={`h-3.5 ${wClass} rounded-[3px] transition-all duration-300 ${
                              isWordHighlighted
                                ? "bg-gradient-to-r from-[#c4b5fd] via-[#a78bfa] to-[#8b5cf6] shadow-[0_0_12px_rgba(167,139,250,0.8)] scale-y-110"
                                : isSecondCard
                                ? "bg-white/45"
                                : "bg-white/18"
                            }`}
                          />
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Right: Sharp-Cornered Timestamp Box */}
                <div
                  className={`h-7 w-11 rounded-[4px] border shrink-0 flex items-center justify-center transition-colors duration-500 ${
                    isSecondCard
                      ? "border-purple-300/50 bg-purple-500/20"
                      : "border-white/[0.08] bg-white/[0.03]"
                  }`}
                >
                  <span
                    className={`h-1.5 w-5 rounded-[2px] ${
                      isSecondCard ? "bg-purple-200/85" : "bg-white/22"
                    }`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 3. 95% TRANSCRIBE ACCURACY
// Exact 2:1 Isometric Frosted Glass Deck with 2x2 Tiles (95%, EN, TH, Waveform)
// Matches Card 1 & Card 2 glass material, cross-grid, chevrons & wireframe style
// ============================================================================
type KeyId = "95" | "en" | "th" | "icon";

function TranscribeAccuracyGraphic({ lang = "en" }: { lang?: Lang }) {
  const [activeKey, setActiveKey] = useState<KeyId>("95");

  // 2x2 Isometric Glass Tiles (Painter's order: North -> West & East -> South)
  const keys: Array<{
    id: KeyId;
    cx: number;
    cy: number;
  }> = [
    { id: "95", cx: 160, cy: 65 },
    { id: "en", cx: 120, cy: 85 },
    { id: "th", cx: 200, cy: 85 },
    { id: "icon", cx: 160, cy: 105 },
  ];

  const rxTile = 34;
  const ryTile = 17;

  return (
    <div
      aria-label={lang === "en" ? "95% Transcribe Accuracy (EN / TH)" : "ความแม่นยำถอดเสียง 95% (EN / TH)"}
      className="relative w-full h-full flex items-center justify-center select-none [transform-style:preserve-3d] group/iso3"
    >
      {/* PLANE 0 (Z: 2px) — Identical 2:1 Isometric Cross-Grid & Base Glass Plate */}
      <svg
        className="pointer-events-none absolute w-[295px] sm:w-[320px] xl:w-[340px] h-auto max-h-full overflow-visible"
        viewBox="0 0 320 185"
        fill="none"
        style={{ transform: "translateZ(2px)" }}
      >
        <defs>
          <radialGradient id="iso3FloorGlow" cx="50%" cy="52%" r="46%">
            <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.22" />
            <stop offset="60%" stopColor="#6d28d9" stopOpacity="0.06" />
            <stop offset="100%" stopColor="#07060a" stopOpacity="0" />
          </radialGradient>

          <linearGradient id="iso3BaseFill" x1="62" y1="45" x2="258" y2="143" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#1b1630" stopOpacity="0.82" />
            <stop offset="50%" stopColor="#110e1f" stopOpacity="0.92" />
            <stop offset="100%" stopColor="#161228" stopOpacity="0.88" />
          </linearGradient>
          <linearGradient id="iso3BaseStroke" x1="62" y1="45" x2="258" y2="143" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.18" />
            <stop offset="50%" stopColor="#a78bfa" stopOpacity="0.52" />
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.24" />
          </linearGradient>
        </defs>

        {/* Ambient Violet Floor Glow */}
        <ellipse cx="160" cy="96" rx="138" ry="66" fill="url(#iso3FloorGlow)" />

        {/* Identical 2:1 Isometric Floor Cross-Grid as Card 1 & Card 2 */}
        <g stroke="rgba(255, 255, 255, 0.05)" strokeWidth="1">
          <line x1="36" y1="138" x2="216" y2="48" />
          <line x1="64" y1="152" x2="244" y2="62" />
          <line x1="92" y1="166" x2="272" y2="76" />
          <line x1="120" y1="180" x2="300" y2="90" />

          <line x1="284" y1="138" x2="104" y2="48" />
          <line x1="256" y1="152" x2="76" y2="62" />
          <line x1="228" y1="166" x2="48" y2="76" />
          <line x1="200" y1="180" x2="20" y2="90" />
        </g>

        {/* Deep Shadow under Lower Obsidian Glass Plate */}
        <path
          d={isoRhombusPath(160, 106, 96, 48, 0.12)}
          fill="rgba(2, 1, 6, 0.85)"
        />

        {/* Lower Stacked Obsidian Glass Plate (Matches Card 1 Bottom Plate) */}
        <path
          d={isoRhombusPath(160, 100.5, 96, 48, 0.12)}
          fill="rgba(14, 12, 25, 0.9)"
          stroke="rgba(139, 92, 246, 0.22)"
          strokeWidth="1"
        />
        <path
          d={isoRhombusPath(160, 98, 96, 48, 0.12)}
          fill="url(#iso3BaseFill)"
          stroke="url(#iso3BaseStroke)"
          strokeWidth="1.3"
        />
      </svg>

      {/* PLANE 1 (Z: 18px) — Upper Frosted Glass Tray & 2x2 Translucent Glass Tiles */}
      <svg
        className="w-[295px] sm:w-[320px] xl:w-[340px] h-auto max-h-full overflow-visible"
        viewBox="0 0 320 185"
        fill="none"
        style={{ transform: "translateZ(18px)" }}
      >
        <defs>
          {/* Upper Frosted Glass Tray (Matches Card 1 Top Plate) */}
          <radialGradient id="iso3TrayFill" cx="50%" cy="50%" r="54%">
            <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.22" />
            <stop offset="50%" stopColor="#1b1532" stopOpacity="0.78" />
            <stop offset="100%" stopColor="#110d20" stopOpacity="0.90" />
          </radialGradient>
          <linearGradient id="iso3TrayStroke" x1="64" y1="38" x2="256" y2="134" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.24" />
            <stop offset="50%" stopColor="#ddd6fe" stopOpacity="0.75" />
            <stop offset="100%" stopColor="#a78bfa" stopOpacity="0.35" />
          </linearGradient>

          {/* Inactive Translucent Obsidian Tile */}
          <linearGradient id="iso3TileStd" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1f1838" stopOpacity="0.92" />
            <stop offset="100%" stopColor="#110d22" stopOpacity="0.96" />
          </linearGradient>
          <linearGradient id="iso3TileStdRim" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#e9d5ff" stopOpacity="0.48" />
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.22" />
          </linearGradient>

          {/* Active Highlighted Frosted Violet Tile (Matches Card 2 Active Card) */}
          <linearGradient id="iso3TileAct" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#352563" stopOpacity="0.95" />
            <stop offset="50%" stopColor="#241947" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#171030" stopOpacity="0.98" />
          </linearGradient>
          <linearGradient id="iso3TileActRim" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.92" />
            <stop offset="50%" stopColor="#ddd6fe" stopOpacity="0.80" />
            <stop offset="100%" stopColor="#a78bfa" stopOpacity="0.55" />
          </linearGradient>
        </defs>

        {/* Upper Glass Tray 3px Thickness Edge */}
        <path
          d={isoRhombusPath(160, 90, 94, 47, 0.12)}
          fill="rgba(109, 40, 217, 0.18)"
          stroke="rgba(167, 139, 250, 0.32)"
          strokeWidth="1.1"
        />

        {/* Upper Frosted Glass Tray Surface */}
        <path
          d={isoRhombusPath(160, 87, 94, 47, 0.12)}
          fill="url(#iso3TrayFill)"
          stroke="url(#iso3TrayStroke)"
          strokeWidth="1.4"
        />

        {/* Inner Dashed Frame (Matches Card 1 & Card 4 Dashed Frame) */}
        <path
          d={isoRhombusPath(160, 87, 82, 41, 0.12)}
          stroke="rgba(196, 181, 253, 0.25)"
          strokeWidth="1"
          strokeDasharray="2.5 3"
        />

        {/* 2x2 Translucent Glass Tiles (95%, EN, TH, Waveform) */}
        {keys.map((k) => {
          const isSelected = activeKey === k.id;
          const cyTop = isSelected ? k.cy - 2.5 : k.cy;
          const cyEdge = cyTop + 3;

          return (
            <g
              key={k.id}
              onClick={(e) => {
                e.stopPropagation();
                setActiveKey(k.id);
              }}
              className="cursor-pointer"
            >
              {/* Soft Shadow Cast onto Glass Tray */}
              <path
                d={isoRhombusPath(k.cx, k.cy + 4.5, rxTile * 0.96, ryTile * 0.96, 0.16)}
                fill="rgba(4, 2, 10, 0.75)"
              />

              {/* 3px Extruded Glass Thickness Rim */}
              <path
                d={isoRhombusPath(k.cx, cyEdge, rxTile, ryTile, 0.16)}
                fill={isSelected ? "rgba(139, 92, 246, 0.38)" : "rgba(30, 22, 56, 0.85)"}
                stroke={isSelected ? "rgba(221, 214, 254, 0.55)" : "rgba(167, 139, 250, 0.25)"}
                strokeWidth="1"
              />

              {/* Top Frosted Glass Tile Face */}
              <path
                d={isoRhombusPath(k.cx, cyTop, rxTile, ryTile, 0.16)}
                fill={isSelected ? "url(#iso3TileAct)" : "url(#iso3TileStd)"}
                stroke={isSelected ? "url(#iso3TileActRim)" : "url(#iso3TileStdRim)"}
                strokeWidth={isSelected ? "1.45" : "1.15"}
              />

              {/* Foreshortened Isometric Legend: Crisp vector text & icons without blur/glow */}
              <g
                transform={`translate(${k.cx}, ${cyTop}) scale(1, 0.52) rotate(-45)`}
                textRendering="geometricPrecision"
                shapeRendering="geometricPrecision"
              >
                {k.id === "95" && (
                  <text
                    x="0"
                    y="5"
                    textAnchor="middle"
                    fill={isSelected ? "#ffffff" : "#c4b5fd"}
                    fontSize="14.5"
                    fontWeight="800"
                    fontFamily="var(--font-mono), monospace"
                    letterSpacing="-0.5"
                  >
                    95%
                  </text>
                )}

                {k.id === "en" && (
                  <text
                    x="0"
                    y="5"
                    textAnchor="middle"
                    fill={isSelected ? "#ffffff" : "rgba(221, 214, 254, 0.85)"}
                    fontSize="14.5"
                    fontWeight="700"
                    fontFamily="var(--font-mono), monospace"
                    letterSpacing="0.5"
                  >
                    EN
                  </text>
                )}

                {k.id === "th" && (
                  <text
                    x="0"
                    y="5"
                    textAnchor="middle"
                    fill={isSelected ? "#ffffff" : "rgba(221, 214, 254, 0.85)"}
                    fontSize="14.5"
                    fontWeight="700"
                    fontFamily="var(--font-mono), monospace"
                    letterSpacing="0.5"
                  >
                    TH
                  </text>
                )}

                {k.id === "icon" && (
                  <g
                    stroke={isSelected ? "#ffffff" : "rgba(221, 214, 254, 0.85)"}
                    strokeWidth="2.4"
                    strokeLinecap="round"
                  >
                    <line x1="-11" y1="3.5" x2="-11" y2="-3.5" />
                    <line x1="-5.5" y1="8.5" x2="-5.5" y2="-8.5" />
                    <line x1="0" y1="11.5" x2="0" y2="-11.5" />
                    <line x1="5.5" y1="7" x2="5.5" y2="-7" />
                    <line x1="11" y1="3.5" x2="11" y2="-3.5" />
                  </g>
                )}
              </g>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ============================================================================
// 4. MULTI-RATIO SUPPORT (9:16, 16:9 & 1:1 PREVIEW)
// Unified with Card 1, 2, 3: Same Floor Cross-Grid, Chevrons & Glass Material
// ============================================================================
function MultiRatioGraphic() {
  const [selectedRatio, setSelectedRatio] = useState<"9:16" | "1:1" | "16:9">("16:9");

  return (
    <div className="relative w-full h-full flex items-center justify-center select-none [transform-style:preserve-3d] group/iso4">
      {/* PLANE 0 (Z: 2px) — Identical 2:1 Isometric Floor Cross-Grid */}
      <svg
        className="pointer-events-none absolute w-[295px] sm:w-[320px] xl:w-[340px] h-auto max-h-full overflow-visible"
        viewBox="0 0 320 185"
        fill="none"
        style={{ transform: "translateZ(2px)" }}
      >
        <defs>
          <radialGradient id="iso4Ambient" cx="50%" cy="52%" r="46%">
            <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.22" />
            <stop offset="60%" stopColor="#6d28d9" stopOpacity="0.06" />
            <stop offset="100%" stopColor="#07060a" stopOpacity="0" />
          </radialGradient>
        </defs>

        <ellipse cx="160" cy="96" rx="138" ry="66" fill="url(#iso4Ambient)" />

        {/* Identical 2:1 Isometric Floor Cross-Grid as Cards 1, 2, 3 */}
        <g stroke="rgba(255, 255, 255, 0.05)" strokeWidth="1">
          <line x1="36" y1="138" x2="216" y2="48" />
          <line x1="64" y1="152" x2="244" y2="62" />
          <line x1="92" y1="166" x2="272" y2="76" />
          <line x1="120" y1="180" x2="300" y2="90" />

          <line x1="284" y1="138" x2="104" y2="48" />
          <line x1="256" y1="152" x2="76" y2="62" />
          <line x1="228" y1="166" x2="48" y2="76" />
          <line x1="200" y1="180" x2="20" y2="90" />
        </g>
      </svg>

      {/* PLANE 1 (Z: 12px) — Back-Left Standing Screen: 9:16 Vertical */}
      <svg
        className="pointer-events-none absolute w-[265px] sm:w-[285px] xl:w-[300px] h-auto max-h-full overflow-visible transition-transform duration-300 ease-out"
        viewBox="0 0 302 210"
        fill="none"
        style={{
          transform: `translateZ(${selectedRatio === "9:16" ? "22px" : "10px"})`,
        }}
      >
        <defs>
          <linearGradient id="iso4StdGlass" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1e1736" stopOpacity="0.90" />
            <stop offset="100%" stopColor="#100c1e" stopOpacity="0.94" />
          </linearGradient>
          <linearGradient id="iso4ActGlass" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#352563" stopOpacity="0.94" />
            <stop offset="50%" stopColor="#221742" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#140e29" stopOpacity="0.97" />
          </linearGradient>
          <linearGradient id="iso4StdRim" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#e9d5ff" stopOpacity="0.50" />
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.24" />
          </linearGradient>
          <linearGradient id="iso4ActRim" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.92" />
            <stop offset="50%" stopColor="#ddd6fe" stopOpacity="0.78" />
            <stop offset="100%" stopColor="#a78bfa" stopOpacity="0.50" />
          </linearGradient>
        </defs>

        <g
          onClick={() => setSelectedRatio("9:16")}
          className="pointer-events-auto cursor-pointer"
          transform="translate(68, 56) skewY(-26.5)"
        >
          {/* 3D Extruded Glass Thickness Slab */}
          <rect
            x="-3.5"
            y="-2"
            width="64"
            height="110"
            rx="7"
            fill={selectedRatio === "9:16" ? "rgba(139, 92, 246, 0.35)" : "rgba(24, 16, 46, 0.80)"}
            stroke={selectedRatio === "9:16" ? "rgba(221, 214, 254, 0.55)" : "rgba(167, 139, 250, 0.25)"}
            strokeWidth="1"
          />
          {/* Main Front Standing Glass Face */}
          <rect
            x="0"
            y="0"
            width="64"
            height="110"
            rx="7"
            fill={selectedRatio === "9:16" ? "url(#iso4ActGlass)" : "url(#iso4StdGlass)"}
            stroke={selectedRatio === "9:16" ? "url(#iso4ActRim)" : "url(#iso4StdRim)"}
            strokeWidth={selectedRatio === "9:16" ? "1.5" : "1.15"}
          />
          {/* Inner Dashed Frame */}
          <rect
            x="7"
            y="9"
            width="50"
            height="92"
            rx="4"
            stroke="rgba(196, 181, 253, 0.28)"
            strokeWidth="1"
            strokeDasharray="2.5 3"
          />
          {/* Single Crisp Ratio Label */}
          <text
            x="32"
            y="56"
            textAnchor="middle"
            fill={selectedRatio === "9:16" ? "#ffffff" : "rgba(221, 214, 254, 0.72)"}
            fontSize="10.5"
            fontWeight="800"
            fontFamily="var(--font-mono), monospace"
          >
            9:16
          </text>
          {/* Bottom Wireframe Subtitle Bar */}
          <rect
            x="16"
            y="86"
            width="32"
            height="4"
            rx="2"
            fill={selectedRatio === "9:16" ? "rgba(221, 214, 254, 0.75)" : "rgba(255, 255, 255, 0.22)"}
          />
        </g>
      </svg>

      {/* PLANE 2 (Z: 24px) — Middle Standing Screen: 1:1 Square */}
      <svg
        className="pointer-events-none absolute w-[265px] sm:w-[285px] xl:w-[300px] h-auto max-h-full overflow-visible transition-transform duration-300 ease-out"
        viewBox="0 0 302 210"
        fill="none"
        style={{
          transform: `translateZ(${selectedRatio === "1:1" ? "34px" : "24px"})`,
        }}
      >
        <g
          onClick={() => setSelectedRatio("1:1")}
          className="pointer-events-auto cursor-pointer"
          transform="translate(104, 78) skewY(-26.5)"
        >
          {/* Drop Shadow cast onto 9:16 pane behind it */}
          <rect
            x="-8"
            y="4"
            width="84"
            height="88"
            rx="7"
            fill="rgba(4, 2, 10, 0.70)"
          />
          {/* 3D Extruded Glass Thickness Slab */}
          <rect
            x="-3.5"
            y="-2"
            width="84"
            height="88"
            rx="7"
            fill={selectedRatio === "1:1" ? "rgba(139, 92, 246, 0.35)" : "rgba(24, 16, 46, 0.85)"}
            stroke={selectedRatio === "1:1" ? "rgba(221, 214, 254, 0.55)" : "rgba(167, 139, 250, 0.25)"}
            strokeWidth="1"
          />
          {/* Main Front Standing Square Glass Face */}
          <rect
            x="0"
            y="0"
            width="84"
            height="88"
            rx="7"
            fill={selectedRatio === "1:1" ? "url(#iso4ActGlass)" : "url(#iso4StdGlass)"}
            stroke={selectedRatio === "1:1" ? "url(#iso4ActRim)" : "url(#iso4StdRim)"}
            strokeWidth={selectedRatio === "1:1" ? "1.5" : "1.15"}
          />
          {/* Inner Dashed Frame */}
          <rect
            x="8"
            y="8"
            width="68"
            height="72"
            rx="4"
            stroke="rgba(196, 181, 253, 0.28)"
            strokeWidth="1"
            strokeDasharray="2.5 3"
          />
          {/* Single Crisp Ratio Label */}
          <text
            x="42"
            y="46"
            textAnchor="middle"
            fill={selectedRatio === "1:1" ? "#ffffff" : "rgba(221, 214, 254, 0.75)"}
            fontSize="11"
            fontWeight="800"
            fontFamily="var(--font-mono), monospace"
          >
            1:1
          </text>
          {/* Bottom Wireframe Subtitle Bar */}
          <rect
            x="22"
            y="66"
            width="40"
            height="4"
            rx="2"
            fill={selectedRatio === "1:1" ? "rgba(221, 214, 254, 0.75)" : "rgba(255, 255, 255, 0.22)"}
          />
        </g>
      </svg>

      {/* PLANE 3 (Z: 38px) — Front-Right Standing Screen: 16:9 Widescreen */}
      <svg
        className="pointer-events-none absolute w-[265px] sm:w-[285px] xl:w-[300px] h-auto max-h-full overflow-visible transition-transform duration-300 ease-out"
        viewBox="0 0 302 210"
        fill="none"
        style={{
          transform: `translateZ(${selectedRatio === "16:9" ? "46px" : "36px"})`,
        }}
      >
        <g
          onClick={() => setSelectedRatio("16:9")}
          className="pointer-events-auto cursor-pointer"
          transform="translate(142, 118) skewY(-26.5)"
        >
          {/* Drop Shadow cast onto 1:1 pane behind it */}
          <rect
            x="-8"
            y="4"
            width="106"
            height="70"
            rx="7"
            fill="rgba(4, 2, 10, 0.78)"
          />
          {/* 3D Extruded Glass Thickness Slab */}
          <rect
            x="-3.5"
            y="-2"
            width="106"
            height="70"
            rx="7"
            fill={selectedRatio === "16:9" ? "rgba(139, 92, 246, 0.38)" : "rgba(24, 16, 46, 0.85)"}
            stroke={selectedRatio === "16:9" ? "rgba(221, 214, 254, 0.58)" : "rgba(167, 139, 250, 0.25)"}
            strokeWidth="1"
          />
          {/* Main Front Standing 16:9 Widescreen Glass Face */}
          <rect
            x="0"
            y="0"
            width="106"
            height="70"
            rx="7"
            fill={selectedRatio === "16:9" ? "url(#iso4ActGlass)" : "url(#iso4StdGlass)"}
            stroke={selectedRatio === "16:9" ? "url(#iso4ActRim)" : "url(#iso4StdRim)"}
            strokeWidth={selectedRatio === "16:9" ? "1.5" : "1.15"}
          />
          {/* Inner Dashed Safe-Zone Frame (Matches Card 1 & Card 3) */}
          <rect
            x="8"
            y="8"
            width="90"
            height="54"
            rx="4"
            fill={selectedRatio === "16:9" ? "rgba(139, 92, 246, 0.08)" : "transparent"}
            stroke={selectedRatio === "16:9" ? "rgba(255, 255, 255, 0.45)" : "rgba(196, 181, 253, 0.28)"}
            strokeWidth="1.1"
            strokeDasharray="2.5 3"
          />
          {/* Single Crisp Ratio Label */}
          <text
            x="53"
            y="36"
            textAnchor="middle"
            fill={selectedRatio === "16:9" ? "#ffffff" : "rgba(221, 214, 254, 0.78)"}
            fontSize="11.5"
            fontWeight="800"
            fontFamily="var(--font-mono), monospace"
          >
            16:9
          </text>
          {/* Glowing Wireframe Active Subtitle Bar at Bottom */}
          <rect
            x="29"
            y="48"
            width="48"
            height="4.5"
            rx="2.25"
            fill={selectedRatio === "16:9" ? "#ddd6fe" : "rgba(255, 255, 255, 0.25)"}
          />
        </g>
      </svg>
    </div>
  );
}

// ============================================================================
// 5. FONT SIZE & HIGHLIGHT COLORS
// Exact 2:1 Isometric Plane (rotateX 60deg rotateZ -45deg), Same Cross-Grid,
// Same Chevrons, Same Obsidian-Violet Glass & Wireframe Abstraction as Card 1 & 2
// ============================================================================
// ============================================================================
// 5. CUSTOM STYLES & VIRAL TEMPLATES
// Exact 2:1 Isometric Frosted Obsidian Deck with Presets Switcher & Deep Controls
// Matches Card 1 & Card 2 glass material, cross-grid, chevrons & wireframe style
// ============================================================================
interface PresetTemplate {
  id: string;
  label: string;
  font: string;
  highlightColor: string;
  glowColor: string;
  badgeStyle: "viral" | "glow" | "clean";
  words: {
    en: [string, string, string];
    th: [string, string, string];
  };
  highlightIdx: number;
}

const PRESET_TEMPLATES: PresetTemplate[] = [
  {
    id: "viral",
    label: "Viral",
    font: "Kanit",
    highlightColor: "#facc15",
    glowColor: "rgba(250, 204, 21, 0.65)",
    badgeStyle: "viral",
    words: {
      en: ["HOOK", "THE", "SCROLL!"],
      th: ["ทำคลิป", "ให้ติด", "ไวรัล!"],
    },
    highlightIdx: 2,
  },
  {
    id: "glow",
    label: "Glow",
    font: "Prompt",
    highlightColor: "#a78bfa",
    glowColor: "rgba(167, 139, 250, 0.75)",
    badgeStyle: "glow",
    words: {
      en: ["SMART", "AI", "CAPTIONS"],
      th: ["ซับฉลาด", "ระดับ", "AI"],
    },
    highlightIdx: 1,
  },
  {
    id: "clean",
    label: "Clean",
    font: "Inter",
    highlightColor: "#ffffff",
    glowColor: "rgba(255, 255, 255, 0.60)",
    badgeStyle: "clean",
    words: {
      en: ["STUDIO", "MINIMAL", "PRO"],
      th: ["เรียบหรู", "สไตล์คลีน", "โปร"],
    },
    highlightIdx: 1,
  },
];

const COLOR_SWATCHES = [
  { hex: "#facc15", glow: "rgba(250, 204, 21, 0.70)", label: "Amber Gold" },
  { hex: "#a78bfa", glow: "rgba(167, 139, 250, 0.80)", label: "Zaizub Violet" },
  { hex: "#22d3ee", glow: "rgba(34, 211, 238, 0.75)", label: "Neon Cyan" },
  { hex: "#ffffff", glow: "rgba(255, 255, 255, 0.65)", label: "Studio White" },
] as const;

function StyleColorsGraphic({ lang = "en" }: { lang?: Lang }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);
  const isCardHovered = React.useContext(FeatureCardHoverContext);
  const [isSelfHovered, setIsSelfHovered] = useState(false);
  const [activePresetIdx, setActivePresetIdx] = useState(0);
  const [customColor, setCustomColor] = useState<string | null>(null);
  const [activeSize, setActiveSize] = useState<"S" | "M" | "L">("M");

  const isInteracting = isCardHovered || isSelfHovered;

  useEffect(() => {
    const el = rootRef.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setIsInView(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        setIsInView(Boolean(entries[0]?.isIntersecting));
      },
      { rootMargin: "150px 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Gentle auto-cycle through presets when untouched AND in view
  useEffect(() => {
    if (isInteracting || !isInView) return;
    const interval = setInterval(() => {
      setActivePresetIdx((prev) => (prev + 1) % PRESET_TEMPLATES.length);
      setCustomColor(null);
    }, 3400);
    return () => clearInterval(interval);
  }, [isInteracting, isInView]);

  const currentPreset = PRESET_TEMPLATES[activePresetIdx] || PRESET_TEMPLATES[0];
  const activeColor = customColor || currentPreset.highlightColor;
  const currentWords = currentPreset.words[lang] || currentPreset.words.en;

  const sliderPercent = activeSize === "S" ? "28%" : activeSize === "M" ? "62%" : "96%";

  return (
    <div
      ref={rootRef}
      aria-label={lang === "en" ? "Custom Styles & Viral Templates" : "ปรับแต่งสไตล์ & เทมเพลตสำเร็จรูป"}
      className="relative w-full h-full flex items-center justify-center select-none [transform-style:preserve-3d] group/iso5"
    >
      {/* PLANE 0 (Z: -80px) — Compact background floor grid with generous breathing room */}
      <svg
        className="pointer-events-none absolute w-[260px] sm:w-[280px] xl:w-[300px] h-auto max-h-full overflow-visible"
        viewBox="0 0 340 190"
        fill="none"
        style={{ transform: "translateZ(-80px)" }}
      >
        <defs>
          <radialGradient id="iso5Ambient" cx="50%" cy="50%" r="48%">
            <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.22" />
            <stop offset="60%" stopColor="#6d28d9" stopOpacity="0.06" />
            <stop offset="100%" stopColor="#07060a" stopOpacity="0" />
          </radialGradient>
        </defs>

        <ellipse cx="170" cy="98" rx="130" ry="62" fill="url(#iso5Ambient)" />

        {/* Identical 2:1 Isometric Floor Cross-Grid */}
        <g stroke="rgba(255, 255, 255, 0.05)" strokeWidth="1">
          <line x1="36" y1="142" x2="226" y2="47" />
          <line x1="66" y1="157" x2="256" y2="62" />
          <line x1="96" y1="172" x2="286" y2="77" />
          <line x1="126" y1="187" x2="316" y2="92" />

          <line x1="304" y1="142" x2="114" y2="47" />
          <line x1="274" y1="157" x2="84" y2="62" />
          <line x1="244" y1="172" x2="54" y2="77" />
          <line x1="214" y1="187" x2="24" y2="92" />
        </g>
      </svg>

      {/* PLANE 0 (Z: -80px) — Compact background floor grid with generous breathing room */}
      <svg
        className="pointer-events-none absolute w-[250px] sm:w-[270px] xl:w-[290px] h-auto max-h-full overflow-visible"
        viewBox="0 0 340 190"
        fill="none"
        style={{ transform: "translateZ(-80px)" }}
      >
        <defs>
          <radialGradient id="iso5Ambient" cx="50%" cy="50%" r="48%">
            <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.22" />
            <stop offset="60%" stopColor="#6d28d9" stopOpacity="0.06" />
            <stop offset="100%" stopColor="#07060a" stopOpacity="0" />
          </radialGradient>
        </defs>

        <ellipse cx="170" cy="98" rx="120" ry="58" fill="url(#iso5Ambient)" />

        {/* Identical 2:1 Isometric Floor Cross-Grid */}
        <g stroke="rgba(255, 255, 255, 0.05)" strokeWidth="1">
          <line x1="36" y1="142" x2="226" y2="47" />
          <line x1="66" y1="157" x2="256" y2="62" />
          <line x1="96" y1="172" x2="286" y2="77" />
          <line x1="126" y1="187" x2="316" y2="92" />

          <line x1="304" y1="142" x2="114" y2="47" />
          <line x1="274" y1="157" x2="84" y2="62" />
          <line x1="244" y1="172" x2="54" y2="77" />
          <line x1="214" y1="187" x2="24" y2="92" />
        </g>
      </svg>

      {/* Refined Compact 3D Isometric Deck Stage (Centered vertically with safe stage margins) */}
      <div
        className="relative w-[182px] sm:w-[190px] xl:w-[198px] h-[106px] sm:h-[110px] xl:h-[114px] [transform-style:preserve-3d]"
        style={{
          transform: "translate3d(0px, 4px, 12px) rotateX(60deg) rotateZ(-45deg)",
        }}
      >
        {/* Layer 0: Lower Stacked Obsidian Glass Plates (Preset Library Depth) */}
        <div
          className="pointer-events-none absolute inset-0 rounded-[9px] border border-white/[0.08] bg-[#0c0918]/98"
          style={{
            transform: "translate3d(-4px, 5px, -8px)",
            boxShadow:
              "-3.5px 3.5px 0px rgba(139, 92, 246, 0.18), -14px 14px 30px rgba(0, 0, 0, 0.94)",
          }}
        >
          {/* Subtle preset shelf indicator lines */}
          <div className="absolute top-1 left-2.5 right-2.5 flex items-center justify-between opacity-30 pt-0.5">
            <span className="h-0.5 w-5 rounded-full bg-purple-400/50" />
            <span className="h-0.5 w-10 rounded-full bg-white/20" />
            <span className="h-0.5 w-5 rounded-full bg-purple-400/40" />
          </div>
        </div>

        {/* Layer 1: Elevated Active Frosted Violet-Obsidian Glass Deck */}
        <div
          onPointerEnter={() => setIsSelfHovered(true)}
          onPointerLeave={() => setIsSelfHovered(false)}
          className="relative w-full h-full rounded-[9px] border border-purple-300/70 bg-gradient-to-br from-[#21183e]/98 via-[#150f2b]/98 to-[#100c22]/98 p-2 flex flex-col justify-between shadow-[0_16px_32px_rgba(0,0,0,0.92)] overflow-hidden"
          style={{
            transform: "translateZ(14px)",
            boxShadow:
              "-2.5px 2.5px 0px rgba(139, 92, 246, 0.50), -10px 12px 24px rgba(0, 0, 0, 0.95), 0 0 20px rgba(139, 92, 246, 0.22), inset 0 1px 0 rgba(255, 255, 255, 0.25)",
          }}
        >
          {/* Row 1: Preset Templates Switcher ONLY (No swatches here — prevents any right overflow!) */}
          <div className="flex items-center justify-between gap-1 w-full pb-0.5 border-b border-white/[0.06]">
            {/* Presets Segmented Buttons */}
            <div className="flex items-center gap-1">
              <span className="font-mono text-[6.5px] font-bold tracking-wider uppercase text-purple-300/70 mr-0.5">
                PRESETS
              </span>
              {PRESET_TEMPLATES.map((preset, idx) => {
                const isActive = idx === activePresetIdx;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActivePresetIdx(idx);
                      setCustomColor(null);
                    }}
                    className={`h-[15px] px-1.5 rounded-[3px] font-mono text-[7px] font-bold cursor-pointer transition-all border flex items-center justify-center ${
                      isActive
                        ? "bg-purple-500/35 border-purple-300/85 text-white shadow-[0_0_6px_rgba(139,92,246,0.5)]"
                        : "bg-white/[0.03] border-white/[0.08] text-purple-200/50 hover:text-white hover:bg-white/[0.06]"
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>

            {/* Subtle active preset status pill */}
            <span className="font-mono text-[6px] text-purple-300/50 uppercase tracking-widest hidden sm:inline">
              1-CLICK
            </span>
          </div>

          {/* Row 2: Typography Badge + Live Caption Preview Track */}
          <div className="flex items-center gap-1.5 w-full h-[32px] sm:h-[34px] rounded-[5px] border border-white/[0.10] bg-[#080612]/90 px-1.5">
            {/* Left 'Aa' Font Badge */}
            <div
              className="h-5 w-5 sm:h-5.5 sm:w-5.5 rounded-[3.5px] shrink-0 flex flex-col items-center justify-center border transition-all duration-300"
              style={{
                borderColor: `${activeColor}60`,
                backgroundColor: `${activeColor}16`,
                boxShadow: `0 0 8px ${activeColor}30`,
              }}
            >
              <span className="font-mono text-[7.5px] font-extrabold text-white leading-none">
                Aa
              </span>
              <span className="text-[5px] font-mono text-purple-200/70 leading-none mt-0.5">
                {currentPreset.font}
              </span>
            </div>

            {/* Right: Words Track with Dynamic Template & Highlight Style */}
            <div className="flex items-center justify-around flex-1 min-w-0 px-0.5">
              {currentWords.map((word, wIdx) => {
                const isHighlighted = wIdx === currentPreset.highlightIdx;
                const sizeClass =
                  activeSize === "S"
                    ? "text-[7px] px-1 py-0.5"
                    : activeSize === "M"
                    ? "text-[7.5px] sm:text-[8px] px-1.5 py-0.5"
                    : "text-[8.5px] sm:text-[9px] px-1.5 py-0.5";

                if (!isHighlighted) {
                  return (
                    <span
                      key={wIdx}
                      className="font-mono text-[7px] sm:text-[7.5px] font-semibold text-white/40 tracking-tight shrink-0 transition-opacity"
                    >
                      {word}
                    </span>
                  );
                }

                return (
                  <span
                    key={wIdx}
                    className={`font-mono font-black tracking-tight shrink-0 rounded-[3px] transition-all duration-300 ${sizeClass}`}
                    style={{
                      color: currentPreset.badgeStyle === "clean" ? "#ffffff" : activeColor,
                      backgroundColor:
                        currentPreset.badgeStyle === "clean"
                          ? "rgba(255, 255, 255, 0.16)"
                          : `${activeColor}22`,
                      border: `1px solid ${activeColor}70`,
                      boxShadow: `0 0 8px ${activeColor}50`,
                      textShadow:
                        currentPreset.badgeStyle === "viral"
                          ? "0 1.5px 3px rgba(0,0,0,0.9)"
                          : `0 0 6px ${activeColor}80`,
                    }}
                  >
                    {word}
                  </span>
                );
              })}
            </div>
          </div>

          {/* Row 3: S/M/L Buttons + Slider Bar + Color Swatches (All comfortably inside with zero overflow!) */}
          <div className="flex items-center justify-between gap-1 w-full pt-0.5">
            {/* Left: S / M / L Size Preset Buttons */}
            <div className="flex items-center gap-0.5 shrink-0">
              {(["S", "M", "L"] as const).map((sz) => {
                const isSelected = activeSize === sz;
                return (
                  <button
                    key={sz}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveSize(sz);
                    }}
                    className={`h-[15px] w-[15px] rounded-[3px] font-mono text-[7px] font-bold cursor-pointer transition-all border flex items-center justify-center ${
                      isSelected
                        ? "bg-purple-500/35 border-purple-300/80 text-white shadow-[0_0_6px_rgba(139,92,246,0.45)]"
                        : "bg-white/[0.04] border-white/[0.09] text-purple-200/50 hover:text-white"
                    }`}
                  >
                    {sz}
                  </button>
                );
              })}
            </div>

            {/* Center: Font Size Slider Bar */}
            <div
              onClick={(e) => {
                e.stopPropagation();
                setActiveSize((prev) => (prev === "S" ? "M" : prev === "M" ? "L" : "S"));
              }}
              className="flex-1 max-w-[54px] sm:max-w-[62px] h-[15px] px-1.5 rounded-[3px] border border-white/[0.08] bg-white/[0.03] flex items-center cursor-pointer group/slider hover:border-purple-400/40"
              title="Click to adjust font scale"
            >
              <div className="relative w-full h-1 rounded-full bg-white/[0.10] overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: sliderPercent,
                    backgroundColor: activeColor,
                    boxShadow: `0 0 6px ${activeColor}`,
                  }}
                />
              </div>
            </div>

            {/* Right: Color Swatches safely inside the card margin */}
            <div className="flex items-center gap-1 shrink-0">
              {COLOR_SWATCHES.map((sw) => {
                const isSelected = activeColor === sw.hex;
                return (
                  <button
                    key={sw.hex}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCustomColor(sw.hex);
                    }}
                    style={{
                      backgroundColor: sw.hex,
                      boxShadow: isSelected ? `0 0 6px ${sw.glow}` : undefined,
                    }}
                    className={`h-2.5 w-2.5 rounded-full transition-all cursor-pointer ${
                      isSelected
                        ? "ring-1.5 ring-purple-200 ring-offset-1 ring-offset-[#150f2b] scale-110"
                        : "opacity-60 hover:opacity-100"
                    }`}
                    aria-label={`Highlight color ${sw.label}`}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// UNIFIED BENTO FEATURE CARD WRAPPER WITH 120FPS 3D STAGE
// ============================================================================
interface FeatureCardProps {
  title: string;
  description: string;
  children: React.ReactNode;
  className?: string;
  stageHeight?: string;
}

function FeatureCard({
  title,
  description,
  children,
  className = "",
  stageHeight = "h-[165px] sm:h-[180px] lg:h-[175px] xl:h-[200px]",
}: FeatureCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const {
    containerRef,
    stageRef,
    glowRef,
    initialTransform,
    handlePointerMove,
    handlePointerEnter,
    handlePointerLeave,
  } = useFast3DTilt(0, 0, 2.5);

  const onEnter = useCallback(() => {
    setIsHovered(true);
    handlePointerEnter();
  }, [handlePointerEnter]);

  const onLeave = useCallback(() => {
    setIsHovered(false);
    handlePointerLeave();
  }, [handlePointerLeave]);

  return (
    <FeatureCardHoverContext.Provider value={isHovered}>
      <div
        ref={containerRef}
        onPointerMove={handlePointerMove}
        onPointerEnter={onEnter}
        onPointerLeave={onLeave}
        className={`group relative flex flex-col justify-start overflow-hidden rounded-[18px] sm:rounded-[20px] lg:rounded-[18px] xl:rounded-[22px] border border-white/[0.08] bg-[#0b0916] transition-all duration-300 ease-out hover:-translate-y-[1px] hover:border-purple-400/40 hover:shadow-[0_12px_36px_-8px_rgba(139,92,246,0.22)] ${className}`}
        style={{
          boxShadow:
            "inset 0 1px 0 0 rgba(255, 255, 255, 0.08), 0 16px 36px -12px rgba(0, 0, 0, 0.75)",
        }}
      >
        {/* Dynamic Pointer-Tracked Radial Glow matching reference cards */}
        <div
          ref={glowRef}
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(80% 75% at 24% 20%, rgba(139, 92, 246, 0.16) 0%, rgba(76, 29, 149, 0.05) 55%, #0b0916 100%)",
          }}
          aria-hidden="true"
        />

        {/* Upper: Volumetric 3D Isometric Interactive Visual Stage */}
        <div
          className={`relative w-full shrink-0 ${stageHeight} flex items-center justify-center overflow-hidden select-none`}
          style={{ perspective: "1000px" }}
        >
          <div
            ref={stageRef}
            className="w-full h-full will-change-transform [transform-style:preserve-3d] flex items-center justify-center"
            style={{ transform: initialTransform }}
          >
            {children}
          </div>
        </div>

        {/* Bottom Typography: Aligned top baseline across every card on the same row */}
        <div className="relative z-10 flex flex-1 flex-col justify-start px-4.5 pb-3.5 pt-2 sm:px-5 sm:pb-4 sm:pt-2.5 lg:px-4 xl:px-5 lg:pb-3.5 lg:pt-2 [@media(max-height:760px)]:pb-2.5 [@media(max-height:760px)]:pt-1.5">
          <h3 className="text-[15.5px] sm:text-[17px] lg:text-[16px] xl:text-[17.5px] font-semibold tracking-tight text-white leading-snug antialiased transition-colors duration-300 group-hover:text-purple-200">
            {title}
          </h3>
          <p className="mt-1 text-[12px] sm:text-[13px] lg:text-[12px] xl:text-[13px] text-slate-400 leading-relaxed font-normal antialiased line-clamp-1">
            {description}
          </p>
        </div>
      </div>
    </FeatureCardHoverContext.Provider>
  );
}

// ============================================================================
// MAIN FEATURES SECTION
// ============================================================================
export default function Features({ lang = "en" }: { lang?: Lang }) {
  const t = featuresCopy[lang] || featuresCopy.en;
  const items = t.items;

  return (
    <section
      id="features"
      className="relative min-h-[calc(100svh-3.75rem)] min-h-[calc(100dvh-3.75rem)] min-h-[calc(100vh-3.75rem)] flex flex-col justify-center py-5 sm:py-6 lg:py-5 xl:py-8 [@media(max-height:760px)]:py-3 bg-bg overflow-hidden text-white scroll-mt-16"
    >
      {/* Background ambient lighting matching Hero and EditorMockup */}
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_35%,rgba(139,92,246,0.06)_0%,rgba(124,58,237,0.02)_40%,transparent_70%)]"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 xl:px-10 w-full">
        {/* Top Row: 40% / 60% Bento Split */}
        <div className="grid grid-cols-1 gap-3.5 sm:gap-4 lg:gap-4 xl:gap-5 [@media(max-height:760px)]:gap-2.5 lg:grid-cols-12">
          {/* Card 1: Drop & Auto-Transcribe (40% width) */}
          <FeatureCard
            className="lg:col-span-5"
            stageHeight="h-[165px] sm:h-[185px] lg:h-[185px] xl:h-[215px] [@media(max-height:760px)]:h-[150px]"
            title={items[0]?.title || "Drop & Auto-Transcribe"}
            description={
              items[0]?.body ||
              "Upload MP4 up to 50 MB for instant timed caption cards."
            }
          >
            <UploadTranscribeGraphic />
          </FeatureCard>

          {/* Card 2: Card-by-Card Subtitle Editor (60% width) */}
          <FeatureCard
            className="lg:col-span-7"
            stageHeight="h-[165px] sm:h-[185px] lg:h-[185px] xl:h-[215px] [@media(max-height:760px)]:h-[150px]"
            title={items[1]?.title || "Card-by-Card Subtitle Editor"}
            description={
              items[1]?.body ||
              "Numbered caption cards synchronized with live video playback."
            }
          >
            <SubtitleEditorGraphic />
          </FeatureCard>
        </div>

        {/* Bottom Row: 3 Equal Cards */}
        <div className="mt-3.5 sm:mt-4 lg:mt-4 xl:mt-5 [@media(max-height:760px)]:mt-2.5 grid grid-cols-1 gap-3.5 sm:gap-4 lg:gap-4 xl:gap-5 [@media(max-height:760px)]:gap-2.5 md:grid-cols-3">
          {/* Card 3: 95% Transcribe Accuracy */}
          <FeatureCard
            stageHeight="h-[145px] sm:h-[160px] lg:h-[155px] xl:h-[185px] [@media(max-height:760px)]:h-[135px]"
            title={items[2]?.title || (lang === "en" ? "95% Transcribe Accuracy" : "ถอดเสียงแม่นยำ 95%")}
            description={
              items[2]?.body ||
              (lang === "en"
                ? "High-precision AI transcription for Thai & English."
                : "ถอดเสียงแม่นยำสูง รองรับทั้งภาษาไทยและอังกฤษ")
            }
          >
            <TranscribeAccuracyGraphic lang={lang} />
          </FeatureCard>

          {/* Card 4: Multi-Ratio Support */}
          <FeatureCard
            stageHeight="h-[145px] sm:h-[160px] lg:h-[155px] xl:h-[185px] [@media(max-height:760px)]:h-[135px]"
            title={items[3]?.title || (lang === "en" ? "Multi-Ratio Support" : "รองรับหลายอัตราส่วน")}
            description={
              items[3]?.body ||
              (lang === "en"
                ? "Instant aspect switching for TikTok, Reels & Shorts."
                : "สลับขนาด 9:16, 16:9 และ 1:1 สำหรับทุกแพลตฟอร์ม")
            }
          >
            <MultiRatioGraphic />
          </FeatureCard>

          {/* Card 5: Custom Styles & Viral Templates */}
          <FeatureCard
            stageHeight="h-[145px] sm:h-[160px] lg:h-[155px] xl:h-[185px] [@media(max-height:760px)]:h-[135px]"
            title={items[4]?.title || (lang === "en" ? "Custom Styles & Viral Templates" : "ปรับแต่งสไตล์ & เทมเพลตสำเร็จรูป")}
            description={
              items[4]?.body ||
              (lang === "en"
                ? "Apply 1-click viral presets or customize text styles."
                : "เลือกใช้พรีเซ็ตยอดฮิต หรือปรับแต่งสไตล์ได้อิสระ")
            }
          >
            <StyleColorsGraphic lang={lang} />
          </FeatureCard>
        </div>
      </div>
    </section>
  );
}