"use client";

import { useEffect, useRef } from "react";

type Dot = {
  x: number;
  y: number;
  offsetX: number;
  offsetY: number;
  velocityX: number;
  velocityY: number;
};

const DOT_COLOR = "255, 255, 255";
const DOT_SPACING = 28;
const MOUSE_RADIUS = 72;

export default function InteractiveDots() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    const mouse = {
      x: 0,
      y: 0,
      pageX: 0,
      pageY: 0,
      active: false,
      hasPosition: false,
    };
    let dots: Dot[] = [];
    let animationFrame = 0;
    let width = 0;
    let height = 0;
    let reducedMotion = false;
    let isVisible = true;

    const updatePointerPosition = () => {
      if (!mouse.hasPosition) return;

      const bounds = canvas.getBoundingClientRect();
      const canvasPageLeft = bounds.left + window.scrollX;
      const canvasPageTop = bounds.top + window.scrollY;
      mouse.x = mouse.pageX - canvasPageLeft;
      mouse.y = mouse.pageY - canvasPageTop;
      mouse.active =
        mouse.x >= 0 && mouse.x <= bounds.width && mouse.y >= 0 && mouse.y <= bounds.height;
    };

    const createDots = () => {
      dots = [];

      for (let y = DOT_SPACING / 2; y < height; y += DOT_SPACING) {
        for (let x = DOT_SPACING / 2; x < width; x += DOT_SPACING) {
          dots.push({ x, y, offsetX: 0, offsetY: 0, velocityX: 0, velocityY: 0 });
        }
      }
    };

    const draw = () => {
      if (!isVisible) return;

      updatePointerPosition();

      context.clearRect(0, 0, width, height);

      for (const dot of dots) {
        let targetX = 0;
        let targetY = 0;
        const distanceToMouse = mouse.active
          ? Math.hypot(dot.x - mouse.x, dot.y - mouse.y)
          : Number.POSITIVE_INFINITY;

        if (!reducedMotion && distanceToMouse > 0 && distanceToMouse < MOUSE_RADIUS) {
          const force = (1 - distanceToMouse / MOUSE_RADIUS) * 9;
          targetX = ((dot.x - mouse.x) / distanceToMouse) * force;
          targetY = ((dot.y - mouse.y) / distanceToMouse) * force;
        }

        dot.velocityX += (targetX - dot.offsetX) * 0.08;
        dot.velocityY += (targetY - dot.offsetY) * 0.08;
        dot.velocityX *= 0.82;
        dot.velocityY *= 0.82;
        dot.offsetX += dot.velocityX;
        dot.offsetY += dot.velocityY;

        const proximity = Math.max(0, 1 - distanceToMouse / MOUSE_RADIUS);
        const opacity = 0.04 + proximity * 0.20;

        context.beginPath();
        context.arc(dot.x + dot.offsetX, dot.y + dot.offsetY, 0.9, 0, Math.PI * 2);
        context.fillStyle = `rgba(${DOT_COLOR}, ${opacity})`;
        context.fill();
      }

      if (!reducedMotion && isVisible) {
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
      createDots();
      draw();
    };

    const handlePointerMove = (event: PointerEvent) => {
      mouse.pageX = event.clientX + window.scrollX;
      mouse.pageY = event.clientY + window.scrollY;
      mouse.hasPosition = true;
      updatePointerPosition();
    };

    const handlePointerLeave = () => {
      mouse.active = false;
      mouse.hasPosition = false;
    };

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handleMotionPreference = () => {
      reducedMotion = motionQuery.matches;
      window.cancelAnimationFrame(animationFrame);
      draw();
    };

    reducedMotion = motionQuery.matches;
    resize();

    // IntersectionObserver to pause loop when scrolled offscreen
    const intersectionObserver = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting;
      if (isVisible && !reducedMotion) {
        window.cancelAnimationFrame(animationFrame);
        animationFrame = window.requestAnimationFrame(draw);
      }
    }, { threshold: 0.05 });

    intersectionObserver.observe(canvas);

    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("scroll", updatePointerPosition, { passive: true });
    window.addEventListener("blur", handlePointerLeave);
    motionQuery.addEventListener("change", handleMotionPreference);

    return () => {
      intersectionObserver.disconnect();
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("scroll", updatePointerPosition);
      window.removeEventListener("blur", handlePointerLeave);
      motionQuery.removeEventListener("change", handleMotionPreference);
    };
  }, []);

  return <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 z-0" aria-hidden="true" />;
}
