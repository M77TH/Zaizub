"use client";

import * as React from "react";
import ZaiZubLogo from "@/components/logo/Logo-v3";
import { footerCopy, type Lang } from "./copy";

export interface FooterLink {
  label: string;
  href?: string;
}

const SANS_STACK =
  'Geist, "Inter Tight", "Inter Variable", "Inter", "Helvetica Neue", Arial, system-ui, sans-serif';
const MONO_STACK =
  '"Geist Mono", "JetBrains Mono", "SF Mono", ui-monospace, Menlo, Consolas, monospace';

// Pure math & geometry helpers for halftone simulation
function hexToRgb(hex: string): [number, number, number] | null {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec((hex || "").trim());
  if (!m) return null;
  const h = m[1].length === 3 ? m[1].split("").map((c) => c + c).join("") : m[1];
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

function dotRadius(coverage: number, gap: number): number {
  const c = coverage < 0 ? 0 : coverage > 1 ? 1 : coverage;
  return Math.sqrt(c) * gap * 0.56;
}

function stepDot(
  x: number,
  y: number,
  vx: number,
  vy: number,
  hx: number,
  hy: number,
  px: number,
  py: number,
  r: number
): [number, number, number, number] {
  const dx = x - px;
  const dy = y - py;
  const d2 = dx * dx + dy * dy;
  if (r > 0 && d2 < r * r) {
    const d = Math.sqrt(d2) + 0.001;
    const f = (1 - d / r) * 2.6;
    vx += (dx / d) * f;
    vy += (dy / d) * f;
  }
  vx = (vx + (hx - x) * 0.05) * 0.84;
  vy = (vy + (hy - y) * 0.05) * 0.84;
  return [x + vx, y + vy, vx, vy];
}

function dotWarmth(x: number, y: number, hx: number, hy: number, span: number): number {
  const d = Math.hypot(x - hx, y - hy);
  return span > 0 ? Math.min(1, d / span) : 0;
}

function fitFontSize(measured: number, width: number): number {
  return measured > 0 ? (width / measured) * 100 : 0;
}

const FOOTER_STYLES = `
.hwf-root {
  position: relative; width: 100%; overflow: hidden; isolation: isolate;
  background: #07060a; color: #f4f2f8; -webkit-font-smoothing: antialiased;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}
.hwf-root canvas { position: absolute; inset: 0; width: 100%; height: 100%; display: block; max-width: none; }
.hwf-container {
  position: relative; z-index: 1; max-width: 80rem; margin: 0 auto;
  padding: 0 1.25rem;
}
@media (min-width: 640px) { .hwf-container { padding: 0 1.5rem; } }
@media (min-width: 1024px) { .hwf-container { padding: 0 2.5rem; } }

.hwf-bar {
  display: flex; justify-content: space-between; align-items: center;
  gap: 20px; padding-top: clamp(20px, 2.5vw, 28px);
  font-family: var(--font-display), Geist, -apple-system, sans-serif;
}
.hwf-brand { display: flex; flex-direction: column; gap: 4px; }
.hwf-brand strong { display: flex; align-items: center; gap: 8px; font-weight: 700; font-size: 16px; color: #ffffff; letter-spacing: -0.02em; }
.hwf-copy { font-family: ${MONO_STACK}; font-size: 11px; color: #71717a; letter-spacing: -0.01em; }
.hwf-nav { display: flex; align-items: center; flex-wrap: wrap; gap: 20px; }
.hwf-nav a {
  color: #a19cb0; text-decoration: none; font-size: 13px; font-weight: 400;
  transition: color 0.2s ease;
}
.hwf-nav a:hover { color: #ffffff; }
.hwf-nav a:focus-visible { outline: 1px solid #a78bfa; outline-offset: 3px; }
.hwf-up {
  color: #a19cb0; background: none; border: 0; padding: 4px 8px; border-radius: 6px;
  font-size: 11.5px; font-family: ${MONO_STACK}; cursor: pointer;
  transition: all 0.2s ease; display: inline-flex; align-items: center; gap: 3px;
}
.hwf-up:hover { color: #a78bfa; background: rgba(139, 92, 246, 0.08); }
.hwf-sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
@media (max-width: 640px) {
  .hwf-bar { flex-direction: column; align-items: flex-start; gap: 14px; }
  .hwf-nav { gap: 14px; }
}
@media (prefers-reduced-motion: reduce) {
  .hwf-nav a, .hwf-up { transition: none; }
}
`;

export default function Footer({ lang = "en" }: { lang?: Lang }) {
  const t = footerCopy[lang] || footerCopy.en;

  const links: FooterLink[] = [
    { label: t.terms, href: "#" },
    { label: t.privacy, href: "#" },
    { label: t.support, href: "#" },
  ];

  const wordmark = "zaizub";
  const label = "Zaizub";
  const height = "260px";
  const dotGap = 6;
  const radius = 85;
  const crop = 0.18;
  const grain = 0.25;
  const interactive = true;
  const fontFamily = SANS_STACK;
  const fontWeight = 800;

  const colors = {
    background: "#07060a",
    ink: "#2d2746",
    warm: "#c084fc",
  };

  const rootRef = React.useRef<HTMLElement | null>(null);
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const opts = React.useRef({ colors, dotGap, radius, crop, grain, interactive, fontFamily, fontWeight, wordmark });
  opts.current = { colors, dotGap, radius, crop, grain, interactive, fontFamily, fontWeight, wordmark };

  React.useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    if (!root || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let w = 0;
    let h = 0;
    let dpr = 1;
    let px = -1e5;
    let py = -1e5;
    let raf = 0;
    let visible = true;
    let awake = true;
    let ring = { x: 0, y: 0, t: -1 };
    let dots = new Float32Array(0);
    let count = 0;
    let grainPattern: CanvasPattern | null = null;
    let cachedRect: DOMRect | null = null;
    const ink = hexToRgb(opts.current.colors.ink) || [45, 39, 70];
    const warm = hexToRgb(opts.current.colors.warm) || [192, 132, 252];

    const layout = () => {
      const o = opts.current;
      const rect = root.getBoundingClientRect();
      cachedRect = rect;
      w = Math.max(1, Math.round(rect.width));
      h = Math.max(1, Math.round(rect.height));
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);

      const mask = document.createElement("canvas");
      mask.width = w;
      mask.height = h;
      const m = mask.getContext("2d", { willReadFrequently: true });
      if (!m) return;
      const face = o.fontWeight + " 100px " + o.fontFamily;
      m.font = face;
      const word = o.wordmark || " ";
      const targetWidth = Math.min(w * 0.72, 780);
      const fit = fitFontSize(m.measureText(word).width, targetWidth);
      m.font = o.fontWeight + " " + fit + "px " + o.fontFamily;
      const box = m.measureText(word);
      const cap = box.actualBoundingBoxAscent || fit * 0.72;
      const c = Math.max(0, Math.min(0.6, o.crop));
      m.fillStyle = "#000";
      m.textBaseline = "alphabetic";
      m.fillText(word, (w - box.width) / 2, h + cap * (c + 0.02));
      const img = m.getImageData(0, 0, w, h).data;

      const gap = Math.max(3, o.dotGap);
      const cols = Math.ceil(w / gap);
      const rows = Math.ceil(h / gap);
      const tmp: number[] = [];
      for (let gy = 0; gy < rows; gy++) {
        for (let gx = 0; gx < cols; gx++) {
          let sum = 0;
          for (let sy = 0; sy < 3; sy++) {
            for (let sx = 0; sx < 3; sx++) {
              const x = Math.min(w - 1, Math.floor(gx * gap + ((sx + 0.5) * gap) / 3));
              const y = Math.min(h - 1, Math.floor(gy * gap + ((sy + 0.5) * gap) / 3));
              sum += img[(y * w + x) * 4 + 3];
            }
          }
          const cov = sum / (9 * 255);
          if (cov < 0.06) continue;
          const hx = gx * gap + gap / 2;
          const hy = gy * gap + gap / 2;
          tmp.push(hx, hy, 0, 0, hx, hy, dotRadius(cov, gap));
        }
      }
      dots = new Float32Array(tmp);
      count = tmp.length / 7;

      if (!grainPattern) {
        const grainTile = document.createElement("canvas");
        grainTile.width = 256;
        grainTile.height = 256;
        const g = grainTile.getContext("2d");
        if (g) {
          const id = g.createImageData(256, 256);
          for (let i = 0; i < id.data.length; i += 4) {
            const v = Math.random() * 255;
            id.data[i] = id.data[i + 1] = id.data[i + 2] = v;
            id.data[i + 3] = Math.random() < 0.5 ? 0 : 255;
          }
          g.putImageData(id, 0, 0);
        }
        grainPattern = ctx.createPattern(grainTile, "repeat");
      }
      awake = true;
    };

    const warmIndices: number[] = [];
    const warmValues: number[] = [];

    const draw = (now: number) => {
      const o = opts.current;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = o.colors.background;
      ctx.fillRect(0, 0, w, h);

      const r = o.interactive && !reduced ? Math.max(0, o.radius) : 0;
      const ringAge = ring.t < 0 ? 1e9 : now - ring.t;
      const ringR = ringAge * 0.9;
      let moving = false;
      warmIndices.length = 0;
      warmValues.length = 0;

      ctx.fillStyle = o.colors.ink;
      ctx.beginPath();

      for (let i = 0; i < count; i++) {
        const j = i * 7;
        let x = dots[j];
        let y = dots[j + 1];
        let vx = dots[j + 2];
        let vy = dots[j + 3];
        const hx = dots[j + 4];
        const hy = dots[j + 5];
        if (!reduced) {
          if (ringAge < 900) {
            const dx = hx - ring.x;
            const dy = hy - ring.y;
            const d = Math.sqrt(dx * dx + dy * dy) + 0.001;
            const band = 1 - Math.min(1, Math.abs(d - ringR) / 26);
            if (band > 0) {
              const f = band * 3.2 * (1 - ringAge / 900);
              vx += (dx / d) * f;
              vy += (dy / d) * f;
            }
          }
          const s = stepDot(x, y, vx, vy, hx, hy, px, py, r);
          x = s[0];
          y = s[1];
          const speed = Math.abs(vx) + Math.abs(vy);
          if (speed > 0.015) {
            moving = true;
          } else {
            vx = 0;
            vy = 0;
            if (px < -1e4) {
              x = hx;
              y = hy;
            }
          }
          dots[j] = x;
          dots[j + 1] = y;
          dots[j + 2] = vx;
          dots[j + 3] = vy;
        }
        const k = dotWarmth(x, y, hx, hy, 28);
        if (k > 0.02) {
          warmIndices.push(j);
          warmValues.push(k);
        } else {
          const rad = dots[j + 6];
          ctx.moveTo(x + rad, y);
          ctx.arc(x, y, rad, 0, 6.2832);
        }
      }

      ctx.fill();

      for (let m = 0; m < warmIndices.length; m++) {
        const j = warmIndices[m];
        const k = warmValues[m];
        ctx.fillStyle =
          "rgb(" +
          Math.round(ink[0] + (warm[0] - ink[0]) * k) +
          "," +
          Math.round(ink[1] + (warm[1] - ink[1]) * k) +
          "," +
          Math.round(ink[2] + (warm[2] - ink[2]) * k) +
          ")";
        ctx.beginPath();
        ctx.arc(dots[j], dots[j + 1], dots[j + 6], 0, 6.2832);
        ctx.fill();
      }

      if (grainPattern && o.grain > 0) {
        ctx.globalAlpha = Math.min(1, o.grain) * 0.07;
        ctx.globalCompositeOperation = "overlay";
        ctx.fillStyle = grainPattern;
        ctx.fillRect(0, 0, w, h);
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = "source-over";
      }
      awake = moving || ringAge < 900;
    };

    const loop = (now: number) => {
      raf = 0;
      if (!visible) return;
      draw(now);
      if (awake) raf = requestAnimationFrame(loop);
    };

    const wake = () => {
      awake = true;
      if (!raf && visible) raf = requestAnimationFrame(loop);
    };

    const toLocal = (e: PointerEvent) => {
      const b = cachedRect || (cachedRect = canvas.getBoundingClientRect());
      return [e.clientX - b.left, e.clientY - b.top];
    };
    const onEnter = () => {
      cachedRect = canvas.getBoundingClientRect();
    };
    const onMove = (e: PointerEvent) => {
      if (!opts.current.interactive) return;
      const p = toLocal(e);
      px = p[0];
      py = p[1];
      wake();
    };
    const onLeave = () => {
      cachedRect = null;
      px = -1e5;
      py = -1e5;
      wake();
    };
    const onDown = (e: PointerEvent) => {
      if (!opts.current.interactive || reduced) return;
      if ((e.target as HTMLElement).closest("a,button")) return;
      cachedRect = canvas.getBoundingClientRect();
      const p = toLocal(e);
      ring = { x: p[0], y: p[1], t: performance.now() };
      wake();
    };

    layout();
    draw(performance.now());
    wake();

    root.addEventListener("pointerenter", onEnter);
    root.addEventListener("pointermove", onMove);
    root.addEventListener("pointerleave", onLeave);
    root.addEventListener("pointerdown", onDown);
    const ro = new ResizeObserver(() => {
      layout();
      wake();
    });
    ro.observe(root);
    const io = new IntersectionObserver((entries) => {
      visible = entries[0] ? entries[0].isIntersecting : true;
      if (visible) wake();
    });
    io.observe(root);

    const handleVisibility = () => {
      if (document.hidden) {
        visible = false;
        if (raf) cancelAnimationFrame(raf);
      } else {
        visible = true;
        wake();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    let alive = true;
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        if (!alive) return;
        layout();
        wake();
      });
    }

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", handleVisibility);
      root.removeEventListener("pointerenter", onEnter);
      root.removeEventListener("pointermove", onMove);
      root.removeEventListener("pointerleave", onLeave);
      root.removeEventListener("pointerdown", onDown);
    };
  }, []);

  const toTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer
      ref={rootRef}
      className="hwf-root"
      style={{ height } as React.CSSProperties}
    >
      <style>{FOOTER_STYLES}</style>

      {/* Subtle ambient violet glow rising from bottom matching Hero & Editor */}
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_75%_55%_at_50%_100%,rgba(139,92,246,0.12)_0%,rgba(109,40,217,0.04)_45%,transparent_75%)]"
        aria-hidden="true"
      />

      <canvas ref={canvasRef} aria-hidden="true" />
      <span className="hwf-sr">{wordmark}</span>

      <div className="hwf-container">
        <div className="hwf-bar">
          <div className="hwf-brand">
            <strong>
              <ZaiZubLogo size={22} />
              <span>{label}</span>
            </strong>
            <span className="hwf-copy">
              © {new Date().getFullYear()} {label}. {t.tagline}
            </span>
          </div>

          <nav className="hwf-nav" aria-label="Footer links">
            {links.map((l) => (
              <a
                key={l.label}
                href={l.href || "#"}
                onClick={(e) => {
                  if (!l.href || l.href === "#") {
                    e.preventDefault();
                  }
                }}
              >
                {l.label}
              </a>
            ))}
            <button type="button" className="hwf-up" onClick={toTop}>
              Back to top ↑
            </button>
          </nav>
        </div>
      </div>
    </footer>
  );
}
