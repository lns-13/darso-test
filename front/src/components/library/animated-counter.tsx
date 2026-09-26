// Ported from ../components/animatedCounter.tsx
// The original relied on an external `AnimatedNumber` primitive we don't ship,
// so this is a fresh, dependency-free implementation using motion/react's
// useInView + requestAnimationFrame. Counts from 0 to `value` on scroll-into-view.
"use client";

import { useEffect, useRef, useState } from "react";
import { useInView, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

type AnimatedCounterProps = {
  value: number;
  /** Total animation duration in ms. Defaults to 1400. */
  durationMs?: number;
  /** Number of fraction digits to display (e.g. 1 for "4.8"). */
  fractionDigits?: number;
  /** Locale used for grouping separators. Defaults to fr-FR. */
  locale?: string;
  /** Prefix rendered before the number, e.g. "€". */
  prefix?: string;
  /** Suffix rendered after the number, e.g. "+" or "/ 5". */
  suffix?: string;
  /** Optional className applied to the outer span. */
  className?: string;
};

const easeOutCubic = (x: number) => 1 - Math.pow(1 - x, 3);

export function AnimatedCounter({
  value,
  durationMs = 1400,
  fractionDigits = 0,
  locale = "fr-FR",
  prefix,
  suffix,
  className,
}: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });
  const prefersReducedMotion = useReducedMotion();
  const [display, setDisplay] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!inView) return;
    if (prefersReducedMotion) {
      setDisplay(value);
      return;
    }

    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = easeOutCubic(t);
      setDisplay(value * eased);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [inView, value, durationMs, prefersReducedMotion]);

  const formatted = display.toLocaleString(locale, {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });

  return (
    <span ref={ref} className={cn("tabular-nums", className)}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}
