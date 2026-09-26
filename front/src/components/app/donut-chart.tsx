"use client";

// Fresh minimal SVG donut — reference `../components/circleChartDetails.tsx`
// was an Apple-activity rings component (not a segmented donut), so we build
// a small stroke-dasharray donut here instead of porting it.

import { motion } from "motion/react";
import { cn } from "@/lib/utils";

export type DonutSlice = {
  label: string;
  value: number;
  color: string;
};

export type DonutChartProps = {
  data: DonutSlice[];
  total?: number;
  centerLabel?: string;
  centerSubtitle?: string;
  size?: number;
  thickness?: number;
  showLegend?: boolean;
  className?: string;
  /** money-format the legend amounts */
  formatValue?: (v: number) => string;
  currency?: string;
};

const defaultFormat = (v: number) => v.toLocaleString("fr-FR");

export function DonutChart({
  data,
  total,
  centerLabel,
  centerSubtitle = "revenus totaux",
  size = 200,
  thickness = 22,
  showLegend = true,
  className,
  formatValue = defaultFormat,
  currency = "MAD",
}: DonutChartProps) {
  const sum = data.reduce((s, d) => s + d.value, 0) || 1;
  const displayTotal = total ?? sum;

  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const gap = data.length > 1 ? 2 : 0; // subtle separator between slices

  // pre-compute offsets so slices sit end-to-end
  let cumulative = 0;
  const slices = data.map((slice) => {
    const fraction = slice.value / sum;
    const length = Math.max(0, fraction * circumference - gap);
    const dashOffset = -cumulative;
    cumulative += fraction * circumference;
    return {
      ...slice,
      fraction,
      length,
      dashOffset,
    };
  });

  return (
    <div className={cn("flex flex-col items-center gap-4", className)}>
      <div
        className="relative"
        style={{ width: size, height: size }}
        role="img"
        aria-label={
          centerLabel ? `${centerLabel} · ${data.length} segments` : "Donut chart"
        }
      >
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="-rotate-90"
        >
          {/* Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#F0F0F2"
            strokeWidth={thickness}
          />
          {slices.map((slice, i) => (
            <motion.circle
              key={`${slice.label}-${i}`}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={slice.color}
              strokeWidth={thickness}
              strokeLinecap="butt"
              strokeDasharray={`${slice.length} ${circumference - slice.length}`}
              strokeDashoffset={slice.dashOffset}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: i * 0.08, ease: "easeOut" }}
            />
          ))}
        </svg>

        {/* Center label */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-4 text-center">
          <span className="font-[family-name:var(--font-cabinet)] text-[24px] font-bold leading-none tracking-tight text-[#0B0B0F] tabular-nums">
            {formatValue(displayTotal)}
          </span>
          <span className="mt-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#8A8D93]">
            {currency}
          </span>
          {centerLabel ? (
            <span className="mt-2 text-[11px] font-semibold text-[#0B0B0F]">
              {centerLabel}
            </span>
          ) : null}
          <span className="mt-0.5 text-[10.5px] text-[#8A8D93]">
            {centerSubtitle}
          </span>
        </div>
      </div>

      {showLegend ? (
        <ul className="w-full space-y-1.5">
          {slices.map((slice) => {
            const pct = Math.round(slice.fraction * 100);
            return (
              <li
                key={slice.label}
                className="flex items-center gap-2 text-[11.5px] text-[#0B0B0F]"
              >
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: slice.color }}
                  aria-hidden
                />
                <span className="min-w-0 flex-1 truncate font-medium">
                  {slice.label}
                </span>
                <span className="shrink-0 tabular-nums text-[#0B0B0F] font-semibold">
                  {formatValue(slice.value)}
                </span>
                <span className="shrink-0 w-9 text-right tabular-nums text-[#8A8D93]">
                  {pct}%
                </span>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
