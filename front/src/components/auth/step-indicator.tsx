"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type StepIndicatorItem = {
  label: string;
  disabled?: boolean;
};

type StepIndicatorProps = {
  steps: StepIndicatorItem[];
  current: number;
};

export function StepIndicator({ steps, current }: StepIndicatorProps) {
  return (
    <ol
      aria-label="Progression de l'inscription"
      className="flex items-center gap-1.5"
    >
      {steps.map((step, i) => {
        const isCurrent = i === current;
        const isPast = i < current;
        const isFuture = i > current;
        const isDisabled = step.disabled;

        const base =
          "inline-flex h-6 items-center gap-1 rounded-full px-2.5 text-[10px] font-semibold uppercase tracking-[0.09em] transition";

        let tone = "bg-[#F0F0F2] text-[#8A8D93]";
        if (isDisabled && !isCurrent) tone = "bg-[#F5F5F7] text-[#B0B3B8]";
        else if (isCurrent) tone = "bg-[#0B0B0F] text-white";
        else if (isPast) tone = "bg-[#DFFF3F] text-[#0B0B0F]";
        else if (isFuture) tone = "bg-[#F0F0F2] text-[#8A8D93]";

        return (
          <li key={step.label} className={cn(base, tone)}>
            <span
              aria-hidden
              className={cn(
                "grid h-3.5 w-3.5 place-items-center rounded-full text-[9px] font-bold",
                isPast
                  ? "bg-[#0B0B0F] text-[#DFFF3F]"
                  : isCurrent
                    ? "bg-white/20 text-white"
                    : "bg-white/70 text-[#8A8D93]",
              )}
            >
              {isPast ? <Check className="h-2.5 w-2.5" strokeWidth={3} /> : i + 1}
            </span>
            {step.label}
          </li>
        );
      })}
    </ol>
  );
}
