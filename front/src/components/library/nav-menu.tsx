// Ported from ../components/navMenuComponent.tsx
// Original was a horizontal hover-panel navbar (Menu/MenuItem with mouse-enter
// dropdowns). For the profile sub-navigation use case we simplified to a
// focused two-variant API: vertical rows (desktop sidebar) and horizontal
// scroll-snap pills (mobile). Kept the shared motion accent (layoutId) that
// smoothly slides the active background — that is the DNA of the original.

"use client";

import { motion } from "motion/react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { springSoft } from "@/lib/motion";

export type NavMenuItem = {
  id: string;
  label: string;
  icon?: LucideIcon;
  badge?: number | string;
};

type NavMenuProps = {
  items: NavMenuItem[];
  activeId: string;
  onChange: (id: string) => void;
  variant?: "vertical" | "horizontal";
  className?: string;
  layoutIdSuffix?: string;
};

export function NavMenu({
  items,
  activeId,
  onChange,
  variant = "vertical",
  className,
  layoutIdSuffix = "default",
}: NavMenuProps) {
  if (variant === "horizontal") {
    return (
      <div
        role="tablist"
        aria-orientation="horizontal"
        className={cn(
          "scrollbar-none -mx-4 flex snap-x snap-mandatory gap-2 overflow-x-auto px-4 pb-1",
          className,
        )}
      >
        {items.map((it) => {
          const active = it.id === activeId;
          const Icon = it.icon;
          return (
            <button
              key={it.id}
              role="tab"
              aria-selected={active}
              onClick={() => onChange(it.id)}
              className={cn(
                "relative flex shrink-0 snap-start items-center gap-1.5 rounded-full px-3.5 py-2 text-[12px] font-semibold transition-colors",
                active ? "text-[#0B0B0F]" : "text-[#6E7178] hover:text-[#0B0B0F]",
              )}
            >
              {active ? (
                <motion.span
                  layoutId={`nav-menu-active-h-${layoutIdSuffix}`}
                  transition={springSoft}
                  className="absolute inset-0 rounded-full bg-[#DFFF3F]"
                />
              ) : null}
              {Icon ? (
                <Icon
                  className="relative z-10 h-3.5 w-3.5"
                  strokeWidth={active ? 2 : 1.75}
                />
              ) : null}
              <span className="relative z-10 whitespace-nowrap">{it.label}</span>
              {it.badge !== undefined ? (
                <span
                  className={cn(
                    "relative z-10 rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                    active ? "bg-[#0B0B0F] text-white" : "bg-[#F0F0F2] text-[#0B0B0F]",
                  )}
                >
                  {it.badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <nav
      role="tablist"
      aria-orientation="vertical"
      className={cn("flex flex-col gap-0.5", className)}
    >
      {items.map((it) => {
        const active = it.id === activeId;
        const Icon = it.icon;
        return (
          <button
            key={it.id}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(it.id)}
            className={cn(
              "relative flex items-center gap-2.5 rounded-[14px] px-3 py-2.5 text-left text-[13px] font-medium transition-colors",
              active ? "text-[#0B0B0F]" : "text-[#0B0B0F]/85 hover:bg-[#F5F5F7]",
            )}
          >
            {active ? (
              <motion.span
                layoutId={`nav-menu-active-v-${layoutIdSuffix}`}
                transition={springSoft}
                className="absolute inset-0 rounded-[14px] bg-[#DFFF3F]"
              />
            ) : null}
            {Icon ? (
              <Icon
                className="relative z-10 h-4 w-4"
                strokeWidth={active ? 2 : 1.75}
              />
            ) : null}
            <span className="relative z-10 flex-1 truncate">{it.label}</span>
            {it.badge !== undefined ? (
              <span
                className={cn(
                  "relative z-10 rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                  active ? "bg-[#0B0B0F] text-white" : "bg-[#F0F0F2] text-[#0B0B0F]",
                )}
              >
                {it.badge}
              </span>
            ) : null}
          </button>
        );
      })}
    </nav>
  );
}
