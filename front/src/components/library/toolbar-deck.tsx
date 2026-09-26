// Ported from ../components/toolbarDeck.tsx
// Original: kokonutui Toolbar (@dorianbaffier, MIT).
// Adapted for darso: darso design tokens, no notification popover, no toggle,
// smaller sizing, and typed via LucideIcon.
"use client";

import * as React from "react";
import { AnimatePresence, motion } from "motion/react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToolbarDeckItem = {
  id: string;
  title: string;
  icon: LucideIcon;
};

type ToolbarDeckProps = {
  items: ToolbarDeckItem[];
  defaultSelected?: string | null;
  className?: string;
  onSelect?: (itemId: string) => void;
  size?: "sm" | "md";
};

const buttonVariants = {
  initial: { gap: 0, paddingLeft: ".5rem", paddingRight: ".5rem" },
  animate: (isSelected: boolean) => ({
    gap: isSelected ? ".4rem" : 0,
    paddingLeft: isSelected ? ".75rem" : ".5rem",
    paddingRight: isSelected ? ".75rem" : ".5rem",
  }),
};

const spanVariants = {
  initial: { width: 0, opacity: 0 },
  animate: { width: "auto", opacity: 1 },
  exit: { width: 0, opacity: 0 },
};

const transition = { type: "spring" as const, bounce: 0, duration: 0.35 };

export function ToolbarDeck({
  items,
  defaultSelected = null,
  className,
  onSelect,
  size = "sm",
}: ToolbarDeckProps) {
  const [selected, setSelected] = React.useState<string | null>(defaultSelected);
  const iconSize = size === "sm" ? 14 : 16;
  const height = size === "sm" ? "h-8" : "h-9";

  const handleClick = (itemId: string) => {
    setSelected(selected === itemId ? null : itemId);
    onSelect?.(itemId);
  };

  return (
    <div
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full border border-[#EFEFF1] bg-white p-1",
        className,
      )}
    >
      {items.map((item) => {
        const isSelected = selected === item.id;
        return (
          <motion.button
            key={item.id}
            type="button"
            aria-label={item.title}
            aria-pressed={isSelected}
            onClick={() => handleClick(item.id)}
            custom={isSelected}
            initial={false}
            animate="animate"
            variants={buttonVariants as never}
            transition={transition as never}
            className={cn(
              "relative flex shrink-0 items-center rounded-full font-semibold transition-colors",
              height,
              "text-[11px]",
              isSelected
                ? "bg-[#0B0B0F] text-white"
                : "text-[#6E7178] hover:bg-[#F5F5F7] hover:text-[#0B0B0F]",
            )}
          >
            <item.icon
              size={iconSize}
              strokeWidth={1.9}
              className={cn(isSelected ? "text-white" : "")}
            />
            <AnimatePresence initial={false}>
              {isSelected ? (
                <motion.span
                  key="label"
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  variants={spanVariants as never}
                  transition={transition as never}
                  className="overflow-hidden whitespace-nowrap"
                >
                  {item.title}
                </motion.span>
              ) : null}
            </AnimatePresence>
          </motion.button>
        );
      })}
    </div>
  );
}

export default ToolbarDeck;
