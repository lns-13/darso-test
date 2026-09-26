"use client";

import { motion } from "motion/react";
import { Calendar, Clock, MoreHorizontal, RotateCcw, X } from "lucide-react";
import { Avatar } from "@/components/app/avatar";
import { cn } from "@/lib/utils";
import { springTight } from "@/lib/motion";

export type SessionStatus = "upcoming" | "live" | "past";

export type SessionCardProps = {
  id: string;
  title: string;
  subject: string;
  teacher: { name: string; initials: string };
  whenLabel: string;
  when: string; // ISO
  duration: string;
  status: SessionStatus;
  dot?: string;
  selected?: boolean;
  pulsing?: boolean;
  onSelect?: (id: string) => void;
  onJoin?: (id: string) => void;
  onReschedule?: (id: string) => void;
  onCancel?: (id: string) => void;
};

const statusMeta: Record<
  SessionStatus,
  { label: string; className: string; dotClass?: string }
> = {
  live: {
    label: "En cours",
    className: "bg-[#DFFF3F] text-[#0B0B0F]",
    dotClass: "bg-[#0B0B0F] animate-pulse",
  },
  upcoming: {
    label: "À venir",
    className: "bg-[#0B0B0F] text-white",
  },
  past: {
    label: "Terminée",
    className: "bg-[#F0F0F2] text-[#6E7178]",
  },
};

export function SessionCard({
  id,
  title,
  subject,
  teacher,
  whenLabel,
  duration,
  status,
  dot = "#C4CFFF",
  selected,
  pulsing,
  onSelect,
  onJoin,
  onReschedule,
  onCancel,
}: SessionCardProps) {
  const isPast = status === "past";
  const isLive = status === "live";
  const meta = statusMeta[status];

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect?.(id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect?.(id);
        }
      }}
      className={cn(
        "group relative flex cursor-pointer items-stretch gap-3.5 rounded-[16px] border p-3.5 transition-all",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0B0B0F] focus-visible:ring-offset-2",
        selected
          ? "border-[#0B0B0F] bg-white shadow-[0_2px_8px_rgba(10,11,20,0.08)]"
          : "border-[#EFEFF1] bg-white hover:border-[#D5D7DB]",
        isPast && !selected && "bg-[#F5F5F7]/60",
      )}
    >
      {selected ? (
        <motion.span
          layoutId="session-card-active-bar"
          transition={springTight}
          className="absolute left-0 top-3 bottom-3 w-[3px] rounded-r-full bg-[#DFFF3F]"
        />
      ) : null}

      <div className="relative shrink-0">
        <div
          className={cn(
            "relative grid h-11 w-11 place-items-center rounded-[12px]",
            isPast ? "bg-[#EDEDEF] text-[#8A8D93]" : "bg-[#F5F5F7] text-[#0B0B0F]",
          )}
        >
          <Calendar className="h-4 w-4" strokeWidth={1.75} />
          <span
            className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-white"
            style={{ backgroundColor: dot }}
          />
        </div>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p
            className={cn(
              "text-[10px] font-semibold uppercase tracking-[0.06em]",
              isPast ? "text-[#A5A8AE]" : "text-[#8A8D93]",
            )}
          >
            {whenLabel}
          </p>
          <span
            className={cn(
              "inline-flex h-4 items-center gap-1 rounded-full px-1.5 text-[9.5px] font-semibold",
              meta.className,
            )}
          >
            {meta.dotClass ? (
              <span className={cn("h-1 w-1 rounded-full", meta.dotClass)} />
            ) : null}
            {meta.label}
          </span>
        </div>
        <p
          className={cn(
            "mt-0.5 truncate text-[13.5px] font-semibold",
            isPast ? "text-[#4A4D54]" : "text-[#0B0B0F]",
          )}
        >
          {title}
        </p>
        <div className="mt-1 flex items-center gap-2 text-[11px] text-[#8A8D93]">
          <div className="flex items-center gap-1.5">
            <Avatar initials={teacher.initials} size={16} tone="neutral" />
            <span className="truncate">{teacher.name}</span>
          </div>
          <span className="h-0.5 w-0.5 shrink-0 rounded-full bg-[#D5D7DB]" />
          <span className="shrink-0">{subject}</span>
          <span className="h-0.5 w-0.5 shrink-0 rounded-full bg-[#D5D7DB]" />
          <span className="flex shrink-0 items-center gap-1">
            <Clock className="h-3 w-3" strokeWidth={1.75} />
            {duration}
          </span>
        </div>
      </div>

      {!isPast ? (
        <div className="hidden shrink-0 items-center gap-1.5 min-[900px]:flex">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onJoin?.(id);
            }}
            className={cn(
              "relative h-8 rounded-full px-3 text-[11.5px] font-semibold transition-colors",
              isLive || pulsing
                ? "bg-[#DFFF3F] text-[#0B0B0F] hover:brightness-[0.97]"
                : "bg-[#0B0B0F] text-white hover:bg-[#1a1b21]",
            )}
          >
            {pulsing ? (
              <motion.span
                aria-hidden
                animate={{ scale: [1, 1.04, 1] }}
                transition={{ repeat: Infinity, duration: 1.6 }}
                className="pointer-events-none absolute inset-0 rounded-full ring-2 ring-[#DFFF3F]/70"
              />
            ) : null}
            <span className="relative flex items-center gap-1.5">
              {isLive || pulsing ? (
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#0B0B0F]" />
              ) : null}
              Rejoindre
            </span>
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onReschedule?.(id);
            }}
            aria-label="Reprogrammer"
            className="grid h-8 w-8 place-items-center rounded-full border border-[#EFEFF1] text-[#0B0B0F] transition-colors hover:bg-[#F5F5F7]"
          >
            <RotateCcw className="h-3.5 w-3.5" strokeWidth={1.75} />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onCancel?.(id);
            }}
            aria-label="Annuler"
            className="grid h-8 w-8 place-items-center rounded-full border border-[#EFEFF1] text-[#0B0B0F] transition-colors hover:bg-[#F5F5F7]"
          >
            <X className="h-3.5 w-3.5" strokeWidth={1.75} />
          </button>
        </div>
      ) : (
        <div className="hidden shrink-0 items-center gap-1.5 min-[900px]:flex">
          <span
            className="grid h-8 w-8 place-items-center rounded-full border border-[#EFEFF1] text-[#8A8D93]"
            aria-hidden
          >
            <MoreHorizontal className="h-3.5 w-3.5" strokeWidth={1.75} />
          </span>
        </div>
      )}
    </div>
  );
}
