"use client";

import { useEffect, useRef } from "react";

const DOT_COLOR = "255, 255, 255";
const BASE_FILL = `rgba(${DOT_COLOR}, 0.04)`;
const DOT_SPACING = 28;
const MOUSE_RADIUS = 72;
const MOUSE_RADIUS_SQ = MOUSE_RADIUS * MOUSE_RADIUS;
const TWO_PI = Math.PI * 2;

export default function InteractiveDots() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    const mouse = {
      x: 0,
      y: 0,
      clientX: 0,
      clientY: 0,
      active: false,
      hasPosition: false,
    };

    // Flat Float32Array: [x, y, offsetX, offsetY, velocityX, velocityY] per dot (stride 6)
    let dots = new Float32Array(0);
    let dotCount = 0;
    let animationFrame = 0;
    let width = 0;
    let height = 0;
    let canvasLeft = 0;
    let canvasTop = 0;
    let reducedMotion = false;
    let isVisible = true;

    let cachedDocTop = 0;
    let cachedDocLeft = 0;

    const updateCanvasBounds = () => {
      const bounds = canvas.getBoundingClientRect();
      cachedDocLeft = bounds.left + window.scrollX;
      cachedDocTop = bounds.top + window.scrollY;
      canvasLeft = bounds.left;
      canvasTop = bounds.top;
    };

    const syncMouseLocal = () => {
      if (!mouse.hasPosition) return;
      mouse.x = mouse.clientX - canvasLeft;
      mouse.y = mouse.clientY - canvasTop;
      mouse.active =
        mouse.x >= -MOUSE_RADIUS &&
        mouse.x <= width + MOUSE_RADIUS &&
        mouse.y >= -MOUSE_RADIUS &&
        mouse.y <= height + MOUSE_RADIUS;
    };

    const createDots = () => {
      const cols = Math.max(0, Math.ceil((width - DOT_SPACING / 2) / DOT_SPACING));
      const rows = Math.max(0, Math.ceil((height - DOT_SPACING / 2) / DOT_SPACING));
      dotCount = cols * rows;
      dots = new Float32Array(dotCount * 6);

      let idx = 0;
      for (let y = DOT_SPACING / 2; y < height; y += DOT_SPACING) {
        for (let x = DOT_SPACING / 2; x < width; x += DOT_SPACING) {
          dots[idx] = x;
          dots[idx + 1] = y;
          idx += 6;
        }
      }
    };

    // Temporary buffer for dots within mouse proximity that need custom opacity
    const activeIndices: number[] = [];
    const activeOpacities: number[] = [];

    const draw = () => {
      animationFrame = 0;
      if (!isVisible) return;

      context.clearRect(0, 0, width, height);

      activeIndices.length = 0;
      activeOpacities.length = 0;
      let anyMoving = false;

      const mx = mouse.x;
      const my = mouse.y;
      const mouseActive = mouse.active && !reducedMotion;

      // Batch all base-opacity dots into a single canvas path (1 draw call instead of ~2,200)
      context.beginPath();

      for (let i = 0; i < dotCount; i++) {
        const base = i * 6;
        const x = dots[base];
        const y = dots[base + 1];
        let offsetX = dots[base + 2];
        let offsetY = dots[base + 3];
        let velocityX = dots[base + 4];
        let velocityY = dots[base + 5];

        let targetX = 0;
        let targetY = 0;
        let proximity = 0;

        if (mouseActive) {
          const dx = x - mx;
          const dy = y - my;
          const distSq = dx * dx + dy * dy;
          if (distSq > 0 && distSq < MOUSE_RADIUS_SQ) {
            const distanceToMouse = Math.sqrt(distSq);
            proximity = 1 - distanceToMouse / MOUSE_RADIUS;
            const force = proximity * 9;
            targetX = (dx / distanceToMouse) * force;
            targetY = (dy / distanceToMouse) * force;
          }
        }

        if (!reducedMotion && (proximity > 0 || offsetX !== 0 || offsetY !== 0 || velocityX !== 0 || velocityY !== 0)) {
          velocityX = (velocityX + (targetX - offsetX) * 0.08) * 0.82;
          velocityY = (velocityY + (targetY - offsetY) * 0.08) * 0.82;
          offsetX += velocityX;
          offsetY += velocityY;

          if (
            Math.abs(velocityX) + Math.abs(velocityY) > 0.004 ||
            Math.abs(offsetX) + Math.abs(offsetY) > 0.02
          ) {
            anyMoving = true;
          } else {
            offsetX = 0;
            offsetY = 0;
            velocityX = 0;
            velocityY = 0;
          }

          dots[base + 2] = offsetX;
          dots[base + 3] = offsetY;
          dots[base + 4] = velocityX;
          dots[base + 5] = velocityY;
        }

        const drawX = x + offsetX;
        const drawY = y + offsetY;

        if (proximity > 0.005) {
          activeIndices.push(base);
          activeOpacities.push(0.04 + proximity * 0.2);
        } else {
          context.moveTo(drawX + 0.9, drawY);
          context.arc(drawX, drawY, 0.9, 0, TWO_PI);
        }
      }

      context.fillStyle = BASE_FILL;
      context.fill();

      // Draw only the ~15-25 proximity-highlighted dots individually
      for (let k = 0; k < activeIndices.length; k++) {
        const base = activeIndices[k];
        const drawX = dots[base] + dots[base + 2];
        const drawY = dots[base + 1] + dots[base + 3];
        context.beginPath();
        context.arc(drawX, drawY, 0.9, 0, TWO_PI);
        context.fillStyle = `rgba(${DOT_COLOR}, ${activeOpacities[k].toFixed(3)})`;
        context.fill();
      }

      // Sleep automatically once all dots settle back to rest
      if (!reducedMotion && isVisible && anyMoving) {
        animationFrame = window.requestAnimationFrame(draw);
      }
    };

    const wake = () => {
      if (!animationFrame && isVisible && !reducedMotion) {
        animationFrame = window.requestAnimationFrame(draw);
      }
    };

    const resize = () => {
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.parentElement?.getBoundingClientRect();
      width = rect?.width || window.innerWidth;
      height = rect?.height || window.innerHeight;

      canvas.width = Math.floor(width * pixelRatio);
      canvas.height = Math.floor(height * pixelRatio);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      updateCanvasBounds();
      createDots();
      draw();
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (!isVisible || reducedMotion) return;
      mouse.clientX = event.clientX;
      mouse.clientY = event.clientY;
      mouse.hasPosition = true;
      syncMouseLocal();
      if (mouse.active) {
        wake();
      }
    };

    const handleScroll = () => {
      if (!isVisible) return;
      canvasLeft = cachedDocLeft - window.scrollX;
      canvasTop = cachedDocTop - window.scrollY;
      if (mouse.hasPosition) {
        syncMouseLocal();
        if (mouse.active) wake();
      }
    };

    const handlePointerLeave = () => {
      mouse.active = false;
      mouse.hasPosition = false;
      wake();
    };

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handleMotionPreference = () => {
      reducedMotion = motionQuery.matches;
      if (animationFrame) {
        window.cancelAnimationFrame(animationFrame);
        animationFrame = 0;
      }
      draw();
    };

    reducedMotion = motionQuery.matches;
    resize();

    // IntersectionObserver to pause loop when scrolled offscreen
    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry.isIntersecting;
        if (isVisible) {
          updateCanvasBounds();
          draw();
        } else if (animationFrame) {
          window.cancelAnimationFrame(animationFrame);
          animationFrame = 0;
        }
      },
      { threshold: 0.05 }
    );

    intersectionObserver.observe(canvas);

    const handleVisibility = () => {
      if (document.hidden) {
        if (animationFrame) {
          window.cancelAnimationFrame(animationFrame);
          animationFrame = 0;
        }
      } else if (isVisible) {
        wake();
      }
    };

    window.addEventListener("resize", resize, { passive: true });
    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("blur", handlePointerLeave);
    document.addEventListener("visibilitychange", handleVisibility);
    motionQuery.addEventListener("change", handleMotionPreference);

    return () => {
      intersectionObserver.disconnect();
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("blur", handlePointerLeave);
      document.removeEventListener("visibilitychange", handleVisibility);
      motionQuery.removeEventListener("change", handleMotionPreference);
    };
  }, []);

  return <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 z-0" aria-hidden="true" />;
}
