"use client";

import { useEffect, useRef, useState } from "react";

const COMPACT_RATIO_THRESHOLD = 1.15;
const REVEAL_FADE_MS = 260;

type Layout = "wide" | "compact";

export function HeroVideoPlayer() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [layout, setLayout] = useState<Layout>("wide");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const rect = entries[0]?.contentRect;
      if (!rect || rect.width === 0 || rect.height === 0) return;
      const next: Layout =
        rect.width / rect.height < COMPACT_RATIO_THRESHOLD ? "compact" : "wide";
      setLayout((prev) => (prev === next ? prev : next));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    setReady(false);
    video.load();
  }, [layout]);

  const base = layout === "compact" ? "/hero-compact" : "/hero-wide";

  return (
    <div
      ref={wrapperRef}
      style={{ position: "absolute", inset: 0, overflow: "hidden" }}
    >
      <video
        ref={videoRef}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        aria-hidden
        onCanPlay={() => setReady(true)}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          display: "block",
          opacity: ready ? 1 : 0,
          transition: `opacity ${REVEAL_FADE_MS}ms ease-out`,
        }}
      >
        <source key={`${base}.webm`} src={`${base}.webm`} type="video/webm" />
        <source key={`${base}.mp4`} src={`${base}.mp4`} type="video/mp4" />
      </video>
    </div>
  );
}
