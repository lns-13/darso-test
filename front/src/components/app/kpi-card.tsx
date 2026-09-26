import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type KpiCardTone = "default" | "dark";

export type KpiCardProps = {
  label: string;
  value: string | number;
  unit?: string;
  hint?: string;
  trend?: { direction: "up" | "down"; value: string };
  sparkline: number[];
  tone?: KpiCardTone;
  className?: string;
};

/**
 * KPI card with a compact SVG sparkline below the metric.
 * Meant for the Teacher Full Stats page — larger than StatCard.
 */
export function KpiCard({
  label,
  value,
  unit,
  hint,
  trend,
  sparkline,
  tone = "default",
  className,
}: KpiCardProps) {
  const isDark = tone === "dark";
  const stroke =
    trend?.direction === "down"
      ? isDark
        ? "#FCA5A5"
        : "#DC2626"
      : isDark
        ? "#DFFF3F"
        : "#0B0B0F";
  const areaFill = isDark ? "rgba(223,255,63,0.18)" : "rgba(11,11,15,0.06)";

  return (
    <div
      className={cn(
        "flex min-w-0 flex-col justify-between rounded-[20px] border p-4",
        isDark
          ? "bg-[#0B0B0F] border-transparent text-white"
          : "bg-white border-[#EFEFF1] text-[#0B0B0F]",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p
          className={cn(
            "text-[10px] font-semibold uppercase tracking-[0.08em]",
            isDark ? "text-white/50" : "text-[#8A8D93]",
          )}
        >
          {label}
        </p>
        {trend ? (
          <span
            className={cn(
              "inline-flex h-5 shrink-0 items-center gap-0.5 rounded-full px-1.5 text-[10px] font-semibold tabular-nums",
              trend.direction === "up"
                ? isDark
                  ? "bg-[#DFFF3F] text-[#0B0B0F]"
                  : "bg-[#0B0B0F] text-[#DFFF3F]"
                : isDark
                  ? "bg-white/10 text-[#FCA5A5]"
                  : "bg-white text-[#DC2626] border border-[#EFEFF1]",
            )}
          >
            {trend.direction === "up" ? (
              <ArrowUpRight className="h-2.5 w-2.5" strokeWidth={2.25} />
            ) : (
              <ArrowDownRight className="h-2.5 w-2.5" strokeWidth={2.25} />
            )}
            {trend.value}
          </span>
        ) : null}
      </div>

      <div className="mt-4 flex items-baseline gap-1.5">
        <span className="font-[family-name:var(--font-cabinet)] text-[26px] sm:text-[30px] md:text-[32px] font-bold leading-none tracking-[-0.02em] tabular-nums">
          {value}
        </span>
        {unit ? (
          <span
            className={cn(
              "text-[12px] font-semibold tabular-nums",
              isDark ? "text-white/50" : "text-[#8A8D93]",
            )}
          >
            {unit}
          </span>
        ) : null}
      </div>

      {hint ? (
        <p
          className={cn(
            "mt-1.5 truncate text-[11px]",
            isDark ? "text-white/55" : "text-[#8A8D93]",
          )}
        >
          {hint}
        </p>
      ) : null}

      <Sparkline
        data={sparkline}
        stroke={stroke}
        areaFill={areaFill}
        className="mt-3"
      />
    </div>
  );
}

/* ---------- inline sparkline ---------- */

function Sparkline({
  data,
  stroke,
  areaFill,
  className,
}: {
  data: number[];
  stroke: string;
  areaFill: string;
  className?: string;
}) {
  const W = 120;
  const H = 30;
  if (data.length < 2) {
    return <div className={cn("h-[30px]", className)} />;
  }
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const step = W / (data.length - 1);
  const pts = data.map((v, i) => {
    const x = i * step;
    const y = H - 2 - ((v - min) / range) * (H - 4);
    return [x, y] as const;
  });
  const line = pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`).join(" ");
  const area = `${line} L${W},${H} L0,${H} Z`;
  return (
    <svg
      className={cn("block h-[30px] w-full", className)}
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      aria-hidden
    >
      <path d={area} fill={areaFill} />
      <path
        d={line}
        fill="none"
        stroke={stroke}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
