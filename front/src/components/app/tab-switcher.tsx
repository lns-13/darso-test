"use client";

import { motion } from "motion/react";
import { useId } from "react";
import { springTight } from "@/lib/motion";
import { cn } from "@/lib/utils";

export type TabSwitcherProps<T extends string> = {
  tabs: { key: T; label: string; count?: number }[];
  value: T;
  onChange: (v: T) => void;
  className?: string;
};

export function TabSwitcher<T extends string>({
  tabs,
  value,
  onChange,
  className,
}: TabSwitcherProps<T>) {
  const layoutId = useId();
  return (
    <div
      role="tablist"
      className={cn(
        "inline-flex h-9 items-center gap-0.5 rounded-full bg-[#F0F0F2] p-1",
        className,
      )}
    >
      {tabs.map((tab) => {
        const isActive = tab.key === value;
        return (
          <button
            key={tab.key}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.key)}
            className={cn(
              "relative flex h-7 items-center gap-1.5 rounded-full px-3 text-[12px] font-semibold transition-colors",
              isActive ? "text-white" : "text-[#4A4D54] hover:text-[#0B0B0F]",
            )}
          >
            {isActive ? (
              <motion.span
                layoutId={`tab-pill-${layoutId}`}
                transition={springTight}
                className="absolute inset-0 rounded-full bg-[#0B0B0F]"
              />
            ) : null}
            <span className="relative z-10">{tab.label}</span>
            {typeof tab.count === "number" ? (
              <span
                className={cn(
                  "relative z-10 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold tabular-nums",
                  isActive ? "bg-[#DFFF3F] text-[#0B0B0F]" : "bg-white text-[#4A4D54]",
                )}
              >
                {tab.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
