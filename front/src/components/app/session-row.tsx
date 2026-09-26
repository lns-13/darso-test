"use client";

import { Calendar } from "lucide-react";
import { ComingSoonButton } from "@/components/app/coming-soon-button";
import { StatefulButton } from "@/components/library/stateful-button";

export type SessionRowProps = {
  when: string;
  title: string;
  teacher: string;
  duration: string;
  dot: string;
  joinable: boolean;
  /** If provided, tapping the row (outside the trailing button) fires this. */
  onSelect?: () => void;
  /** If provided, replaces the coming-soon 'Rejoindre' with a real join. */
  onJoin?: () => void;
  /** If provided, replaces the coming-soon 'Détails' with a real handler. */
  onDetails?: () => void;
};

export function SessionRow({
  when,
  title,
  teacher,
  duration,
  dot,
  joinable,
  onSelect,
  onJoin,
  onDetails,
}: SessionRowProps) {
  const rowInteractive = Boolean(onSelect);
  const rowInteractiveProps = rowInteractive
    ? {
        role: "button" as const,
        tabIndex: 0,
        onClick: onSelect,
        onKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onSelect?.();
          }
        },
      }
    : {};
  return (
    <div
      {...rowInteractiveProps}
      className={
        rowInteractive
          ? "flex w-full cursor-pointer items-center gap-3.5 p-3.5 text-left transition-colors hover:bg-[#F5F5F7] focus:outline-none focus-visible:bg-[#F5F5F7]"
          : "flex items-center gap-3.5 p-3.5"
      }
    >
      <div className="relative grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[#F5F5F7]">
        <Calendar className="h-4 w-4 text-[#0B0B0F]" strokeWidth={1.75} />
        <span
          className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-white"
          style={{ backgroundColor: dot }}
        />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-[0.06em] text-[#8A8D93]">
          {when}
        </p>
        <p className="mt-0.5 truncate text-[13px] font-semibold text-[#0B0B0F]">{title}</p>
        <p className="truncate text-[11px] text-[#8A8D93]">
          avec {teacher} · {duration}
        </p>
      </div>
      {joinable ? (
        onJoin ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onJoin();
            }}
            className="flex shrink-0 items-center gap-1.5 rounded-full bg-[#0B0B0F] px-3 py-1.5 text-[11.5px] font-semibold text-white transition-colors hover:bg-[#1a1b21]"
          >
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#DFFF3F]" />
            Rejoindre
          </button>
        ) : (
          <StatefulButton>
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#0B0B0F]" />
              Rejoindre
            </span>
          </StatefulButton>
        )
      ) : onDetails ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDetails();
          }}
          className="shrink-0 rounded-full border border-[#EFEFF1] px-3 py-1.5 text-[11.5px] font-semibold text-[#0B0B0F] transition-colors hover:bg-[#F5F5F7]"
        >
          Détails
        </button>
      ) : (
        <ComingSoonButton
          message="Détails à venir"
          className="rounded-full border border-[#EFEFF1] px-3 py-1.5 text-[11.5px] font-semibold text-[#0B0B0F] transition-colors hover:bg-[#F5F5F7]"
          flashClassName="!bg-[#F5F5F7]"
        >
          Détails
        </ComingSoonButton>
      )}
    </div>
  );
}
