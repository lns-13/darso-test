"use client";

import { Check, ChevronDown, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useMemo, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export type StepperStatus =
  | "pending"
  | "in-progress"
  | "approved"
  | "rejected";

export type StepperStep = {
  id: string;
  label: string;
  status: StepperStatus;
  description?: string;
};

type StepperProps = {
  steps: StepperStep[];
  activeId: string;
  onSelect: (id: string) => void;
  className?: string;
};

/* ---------------- shared visuals ---------------- */

const STATUS_PILL: Record<StepperStatus, { label: string; classes: string }> = {
  approved: { label: "Approuvé", classes: "bg-[#DFFF3F] text-[#0B0B0F]" },
  "in-progress": { label: "En cours", classes: "bg-[#0B0B0F] text-white" },
  pending: { label: "En attente", classes: "bg-[#F0F0F2] text-[#6E7178]" },
  rejected: {
    label: "Rejeté",
    classes: "border border-[#DC2626] bg-white text-[#DC2626]",
  },
};

export function StepperStatusPill({
  status,
  className,
}: {
  status: StepperStatus;
  className?: string;
}) {
  const v = STATUS_PILL[status];
  return (
    <span
      className={cn(
        "inline-flex h-5 items-center gap-1 rounded-full px-2 text-[10px] font-semibold",
        v.classes,
        className,
      )}
    >
      {v.label}
    </span>
  );
}

function StepDot({
  status,
  active,
}: {
  status: StepperStatus;
  active: boolean;
}) {
  // Base sizes: active is bigger with a lime ring.
  const base =
    "relative z-10 grid shrink-0 place-items-center rounded-full transition-all";
  const size = active ? "h-8 w-8" : "h-6 w-6";

  if (status === "approved") {
    return (
      <div
        className={cn(
          base,
          size,
          "bg-[#0B0B0F] text-[#DFFF3F]",
          active && "ring-4 ring-[#DFFF3F]",
        )}
      >
        <Check
          className={active ? "h-4 w-4" : "h-3 w-3"}
          strokeWidth={2.5}
        />
      </div>
    );
  }

  if (status === "rejected") {
    return (
      <div
        className={cn(
          base,
          size,
          "border border-[#DC2626] bg-white text-[#DC2626]",
          active && "ring-4 ring-[#DFFF3F]",
        )}
      >
        <X className={active ? "h-4 w-4" : "h-3 w-3"} strokeWidth={2.5} />
      </div>
    );
  }

  if (status === "in-progress") {
    return (
      <div
        className={cn(
          base,
          size,
          "border-2 border-[#0B0B0F] bg-white",
          active && "ring-4 ring-[#DFFF3F]",
        )}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-[#0B0B0F]" />
      </div>
    );
  }

  // pending
  return (
    <div
      className={cn(
        base,
        size,
        "border border-[#EFEFF1] bg-white",
        active && "ring-4 ring-[#DFFF3F]",
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-[#D5D7DB]" />
    </div>
  );
}

/* ---------------- Desktop vertical stepper ---------------- */

export function Stepper({
  steps,
  activeId,
  onSelect,
  className,
}: StepperProps) {
  const activeIndex = useMemo(
    () => Math.max(0, steps.findIndex((s) => s.id === activeId)),
    [steps, activeId],
  );

  const handleKey = useCallback(
    (e: React.KeyboardEvent<HTMLButtonElement>, idx: number) => {
      if (e.key === "ArrowDown" || e.key === "ArrowRight") {
        e.preventDefault();
        const next = steps[Math.min(steps.length - 1, idx + 1)];
        if (next) onSelect(next.id);
      } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
        e.preventDefault();
        const prev = steps[Math.max(0, idx - 1)];
        if (prev) onSelect(prev.id);
      }
    },
    [steps, onSelect],
  );

  return (
    <ol
      className={cn(
        "relative rounded-[20px] bg-white p-4 shadow-[0_1px_2px_rgba(10,11,20,0.04)]",
        className,
      )}
      aria-label="Étapes de vérification"
    >
      {steps.map((step, i) => {
        const isActive = step.id === activeId;
        const isTraveled = i <= activeIndex;
        const isRejectedLabel = step.status === "rejected";
        const isLast = i === steps.length - 1;

        return (
          <li key={step.id} className="relative flex gap-3 pb-4 last:pb-0">
            {/* connecting line to the next dot */}
            {!isLast ? (
              <span
                aria-hidden
                className={cn(
                  "absolute left-[15px] top-8 w-[2px]",
                  // extend down to the next dot
                  "h-[calc(100%-1rem)]",
                  i < activeIndex ? "bg-[#DFFF3F]" : "bg-[#EFEFF1]",
                )}
                style={{ transform: "translateX(-1px)" }}
              />
            ) : null}

            <div className="pt-0.5">
              <StepDot status={step.status} active={isActive} />
            </div>

            <button
              type="button"
              onClick={() => onSelect(step.id)}
              onKeyDown={(e) => handleKey(e, i)}
              aria-current={isActive ? "step" : undefined}
              className={cn(
                "group -mx-2 flex flex-1 flex-col rounded-xl px-2 py-1 text-left transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B0B0F]",
                isActive
                  ? "bg-transparent"
                  : "hover:bg-[#F5F5F7]",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <p
                  className={cn(
                    "font-[family-name:var(--font-cabinet)] text-[14px] font-bold tracking-tight",
                    isRejectedLabel
                      ? "text-[#DC2626]"
                      : isTraveled
                      ? "text-[#0B0B0F]"
                      : "text-[#6E7178]",
                  )}
                >
                  {i + 1}. {step.label}
                </p>
                <StepperStatusPill status={step.status} />
              </div>
              {step.description ? (
                <p className="mt-0.5 text-[11.5px] leading-snug text-[#8A8D93]">
                  {step.description}
                </p>
              ) : null}
            </button>
          </li>
        );
      })}
    </ol>
  );
}

/* ---------------- Mobile accordion variant ---------------- */

type StepperMobileProps = StepperProps & {
  renderBody: (step: StepperStep) => ReactNode;
};

export function StepperMobile({
  steps,
  activeId,
  onSelect,
  renderBody,
  className,
}: StepperMobileProps) {
  return (
    <ol
      className={cn(
        "divide-y divide-[#EFEFF1] overflow-hidden rounded-[20px] border border-[#EFEFF1] bg-white",
        className,
      )}
      aria-label="Étapes de vérification"
    >
      {steps.map((step, i) => {
        const isActive = step.id === activeId;
        const isRejectedLabel = step.status === "rejected";

        return (
          <li key={step.id}>
            <button
              type="button"
              onClick={() => onSelect(isActive ? "" : step.id)}
              aria-expanded={isActive}
              className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-[#FAFAFB]"
            >
              <StepDot status={step.status} active={isActive} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p
                    className={cn(
                      "font-[family-name:var(--font-cabinet)] text-[14px] font-bold tracking-tight",
                      isRejectedLabel
                        ? "text-[#DC2626]"
                        : "text-[#0B0B0F]",
                    )}
                  >
                    {i + 1}. {step.label}
                  </p>
                  <StepperStatusPill status={step.status} />
                </div>
                {step.description ? (
                  <p className="mt-0.5 truncate text-[11px] text-[#8A8D93]">
                    {step.description}
                  </p>
                ) : null}
              </div>
              <motion.span
                aria-hidden
                animate={{ rotate: isActive ? 180 : 0 }}
                transition={{ type: "spring", stiffness: 360, damping: 30 }}
                className={cn(
                  "grid h-6 w-6 shrink-0 place-items-center rounded-full border border-[#EFEFF1] text-[#0B0B0F]",
                  isActive ? "border-transparent bg-[#0B0B0F] text-[#DFFF3F]" : "bg-white",
                )}
              >
                <ChevronDown className="h-3.5 w-3.5" strokeWidth={2} />
              </motion.span>
            </button>

            <AnimatePresence initial={false}>
              {isActive ? (
                <motion.div
                  key="body"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 320, damping: 34, mass: 0.7 }}
                  style={{ overflow: "hidden" }}
                >
                  <div className="border-t border-[#EFEFF1] bg-[#FAFAFB] p-4">
                    {renderBody(step)}
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </li>
        );
      })}
    </ol>
  );
}
