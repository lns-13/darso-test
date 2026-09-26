import { useId } from "react";
import { cn } from "@/lib/utils";

export type LineSeries = {
  label: string;
  points: { x: string | number; y: number }[];
  color?: string;
  area?: boolean; // if true and primary, area fill under this series
};

export type LineChartProps = {
  series: LineSeries[];
  xLabels?: string[]; // optional overrides; else uses primary series' x values
  yTicks?: number; // number of horizontal gridlines (default 4)
  height?: number;
  className?: string;
  formatY?: (v: number) => string;
};

/**
 * Minimalist SVG line chart.
 *
 * viewBox is fixed at 600×H so the chart scales cleanly to its container width.
 * Uses `preserveAspectRatio="none"` on X only would distort strokes, so we
 * apply `vectorEffect="non-scaling-stroke"` to keep hairlines crisp instead.
 */
export function LineChart({
  series,
  xLabels,
  yTicks = 4,
  height = 240,
  className,
  formatY,
}: LineChartProps) {
  const uid = useId();
  const W = 600;
  const H = height;
  const padL = 36;
  const padR = 12;
  const padT = 12;
  const padB = 24;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;

  const primary = series[0];
  const nPoints = primary?.points.length ?? 0;
  if (!primary || nPoints < 2) {
    return (
      <div
        className={cn("grid place-items-center rounded-[12px] bg-[#FAFAFB] text-[11px] text-[#8A8D93]", className)}
        style={{ height: H }}
      >
        Pas assez de données
      </div>
    );
  }

  // combined y domain
  let yMin = Infinity;
  let yMax = -Infinity;
  for (const s of series) {
    for (const p of s.points) {
      if (p.y < yMin) yMin = p.y;
      if (p.y > yMax) yMax = p.y;
    }
  }
  if (yMin === yMax) {
    yMax = yMin + 1;
  }
  // nudge min down toward 0 for prettier zero-anchored charts
  if (yMin > 0 && yMin < yMax * 0.35) yMin = 0;
  const yRange = yMax - yMin;

  const xStep = innerW / (nPoints - 1);
  const toX = (i: number) => padL + i * xStep;
  const toY = (v: number) => padT + innerH - ((v - yMin) / yRange) * innerH;

  const grid: number[] = [];
  for (let i = 0; i <= yTicks; i++) {
    grid.push(padT + (i / yTicks) * innerH);
  }
  const yLabelVals: number[] = [];
  for (let i = 0; i <= yTicks; i++) {
    yLabelVals.push(yMax - (i / yTicks) * yRange);
  }

  const buildPath = (s: LineSeries) => {
    return s.points
      .map((p, i) => `${i === 0 ? "M" : "L"}${toX(i).toFixed(2)},${toY(p.y).toFixed(2)}`)
      .join(" ");
  };

  const primaryPath = buildPath(primary);
  const primaryColor = primary.color ?? "#DFFF3F";
  const areaPath = `${primaryPath} L${toX(nPoints - 1).toFixed(2)},${(padT + innerH).toFixed(2)} L${toX(0).toFixed(2)},${(padT + innerH).toFixed(2)} Z`;

  // x tick spacing — cap to ~6 labels for legibility
  const xs = xLabels ?? primary.points.map((p) => String(p.x));
  const maxLabels = 6;
  const labelStride = Math.max(1, Math.ceil(nPoints / maxLabels));

  const gradId = `line-area-${uid}`;

  return (
    <svg
      className={cn("block w-full", className)}
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      role="img"
      aria-label={`Ligne — ${series.map((s) => s.label).join(", ")}`}
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={primaryColor} stopOpacity={0.45} />
          <stop offset="100%" stopColor={primaryColor} stopOpacity={0} />
        </linearGradient>
      </defs>

      {/* gridlines */}
      {grid.map((gy, i) => (
        <line
          key={`g-${i}`}
          x1={padL}
          x2={W - padR}
          y1={gy}
          y2={gy}
          stroke="#EFEFF1"
          strokeWidth={1}
          vectorEffect="non-scaling-stroke"
        />
      ))}

      {/* y-axis labels */}
      {yLabelVals.map((v, i) => (
        <text
          key={`yl-${i}`}
          x={padL - 6}
          y={grid[i] + 3}
          textAnchor="end"
          className="fill-[#8A8D93]"
          style={{ fontSize: 9, fontVariantNumeric: "tabular-nums" }}
        >
          {formatY ? formatY(v) : Math.round(v).toString()}
        </text>
      ))}

      {/* area fill under primary */}
      {primary.area !== false ? (
        <path d={areaPath} fill={`url(#${gradId})`} />
      ) : null}

      {/* additional series (baselines) */}
      {series.slice(1).map((s, si) => (
        <path
          key={`s-${si}`}
          d={buildPath(s)}
          fill="none"
          stroke={s.color ?? "#B5D3FF"}
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="4 3"
          vectorEffect="non-scaling-stroke"
        />
      ))}

      {/* primary line */}
      <path
        d={primaryPath}
        fill="none"
        stroke={primaryColor}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />

      {/* dots at endpoints of primary series only (keep chart clean) */}
      {primary.points.map((p, i) => {
        const showEvery = Math.max(1, Math.ceil(nPoints / 12));
        if (i % showEvery !== 0 && i !== nPoints - 1) return null;
        return (
          <circle
            key={`d-${i}`}
            cx={toX(i)}
            cy={toY(p.y)}
            r={i === nPoints - 1 ? 3 : 1.8}
            fill={i === nPoints - 1 ? "#0B0B0F" : primaryColor}
            stroke={i === nPoints - 1 ? primaryColor : "none"}
            strokeWidth={i === nPoints - 1 ? 2 : 0}
          />
        );
      })}

      {/* x-axis labels */}
      {xs.map((label, i) => {
        if (i % labelStride !== 0 && i !== nPoints - 1) return null;
        const anchor = i === 0 ? "start" : i === nPoints - 1 ? "end" : "middle";
        return (
          <text
            key={`xl-${i}`}
            x={toX(i)}
            y={H - 6}
            textAnchor={anchor}
            className="fill-[#8A8D93]"
            style={{ fontSize: 9 }}
          >
            {label}
          </text>
        );
      })}
    </svg>
  );
}
