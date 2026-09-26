"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { Lock, X } from "lucide-react";
import { cn } from "@/lib/utils";

/* ---------------- Types ---------------- */

export type WeekSlot = {
  id: string;
  day: number; // 0..6 (0 = Monday)
  start: string; // "HH:MM"
  end: string; // "HH:MM"
};

export type WeekGridProps = {
  slots: WeekSlot[];
  blockedDates?: string[]; // ISO YYYY-MM-DD
  currentWeekStart?: Date; // Monday of current view
  onCreateSlot?: (day: number, startMinutes: number, endMinutes: number) => void;
  onSlotClick?: (slotId: string) => void;
  onSlotDelete?: (slotId: string) => void;
  className?: string;
};

/* ---------------- Constants ---------------- */

const DAY_LABELS_SHORT = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const DAY_LABELS_ONE = ["L", "M", "M", "J", "V", "S", "D"];
const ROW_STEP_MIN = 30;
const ROWS_TOTAL = (24 * 60) / ROW_STEP_MIN; // 48
const DEFAULT_START_MIN = 6 * 60; // 06:00
const DEFAULT_END_MIN = 23 * 60; // 23:00
const ROW_HEIGHT = 22; // px per 30-min row

/* ---------------- Helpers ---------------- */

function minutesToHHMM(m: number) {
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${String(h).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

function hhmmToMinutes(s: string) {
  const [h, m] = s.split(":").map((n) => parseInt(n, 10));
  return h * 60 + (m ?? 0);
}

function addDays(d: Date, n: number) {
  const c = new Date(d);
  c.setDate(c.getDate() + n);
  return c;
}

function isoDate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

/* ---------------- Component ---------------- */

export function WeekGrid({
  slots,
  blockedDates = [],
  currentWeekStart,
  onCreateSlot,
  onSlotClick,
  onSlotDelete,
  className,
}: WeekGridProps) {
  const [expanded, setExpanded] = useState(false);

  const startMin = expanded ? 0 : DEFAULT_START_MIN;
  const endMin = expanded ? 24 * 60 : DEFAULT_END_MIN;
  const visibleRows = (endMin - startMin) / ROW_STEP_MIN;

  const dayColRefs = useRef<Array<HTMLDivElement | null>>([]);
  const [drag, setDrag] = useState<{
    day: number;
    startRow: number;
    currentRow: number;
    pointerId: number;
  } | null>(null);

  const blockedSet = useMemo(() => new Set(blockedDates), [blockedDates]);

  const isDayBlocked = useCallback(
    (day: number) => {
      if (!currentWeekStart) return false;
      return blockedSet.has(isoDate(addDays(currentWeekStart, day)));
    },
    [blockedSet, currentWeekStart],
  );

  const handlePointerDown = (day: number, e: React.PointerEvent<HTMLDivElement>) => {
    if (isDayBlocked(day)) return;
    // Only trigger if the mousedown target is the column background (empty area), not on a slot pill.
    const target = e.target as HTMLElement;
    if (target.closest("[data-slot-pill='true']")) return;

    const col = dayColRefs.current[day];
    if (!col) return;
    const rect = col.getBoundingClientRect();
    const yRel = e.clientY - rect.top;
    const row = Math.max(0, Math.min(visibleRows - 1, Math.floor(yRel / ROW_HEIGHT)));

    (e.target as Element).setPointerCapture?.(e.pointerId);
    setDrag({ day, startRow: row, currentRow: row, pointerId: e.pointerId });
    e.preventDefault();
  };

  const handlePointerMove = (day: number, e: React.PointerEvent<HTMLDivElement>) => {
    if (!drag || drag.day !== day || drag.pointerId !== e.pointerId) return;
    const col = dayColRefs.current[day];
    if (!col) return;
    const rect = col.getBoundingClientRect();
    const yRel = e.clientY - rect.top;
    const row = Math.max(0, Math.min(visibleRows, Math.floor(yRel / ROW_HEIGHT)));
    if (row !== drag.currentRow) {
      setDrag({ ...drag, currentRow: row });
    }
  };

  const handlePointerUp = (day: number, e: React.PointerEvent<HTMLDivElement>) => {
    if (!drag || drag.day !== day || drag.pointerId !== e.pointerId) return;
    const from = Math.min(drag.startRow, drag.currentRow);
    let to = Math.max(drag.startRow, drag.currentRow) + 1; // inclusive of hovered row
    if (to - from < 1) to = from + 1;
    const startMinutes = startMin + from * ROW_STEP_MIN;
    const endMinutes = startMin + to * ROW_STEP_MIN;
    onCreateSlot?.(day, startMinutes, endMinutes);
    setDrag(null);
  };

  const handlePointerCancel = () => setDrag(null);

  // Compute hour labels for the leftmost column
  const hourLabels = useMemo(() => {
    const labels: { row: number; text: string }[] = [];
    for (let m = startMin; m < endMin; m += 60) {
      const row = (m - startMin) / ROW_STEP_MIN;
      labels.push({ row, text: `${String(Math.floor(m / 60)).padStart(2, "0")}h` });
    }
    return labels;
  }, [startMin, endMin]);

  return (
    <div className={cn("overflow-hidden rounded-[16px] border border-[#EFEFF1] bg-white", className)}>
      {/* Sticky day headers */}
      <div className="grid grid-cols-[48px_repeat(7,minmax(0,1fr))] border-b border-[#EFEFF1] bg-white">
        <div className="grid place-items-center border-r border-[#EFEFF1] py-2 text-[10px] font-semibold uppercase tracking-[0.06em] text-[#8A8D93]">
          {expanded ? "24h" : "6-23h"}
        </div>
        {DAY_LABELS_SHORT.map((label, i) => {
          const dayDate = currentWeekStart ? addDays(currentWeekStart, i) : null;
          const blocked = isDayBlocked(i);
          return (
            <div
              key={i}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 border-r border-[#EFEFF1] py-2 last:border-r-0",
                blocked && "bg-[#F5F5F7]/60",
              )}
            >
              <div className="flex items-center gap-1">
                <span className="text-[10.5px] font-semibold uppercase tracking-[0.06em] text-[#0B0B0F] hidden min-[640px]:inline">
                  {label}
                </span>
                <span className="text-[10.5px] font-semibold uppercase tracking-[0.06em] text-[#0B0B0F] min-[640px]:hidden">
                  {DAY_LABELS_ONE[i]}
                </span>
                {blocked ? (
                  <Lock className="h-3 w-3 text-[#8A8D93]" strokeWidth={1.75} />
                ) : null}
              </div>
              {dayDate ? (
                <span className="text-[10px] tabular-nums text-[#8A8D93]">
                  {dayDate.getDate()}
                </span>
              ) : null}
            </div>
          );
        })}
      </div>

      {/* Grid body */}
      <div className="grid grid-cols-[48px_repeat(7,minmax(0,1fr))]">
        {/* Hour axis */}
        <div className="relative border-r border-[#EFEFF1]" style={{ height: visibleRows * ROW_HEIGHT }}>
          {hourLabels.map((h) => (
            <div
              key={h.row}
              className="absolute right-1 text-[9.5px] tabular-nums text-[#8A8D93]"
              style={{ top: h.row * ROW_HEIGHT - 6 }}
            >
              {h.text}
            </div>
          ))}
        </div>

        {/* 7 day columns */}
        {Array.from({ length: 7 }, (_, day) => {
          const blocked = isDayBlocked(day);
          const daySlots = slots.filter((s) => s.day === day);
          const dragActive = drag && drag.day === day;
          const dragFrom = dragActive ? Math.min(drag!.startRow, drag!.currentRow) : 0;
          const dragTo = dragActive ? Math.max(drag!.startRow, drag!.currentRow) + 1 : 0;

          return (
            <div
              key={day}
              ref={(el) => {
                dayColRefs.current[day] = el;
              }}
              className={cn(
                "relative border-r border-[#EFEFF1] last:border-r-0 touch-none select-none",
                blocked && "bg-[#F5F5F7]/40",
              )}
              style={{ height: visibleRows * ROW_HEIGHT }}
              onPointerDown={(e) => handlePointerDown(day, e)}
              onPointerMove={(e) => handlePointerMove(day, e)}
              onPointerUp={(e) => handlePointerUp(day, e)}
              onPointerCancel={handlePointerCancel}
            >
              {/* Row dividers */}
              {Array.from({ length: visibleRows }, (_, r) => (
                <div
                  key={r}
                  className={cn(
                    "absolute inset-x-0 border-b",
                    r % 2 === 1 ? "border-[#EFEFF1]" : "border-[#F5F5F7]",
                  )}
                  style={{ top: (r + 1) * ROW_HEIGHT - 1, height: 0 }}
                />
              ))}

              {/* Slot pills */}
              {daySlots.map((s) => {
                const sMin = hhmmToMinutes(s.start);
                const eMin = hhmmToMinutes(s.end);
                const topRow = (sMin - startMin) / ROW_STEP_MIN;
                const heightRows = (eMin - sMin) / ROW_STEP_MIN;
                if (eMin <= startMin || sMin >= endMin) return null;
                const clampedTop = Math.max(0, topRow);
                const clampedHeight = Math.min(visibleRows - clampedTop, heightRows);
                return (
                  <button
                    key={s.id}
                    type="button"
                    data-slot-pill="true"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSlotClick?.(s.id);
                    }}
                    className="group absolute left-0.5 right-0.5 flex flex-col items-start rounded-md bg-[#0B0B0F] px-2 py-1 text-left text-[10.5px] font-semibold text-white shadow-[0_1px_2px_rgba(10,11,20,0.15)] transition-transform hover:scale-[1.02] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#DFFF3F]"
                    style={{
                      top: clampedTop * ROW_HEIGHT + 1,
                      height: Math.max(ROW_HEIGHT - 2, clampedHeight * ROW_HEIGHT - 2),
                    }}
                  >
                    <span className="truncate leading-tight">
                      {s.start}–{s.end}
                    </span>
                    {onSlotDelete ? (
                      <span
                        role="button"
                        tabIndex={-1}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSlotDelete(s.id);
                        }}
                        aria-label="Supprimer le créneau"
                        className="pointer-events-auto absolute right-0.5 top-0.5 hidden h-4 w-4 place-items-center rounded-full bg-white/10 text-white/70 hover:bg-white/20 hover:text-white group-hover:grid"
                      >
                        <X className="h-2.5 w-2.5" strokeWidth={2} />
                      </span>
                    ) : null}
                  </button>
                );
              })}

              {/* Drag preview */}
              {dragActive ? (
                <div
                  aria-hidden
                  className="pointer-events-none absolute left-0.5 right-0.5 rounded-md border border-dashed border-[#0B0B0F]/40 bg-[#DFFF3F]/60"
                  style={{
                    top: dragFrom * ROW_HEIGHT + 1,
                    height: Math.max(ROW_HEIGHT - 2, (dragTo - dragFrom) * ROW_HEIGHT - 2),
                  }}
                >
                  <span className="block px-1.5 pt-0.5 text-[9.5px] font-semibold text-[#0B0B0F] tabular-nums">
                    {minutesToHHMM(startMin + dragFrom * ROW_STEP_MIN)}–
                    {minutesToHHMM(startMin + dragTo * ROW_STEP_MIN)}
                  </span>
                </div>
              ) : null}

              {/* Blocked overlay */}
              {blocked ? (
                <div className="pointer-events-none absolute inset-0 grid place-items-center">
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-white/80 text-[#8A8D93] shadow-[0_1px_2px_rgba(10,11,20,0.06)]">
                    <Lock className="h-3.5 w-3.5" strokeWidth={1.75} />
                  </span>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      {/* Footer toggle */}
      <div className="flex items-center justify-between border-t border-[#EFEFF1] bg-[#F5F5F7]/50 px-3 py-2">
        <span className="text-[10.5px] text-[#8A8D93]">
          Glisse dans une colonne vide pour créer un créneau
        </span>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="rounded-full border border-[#EFEFF1] bg-white px-2.5 py-1 text-[10.5px] font-semibold text-[#0B0B0F] transition-colors hover:bg-[#F5F5F7]"
        >
          {expanded ? "Voir 6h – 23h" : "Voir 24h"}
        </button>
      </div>
    </div>
  );
}

export { minutesToHHMM, hhmmToMinutes };
