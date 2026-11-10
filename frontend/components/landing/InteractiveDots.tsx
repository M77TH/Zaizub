"use client";

import { useEffect, useRef } from "react";

const DOT_COLOR = "255, 255, 255";
const BASE_FILL = `rgba(${DOT_COLOR}, 0.04)`;
const DOT_SPACING = 28;
const MOUSE_RADIUS = 72;
const MOUSE_RADIUS_SQ = MOUSE_RADIUS * MOUSE_RADIUS;
const TWO_PI = Math.PI * 2;
const POINTER_IDLE_MS = 140;

export default function InteractiveDots() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    const baseCanvas = document.createElement("canvas");
    const baseContext = baseCanvas.getContext("2d");

    const mouse = {
      x: 0,
      y: 0,
      clientX: 0,
      clientY: 0,
      active: false,
      hasPosition: false,
      lastMoveTime: 0,
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

    const createDots = (pixelRatio: number) => {
      const cols = Math.max(0, Math.ceil((width - DOT_SPACING / 2) / DOT_SPACING));
      const rows = Math.max(0, Math.ceil((height - DOT_SPACING / 2) / DOT_SPACING));
      dotCount = cols * rows;
      dots = new Float32Array(dotCount * 6);

      baseCanvas.width = Math.max(1, Math.floor(width * pixelRatio));
      baseCanvas.height = Math.max(1, Math.floor(height * pixelRatio));
      if (baseContext) {
        baseContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
        baseContext.clearRect(0, 0, width, height);
        baseContext.beginPath();
      }

      let idx = 0;
      for (let y = DOT_SPACING / 2; y < height; y += DOT_SPACING) {
        for (let x = DOT_SPACING / 2; x < width; x += DOT_SPACING) {
          dots[idx] = x;
          dots[idx + 1] = y;
          if (baseContext) {
            baseContext.moveTo(x + 0.9, y);
            baseContext.arc(x, y, 0.9, 0, TWO_PI);
          }
          idx += 6;
        }
      }

      if (baseContext) {
        baseContext.fillStyle = BASE_FILL;
        baseContext.fill();
      }
    };

    // Temporary buffer for dots that are displaced or within mouse proximity
    const activeIndices: number[] = [];
    const activeOpacities: number[] = [];

    const draw = () => {
      animationFrame = 0;
      if (!isVisible) return;

      const now = performance.now();
      const pointerRecentlyMoved = now - mouse.lastMoveTime < POINTER_IDLE_MS;
      const mouseActive = mouse.active && pointerRecentlyMoved && !reducedMotion;

      context.clearRect(0, 0, width, height);
      if (baseCanvas.width > 0 && baseCanvas.height > 0) {
        context.drawImage(baseCanvas, 0, 0, width, height);
      }

      activeIndices.length = 0;
      activeOpacities.length = 0;
      let anyMoving = false;

      const mx = mouse.x;
      const my = mouse.y;

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
          if (dx > -MOUSE_RADIUS && dx < MOUSE_RADIUS) {
            const dy = y - my;
            if (dy > -MOUSE_RADIUS && dy < MOUSE_RADIUS) {
              const distSq = dx * dx + dy * dy;
              if (distSq > 0 && distSq < MOUSE_RADIUS_SQ) {
                const distanceToMouse = Math.sqrt(distSq);
                proximity = 1 - distanceToMouse / MOUSE_RADIUS;
                const wave = Math.sin(now * 0.0035 - distanceToMouse * 0.06);
                const force = proximity * (8.5 + 1.5 * wave);
                targetX = (dx / distanceToMouse) * force;
                targetY = (dy / distanceToMouse) * force;
              }
            }
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

        if (proximity > 0.005 || offsetX !== 0 || offsetY !== 0) {
          activeIndices.push(base);
          activeOpacities.push(0.04 + proximity * 0.2);
          // Erase the static base dot at its resting coordinate before drawing the displaced dot
          context.clearRect(x - 1.5, y - 1.5, 3, 3);
        }
      }

      // Draw only the ~15-25 proximity-highlighted / displaced dots individually
      for (let k = 0; k < activeIndices.length; k++) {
        const base = activeIndices[k];
        const drawX = dots[base] + dots[base + 2];
        const drawY = dots[base + 1] + dots[base + 3];
        context.beginPath();
        context.arc(drawX, drawY, 0.9, 0, TWO_PI);
        context.fillStyle = `rgba(${DOT_COLOR}, ${activeOpacities[k].toFixed(3)})`;
        context.fill();
      }

      // Continuously animate only while pointer is actively moving or dots are settling back to rest
      if (!reducedMotion && isVisible && (anyMoving || mouseActive) && !animationFrame) {
        animationFrame = window.requestAnimationFrame(draw);
      }
    };

    let isTicking = false;
    const safeDraw = () => {
      isTicking = true;
      try {
        draw();
      } finally {
        isTicking = false;
      }
    };

    const wake = () => {
      if (!animationFrame && isVisible && !reducedMotion && !isTicking) {
        animationFrame = window.requestAnimationFrame(safeDraw);
      }
    };

    const resize = () => {
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
      const rect = canvas.parentElement?.getBoundingClientRect();
      width = rect?.width || window.innerWidth;
      height = rect?.height || window.innerHeight;

      canvas.width = Math.floor(width * pixelRatio);
      canvas.height = Math.floor(height * pixelRatio);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      updateCanvasBounds();
      createDots(pixelRatio);
      draw();
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (!isVisible || reducedMotion) return;
      mouse.clientX = event.clientX;
      mouse.clientY = event.clientY;
      mouse.hasPosition = true;
      mouse.lastMoveTime = performance.now();
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
        if (mouse.active) {
          mouse.lastMoveTime = performance.now();
          wake();
        }
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
        handlePointerLeave();
        if (animationFrame) {
          window.cancelAnimationFrame(animationFrame);
          animationFrame = 0;
        }
      } else if (isVisible) {
        handlePointerLeave();
        draw();
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
