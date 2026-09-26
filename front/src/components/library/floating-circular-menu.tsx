"use client";

// Built fresh from scratch — the original ../components/floatingCircularAnimatedMenu.tsx
// depends on a Link-based menu with a separate CSS file. This version is a lighter,
// callback-driven radial FAB using motion/react.

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Plus, X, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type FloatingMenuAction = {
  key: string;
  label: string;
  icon: LucideIcon;
  onSelect: () => void;
  tone?: "dark" | "lime";
};

export type FloatingCircularMenuProps = {
  actions: FloatingMenuAction[];
  triggerLabel?: string;
  triggerIcon?: LucideIcon;
  className?: string;
  /** Radius from FAB center to sub-buttons, in px. */
  radius?: number;
  /** Start angle (deg) — 180 = left, 270 = up. */
  startAngle?: number;
  /** Fan sweep (deg). Default 90 = quarter-circle. */
  sweep?: number;
};

export function FloatingCircularMenu({
  actions,
  triggerLabel = "Ouvrir le menu",
  triggerIcon: TriggerIcon = Plus,
  className,
  radius = 78,
  startAngle = 180,
  sweep = 90,
}: FloatingCircularMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (rootRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const count = actions.length;
  const step = count > 1 ? sweep / (count - 1) : 0;

  return (
    <div ref={rootRef} className={cn("relative z-[70]", className)}>
      {/* Backdrop */}
      <AnimatePresence>
        {open ? (
          <motion.button
            key="fab-backdrop"
            aria-label="Fermer le menu"
            onClick={close}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 -z-10 bg-[#0B0B0F]/30 backdrop-blur-[1px]"
          />
        ) : null}
      </AnimatePresence>

      {/* Sub-actions */}
      <div className="pointer-events-none absolute right-2 bottom-2">
        {actions.map((a, i) => {
          const angle = (startAngle + step * i) * (Math.PI / 180);
          const dx = Math.cos(angle) * radius;
          const dy = Math.sin(angle) * radius;
          const Icon = a.icon;
          const tone = a.tone ?? "dark";
          return (
            <motion.div
              key={a.key}
              initial={false}
              animate={
                open
                  ? { x: dx, y: dy, scale: 1, opacity: 1 }
                  : { x: 0, y: 0, scale: 0.6, opacity: 0 }
              }
              transition={{
                type: "spring",
                stiffness: 380,
                damping: 26,
                mass: 0.5,
                delay: open ? i * 0.03 : (count - 1 - i) * 0.02,
              }}
              className="absolute right-0 bottom-0"
              style={{ pointerEvents: open ? "auto" : "none" }}
            >
              <button
                type="button"
                onClick={() => {
                  a.onSelect();
                  setOpen(false);
                }}
                aria-label={a.label}
                title={a.label}
                className={cn(
                  "grid h-11 w-11 place-items-center rounded-full shadow-[0_6px_18px_rgba(10,11,20,0.22)] transition-transform hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#DFFF3F] focus-visible:ring-offset-2",
                  tone === "lime"
                    ? "bg-[#DFFF3F] text-[#0B0B0F]"
                    : "bg-[#0B0B0F] text-white",
                )}
              >
                <Icon className="h-4 w-4" strokeWidth={2} />
              </button>
              {/* Floating label */}
              <span
                aria-hidden
                className="pointer-events-none absolute right-[52px] top-1/2 -translate-y-1/2 whitespace-nowrap rounded-full bg-[#0B0B0F] px-2 py-0.5 text-[10.5px] font-semibold text-white shadow-[0_2px_6px_rgba(10,11,20,0.2)]"
                style={{ opacity: open ? 1 : 0, transition: "opacity 160ms ease" }}
              >
                {a.label}
              </span>
            </motion.div>
          );
        })}
      </div>

      {/* Main FAB */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={open ? "Fermer" : triggerLabel}
        className="relative grid h-14 w-14 place-items-center rounded-full bg-[#DFFF3F] text-[#0B0B0F] shadow-[0_10px_28px_rgba(10,11,20,0.28)] transition-[filter,transform] hover:brightness-[0.97] active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0B0B0F] focus-visible:ring-offset-2"
      >
        <motion.span
          animate={{ rotate: open ? 45 : 0 }}
          transition={{ type: "spring", stiffness: 380, damping: 22 }}
          className="grid place-items-center"
        >
          {open ? (
            <X className="h-5 w-5" strokeWidth={2} />
          ) : (
            <TriggerIcon className="h-5 w-5" strokeWidth={2} />
          )}
        </motion.span>
      </button>
    </div>
  );
}
