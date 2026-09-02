"use client";

import { useEffect, useRef, useState, useCallback, type RefObject } from "react";
import { useLenis } from "@/components/providers/SmoothScroll";

type CustomScrollbarProps = {
  scrollRef?: RefObject<HTMLElement | null>;
};

export default function CustomScrollbar({ scrollRef }: CustomScrollbarProps) {
  const { lenis } = useLenis();
  const [thumb, setThumb] = useState({ height: 0, top: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const thumbRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const thumbStateRef = useRef({ height: 0, top: 0, maxScroll: 0, maxThumbTop: 0 });

  const updateGeometry = useCallback(() => {
    if (typeof window === "undefined") return;

    const scrollElement = scrollRef?.current;
    const docHeight = scrollElement?.scrollHeight ?? document.documentElement.scrollHeight;
    const viewportHeight = scrollElement?.clientHeight ?? window.innerHeight;
    const maxScroll = Math.max(docHeight - viewportHeight, 0);

    if (maxScroll <= 0) {
      setThumb({ height: 0, top: 0 });
      thumbStateRef.current = { height: 0, top: 0, maxScroll: 0, maxThumbTop: 0 };
      return;
    }

    const trackHeight = viewportHeight;
    const height = Math.max(
      Math.min((viewportHeight / docHeight) * trackHeight, 110),
      56
    );
    const maxThumbTop = Math.max(trackHeight - height, 0);
    const currentScrollY = scrollElement?.scrollTop ?? window.scrollY;
    const progress = Math.min(Math.max(currentScrollY / maxScroll, 0), 1);
    const top = progress * maxThumbTop;

    thumbStateRef.current = { height, top, maxScroll, maxThumbTop };
    setThumb({ height, top });
  }, [scrollRef]);

  useEffect(() => {
    const handleScroll = () => {
      if (isDraggingRef.current) return;
      updateGeometry();
    };

    const initialUpdate = window.requestAnimationFrame(updateGeometry);

    const scrollElement = scrollRef?.current;
    if (scrollElement) scrollElement.addEventListener("scroll", handleScroll, { passive: true });
    else window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", updateGeometry);

    let lenisUnsubscribe: (() => void) | undefined;
    if (lenis) {
      lenis.on("scroll", handleScroll);
      lenisUnsubscribe = () => lenis.off("scroll", handleScroll);
    }

    const observer = new ResizeObserver(updateGeometry);
    observer.observe(document.documentElement);
    observer.observe(document.body);
    if (scrollElement) observer.observe(scrollElement);

    return () => {
      window.cancelAnimationFrame(initialUpdate);
      if (scrollElement) scrollElement.removeEventListener("scroll", handleScroll);
      else window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", updateGeometry);
      lenisUnsubscribe?.();
      observer.disconnect();
    };
  }, [updateGeometry, lenis, scrollRef]);

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

      setThumb((prev) => ({ ...prev, top: targetTop }));
      thumbStateRef.current.top = targetTop;

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

      updateGeometry();
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

  if (thumb.height === 0) return null;

  return (
    <div
      ref={trackRef}
      role="scrollbar"
      aria-controls="main-content"
      aria-valuenow={Math.round(thumb.top)}
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
          height: `${thumb.height}px`,
          transform: `translate3d(0, ${thumb.top}px, 0)`,
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
