"use client";

import { useState } from "react";
import Link from "next/link";
import { Bookmark, Star } from "lucide-react";
import { Avatar } from "./avatar";
import { cn } from "@/lib/utils";

export type CourseCardTone = "lime" | "soft-blue" | "cream";

export type CourseCardProps = {
  subject: string;
  title: string;
  teacher: { name: string; initials: string };
  rating: number;
  sessionsGiven: number;
  price: number;
  nextSlot: string;
  tone: CourseCardTone;
  href?: string;
  /** If provided, bookmark toggle is controlled externally (used by favorites). */
  bookmarked?: boolean;
  onBookmarkToggle?: (next: boolean) => void;
};

export function CourseCard({
  subject,
  title,
  teacher,
  rating,
  sessionsGiven,
  price,
  nextSlot,
  href,
  bookmarked,
  onBookmarkToggle,
}: CourseCardProps) {
  const [internalSaved, setInternalSaved] = useState(false);
  const isControlled = bookmarked !== undefined;
  const saved = isControlled ? bookmarked : internalSaved;
  const setSaved = (next: boolean) => {
    if (isControlled) onBookmarkToggle?.(next);
    else setInternalSaved(next);
  };
  const Wrapper: React.ElementType = href ? Link : "article";
  const wrapperProps = href
    ? { href, "aria-label": `${subject} — ${title}` }
    : {};
  return (
    <Wrapper
      {...wrapperProps}
      className={cn(
        "flex flex-col overflow-hidden rounded-[16px] border border-[#EFEFF1] bg-white transition-shadow hover:shadow-[0_4px_16px_rgba(10,11,20,0.06)]",
        href && "cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0B0B0F] focus-visible:ring-offset-2",
      )}
    >
      <div className="flex items-start justify-between gap-2 px-3.5 pt-3">
        <span className="inline-flex items-center rounded-full border border-[#EFEFF1] bg-white px-2 py-0.5 text-[10.5px] font-semibold text-[#0B0B0F]">
          {subject}
        </span>
        <div className="flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-full bg-[#0B0B0F] px-1.5 py-0.5 text-[10.5px] font-semibold text-white">
            <Star className="h-2.5 w-2.5 fill-current" strokeWidth={0} />
            {rating.toFixed(1)}
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setSaved(!saved);
            }}
            aria-label={saved ? "Retirer des favoris" : "Ajouter aux favoris"}
            aria-pressed={saved}
            className={cn(
              "grid h-7 w-7 place-items-center rounded-full text-[#0B0B0F] transition-colors",
              saved ? "bg-[#DFFF3F]" : "bg-[#F5F5F7] hover:bg-[#EFEFF1]",
            )}
          >
            <Bookmark
              className="h-3.5 w-3.5"
              strokeWidth={1.75}
              fill={saved ? "currentColor" : "none"}
            />
          </button>
        </div>
      </div>
      <div className="flex flex-1 flex-col p-3.5 pt-2.5">
        <h3 className="text-[13px] font-semibold leading-snug text-[#0B0B0F]">{title}</h3>
        <div className="mt-1.5 flex items-center gap-1.5">
          <Avatar initials={teacher.initials} tone="neutral" size={18} />
          <p className="truncate text-[11px] text-[#6E7178]">
            {teacher.name} · {sessionsGiven} séances
          </p>
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-[#EFEFF1] pt-2.5">
          <div>
            <p className="text-[9.5px] font-medium uppercase tracking-[0.06em] text-[#B0B3B8]">
              Prochain créneau
            </p>
            <p className="text-[11px] font-semibold text-[#0B0B0F]">{nextSlot}</p>
          </div>
          <div className="text-right">
            <p className="text-[9.5px] font-medium uppercase tracking-[0.06em] text-[#B0B3B8]">
              À partir de
            </p>
            <p className="text-[12px] font-bold text-[#0B0B0F]">
              {price} <span className="text-[9.5px] font-medium text-[#8A8D93]">MAD/h</span>
            </p>
          </div>
        </div>
      </div>
    </Wrapper>
  );
}
