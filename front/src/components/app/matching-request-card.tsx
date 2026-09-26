"use client";

import { CalendarClock, Users } from "lucide-react";
import { Avatar } from "./avatar";
import { Eyebrow } from "./eyebrow";

export type MatchingRequestCardProps = {
  id: string;
  author: { name: string; initials: string; level: string };
  subject: string;
  title: string;
  snippet?: string;
  budget: number;
  deadlineLabel: string;
  proposalsCount: number;
  onApply?: (id: string) => void;
};

export function MatchingRequestCard({
  id,
  author,
  subject,
  title,
  snippet,
  budget,
  deadlineLabel,
  proposalsCount,
  onApply,
}: MatchingRequestCardProps) {
  return (
    <article className="flex h-full min-w-[280px] max-w-[300px] shrink-0 snap-start flex-col rounded-[16px] border border-[#EFEFF1] bg-white p-3.5 transition-shadow hover:shadow-[0_4px_16px_rgba(10,11,20,0.06)]">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <Avatar initials={author.initials} tone="neutral" size={28} />
          <div className="min-w-0">
            <p className="truncate text-[11.5px] font-semibold text-[#0B0B0F]">
              {author.name}
            </p>
            <p className="truncate text-[9.5px] font-medium text-[#8A8D93]">
              {author.level}
            </p>
          </div>
        </div>
        <span className="flex h-5 shrink-0 items-center gap-1 rounded-full bg-[#F5F5F7] px-1.5 text-[9.5px] font-medium text-[#4A4D54]">
          <Users className="h-2.5 w-2.5" strokeWidth={2.25} />
          {proposalsCount}
        </span>
      </div>

      <div className="mt-2.5">
        <Eyebrow>{subject}</Eyebrow>
        <h3 className="mt-1 font-[family-name:var(--font-cabinet)] text-[14px] font-bold leading-[1.2] tracking-tight text-[#0B0B0F] line-clamp-2">
          {title}
        </h3>
        {snippet ? (
          <p className="mt-1.5 line-clamp-2 text-[11px] leading-snug text-[#6E7178]">
            {snippet}
          </p>
        ) : null}
      </div>

      <div className="mt-auto pt-3">
        <div className="flex items-end justify-between gap-2 border-t border-[#EFEFF1] pt-2.5">
          <div className="min-w-0">
            <p className="text-[9px] font-medium uppercase tracking-[0.06em] text-[#B0B3B8]">
              Budget
            </p>
            <p className="text-[12.5px] font-bold text-[#0B0B0F] tabular-nums">
              {budget}
              <span className="ml-0.5 text-[9.5px] font-medium text-[#8A8D93]">MAD/h</span>
            </p>
          </div>
          <span className="flex shrink-0 items-center gap-1 rounded-full bg-[#F5F5F7] px-2 py-0.5 text-[10px] font-semibold text-[#0B0B0F]">
            <CalendarClock className="h-2.5 w-2.5" strokeWidth={2.25} />
            {deadlineLabel}
          </span>
        </div>
        <button
          type="button"
          onClick={() => onApply?.(id)}
          className="mt-2.5 w-full rounded-full bg-[#0B0B0F] py-2 text-[11.5px] font-semibold text-white transition-colors hover:bg-[#1a1b21]"
        >
          Postuler
        </button>
      </div>
    </article>
  );
}
