"use client";

import { Check, ChevronDown, RotateCcw, Star } from "lucide-react";
import { cn } from "@/lib/utils";

export type FilterValue = {
  subject: string | null;
  level: string | null;
  priceMin: number;
  priceMax: number;
  ratingMin: number;
  days: string[];
};

export const DEFAULT_PRICE_MIN = 50;
export const DEFAULT_PRICE_MAX = 400;

export function createDefaultFilter(): FilterValue {
  return {
    subject: null,
    level: null,
    priceMin: DEFAULT_PRICE_MIN,
    priceMax: DEFAULT_PRICE_MAX,
    ratingMin: 0,
    days: [],
  };
}

export function filterIsActive(v: FilterValue): boolean {
  return (
    v.subject !== null ||
    v.level !== null ||
    v.priceMin !== DEFAULT_PRICE_MIN ||
    v.priceMax !== DEFAULT_PRICE_MAX ||
    v.ratingMin > 0 ||
    v.days.length > 0
  );
}

type FilterBarProps = {
  subjects: string[];
  levels: string[];
  days: string[];
  value: FilterValue;
  onChange: (patch: Partial<FilterValue>) => void;
  onReset: () => void;
  className?: string;
};

export function FilterBar({
  subjects,
  levels,
  days,
  value,
  onChange,
  onReset,
  className,
}: FilterBarProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2 pb-0.5",
        className,
      )}
    >
      <DropdownChip
        label="Matière"
        active={value.subject}
        onClear={() => onChange({ subject: null })}
      >
        <OptionList
          options={subjects}
          value={value.subject}
          onSelect={(v) => onChange({ subject: v })}
        />
      </DropdownChip>

      <DropdownChip
        label="Niveau"
        active={value.level}
        onClear={() => onChange({ level: null })}
      >
        <OptionList
          options={levels}
          value={value.level}
          onSelect={(v) => onChange({ level: v })}
        />
      </DropdownChip>

      <DropdownChip
        label="Tarif"
        active={
          value.priceMin === DEFAULT_PRICE_MIN && value.priceMax === DEFAULT_PRICE_MAX
            ? null
            : `${value.priceMin}–${value.priceMax} MAD`
        }
        onClear={() =>
          onChange({ priceMin: DEFAULT_PRICE_MIN, priceMax: DEFAULT_PRICE_MAX })
        }
      >
        <PriceRange
          min={DEFAULT_PRICE_MIN}
          max={DEFAULT_PRICE_MAX}
          valueMin={value.priceMin}
          valueMax={value.priceMax}
          onChange={(pmin, pmax) => onChange({ priceMin: pmin, priceMax: pmax })}
        />
      </DropdownChip>

      <RatingStepper
        value={value.ratingMin}
        onChange={(r) => onChange({ ratingMin: r })}
      />

      <DropdownChip
        label="Jours"
        active={value.days.length > 0 ? `${value.days.length} jour(s)` : null}
        onClear={() => onChange({ days: [] })}
      >
        <DayList
          days={days}
          value={value.days}
          onToggle={(d) => {
            const next = value.days.includes(d)
              ? value.days.filter((x) => x !== d)
              : [...value.days, d];
            onChange({ days: next });
          }}
        />
      </DropdownChip>

      <button
        onClick={onReset}
        className="ml-auto flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1.5 text-[11.5px] font-medium text-[#8A8D93] transition-colors hover:bg-[#F5F5F7] hover:text-[#0B0B0F]"
      >
        <RotateCcw className="h-3 w-3" strokeWidth={2} />
        Réinitialiser
      </button>
    </div>
  );
}

function DropdownChip({
  label,
  active,
  onClear,
  children,
}: {
  label: string;
  active: string | null;
  onClear: () => void;
  children: React.ReactNode;
}) {
  const isActive = active !== null;
  return (
    <details className="group relative shrink-0">
      <summary
        className={cn(
          "flex h-8 cursor-pointer list-none items-center gap-1.5 rounded-full border px-3 text-[11.5px] font-semibold transition-colors [&::-webkit-details-marker]:hidden",
          isActive
            ? "border-[#0B0B0F] bg-[#0B0B0F] text-white"
            : "border-[#EFEFF1] bg-white text-[#0B0B0F] hover:bg-[#F5F5F7]",
        )}
      >
        <span>
          {label}
          {isActive ? <span className="mx-1 opacity-40">·</span> : null}
          {isActive ? <span className="font-medium">{active}</span> : null}
        </span>
        {isActive ? (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClear();
            }}
            aria-label={`Effacer ${label}`}
            className="grid h-3.5 w-3.5 place-items-center rounded-full bg-white/15 text-[9px] leading-none"
          >
            ×
          </button>
        ) : (
          <ChevronDown className="h-3 w-3" strokeWidth={2} />
        )}
      </summary>
      <div className="absolute left-0 top-9 z-30 min-w-[200px] max-w-[calc(100vw-2rem)] rounded-[14px] border border-[#EFEFF1] bg-white p-2 shadow-[0_8px_24px_rgba(10,11,20,0.08)]">
        {children}
      </div>
    </details>
  );
}

