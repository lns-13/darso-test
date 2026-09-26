import { cn } from "@/lib/utils";

export type HeatmapProps = {
  data: number[][]; // rows × cols
  dayLabels?: string[]; // rows
  hourLabels?: string[]; // cols
  max?: number; // clamp normalization
  className?: string;
  /** Which hour columns to actually label on the x-axis (defaults every 3h) */
  labelStride?: number;
};

const DEFAULT_DAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

/**
 * Days × hours heatmap. Cells are colored on a lime opacity ramp.
 * Native <title> tooltip: day · hour · value.
 * Rendered as CSS grid so it stays crisp on any viewport.
 */
export function Heatmap({
  data,
  dayLabels = DEFAULT_DAYS,
  hourLabels,
  max,
  className,
  labelStride = 3,
}: HeatmapProps) {
  const rows = data.length;
  const cols = rows > 0 ? data[0].length : 0;
  const flat = data.flat();
  const computedMax = max ?? (flat.length ? Math.max(...flat) : 1);
  const safeMax = computedMax > 0 ? computedMax : 1;

  const hours =
    hourLabels ?? Array.from({ length: cols }, (_, h) => `${String(h).padStart(2, "0")}h`);

  const opacityFor = (v: number): number => {
    if (v <= 0) return 0;
    const ratio = v / safeMax;
    // stepped ramp: 0 / 10 / 20 / 40 / 60 / 80 / 100
    if (ratio < 0.05) return 0;
    if (ratio < 0.15) return 0.1;
    if (ratio < 0.3) return 0.2;
    if (ratio < 0.5) return 0.4;
    if (ratio < 0.7) return 0.6;
    if (ratio < 0.9) return 0.8;
    return 1;
  };

  return (
    <div className={cn("w-full", className)}>
      <div
        className="grid gap-1"
        style={{
          gridTemplateColumns: `36px repeat(${cols}, minmax(0, 1fr))`,
        }}
      >
        {/* header row: empty corner + hour labels */}
        <div />
        {hours.map((h, i) => (
          <div
            key={`h-${i}`}
            className="text-center text-[8.5px] font-medium text-white/40 tabular-nums"
          >
            {i % labelStride === 0 ? h.replace("h", "") : ""}
          </div>
        ))}

        {/* rows */}
        {data.map((row, r) => (
          <RowFragment
            key={`r-${r}`}
            dayLabel={dayLabels[r] ?? ""}
            row={row}
            opacityFor={opacityFor}
            hours={hours}
          />
        ))}
      </div>

      {/* legend */}
      <div className="mt-3 flex items-center justify-end gap-1.5 text-[9.5px] text-white/45">
        <span>moins</span>
        {[0.1, 0.2, 0.4, 0.6, 0.8, 1].map((op) => (
          <span
            key={op}
            className="h-2.5 w-2.5 rounded-[3px]"
            style={{ backgroundColor: `rgba(223,255,63,${op})` }}
          />
        ))}
        <span>plus</span>
      </div>
    </div>
  );
}

function RowFragment({
  dayLabel,
  row,
  opacityFor,
  hours,
}: {
  dayLabel: string;
  row: number[];
  opacityFor: (v: number) => number;
  hours: string[];
}) {
  return (
    <>
      <div className="flex items-center text-[10px] font-semibold text-white/55">
        {dayLabel}
      </div>
      {row.map((v, c) => {
        const op = opacityFor(v);
        return (
          <div
            key={`c-${c}`}
            title={`${dayLabel} · ${hours[c] ?? c + "h"} · ${v.toFixed(1)} h`}
            className="aspect-square rounded-[3px] border border-white/[0.06] transition-transform hover:scale-110"
            style={{
              backgroundColor: op > 0 ? `rgba(223,255,63,${op})` : "rgba(255,255,255,0.04)",
            }}
          />
        );
      })}
    </>
  );
}
