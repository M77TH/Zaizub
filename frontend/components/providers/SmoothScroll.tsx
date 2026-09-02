"use client";

import { useEffect, createContext, useContext, useRef, useState, type ReactNode } from "react";
import Lenis from "lenis";

type LenisContextType = {
  lenis: Lenis | null;
};

const LenisContext = createContext<LenisContextType>({ lenis: null });

export const useLenis = () => useContext(LenisContext);

/**
 * Smooth mouse-wheel scrolling for fixed-height panels (editor sidebars etc).
 *
 * Returns:
 *   ref      — attach to the scrollable div
 *   scrollTo — imperative handle: cancels any running animation and jumps to position instantly.
 *              Call this for programmatic scrolls so they don't fight the easing loop.
 *
 * Design rules:
 *   • `target` and `rafId` live inside ONE useEffect closure — scrollTo and the wheel handler
 *     always share the same mutable values, so there is no way for a running animation to
 *     snap-back after a programmatic scroll.
 *   • stopPropagation blocks Lenis (the global page smooth-scroll) from eating wheel events.
 */
export function useSmoothScrollElement<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  // scrollTo lives in a ref so callers always get the latest closure without re-renders
  const scrollTo = useRef<(top: number, smooth?: boolean) => void>(() => {});

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let target = el.scrollTop;
    let rafId: number | null = null;

    // Easing animation — runs until target is reached
    const animate = () => {
      const diff = target - el.scrollTop;
      if (Math.abs(diff) < 0.5) {
        el.scrollTop = target;
        rafId = null;
        return;
      }
      el.scrollTop += diff * 0.16;
      rafId = requestAnimationFrame(animate);
    };

    // Wheel handler: block Lenis, accumulate delta into target, start animation
    const onWheel = (e: WheelEvent) => {
      e.stopPropagation(); // prevent Lenis from scrolling the page
      e.preventDefault();
      target = Math.max(0, Math.min(el.scrollHeight - el.clientHeight, target + e.deltaY));
      if (rafId === null) rafId = requestAnimationFrame(animate);
    };

    // Imperative scrollTo: can glide smoothly with easing or jump instantly
    scrollTo.current = (top: number, smooth: boolean = true) => {
      target = Math.max(0, Math.min(el.scrollHeight - el.clientHeight, top));
      if (rafId !== null) { cancelAnimationFrame(rafId); rafId = null; }
      if (smooth) {
        rafId = requestAnimationFrame(animate);
      } else {
        el.scrollTop = target;
      }
    };

    const onScroll = () => {
      // If no RAF animation is actively driving the scroll, sync target to actual scrollTop
      // This completely eliminates rubber-banding / fighting when user drags the scrollbar thumb!
      if (rafId === null) {
        target = el.scrollTop;
      }
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      el.removeEventListener('wheel', onWheel);
      el.removeEventListener('scroll', onScroll);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, []);

  return { ref, scrollTo };
}


export default function SmoothScroll({ children }: { children: ReactNode }) {
  const [lenis, setLenis] = useState<Lenis | null>(null);

  useEffect(() => {
    // Respect prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    const lenisInstance = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: "vertical",
      gestureOrientation: "vertical",
      smoothWheel: true,
      wheelMultiplier: 1.05,
      touchMultiplier: 1.5,
    });

    setLenis(lenisInstance);
    (window as unknown as { __lenis?: Lenis }).__lenis = lenisInstance;

    let rafId: number;
    function raf(time: number) {
      lenisInstance.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    // Global interceptor for in-page anchor links
    const handleAnchorClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      const anchor = target?.closest("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href || !href.startsWith("#") || href === "#") return;

      if (href === "#top") {
        e.preventDefault();
        lenisInstance.scrollTo(0, { duration: 1.2 });
        return;
      }

      const targetElement = document.querySelector(href);
      if (targetElement) {
        e.preventDefault();
        lenisInstance.scrollTo(targetElement as HTMLElement, { offset: -70, duration: 1.2 });
      }
    };

    document.addEventListener("click", handleAnchorClick);

    return () => {
      document.removeEventListener("click", handleAnchorClick);
      cancelAnimationFrame(rafId);
      lenisInstance.destroy();
      (window as unknown as { __lenis?: Lenis }).__lenis = undefined;
    };
  }, []);

  return (
    <LenisContext.Provider value={{ lenis }}>
      {children}
    </LenisContext.Provider>
  );
}
