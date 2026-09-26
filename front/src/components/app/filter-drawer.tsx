"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Star, X } from "lucide-react";
import { springSoft, fadeQuick } from "@/lib/motion";
import { cn } from "@/lib/utils";
import {
  DEFAULT_PRICE_MAX,
  DEFAULT_PRICE_MIN,
  type FilterValue,
} from "./filter-bar";

type FilterDrawerProps = {
  open: boolean;
  onClose: () => void;
  subjects: string[];
  levels: string[];
  days: string[];
  value: FilterValue;
  onChange: (patch: Partial<FilterValue>) => void;
  onReset: () => void;
  resultCount?: number;
};

export function FilterDrawer({
  open,
  onClose,
  subjects,
  levels,
  days,
  value,
  onChange,
  onReset,
  resultCount,
}: FilterDrawerProps) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            key="backdrop"
            aria-label="Fermer les filtres"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={fadeQuick}
            className="fixed inset-0 z-40 bg-[#0B0B0F]/45"
          />
          <motion.div
            key="sheet"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={springSoft}
            className="fixed inset-x-0 bottom-0 z-50 flex max-h-[90dvh] flex-col rounded-t-[24px] bg-white shadow-[0_-4px_24px_rgba(10,11,20,0.15)]"
          >
            <div className="flex justify-center pt-2.5">
              <div className="h-1 w-9 rounded-full bg-[#EFEFF1]" />
            </div>
            <div className="flex items-center justify-between px-5 pb-3 pt-3">
              <h2 className="font-[family-name:var(--font-cabinet)] text-[20px] font-bold tracking-tight text-[#0B0B0F]">
                Filtres
              </h2>
              <button
                onClick={onClose}
                aria-label="Fermer"
                className="grid h-9 w-9 place-items-center rounded-full bg-[#F5F5F7] text-[#0B0B0F]"
              >
                <X className="h-4 w-4" strokeWidth={2} />
              </button>
            </div>

            <div className="scrollbar-none flex-1 overflow-y-auto px-5 pb-4">
              <Group label="Matière">
                <ChipRow
                  options={subjects}
                  isActive={(o) => value.subject === o}
                  onToggle={(o) =>
                    onChange({ subject: value.subject === o ? null : o })
                  }
                />
              </Group>

              <Group label="Niveau">
                <ChipRow
                  options={levels}
                  isActive={(o) => value.level === o}
                  onToggle={(o) =>
                    onChange({ level: value.level === o ? null : o })
                  }
                />
              </Group>

              <Group label="Tarif horaire (MAD)">
                <div className="mt-1">
                  <div className="flex items-baseline justify-between">
                    <span className="text-[11.5px] text-[#8A8D93]">
                      De {value.priceMin} à {value.priceMax} MAD
                    </span>
                    <button
                      onClick={() =>
                        onChange({
                          priceMin: DEFAULT_PRICE_MIN,
                          priceMax: DEFAULT_PRICE_MAX,
                        })
                      }
                      className="text-[11px] font-medium text-[#8A8D93]"
                    >
                      Réinitialiser
                    </button>
                  </div>
                  <DoubleRange
                    min={DEFAULT_PRICE_MIN}
                    max={DEFAULT_PRICE_MAX}
                    valueMin={value.priceMin}
                    valueMax={value.priceMax}
                    onChange={(pmin, pmax) =>
                      onChange({ priceMin: pmin, priceMax: pmax })
                    }
                  />
                </div>
              </Group>

              <Group label="Note minimum">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((n) => {
                    const filled = value.ratingMin >= n;
                    return (
                      <button
                        key={n}
                        onClick={() =>
                          onChange({ ratingMin: value.ratingMin === n ? 0 : n })
                        }
                        aria-label={`${n} étoiles et plus`}
                        className="grid h-9 w-9 place-items-center rounded-full bg-[#F5F5F7]"
                      >
                        <Star
                          className={cn(
                            "h-4 w-4",
                            filled
                              ? "fill-[#0B0B0F] text-[#0B0B0F]"
                              : "text-[#D5D7DB]",
                          )}
                          strokeWidth={0}
                        />
                      </button>
                    );
                  })}
                  {value.ratingMin > 0 ? (
                    <span className="ml-2 text-[11.5px] font-semibold text-[#0B0B0F]">
                      {value.ratingMin}+ étoiles
                    </span>
                  ) : (
                    <span className="ml-2 text-[11.5px] text-[#8A8D93]">
                      Toutes les notes
                    </span>
                  )}
                </div>
              </Group>

              <Group label="Disponibilités">
                <ChipRow
                  options={days}
                  isActive={(o) => value.days.includes(o)}
                  onToggle={(o) => {
                    const next = value.days.includes(o)
                      ? value.days.filter((x) => x !== o)
                      : [...value.days, o];
                    onChange({ days: next });
                  }}
                />
              </Group>
            </div>

            <div className="sticky bottom-0 flex items-center gap-2.5 border-t border-[#EFEFF1] bg-white px-5 py-3">
              <button
                onClick={onReset}
                className="rounded-full border border-[#EFEFF1] px-4 py-2.5 text-[12.5px] font-semibold text-[#0B0B0F]"
              >
                Réinitialiser
              </button>
              <button
                onClick={onClose}
                className="flex-1 rounded-full bg-[#0B0B0F] py-2.5 text-[12.5px] font-semibold text-white"
              >
                {typeof resultCount === "number"
                  ? `Voir ${resultCount} résultat${resultCount > 1 ? "s" : ""}`
                  : "Appliquer"}
              </button>
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}

function Group({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-b border-[#EFEFF1] py-4 last:border-b-0">
      <h3 className="text-[10px] font-semibold uppercase tracking-[0.09em] text-[#8A8D93]">
        {label}
      </h3>
      <div className="mt-2.5">{children}</div>
    </section>
  );
}

function ChipRow({
  options,
  isActive,
  onToggle,
}: {
  options: string[];
  isActive: (o: string) => boolean;
  onToggle: (o: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => {
        const active = isActive(o);
        return (
          <button
            key={o}
            onClick={() => onToggle(o)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-[11.5px] font-semibold transition-colors",
              active
                ? "border-[#0B0B0F] bg-[#0B0B0F] text-white"
                : "border-[#EFEFF1] bg-white text-[#4A4D54]",
            )}
          >
            {o}
          </button>
        );
      })}
    </div>
  );
}

function DoubleRange({
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
      <style jsx>{`
        .range-thumb::-webkit-slider-thumb {
          pointer-events: auto;
          -webkit-appearance: none;
          appearance: none;
          height: 18px;
          width: 18px;
          border-radius: 999px;
          background: #ffffff;
          border: 2px solid #0b0b0f;
          cursor: pointer;
          box-shadow: 0 1px 3px rgba(10, 11, 20, 0.2);
        }
        .range-thumb::-moz-range-thumb {
          pointer-events: auto;
          height: 18px;
          width: 18px;
          border-radius: 999px;
          background: #ffffff;
          border: 2px solid #0b0b0f;
          cursor: pointer;
          box-shadow: 0 1px 3px rgba(10, 11, 20, 0.2);
        }
      `}</style>
    </div>
  );
}
