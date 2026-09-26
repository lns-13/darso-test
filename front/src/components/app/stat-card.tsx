import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type StatCardTone = "default" | "lime" | "muted";

export type StatCardProps = {
  label: string;
  value: string | number;
  unit?: string;
  hint?: string;
  tone?: StatCardTone;
  trend?: { direction: "up" | "down"; value: string };
  className?: string;
};

const toneToClasses: Record<StatCardTone, string> = {
  default: "bg-white border-[#EFEFF1] text-[#0B0B0F]",
  lime: "bg-[#DFFF3F] border-transparent text-[#0B0B0F]",
  muted: "bg-[#F5F5F7] border-transparent text-[#0B0B0F]",
};

export function StatCard({
  label,
  value,
  unit,
  hint,
  tone = "default",
  trend,
  className,
}: StatCardProps) {
  const isLime = tone === "lime";
  const labelClass = isLime ? "text-[#0B0B0F]/60" : "text-[#8A8D93]";
  const hintClass = isLime ? "text-[#0B0B0F]/60" : "text-[#8A8D93]";
  const unitClass = isLime ? "text-[#0B0B0F]/70" : "text-[#8A8D93]";

  return (
    <div
      className={cn(
        "flex min-w-0 flex-col justify-between rounded-[16px] border p-4",
        toneToClasses[tone],
        className,
      )}
    >
      <p
        className={cn(
          "text-[10px] font-semibold uppercase tracking-[0.08em]",
          labelClass,
        )}
      >
        {label}
      </p>

      <div className="mt-3 flex items-baseline gap-1.5">
        <span className="font-[family-name:var(--font-cabinet)] text-[28px] font-bold leading-none tracking-[-0.02em] tabular-nums">
          {value}
        </span>
        {unit ? (
          <span className={cn("text-[12px] font-semibold tabular-nums", unitClass)}>
            {unit}
          </span>
        ) : null}
      </div>

      {(hint || trend) ? (
        <div className="mt-3 flex items-center justify-between gap-2">
          {hint ? (
            <p className={cn("truncate text-[11px]", hintClass)}>{hint}</p>
          ) : (
            <span />
          )}
          {trend ? (
            <span
              className={cn(
                "inline-flex h-5 shrink-0 items-center gap-0.5 rounded-full px-1.5 text-[10px] font-semibold tabular-nums",
                trend.direction === "up"
                  ? "bg-[#0B0B0F] text-[#DFFF3F]"
                  : "bg-white text-[#DC2626] border border-[#EFEFF1]",
                isLime && trend.direction === "up"
                  ? "bg-[#0B0B0F] text-[#DFFF3F]"
                  : undefined,
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
      ) : null}
    </div>
  );
}
