"use client";

import { useEffect, useRef, useState, useCallback, type RefObject } from "react";
import { useLenis } from "@/components/providers/SmoothScroll";

type CustomScrollbarProps = {
  scrollRef?: RefObject<HTMLElement | null>;
};

export default function CustomScrollbar({ scrollRef }: CustomScrollbarProps) {
  const { lenis } = useLenis();
  const [hasScrollbar, setHasScrollbar] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const thumbRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const thumbStateRef = useRef({ height: 0, top: 0, maxScroll: 0, maxThumbTop: 0 });

  const applyThumbTransform = useCallback((top: number, height?: number) => {
    const thumbEl = thumbRef.current;
    if (!thumbEl) return;
    if (height !== undefined) {
      thumbEl.style.height = `${height}px`;
    }
    thumbEl.style.transform = `translate3d(0, ${top}px, 0)`;
    if (trackRef.current) {
      trackRef.current.setAttribute("aria-valuenow", String(Math.round(top)));
    }
  }, []);

  // Fast scroll-only update: reads only scrollY/scrollTop, zero layout reflow, zero React re-renders
  const updatePosition = useCallback(() => {
    if (typeof window === "undefined") return;
    const { maxScroll, maxThumbTop, height } = thumbStateRef.current;
    if (maxScroll <= 0 || height <= 0) return;

    const scrollElement = scrollRef?.current;
    const currentScrollY = scrollElement
      ? scrollElement.scrollTop
      : lenis
      ? lenis.scroll
      : window.scrollY;
    const progress = Math.min(Math.max(currentScrollY / maxScroll, 0), 1);
    const top = progress * maxThumbTop;

    thumbStateRef.current.top = top;
    applyThumbTransform(top);
  }, [scrollRef, lenis, applyThumbTransform]);

  // Dimension measurement: only runs on mount / ResizeObserver / window resize
  const updateGeometry = useCallback(() => {
    if (typeof window === "undefined") return;

    const scrollElement = scrollRef?.current;
    const docHeight = scrollElement?.scrollHeight ?? document.documentElement.scrollHeight;
    const viewportHeight = scrollElement?.clientHeight ?? window.innerHeight;
    const maxScroll = Math.max(docHeight - viewportHeight, 0);

    if (maxScroll <= 0) {
      thumbStateRef.current = { height: 0, top: 0, maxScroll: 0, maxThumbTop: 0 };
      setHasScrollbar(false);
      return;
    }

    const trackHeight = viewportHeight;
    const height = Math.max(
      Math.min((viewportHeight / docHeight) * trackHeight, 110),
      56
    );
    const maxThumbTop = Math.max(trackHeight - height, 0);
    const currentScrollY = scrollElement
      ? scrollElement.scrollTop
      : lenis
      ? lenis.scroll
      : window.scrollY;
    const progress = Math.min(Math.max(currentScrollY / maxScroll, 0), 1);
    const top = progress * maxThumbTop;

    thumbStateRef.current = { height, top, maxScroll, maxThumbTop };
    setHasScrollbar(true);
    applyThumbTransform(top, height);
  }, [scrollRef, lenis, applyThumbTransform]);

  // Sync initial style when thumb mounts after hasScrollbar becomes true
  useEffect(() => {
    if (hasScrollbar) {
      const { top, height } = thumbStateRef.current;
      applyThumbTransform(top, height);
    }
  }, [hasScrollbar, applyThumbTransform]);

  useEffect(() => {
    const handleScroll = () => {
      if (isDraggingRef.current) return;
      updatePosition();
    };

    const initialUpdate = window.requestAnimationFrame(updateGeometry);

    const scrollElement = scrollRef?.current;
    let lenisUnsubscribe: (() => void) | undefined;

    if (scrollElement) {
      scrollElement.addEventListener("scroll", handleScroll, { passive: true });
    } else if (lenis) {
      lenis.on("scroll", handleScroll);
      lenisUnsubscribe = () => lenis.off("scroll", handleScroll);
    } else {
      window.addEventListener("scroll", handleScroll, { passive: true });
    }

    window.addEventListener("resize", updateGeometry, { passive: true });

    const observer = new ResizeObserver(updateGeometry);
    if (scrollElement) {
      observer.observe(scrollElement);
    } else {
      observer.observe(document.documentElement);
    }

    return () => {
      window.cancelAnimationFrame(initialUpdate);
      if (scrollElement) scrollElement.removeEventListener("scroll", handleScroll);
      else window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", updateGeometry);
      lenisUnsubscribe?.();
      observer.disconnect();
    };
  }, [updateGeometry, updatePosition, lenis, scrollRef]);

  // Handle thumb dragging
  const handleThumbPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    const startY = e.clientY;
    const startTop = thumbStateRef.current.top;
    const { maxThumbTop, maxScroll } = thumbStateRef.current;

    if (maxThumbTop <= 0 || maxScroll <= 0) return;

    isDraggingRef.current = true;
    setIsDragging(true);
    document.body.style.userSelect = "none";
    document.body.style.cursor = "grabbing";

    const handlePointerMove = (moveEvent: PointerEvent) => {
      if (!isDraggingRef.current) return;

      const deltaY = moveEvent.clientY - startY;
      const targetTop = Math.max(0, Math.min(maxThumbTop, startTop + deltaY));
      const progress = maxThumbTop > 0 ? targetTop / maxThumbTop : 0;
      const targetScrollY = progress * maxScroll;

      thumbStateRef.current.top = targetTop;
      applyThumbTransform(targetTop);

      const scrollElement = scrollRef?.current;
      if (scrollElement) {
        scrollElement.scrollTop = targetScrollY;
      } else if (lenis) {
        lenis.scrollTo(targetScrollY, { immediate: true });
      } else {
        window.scrollTo(0, targetScrollY);
      }
    };

    const handlePointerUp = () => {
      isDraggingRef.current = false;
      setIsDragging(false);
      document.body.style.userSelect = "";
      document.body.style.cursor = "";

      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);

      updatePosition();
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);
  };

  // Handle clicking on track to scroll to position
  const handleTrackClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === thumbRef.current) return;
    const { maxThumbTop, maxScroll, height } = thumbStateRef.current;
    if (maxThumbTop <= 0 || maxScroll <= 0) return;

    const trackRect = e.currentTarget.getBoundingClientRect();
    const clickY = e.clientY - trackRect.top;
    const targetThumbTop = clickY - height / 2;
    const progress = Math.max(0, Math.min(1, targetThumbTop / maxThumbTop));
    const targetScrollY = progress * maxScroll;

    const scrollElement = scrollRef?.current;
    if (scrollElement) {
      scrollElement.scrollTop = targetScrollY;
    } else if (lenis) {
      lenis.scrollTo(targetScrollY, { duration: 1.2 });
    } else {
      window.scrollTo({ top: targetScrollY, behavior: "smooth" });
    }
  };

  if (!hasScrollbar) return null;

  return (
    <div
      ref={trackRef}
      role="scrollbar"
      aria-controls="main-content"
      aria-valuenow={Math.round(thumbStateRef.current.top)}
      aria-valuemin={0}
      aria-orientation="vertical"
      onClick={handleTrackClick}
      className={`${scrollRef ? "absolute inset-y-0 right-0 z-20" : "fixed inset-y-0 right-0 z-50"} flex w-3 select-none justify-end cursor-pointer`}
    >
      {/* Draggable Minimal Thumb */}
      <div
        ref={thumbRef}
        onPointerDown={handleThumbPointerDown}
        style={{
          height: `${thumbStateRef.current.height}px`,
          transform: `translate3d(0, ${thumbStateRef.current.top}px, 0)`,
        }}
        className={`relative w-[3px] rounded-full touch-none cursor-grab active:cursor-grabbing will-change-transform ${
          isDragging
            ? "bg-[#949494] transition-none"
            : "bg-[#525252] hover:bg-[#737373]"
        }`}
      >
        {/* Invisible wider hit area for easy mouse grabbing right at screen edge */}
        <div className="absolute -inset-x-2 inset-y-0" />
      </div>
    </div>
  );
}
