"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type AdSlide = {
  id: string;
  eyebrow: string;
  title: string;
  body: string;
  cta: string;
  /** Tailwind bg class OR raw color string used inline */
  bg: string;
  /** Text color: "dark" (near-black) or "light" (white) */
  fg?: "dark" | "light";
  /** Optional accent word rendered in the lime accent, appended after the title */
  accent?: string;
};

export interface AdCarouselProps {
  slides: AdSlide[];
  interval?: number;
  className?: string;
  height?: number;
}

export function AdCarousel({
  slides,
  interval = 5000,
  className,
  height = 128,
}: AdCarouselProps) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [dir, setDir] = useState<1 | -1>(1);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (paused || slides.length <= 1) return;
    timeoutRef.current = setTimeout(() => {
      setDir(1);
      setIndex((i) => (i + 1) % slides.length);
    }, interval);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [index, paused, slides.length, interval]);

  const goTo = (next: number) => {
    setDir(next > index ? 1 : -1);
    setIndex((next + slides.length) % slides.length);
  };

  const slide = slides[index];
  const isDark = (slide.fg ?? "dark") === "dark";

  return (
    <div
      className={cn("relative overflow-hidden rounded-[18px]", className)}
      style={{ height }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
      onTouchEnd={() => setPaused(false)}
    >
      <AnimatePresence mode="wait" custom={dir}>
        <motion.div
          key={slide.id}
          custom={dir}
          variants={{
            enter: (d: 1 | -1) => ({ opacity: 0, x: d * 24 }),
            center: { opacity: 1, x: 0 },
            exit: (d: 1 | -1) => ({ opacity: 0, x: d * -24 }),
          }}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="absolute inset-0 flex items-center justify-between gap-3 p-4"
          style={{ background: slide.bg, color: isDark ? "#0B0B0F" : "#FFFFFF" }}
        >
          <div className="min-w-0 flex-1">
            <p
              className={cn(
                "text-[9.5px] font-semibold uppercase tracking-[0.09em]",
                isDark ? "text-[#0B0B0F]/60" : "text-white/60",
              )}
            >
              {slide.eyebrow}
            </p>
            <p className="mt-1 font-[family-name:var(--font-cabinet)] text-[17px] font-bold leading-[1.15] tracking-tight">
              {slide.title}
              {slide.accent ? <span className="text-[#DFFF3F]"> {slide.accent}</span> : null}
            </p>
            <p
              className={cn(
                "mt-1 line-clamp-1 text-[11px] leading-snug",
                isDark ? "text-[#0B0B0F]/70" : "text-white/70",
              )}
            >
              {slide.body}
            </p>
          </div>
          <button
            className={cn(
              "flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-[11px] font-semibold transition-transform hover:-translate-y-0.5",
              isDark ? "bg-[#0B0B0F] text-white" : "bg-white text-[#0B0B0F]",
            )}
          >
            {slide.cta}
            <ArrowUpRight className="h-3 w-3" strokeWidth={2.25} />
          </button>
        </motion.div>
      </AnimatePresence>

      {/* Progress dots */}
      {slides.length > 1 ? (
        <div className="absolute bottom-2.5 left-1/2 flex -translate-x-1/2 items-center gap-1">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              aria-label={`Bannière ${i + 1}`}
              className={cn(
                "h-1 rounded-full transition-all",
                i === index
                  ? isDark
                    ? "w-4 bg-[#0B0B0F]"
                    : "w-4 bg-white"
                  : isDark
                    ? "w-1 bg-[#0B0B0F]/30"
                    : "w-1 bg-white/40",
              )}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