function OptionList({
  options,
  value,
  onSelect,
}: {
  options: string[];
  value: string | null;
  onSelect: (v: string | null) => void;
}) {
  return (
    <div className="flex flex-col">
      {options.map((opt) => {
        const isActive = opt === value;
        return (
          <button
            key={opt}
            onClick={() => onSelect(isActive ? null : opt)}
            className={cn(
              "flex items-center justify-between rounded-md px-2.5 py-1.5 text-left text-[12px] transition-colors hover:bg-[#F5F5F7]",
              isActive ? "font-semibold text-[#0B0B0F]" : "text-[#4A4D54]",
            )}
          >
            {opt}
            {isActive ? <Check className="h-3.5 w-3.5" strokeWidth={2.25} /> : null}
          </button>
        );
      })}
    </div>
  );
}

function PriceRange({
  min,
  max,
  valueMin,
  valueMax,
  onChange,
}: {
  min: number;
  max: number;
  valueMin: number;
  valueMax: number;
  onChange: (pmin: number, pmax: number) => void;
}) {
  const leftPct = ((valueMin - min) / (max - min)) * 100;
  const rightPct = ((valueMax - min) / (max - min)) * 100;
  return (
    <div className="w-[min(220px,calc(100vw-4rem))] px-2 py-1.5">
      <div className="flex items-baseline justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-[0.06em] text-[#8A8D93]">
          Tarif horaire
        </span>
        <span className="text-[11.5px] font-bold text-[#0B0B0F] tabular-nums">
          {valueMin}–{valueMax} MAD
        </span>
      </div>
      <div className="relative mt-4 h-1.5 rounded-full bg-[#F0F0F2]">
        <div
          className="absolute h-1.5 rounded-full bg-[#0B0B0F]"
          style={{ left: `${leftPct}%`, right: `${100 - rightPct}%` }}
        />
        <input
          type="range"
          min={min}
          max={max}
          value={valueMin}
          onChange={(e) => {
            const next = Math.min(Number(e.target.value), valueMax - 10);
            onChange(next, valueMax);
          }}
          className="range-thumb pointer-events-none absolute inset-0 h-1.5 w-full appearance-none bg-transparent"
          style={{ zIndex: leftPct > 90 ? 3 : 2 }}
        />
        <input
          type="range"
          min={min}
          max={max}
          value={valueMax}
          onChange={(e) => {
            const next = Math.max(Number(e.target.value), valueMin + 10);
            onChange(valueMin, next);
          }}
          className="range-thumb pointer-events-none absolute inset-0 h-1.5 w-full appearance-none bg-transparent"
          style={{ zIndex: 2 }}
        />
      </div>
      <style jsx>{`
        .range-thumb::-webkit-slider-thumb {
          pointer-events: auto;
          -webkit-appearance: none;
          appearance: none;
          height: 16px;
          width: 16px;
          border-radius: 999px;
          background: #ffffff;
          border: 2px solid #0b0b0f;
          cursor: pointer;
          box-shadow: 0 1px 2px rgba(10, 11, 20, 0.15);
        }
        .range-thumb::-moz-range-thumb {
          pointer-events: auto;
          height: 16px;
          width: 16px;
          border-radius: 999px;
          background: #ffffff;
          border: 2px solid #0b0b0f;
          cursor: pointer;
          box-shadow: 0 1px 2px rgba(10, 11, 20, 0.15);
        }
      `}</style>
    </div>
  );
}

function RatingStepper({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div
      className={cn(
        "flex h-8 shrink-0 items-center gap-1 rounded-full border px-2.5",
        value > 0
          ? "border-[#0B0B0F] bg-[#0B0B0F] text-white"
          : "border-[#EFEFF1] bg-white text-[#0B0B0F]",
      )}
    >
      <span className="text-[11.5px] font-semibold">Note</span>
      <div className="flex items-center gap-0.5 pl-0.5">
        {[1, 2, 3, 4, 5].map((n) => {
          const filled = value >= n;
          return (
            <button
              key={n}
              onClick={() => onChange(value === n ? 0 : n)}
              aria-label={`${n} étoiles et plus`}
              className="grid h-4 w-4 place-items-center"
            >
              <Star
                className={cn(
                  "h-3 w-3 transition-colors",
                  filled
                    ? "fill-[#DFFF3F] text-[#DFFF3F]"
                    : value > 0
                      ? "fill-white/25 text-white/25"
                      : "fill-[#D5D7DB] text-[#D5D7DB]",
                )}
                strokeWidth={0}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}

function DayList({
  days,
  value,
  onToggle,
}: {
  days: string[];
  value: string[];
  onToggle: (d: string) => void;
}) {
  return (
    <div className="flex max-w-[220px] flex-wrap gap-1.5 p-1">
      {days.map((d) => {
        const isActive = value.includes(d);
        return (
          <button
            key={d}
            onClick={() => onToggle(d)}
            className={cn(
              "rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors",
              isActive
                ? "border-[#0B0B0F] bg-[#0B0B0F] text-white"
                : "border-[#EFEFF1] bg-white text-[#4A4D54] hover:text-[#0B0B0F]",
            )}
          >
            {d}
          </button>
        );
      })}
    </div>
  );
}
