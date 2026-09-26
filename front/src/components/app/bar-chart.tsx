import { cn } from "@/lib/utils";

export type Bar = { label: string; value: number; color?: string };

export type BarChartProps = {
  bars: Bar[];
  height?: number;
  showValues?: boolean;
  sort?: "asc" | "desc" | "none";
  valueFormatter?: (v: number) => string;
  className?: string;
};

/**
 * Vertical SVG bar chart with 8 px gaps and rounded tops.
 * viewBox scales horizontally; bars use fractional widths so any bar count works.
 */
export function BarChart({
  bars,
  height = 220,
  showValues = true,
  sort = "none",
  valueFormatter,
  className,
}: BarChartProps) {
  const data = [...bars];
  if (sort === "asc") data.sort((a, b) => a.value - b.value);
  else if (sort === "desc") data.sort((a, b) => b.value - a.value);

  const H = height;
  const W = 600;
  const padT = 12;
  const padB = 26;
  const padL = 6;
  const padR = 6;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;

  const gap = 8;
  const n = data.length || 1;
  const barW = Math.max(4, (innerW - gap * (n - 1)) / n);
  const max = Math.max(...data.map((b) => b.value), 1);
  // reserve top space for the value label
  const valueRoom = showValues ? 14 : 0;

  return (
    <svg
      className={cn("block w-full", className)}
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      role="img"
      aria-label="Barres"
    >
      {/* baseline */}
      <line
        x1={padL}
        x2={W - padR}
        y1={H - padB}
        y2={H - padB}
        stroke="#EFEFF1"
        strokeWidth={1}
        vectorEffect="non-scaling-stroke"
      />
      {data.map((b, i) => {
        const h = ((b.value / max) * (innerH - valueRoom));
        const x = padL + i * (barW + gap);
        const y = H - padB - h;
        const color = b.color ?? "#DFFF3F";
        const rx = Math.min(6, barW / 2);
        return (
          <g key={`${b.label}-${i}`}>
            <rect
              x={x}
              y={y}
              width={barW}
              height={Math.max(1, h)}
              rx={rx}
              ry={rx}
              fill={color}
            />
            {showValues ? (
              <text
                x={x + barW / 2}
                y={y - 4}
                textAnchor="middle"
                className="fill-[#0B0B0F]"
                style={{ fontSize: 10, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}
              >
                {valueFormatter ? valueFormatter(b.value) : b.value}
              </text>
            ) : null}
            <text
              x={x + barW / 2}
              y={H - 8}
              textAnchor="middle"
              className="fill-[#8A8D93]"
              style={{ fontSize: 10 }}
            >
              {b.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
