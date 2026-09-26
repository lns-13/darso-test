"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import {
  Bell,
  Calendar,
  MessageCircle,
  MoreHorizontal,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { Avatar } from "@/components/app/avatar";
import { Eyebrow } from "@/components/app/eyebrow";
import { springTight } from "@/lib/motion";
import { cn } from "@/lib/utils";

export type NotificationCategory = "session" | "payment" | "message" | "system";

export type NotificationRowProps = {
  id: string;
  category: NotificationCategory;
  title: string;
  body?: string;
  time: string;
  unread?: boolean;
  action?: { label: string; href?: string; onClick?: () => void };
  onMarkRead?: (id: string) => void;
  onDismiss?: (id: string) => void;
  avatar?: { name: string; initials: string };
};

const iconByCategory: Record<NotificationCategory, LucideIcon> = {
  session: Calendar,
  payment: Wallet,
  message: MessageCircle,
  system: Bell,
};

const chipToneByCategory: Record<NotificationCategory, string> = {
  session: "bg-[#DFFF3F] text-[#0B0B0F]",
  payment: "bg-[#F5F5F7] text-[#0B0B0F]",
  message: "bg-[#E9EAF0] text-[#0B0B0F]",
  system: "bg-[#0B0B0F] text-[#DFFF3F]",
};

export function NotificationRow({
  id,
  category,
  title,
  body,
  time,
  unread = false,
  action,
  onMarkRead,
  onDismiss,
  avatar,
}: NotificationRowProps) {
  const Icon = iconByCategory[category];
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: MouseEvent) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  const handleBodyClick = () => {
    if (unread && onMarkRead) onMarkRead(id);
    if (action?.onClick) action.onClick();
  };

  const bodyContent = (
    <>
      <p
        className={cn(
          "truncate text-[13px] leading-snug",
          unread ? "font-bold text-[#0B0B0F]" : "font-semibold text-[#4A4D54]",
        )}
      >
        {title}
      </p>
      {body ? (
        <p
          className={cn(
            "mt-0.5 line-clamp-2 text-[12px] leading-snug",
            unread ? "text-[#4A4D54]" : "text-[#8A8D93]",
          )}
        >
          {body}
        </p>
      ) : null}
      <div className="mt-1.5">
        <Eyebrow>{time}</Eyebrow>
      </div>
    </>
  );

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={springTight}
      className={cn(
        "group relative flex gap-3 rounded-[16px] p-3.5 shadow-[0_1px_2px_rgba(10,11,20,0.03)] transition-colors",
        unread
          ? "bg-white ring-1 ring-[#EFEFF1] hover:ring-[#E4E5E8]"
          : "bg-[#FAFAFB] ring-1 ring-[#F0F0F2] hover:bg-white",
      )}
    >
      {/* Icon chip (or avatar for message-type when avatar provided) */}
      <div className="relative shrink-0">
        {avatar ? (
          <Avatar
            initials={avatar.initials}
            tone={category === "message" ? "neutral" : "neutral"}
            size={40}
          />
        ) : (
          <div
            className={cn(
              "grid h-10 w-10 place-items-center rounded-full",
              chipToneByCategory[category],
            )}
          >
            <Icon className="h-[17px] w-[17px]" strokeWidth={1.75} />
          </div>
        )}
        {unread ? (
          <span className="absolute -left-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-[#DFFF3F] ring-2 ring-white" />
        ) : null}
      </div>

      {/* Middle — link when we have a related resource, button when we can still
          mark-as-read, plain div otherwise (already read + non-actionable). */}
      {action?.href ? (
        <Link
          href={action.href}
          onClick={handleBodyClick}
          className="min-w-0 flex-1 cursor-pointer text-left"
        >
          {bodyContent}
        </Link>
      ) : unread && onMarkRead ? (
        <button
          type="button"
          onClick={handleBodyClick}
          className="min-w-0 flex-1 cursor-pointer text-left"
        >
          {bodyContent}
        </button>
      ) : (
        <div className="min-w-0 flex-1 text-left">{bodyContent}</div>
      )}

      {/* Right */}
      <div className="flex shrink-0 flex-col items-end justify-between gap-1.5">
        <div className="relative">
          <button
            type="button"
            aria-label="Options"
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen((v) => !v);
            }}
            className="grid h-7 w-7 place-items-center rounded-full text-[#8A8D93] transition-colors hover:bg-[#F0F0F2] hover:text-[#0B0B0F]"
          >
            <MoreHorizontal className="h-4 w-4" strokeWidth={1.75} />
          </button>
          <AnimatePresence>
            {menuOpen ? (
              <motion.div
                ref={menuRef}
                initial={{ opacity: 0, y: -4, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.96 }}
                transition={{ duration: 0.12 }}
                className="absolute right-0 top-8 z-40 w-40 overflow-hidden rounded-[12px] bg-white p-1 shadow-[0_10px_30px_rgba(11,11,15,0.14)] ring-1 ring-[#EFEFF1]"
              >
                  {unread && onMarkRead ? (
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        onMarkRead(id);
                      }}
                      className="block w-full rounded-[8px] px-2.5 py-1.5 text-left text-[12px] font-medium text-[#0B0B0F] transition-colors hover:bg-[#F5F5F7]"
                    >
                      Marquer comme lu
                    </button>
                  ) : null}
                  {onDismiss ? (
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        onDismiss(id);
                      }}
                      className="block w-full rounded-[8px] px-2.5 py-1.5 text-left text-[12px] font-medium text-[#8A8D93] transition-colors hover:bg-[#F5F5F7] hover:text-[#0B0B0F]"
                    >
                      Supprimer
                    </button>
                  ) : null}
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>

        {action ? (
          action.href ? (
            <a
              href={action.href}
              onClick={(e) => {
                e.stopPropagation();
                if (unread && onMarkRead) onMarkRead(id);
              }}
              className={cn(
                "inline-flex h-7 items-center rounded-full px-3 text-[11px] font-semibold transition-colors",
                unread
                  ? "bg-[#0B0B0F] text-white hover:bg-[#22232A]"
                  : "border border-[#EFEFF1] bg-white text-[#0B0B0F] hover:bg-[#F5F5F7]",
              )}
            >
              {action.label}
            </a>
          ) : (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (unread && onMarkRead) onMarkRead(id);
                action.onClick?.();
              }}
              className={cn(
                "inline-flex h-7 items-center rounded-full px-3 text-[11px] font-semibold transition-colors",
                unread
                  ? "bg-[#0B0B0F] text-white hover:bg-[#22232A]"
                  : "border border-[#EFEFF1] bg-white text-[#0B0B0F] hover:bg-[#F5F5F7]",
              )}
            >
              {action.label}
            </button>
          )
        ) : null}
      </div>
    </motion.div>
  );
}
