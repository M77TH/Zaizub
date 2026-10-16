"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { featuresCopy, type Lang } from "./copy";

// ============================================================================
// ULTRA-FAST GPU 3D TILT HOOK (Zero React Re-renders on Pointer Move)
// Uses requestAnimationFrame + direct DOM style mutation for 120fps smoothness
// ============================================================================
function useFast3DTilt(baseRotX = 0, baseRotY = 0, maxTilt = 10) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);

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
    const ease = 0.14;

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
      const gx = 24 + (s.currentX + 1) * 18;
      const gy = 20 + (s.currentY + 1) * 16;
      glowRef.current.style.background = `radial-gradient(80% 75% at ${gx.toFixed(1)}% ${gy.toFixed(1)}%, rgba(139, 92, 246, ${s.isHovered ? "0.24" : "0.16"}) 0%, rgba(76, 29, 149, 0.05) 55%, #0b0916 100%)`;
    }

    const stillMoving =
      Math.abs(s.targetX - s.currentX) > 0.004 ||
      Math.abs(s.targetY - s.currentY) > 0.004 ||
      Math.abs(s.targetZ - s.currentZ) > 0.04;

    if (stillMoving || s.isHovered) {
      s.rafId = requestAnimationFrame(tick);
    } else {
      s.rafId = 0;
    }
  }, [baseRotX, baseRotY, maxTilt]);

  const startLoop = useCallback(() => {
    if (!stateRef.current.rafId) {
      stateRef.current.rafId = requestAnimationFrame(tick);
    }
  }, [tick]);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      const nx = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      const ny = ((e.clientY - rect.top) / rect.height - 0.5) * 2;

      stateRef.current.targetX = Math.max(-1, Math.min(1, nx));
      stateRef.current.targetY = Math.max(-1, Math.min(1, ny));
      stateRef.current.targetZ = 8;
      stateRef.current.isHovered = true;
      startLoop();
    },
    [startLoop]
  );

  const handlePointerEnter = useCallback(() => {
    stateRef.current.isHovered = true;
    stateRef.current.targetZ = 8;
    startLoop();
  }, [startLoop]);

  const handlePointerLeave = useCallback(() => {
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
      {/* PLANE 0 (Z: 2px) — Subtle Isometric Grid, Chevrons & Bottom Obsidian Glass Plate */}
      <svg
        className="w-[370px] sm:w-[400px] h-auto max-h-full overflow-visible pointer-events-none"
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

        {/* 4 Isometric Corner Chevrons (< > ^ v) */}
        <path
          d="M 74 114 L 66 118.5 L 74 123"
          stroke="#a78bfa"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.55"
        />
        <path
          d="M 362 114 L 370 118.5 L 362 123"
          stroke="#a78bfa"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.55"
        />
        <path
          d="M 212 31 L 218 27 L 224 31"
          stroke="#a78bfa"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.50"
        />
        <path
          d="M 211 209 L 218 213.5 L 225 209"
          stroke="#a78bfa"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.65"
        />

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
        className="pointer-events-none absolute w-[370px] sm:w-[400px] h-auto max-h-full overflow-visible transition-transform duration-500 ease-out"
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
        className="pointer-events-none absolute w-[370px] sm:w-[400px] h-auto max-h-full overflow-visible transition-transform duration-500 ease-out"
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
  { id: 0, headerWidth: "w-14", wordWidths: ["w-14", "w-20", "w-14"] },
  { id: 1, headerWidth: "w-16", wordWidths: ["w-16", "w-14", "w-20"] },
  { id: 2, headerWidth: "w-12", wordWidths: ["w-12", "w-24", "w-14"] },
  { id: 3, headerWidth: "w-16", wordWidths: ["w-20", "w-14", "w-16"] },
  { id: 4, headerWidth: "w-14", wordWidths: ["w-14", "w-20", "w-12"] },
  { id: 5, headerWidth: "w-16", wordWidths: ["w-16", "w-16", "w-16"] },
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
  const nextUidRef = useRef(6);
  const [items, setItems] = useState<ConveyorItem[]>(() =>
    CARD_TEMPLATES.slice(0, 6).map((template, idx) => ({
      uid: idx,
      template,
    }))
  );
  const [activeTokenIdx, setActiveTokenIdx] = useState(1);

  const advanceConveyor = useCallback(() => {
    setItems((prev) => {
      const nextUid = nextUidRef.current++;
      const nextTemplate = CARD_TEMPLATES[nextUid % CARD_TEMPLATES.length];
      return [...prev.slice(1), { uid: nextUid, template: nextTemplate }];
    });
    setActiveTokenIdx(0);
  }, []);

  // Step the highlighted word squircle inside the 2nd card, then scroll the list up
  useEffect(() => {
    const tokenTimer = window.setInterval(() => {
      setActiveTokenIdx((prev) => (prev < 2 ? prev + 1 : prev));
    }, 520);

    const scrollTimer = window.setInterval(() => {
      advanceConveyor();
    }, 1750);

    return () => {
      window.clearInterval(tokenTimer);
      window.clearInterval(scrollTimer);
    };
  }, [advanceConveyor]);

  return (
    <div
      onClick={advanceConveyor}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          advanceConveyor();
        }
      }}
      className="relative w-full h-full flex items-center justify-center select-none cursor-pointer [transform-style:preserve-3d]"
      title="Click to advance caption card list"
    >
      {/* Exact Same 2:1 Isometric Floor Cross-Grid, Ambient Glow & 4 Chevrons (< > ^ v) as Card 1 */}
      <svg
        className="pointer-events-none absolute w-[390px] sm:w-[430px] h-auto max-h-full overflow-visible"
        viewBox="0 0 436 225"
        fill="none"
        style={{ transform: "translateZ(2px)" }}
      >
        <defs>
          <radialGradient id="iso2Glow" cx="50%" cy="52%" r="46%">
            <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.22" />
            <stop offset="60%" stopColor="#6d28d9" stopOpacity="0.06" />
            <stop offset="100%" stopColor="#07060a" stopOpacity="0" />
          </radialGradient>
        </defs>

        <ellipse cx="218" cy="118" rx="165" ry="76" fill="url(#iso2Glow)" />

        {/* Identical 2:1 Isometric Floor Cross Lines as Card 1 */}
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

        {/* 4 Isometric Corner Chevrons (< > ^ v) matching Card 1 */}
        <path
          d="M 64 114 L 56 118.5 L 64 123"
          stroke="#a78bfa"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.55"
        />
        <path
          d="M 372 114 L 380 118.5 L 372 123"
          stroke="#a78bfa"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.55"
        />
        <path
          d="M 212 24 L 218 20 L 224 24"
          stroke="#a78bfa"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.50"
        />
        <path
          d="M 211 209 L 218 213.5 L 225 209"
          stroke="#a78bfa"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.65"
        />
      </svg>

      {/* True 2:1 Isometric Plane (rotateX 60deg rotateZ -45deg — parallel to floor cross lines!) */}
      <div
        className="relative w-[265px] sm:w-[285px] h-[290px] [transform-style:preserve-3d]"
        style={{
          transform: "rotateX(60deg) rotateZ(-45deg)",
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
                className={`absolute inset-x-1 h-[64px] rounded-[7px] border px-3.5 flex items-center justify-between gap-3 will-change-transform transition-all duration-600 ease-[cubic-bezier(0.22,1,0.36,1)] ${
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
// 3. VIRAL CREATOR PRESETS (Matches viral-presets.png)
// Isometric 4-layer stacked translucent preset cards with neon typography
// ============================================================================
function ViralPresetsGraphic() {
  const [activeLayer, setActiveLayer] = useState<0 | 1 | 2>(1);

  return (
    <div className="relative w-[270px] h-[155px] flex items-center justify-center select-none [transform-style:preserve-3d] group/iso3">
      {/* Corner Registration Brackets */}
      <svg
        className="pointer-events-none absolute inset-0 w-full h-full opacity-55"
        viewBox="0 0 270 155"
        fill="none"
      >
        <path d="M34 86 L26 90 L34 94" stroke="#a78bfa" strokeWidth="1.3" strokeLinecap="round" />
        <path d="M238 78 L246 82 L238 86" stroke="#a78bfa" strokeWidth="1.3" strokeLinecap="round" />
        <path d="M90 132 L96 136 L104 132" stroke="#a78bfa" strokeWidth="1.3" strokeLinecap="round" />
      </svg>

      {/* Isometric Tilted Preset Card Stack */}
      <div
        className="relative w-[205px] h-[115px] [transform-style:preserve-3d]"
        style={{
          transform: "rotateX(32deg) rotateY(14deg) rotateZ(-22deg)",
        }}
      >
        {/* Base Layer 0: Dark Foundation Glass Plate */}
        <div
          className="absolute left-3 top-7 w-[178px] h-[82px] rounded-2xl border border-white/[0.15] bg-[#0d0a1a]/90 shadow-[0_18px_34px_rgba(0,0,0,0.9)]"
          style={{ transform: "translateZ(0px)" }}
        />

        {/* Layer 1: Cyan Glass Card (Karaoke Glow) */}
        <div
          onClick={() => setActiveLayer(2)}
          className={`absolute left-2 top-4 w-[178px] h-[78px] rounded-2xl border transition-all duration-300 cursor-pointer flex items-end px-3.5 pb-2.5 ${
            activeLayer === 2
              ? "border-cyan-300/80 bg-gradient-to-br from-cyan-500/25 via-[#122230]/90 to-[#0e1525]/95 shadow-[0_0_24px_rgba(34,211,238,0.3)]"
              : "border-cyan-300/45 bg-gradient-to-br from-cyan-400/15 via-[#131c2e]/85 to-[#0e1222]/90 hover:border-cyan-300/70"
          }`}
          style={{
            transform: `translateZ(${activeLayer === 2 ? "22px" : "12px"})`,
          }}
        >
          <div className="rounded-lg border border-emerald-400/45 bg-[#08221e]/90 px-2.5 py-0.5 shadow-[0_0_12px_rgba(16,185,129,0.25)]">
            <span className="text-[11px] font-extrabold tracking-tight text-emerald-300 drop-shadow-[0_0_8px_rgba(52,211,153,0.6)]">
              Karaoke Glow
            </span>
          </div>
        </div>

        {/* Layer 2: Upper Purple Glass Card (MrBeast Badge / MrBeast Viral) */}
        <div
          onClick={() => setActiveLayer(1)}
          className={`absolute left-5 -top-1 w-[176px] h-[74px] rounded-2xl border transition-all duration-300 cursor-pointer p-3 flex flex-col justify-between ${
            activeLayer === 1
              ? "border-purple-300/80 bg-gradient-to-br from-purple-400/25 via-[#22173e]/92 to-[#130d26]/95 shadow-[0_12px_28px_rgba(0,0,0,0.75),0_0_22px_rgba(168,85,247,0.35)]"
              : "border-purple-300/50 bg-gradient-to-br from-purple-400/15 via-[#1c1433]/88 to-[#120d22]/90 hover:border-purple-300/75"
          }`}
          style={{
            transform: `translateZ(${activeLayer === 1 ? "30px" : "24px"})`,
          }}
        >
          <span className="text-[12px] font-extrabold tracking-tight text-cyan-300 drop-shadow-[0_0_10px_rgba(34,211,238,0.55)]">
            MrBeast Badge
          </span>
          <div className="self-start rounded-lg border border-purple-400/40 bg-[#1a1033]/95 px-2.5 py-0.5 shadow-inner">
            <span className="text-[10.5px] font-bold tracking-tight text-purple-300">
              MrBeast Viral
            </span>
          </div>
        </div>

        {/* Layer 3: Top-Left Floating Tab Badge (TikTok Viral) */}
        <div
          onClick={() => setActiveLayer(0)}
          className={`absolute -left-1 -top-4 rounded-xl border px-3 py-1 cursor-pointer transition-all duration-300 ${
            activeLayer === 0
              ? "border-amber-300/80 bg-[#23122b] shadow-[0_0_20px_rgba(250,204,21,0.4)] scale-105"
              : "border-pink-400/50 bg-[#1c1026]/95 shadow-[0_8px_18px_rgba(0,0,0,0.8)] hover:border-amber-300/65"
          }`}
          style={{
            transform: `translateZ(${activeLayer === 0 ? "42px" : "36px"})`,
          }}
        >
          <span className="text-[11px] font-extrabold tracking-tight text-[#fde047] drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]">
            TikTok Viral
          </span>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 4. 9:16, 16:9 & 1:1 PREVIEW (1:1 Isometric Reconstruction of multi-ratio.png)
// 3 Standing Vertical Isometric Glass Slabs (skewY -26.5°) stepped in 3D depth
// ============================================================================
function MultiRatioGraphic() {
  const [selectedRatio, setSelectedRatio] = useState<"9:16" | "1:1" | "16:9" | null>(null);

  return (
    <div className="relative w-full h-full flex items-center justify-center select-none [transform-style:preserve-3d] group/iso4">
      {/* PLANE 0 (Z: 2px) — Isometric Floor Grid & Outer Floating Crop Brackets */}
      <svg
        className="pointer-events-none w-[265px] sm:w-[285px] h-auto max-h-full overflow-visible"
        viewBox="0 0 302 210"
        fill="none"
        style={{ transform: "translateZ(2px)" }}
      >
        <defs>
          <radialGradient id="iso4Ambient" cx="38%" cy="38%" r="52%">
            <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.22" />
            <stop offset="60%" stopColor="#4c1d95" stopOpacity="0.06" />
            <stop offset="100%" stopColor="#07060a" stopOpacity="0" />
          </radialGradient>
        </defs>

        <ellipse cx="145" cy="105" rx="135" ry="85" fill="url(#iso4Ambient)" />

        {/* Isometric Floor Grid beneath the 3 standing screens */}
        <g stroke="rgba(167, 139, 250, 0.12)" strokeWidth="0.9">
          {/* Upward-right lines (-26.5° slope) */}
          <line x1="28" y1="162" x2="178" y2="87" />
          <line x1="48" y1="174" x2="198" y2="99" />
          <line x1="68" y1="186" x2="218" y2="111" />
          <line x1="88" y1="198" x2="238" y2="123" />
          <line x1="108" y1="208" x2="258" y2="133" />
          {/* Downward-right lines (+26.5° slope) */}
          <line x1="42" y1="128" x2="182" y2="198" />
          <line x1="66" y1="116" x2="206" y2="186" />
          <line x1="90" y1="104" x2="230" y2="174" />
          <line x1="114" y1="92" x2="254" y2="162" />
        </g>

        {/* Outer Isometric Crop Marks matching Image 2 */}
        {/* Top-left bracket outside 9:16 screen */}
        <path
          d="M 55 58 V 43 L 67 37"
          stroke="rgba(216, 180, 254, 0.55)"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Top-right bracket above 9:16 screen */}
        <path
          d="M 134 15 L 146 9 V 24"
          stroke="rgba(216, 180, 254, 0.55)"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Bottom-left bracket below 9:16 screen */}
        <path
          d="M 55 152 V 167 L 67 161"
          stroke="rgba(216, 180, 254, 0.55)"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Bottom-left bracket below 16:9 screen */}
        <path
          d="M 134 185 V 198 L 146 192"
          stroke="rgba(216, 180, 254, 0.65)"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Top-right bracket outside 16:9 screen */}
        <path
          d="M 255 62 L 266 56.5 V 70"
          stroke="rgba(216, 180, 254, 0.65)"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      {/* PLANE 1 (Z: 12px) — Back-Left Standing Screen: 9:16 Vertical */}
      <svg
        className="pointer-events-none absolute w-[265px] sm:w-[285px] h-auto max-h-full overflow-visible transition-transform duration-300 ease-out"
        viewBox="0 0 302 210"
        fill="none"
        style={{
          transform: `translateZ(${selectedRatio === "9:16" ? "20px" : "10px"})`,
        }}
      >
        <defs>
          <linearGradient id="iso4Glass1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#c4b5fd" stopOpacity="0.22" />
            <stop offset="45%" stopColor="#2e1d59" stopOpacity="0.48" />
            <stop offset="100%" stopColor="#0f0b1e" stopOpacity="0.78" />
          </linearGradient>
          <linearGradient id="iso4Rim1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f3e8ff" stopOpacity="0.72" />
            <stop offset="50%" stopColor="#a78bfa" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#6d28d9" stopOpacity="0.30" />
          </linearGradient>
        </defs>

        <g
          onClick={() => setSelectedRatio((r) => (r === "9:16" ? null : "9:16"))}
          className="pointer-events-auto cursor-pointer"
          transform="translate(68, 56) skewY(-26.5)"
        >
          {/* 3D Extruded Back/Left Glass Thickness Slab (-4px X, -2px Y) */}
          <rect
            x="-4"
            y="-2"
            width="64"
            height="112"
            rx="8"
            fill="rgba(30, 20, 58, 0.55)"
            stroke="rgba(196, 181, 253, 0.35)"
            strokeWidth="1"
          />
          {/* Main Front Standing Glass Face */}
          <rect
            x="0"
            y="0"
            width="64"
            height="112"
            rx="8"
            fill="url(#iso4Glass1)"
            stroke={selectedRatio === "9:16" ? "#ddd6fe" : "url(#iso4Rim1)"}
            strokeWidth={selectedRatio === "9:16" ? "1.6" : "1.2"}
          />
          {/* Speaker Notch Line */}
          <line
            x1="22"
            y1="8"
            x2="42"
            y2="8"
            stroke="rgba(255, 255, 255, 0.45)"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          {/* Center Dashed Badge */}
          <rect
            x="8"
            y="42"
            width="48"
            height="28"
            rx="4"
            fill="rgba(36, 22, 70, 0.78)"
            stroke="rgba(196, 181, 253, 0.55)"
            strokeWidth="1"
            strokeDasharray="2.5 2.5"
          />
          <text
            x="32"
            y="54"
            textAnchor="middle"
            fill="#e9d5ff"
            fontSize="8.5"
            fontWeight="600"
            fontFamily="var(--font-mono), monospace"
          >
            9:16
          </text>
          <text
            x="32"
            y="64"
            textAnchor="middle"
            fill="#ffffff"
            fontSize="8.5"
            fontWeight="800"
            fontFamily="var(--font-mono), monospace"
          >
            9:16
          </text>
        </g>
      </svg>

      {/* PLANE 2 (Z: 24px) — Middle Standing Screen: 1:1 Square */}
      <svg
        className="pointer-events-none absolute w-[265px] sm:w-[285px] h-auto max-h-full overflow-visible transition-transform duration-300 ease-out"
        viewBox="0 0 302 210"
        fill="none"
        style={{
          transform: `translateZ(${selectedRatio === "1:1" ? "34px" : "24px"})`,
        }}
      >
        <defs>
          <linearGradient id="iso4Glass2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ddd6fe" stopOpacity="0.24" />
            <stop offset="40%" stopColor="#2a1b52" stopOpacity="0.58" />
            <stop offset="100%" stopColor="#0d0a1a" stopOpacity="0.82" />
          </linearGradient>
          <linearGradient id="iso4Rim2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.78" />
            <stop offset="50%" stopColor="#c4b5fd" stopOpacity="0.52" />
            <stop offset="100%" stopColor="#7c3aed" stopOpacity="0.35" />
          </linearGradient>
        </defs>

        <g
          onClick={() => setSelectedRatio((r) => (r === "1:1" ? null : "1:1"))}
          className="pointer-events-auto cursor-pointer"
          transform="translate(104, 78) skewY(-26.5)"
        >
          {/* Drop Shadow cast onto 9:16 pane behind it */}
          <rect
            x="-8"
            y="4"
            width="86"
            height="90"
            rx="8"
            fill="rgba(4, 2, 10, 0.55)"
          />
          {/* 3D Extruded Left/Top Glass Thickness Slab */}
          <rect
            x="-4"
            y="-2"
            width="86"
            height="90"
            rx="8"
            fill="rgba(36, 24, 68, 0.60)"
            stroke="rgba(216, 180, 254, 0.40)"
            strokeWidth="1"
          />
          {/* Main Front Standing Square Glass Face */}
          <rect
            x="0"
            y="0"
            width="86"
            height="90"
            rx="8"
            fill="url(#iso4Glass2)"
            stroke={selectedRatio === "1:1" ? "#f5f3ff" : "url(#iso4Rim2)"}
            strokeWidth={selectedRatio === "1:1" ? "1.6" : "1.25"}
          />
          {/* Inner Corner Crop Ticks */}
          <path
            d="M 7 16 V 7 H 16 M 70 7 H 79 V 16 M 7 74 V 83 H 16"
            stroke="rgba(233, 213, 255, 0.55)"
            strokeWidth="1.1"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Center Dashed Badge: 1:1 square / 1:1 */}
          <rect
            x="14"
            y="29"
            width="58"
            height="32"
            rx="4.5"
            fill="rgba(38, 24, 74, 0.82)"
            stroke="rgba(196, 181, 253, 0.62)"
            strokeWidth="1"
            strokeDasharray="2.5 2.5"
          />
          <text
            x="43"
            y="42"
            textAnchor="middle"
            fill="#d8b4fe"
            fontSize="8"
            fontWeight="600"
            fontFamily="var(--font-mono), monospace"
          >
            1:1 square
          </text>
          <text
            x="43"
            y="54"
            textAnchor="middle"
            fill="#ffffff"
            fontSize="10"
            fontWeight="800"
            fontFamily="var(--font-mono), monospace"
          >
            1:1
          </text>
        </g>
      </svg>

      {/* PLANE 3 (Z: 38px) — Front-Right Standing Screen: 16:9 Widescreen */}
      <svg
        className="pointer-events-none absolute w-[265px] sm:w-[285px] h-auto max-h-full overflow-visible transition-transform duration-300 ease-out"
        viewBox="0 0 302 210"
        fill="none"
        style={{
          transform: `translateZ(${selectedRatio === "16:9" ? "48px" : "38px"})`,
        }}
      >
        <defs>
          <linearGradient id="iso4Glass3" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ede9fe" stopOpacity="0.26" />
            <stop offset="38%" stopColor="#2e1d59" stopOpacity="0.62" />
            <stop offset="100%" stopColor="#0d0a1a" stopOpacity="0.88" />
          </linearGradient>
          <linearGradient id="iso4Rim3" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
            <stop offset="50%" stopColor="#c4b5fd" stopOpacity="0.60" />
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.42" />
          </linearGradient>
        </defs>

        <g
          onClick={() => setSelectedRatio((r) => (r === "16:9" ? null : "16:9"))}
          className="pointer-events-auto cursor-pointer"
          transform="translate(142, 118) skewY(-26.5)"
        >
          {/* Drop Shadow cast onto 1:1 pane behind it */}
          <rect
            x="-8"
            y="4"
            width="108"
            height="72"
            rx="8"
            fill="rgba(4, 2, 10, 0.60)"
          />
          {/* 3D Extruded Left/Top Glass Thickness Slab */}
          <rect
            x="-4"
            y="-2"
            width="108"
            height="72"
            rx="8"
            fill="rgba(42, 28, 78, 0.65)"
            stroke="rgba(221, 214, 254, 0.45)"
            strokeWidth="1"
          />
          {/* Main Front Standing 16:9 Widescreen Glass Face */}
          <rect
            x="0"
            y="0"
            width="108"
            height="72"
            rx="8"
            fill="url(#iso4Glass3)"
            stroke={selectedRatio === "16:9" ? "#ffffff" : "url(#iso4Rim3)"}
            strokeWidth={selectedRatio === "16:9" ? "1.7" : "1.3"}
          />
          {/* 4 Inner Corner Crop Marks */}
          <path
            d="M 7 15 V 7 H 15 M 93 7 H 101 V 15 M 7 57 V 65 H 15 M 93 65 H 101 V 57"
            stroke="rgba(233, 213, 255, 0.62)"
            strokeWidth="1.15"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Center Dashed Badge: safe-zone / 16:9 */}
          <rect
            x="22"
            y="19"
            width="64"
            height="34"
            rx="4.5"
            fill="rgba(40, 25, 78, 0.86)"
            stroke="rgba(196, 181, 253, 0.68)"
            strokeWidth="1.1"
            strokeDasharray="2.5 2.5"
          />
          <text
            x="54"
            y="32"
            textAnchor="middle"
            fill="#d8b4fe"
            fontSize="8"
            fontWeight="600"
            fontFamily="var(--font-mono), monospace"
          >
            safe-zone
          </text>
          <text
            x="54"
            y="45"
            textAnchor="middle"
            fill="#ffffff"
            fontSize="10.5"
            fontWeight="800"
            fontFamily="var(--font-mono), monospace"
          >
            16:9
          </text>
        </g>
      </svg>
    </div>
  );
}

// ============================================================================
// 5. FONT SIZE & HIGHLIGHT COLORS (Matches styles-colors.png)
// Isometric 3D glass control deck with spectral slider, T Size slider & 6 orbs
// ============================================================================
const ORB_COLORS = [
  { hex: "#facc15", name: "Yellow" },
  { hex: "#ffffff", name: "White" },
  { hex: "#22d3ee", name: "Cyan" },
  { hex: "#ef4444", name: "Red" },
  { hex: "#22c55e", name: "Green" },
  { hex: "#ec4899", name: "Pink" },
] as const;

function StyleColorsGraphic() {
  const [activeOrb, setActiveOrb] = useState(0);
  const [sizeVal, setSizeVal] = useState(64);

  const handleTrackClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = Math.max(18, Math.min(92, Math.round(((e.clientX - rect.left) / rect.width) * 100)));
    setSizeVal(pct);
  };

  return (
    <div className="relative w-[270px] h-[155px] flex items-center justify-center select-none [transform-style:preserve-3d] group/iso5">
      {/* Isometric Background Grid & Corner Brackets */}
      <svg
        className="pointer-events-none absolute inset-0 w-full h-full opacity-50"
        viewBox="0 0 270 155"
        fill="none"
      >
        <g stroke="rgba(167,139,250,0.14)" strokeWidth="1">
          <line x1="40" y1="120" x2="200" y2="35" />
          <line x1="80" y1="140" x2="240" y2="55" />
          <line x1="230" y1="120" x2="70" y2="35" />
          <line x1="190" y1="140" x2="30" y2="55" />
        </g>
        <path d="M35 72 L28 76 L35 80" stroke="#a78bfa" strokeWidth="1.3" strokeLinecap="round" />
        <path d="M238 80 L245 84 L238 88" stroke="#a78bfa" strokeWidth="1.3" strokeLinecap="round" />
        <path d="M84 134 L90 138 L98 134" stroke="#a78bfa" strokeWidth="1.3" strokeLinecap="round" />
      </svg>

      {/* Isometric Tilted Control Deck */}
      <div
        className="relative w-[206px] h-[106px] [transform-style:preserve-3d]"
        style={{
          transform: "rotateX(32deg) rotateY(14deg) rotateZ(-22deg)",
        }}
      >
        {/* Bottom Shadow Glass Plate (Z: 0px) */}
        <div
          className="absolute left-2 top-3 w-full h-full rounded-2xl border border-white/[0.14] bg-[#0c0919]/90 shadow-[0_20px_36px_rgba(0,0,0,0.9)]"
          style={{ transform: "translateZ(0px)" }}
        />

        {/* Top Interactive Control Board (Z: 22px) */}
        <div
          className="absolute inset-0 rounded-2xl border border-white/25 bg-gradient-to-br from-[#211a3a]/95 via-[#151129]/95 to-[#0e0b1c]/95 p-3.5 flex flex-col justify-between shadow-[0_12px_28px_rgba(0,0,0,0.75),inset_0_1px_1px_rgba(255,255,255,0.25)]"
          style={{ transform: "translateZ(22px)" }}
        >
          {/* Row 1: Spectral Color Bar with Glowing Thumb */}
          <div
            onClick={handleTrackClick}
            className="flex items-center gap-2 cursor-pointer"
            title="Click to adjust spectral slider"
          >
            <span className="font-mono text-[10px] font-bold text-purple-300/90 leading-none">
              //
            </span>
            <div className="relative flex-1 h-2 rounded-full bg-white/10 flex items-center">
              <div
                className="h-full rounded-full bg-gradient-to-r from-purple-500 via-cyan-300 to-yellow-300 shadow-[0_0_10px_rgba(56,189,248,0.45)] transition-all duration-200"
                style={{ width: `${sizeVal}%` }}
              />
              <span
                className="absolute h-3.5 w-3.5 -ml-1.5 rounded-full bg-white border-2 border-purple-200 shadow-[0_0_10px_#ffffff] transition-all duration-200"
                style={{ left: `${sizeVal}%` }}
              />
            </div>
          </div>

          {/* Row 2: T Size Label + Purple Slider Track */}
          <div
            onClick={handleTrackClick}
            className="flex items-center gap-2.5 cursor-pointer"
            title="Click to adjust T Size"
          >
            <span className="text-[10.5px] font-semibold text-white tracking-tight whitespace-nowrap flex items-center gap-1">
              <span className="font-mono text-purple-300 font-bold">T</span>
              <span>Size</span>
            </span>
            <div className="relative flex-1 h-1.5 rounded-full bg-white/10 flex items-center">
              <div
                className="h-full rounded-full bg-gradient-to-r from-purple-500 to-violet-300 transition-all duration-200"
                style={{ width: `${Math.max(20, sizeVal - 12)}%` }}
              />
              <span
                className="absolute h-3 w-3 -ml-1.5 rounded-full bg-purple-200 border-2 border-white shadow-[0_0_8px_#c084fc] transition-all duration-200"
                style={{ left: `${Math.max(20, sizeVal - 12)}%` }}
              />
            </div>
          </div>

          {/* Row 3: 6 Glowing 3D Color Orbs */}
          <div className="flex items-center justify-between pt-0.5">
            {ORB_COLORS.map((orb, idx) => {
              const isSelected = idx === activeOrb;
              return (
                <button
                  type="button"
                  key={orb.hex}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveOrb(idx);
                  }}
                  className="p-0.5 rounded-full cursor-pointer transition-transform duration-150 hover:scale-125 active:scale-95"
                  aria-label={`Select ${orb.name}`}
                >
                  <span
                    className="block h-3.5 w-3.5 rounded-full transition-all duration-200"
                    style={{
                      backgroundColor: orb.hex,
                      boxShadow: isSelected
                        ? `0 0 12px ${orb.hex}, 0 0 4px #ffffff`
                        : `0 0 6px ${orb.hex}66`,
                      transform: isSelected ? "scale(1.2)" : "scale(1)",
                      outline: isSelected ? "1.5px solid #ffffff" : "none",
                      outlineOffset: "1.5px",
                    }}
                  />
                </button>
              );
            })}
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
  const {
    containerRef,
    stageRef,
    glowRef,
    initialTransform,
    handlePointerMove,
    handlePointerEnter,
    handlePointerLeave,
  } = useFast3DTilt(0, 0, 10);

  return (
    <div
      ref={containerRef}
      onPointerMove={handlePointerMove}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      className={`group relative flex flex-col justify-between overflow-hidden rounded-[18px] sm:rounded-[20px] lg:rounded-[18px] xl:rounded-[22px] border border-white/[0.08] bg-[#0b0916] transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-purple-400/40 hover:shadow-[0_12px_36px_-8px_rgba(139,92,246,0.22)] ${className}`}
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
        className={`relative w-full ${stageHeight} flex items-center justify-center overflow-hidden select-none`}
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

      {/* Bottom Typography: Seamless flow with zero horizontal divider lines */}
      <div className="relative z-10 flex flex-col justify-start px-4.5 pb-3.5 pt-2 sm:px-5 sm:pb-4 sm:pt-2.5 lg:px-5 lg:pb-3.5 lg:pt-2 [@media(max-height:760px)]:pb-2.5 [@media(max-height:760px)]:pt-1.5">
        <h3 className="text-[15.5px] sm:text-[17px] lg:text-[16px] xl:text-[17.5px] font-semibold tracking-tight text-white leading-snug antialiased transition-colors duration-300 group-hover:text-purple-200">
          {title}
        </h3>
        <p className="mt-1 text-[12px] sm:text-[13px] lg:text-[12.5px] xl:text-[13px] text-slate-400 leading-relaxed font-normal antialiased">
          {description}
        </p>
      </div>
    </div>
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
      className="relative border-t border-line min-h-[calc(100svh-3.75rem)] min-h-[calc(100dvh-3.75rem)] min-h-[calc(100vh-3.75rem)] flex flex-col justify-center py-5 sm:py-6 lg:py-5 xl:py-8 [@media(max-height:760px)]:py-3 bg-bg overflow-hidden text-white scroll-mt-16"
    >
      {/* Background ambient lighting matching Hero and EditorMockup */}
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_35%,rgba(139,92,246,0.06)_0%,rgba(124,58,237,0.02)_40%,transparent_70%)]"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 w-full">
        {/* Top Row: 40% / 60% Bento Split */}
        <div className="grid grid-cols-1 gap-3.5 sm:gap-4 lg:gap-3.5 xl:gap-4.5 [@media(max-height:760px)]:gap-2.5 lg:grid-cols-12">
          {/* Card 1: Drop & Auto-Transcribe (40% width) */}
          <FeatureCard
            className="lg:col-span-5"
            stageHeight="h-[165px] sm:h-[185px] lg:h-[175px] xl:h-[205px] [@media(max-height:760px)]:h-[150px]"
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
            stageHeight="h-[165px] sm:h-[185px] lg:h-[175px] xl:h-[205px] [@media(max-height:760px)]:h-[150px]"
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
        <div className="mt-3.5 sm:mt-4 lg:mt-3.5 xl:mt-4.5 [@media(max-height:760px)]:mt-2.5 grid grid-cols-1 gap-3.5 sm:gap-4 lg:gap-3.5 xl:gap-4.5 [@media(max-height:760px)]:gap-2.5 md:grid-cols-3">
          {/* Card 3: Viral Creator Presets */}
          <FeatureCard
            stageHeight="h-[145px] sm:h-[160px] lg:h-[150px] xl:h-[180px] [@media(max-height:760px)]:h-[135px]"
            title={items[2]?.title || "Viral Creator Presets"}
            description={
              items[2]?.body ||
              "One-click presets: TikTok Viral, MrBeast Badge, and Karaoke Glow."
            }
          >
            <ViralPresetsGraphic />
          </FeatureCard>

          {/* Card 4: 9:16, 16:9 & 1:1 Preview */}
          <FeatureCard
            stageHeight="h-[145px] sm:h-[160px] lg:h-[150px] xl:h-[180px] [@media(max-height:760px)]:h-[135px]"
            title={items[3]?.title || "9:16, 16:9 & 1:1 Preview"}
            description={
              items[3]?.body ||
              "Instant aspect switching for TikTok, Reels, Shorts, and YouTube."
            }
          >
            <MultiRatioGraphic />
          </FeatureCard>

          {/* Card 5: Font Size & Highlight Colors */}
          <FeatureCard
            stageHeight="h-[145px] sm:h-[160px] lg:h-[150px] xl:h-[180px] [@media(max-height:760px)]:h-[135px]"
            title={items[4]?.title || "Font Size & Highlight Colors"}
            description={
              items[4]?.body ||
              "Quick font size slider and high-contrast signature highlight colors."
            }
          >
            <StyleColorsGraphic />
          </FeatureCard>
        </div>
      </div>
    </section>
  );
}