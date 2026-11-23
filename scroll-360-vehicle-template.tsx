"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Scroll-scrubbed 360° turn of the MRN Express coach.
 * Frames: public/route-bus/f001..f118.webp (15 fps, 0–7.85 s of the source video).
 * Progress = how far #route-timeline has scrolled through the viewport.
 */

const FRAME_COUNT = 118;
const src = (i: number) => `/route-bus/f${String(i + 1).padStart(3, "0")}.webp`;

export function RouteBus360() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const frames: HTMLImageElement[] = [];
    let started = false;
    let lastDrawn = -1;
    let raf = 0;

    const getProgress = () => {
      const list = document.getElementById("route-timeline");
      if (!list) return 0;
      const r = list.getBoundingClientRect();
      const vh = window.innerHeight;
      const p = (vh * 0.5 - r.top) / Math.max(r.height - vh * 0.4, 1);
      return Math.min(1, Math.max(0, p));
    };

    // draw the nearest loaded frame (falls back to closest earlier one while loading)
    const draw = (p: number) => {
      let i = Math.round(p * (FRAME_COUNT - 1));
      while (i > 0 && !(frames[i]?.complete && frames[i].naturalWidth)) i--;
      const img = frames[i];
      if (!img?.complete || !img.naturalWidth || i === lastDrawn) return;
      lastDrawn = i;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    };

    const update = () => {
      raf = 0;
      const p = getProgress();
      draw(p);
      setProgress(p);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    const start = () => {
      if (started) return;
      started = true;
      for (let i = 0; i < FRAME_COUNT; i++) {
        const img = new Image();
        img.decoding = "async";
        img.src = src(i);
        img.onload = () => {
          if (i === 0) {
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            lastDrawn = -1;
          }
          lastDrawn = -1;
          onScroll();
        };
        frames.push(img);
      }
      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", onScroll);
      onScroll();
    };

    // only fetch frames when the section is near the viewport
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          io.disconnect();
          start();
        }
      },
      { rootMargin: "400px" },
    );
    io.observe(wrap);

    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <div ref={wrapRef} className="flex w-full flex-col">
      <div className="relative aspect-[16/9] w-full overflow-hidden rounded-3xl bg-[#d9dadc]">
        <img
          src="/route-bus/poster.jpg"
          alt="MRN Express luxury coach"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-hidden="true" />
      </div>
      <div className="mt-2 h-1 lg:mt-4 w-full overflow-hidden rounded-full bg-border">
        <div className="h-full rounded-full bg-brand" style={{ width: `${progress * 100}%` }} />
      </div>
    </div>
  );
}
