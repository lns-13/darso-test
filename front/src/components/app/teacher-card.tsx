"use client";

import { Bookmark, BookmarkCheck, Star } from "lucide-react";
import { motion } from "motion/react";
import { Avatar } from "./avatar";
import { Eyebrow } from "./eyebrow";
import { springSoft } from "@/lib/motion";
import { cn } from "@/lib/utils";

export type TeacherCardTone = "lime" | "soft-blue" | "cream" | "neutral";

export type TeacherCardProps = {
  id: string;
  name: string;
  subject: string;
  rating: number;
  sessionsCount: number;
  hourlyRate: number;
  tone?: TeacherCardTone;
  bookmarked?: boolean;
  onBookmarkToggle?: (id: string, next: boolean) => void;
  onClick?: (id: string) => void;
  className?: string;
};

function initialsFromName(name: string): string {
  const parts = name
    .split(/\s+/)
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const avatarToneByTone: Record<TeacherCardTone, "lime" | "soft-blue" | "cream" | "neutral"> = {
  lime: "lime",
  "soft-blue": "soft-blue",
  cream: "cream",
  neutral: "neutral",
};

export function TeacherCard({
  id,
  name,
  subject,
  rating,
  sessionsCount,
  hourlyRate,
  tone = "neutral",
  bookmarked = false,
  onBookmarkToggle,
  onClick,
  className,
}: TeacherCardProps) {
  const handleClick = () => {
    if (onClick) {
      onClick(id);
    } else if (typeof window !== "undefined") {
      window.location.hash = `teacher-${id}`;
    }
  };

  const handleKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleClick();
    }
  };

  const toggleBookmark: React.MouseEventHandler<HTMLButtonElement> = (e) => {
    e.stopPropagation();
    e.preventDefault();
    onBookmarkToggle?.(id, !bookmarked);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={cn(
        "group relative flex cursor-pointer flex-col overflow-hidden rounded-[16px] border border-[#EFEFF1] bg-white p-4 text-left transition-shadow hover:shadow-[0_4px_16px_rgba(10,11,20,0.06)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0B0B0F] focus-visible:ring-offset-2",
        className,
      )}
    >
      {/* Header row: Avatar + name/subject + rating pill */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar
            initials={initialsFromName(name)}
            tone={avatarToneByTone[tone]}
            size={44}
          />
          <div className="min-w-0">
            <Eyebrow>{subject}</Eyebrow>
            <p className="mt-0.5 truncate font-[family-name:var(--font-cabinet)] text-[15px] font-bold leading-tight tracking-tight text-[#0B0B0F]">
              {name}
            </p>
          </div>
        </div>
        <span className="flex shrink-0 items-center gap-1 rounded-full bg-[#0B0B0F] px-1.5 py-0.5 text-[10.5px] font-semibold text-white">
          <Star className="h-2.5 w-2.5 fill-current" strokeWidth={0} />
          {rating.toFixed(1)}
        </span>
      </div>

      {/* Middle: sessions count */}
      <p className="mt-3.5 text-[12px] text-[#6E7178]">
        <span className="font-semibold text-[#0B0B0F] tabular-nums">
          {sessionsCount}
        </span>{" "}
        séances données
      </p>

      {/* Bottom row: rate + bookmark */}
      <div className="mt-3.5 flex items-center justify-between border-t border-[#EFEFF1] pt-3">
        <div>
          <p className="text-[9.5px] font-medium uppercase tracking-[0.06em] text-[#B0B3B8]">
            À partir de
          </p>
          <p className="text-[12px] font-bold text-[#0B0B0F]">
            {hourlyRate}{" "}
            <span className="text-[9.5px] font-medium text-[#8A8D93]">MAD/h</span>
          </p>
        </div>
        <motion.button
          type="button"
          aria-label={bookmarked ? "Retirer des favoris" : "Ajouter aux favoris"}
          aria-pressed={bookmarked}
          onClick={toggleBookmark}
          animate={bookmarked ? { scale: [1, 1.15, 1] } : { scale: 1 }}
          transition={
            bookmarked
              ? { duration: 0.35, times: [0, 0.55, 1], ease: "easeOut" }
              : springSoft
          }
          className={cn(
            "grid h-8 w-8 place-items-center rounded-full transition-colors",
            bookmarked
              ? "bg-[#0B0B0F] text-[#DFFF3F]"
              : "bg-[#F5F5F7] text-[#0B0B0F] hover:bg-[#EDEDEF]",
          )}
        >
          {bookmarked ? (
            <BookmarkCheck className="h-3.5 w-3.5 fill-current" strokeWidth={1.75} />
          ) : (
            <Bookmark className="h-3.5 w-3.5" strokeWidth={1.75} />
          )}
        </motion.button>
      </div>
    </div>
  );
}
