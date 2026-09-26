"use client";

import { Check, TrendingDown, TrendingUp, X } from "lucide-react";
import { Avatar } from "./avatar";
import { Eyebrow } from "./eyebrow";
import { cn } from "@/lib/utils";

export type ApplicationRowProps = {
  id: string;
  student: { name: string; initials: string; level: string };
  targetTitle: string;
  targetKind: "course" | "request";
  offeredPrice: number;
  referencePrice: number;
  message: string;
  onAccept?: (id: string) => void;
  onDecline?: (id: string) => void;
};

export function ApplicationRow({
  id,
  student,
  targetTitle,
  targetKind,
  offeredPrice,
  referencePrice,
  message,
  onAccept,
  onDecline,
}: ApplicationRowProps) {
  const delta = offeredPrice - referencePrice;
  const deltaPct = referencePrice > 0 ? Math.round((delta / referencePrice) * 100) : 0;
  const deltaTone =
    delta === 0
      ? "text-[#8A8D93]"
      : delta > 0
        ? "text-[#0B0B0F]"
        : "text-[#8A8D93]";
  const DeltaIcon = delta > 0 ? TrendingUp : TrendingDown;

  return (
    <div className="group relative rounded-[16px] border border-[#EFEFF1] bg-white p-3.5 transition-colors hover:border-[#E4E5E8]">
      <div className="flex items-start gap-2.5">
        <Avatar initials={student.initials} tone="neutral" size={36} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="truncate text-[12.5px] font-semibold text-[#0B0B0F]">
              {student.name}
            </p>
            <span className="rounded-full bg-[#F5F5F7] px-1.5 py-0.5 text-[9.5px] font-medium text-[#6E7178]">
              {student.level}
            </span>
          </div>
          <div className="mt-0.5">
            <Eyebrow>
              {targetKind === "course" ? "Postule à ton cours" : "Répond à ta demande"}
            </Eyebrow>
          </div>
          <p className="mt-0.5 truncate text-[11px] font-medium text-[#4A4D54]">
            {targetTitle}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-[12.5px] font-bold text-[#0B0B0F] tabular-nums">
            {offeredPrice}
            <span className="ml-0.5 text-[9.5px] font-medium text-[#8A8D93]">MAD</span>
          </p>
          {delta !== 0 ? (
            <span
              className={cn(
                "mt-0.5 inline-flex items-center gap-0.5 text-[9.5px] font-semibold tabular-nums",
                deltaTone,
              )}
            >
              <DeltaIcon className="h-2.5 w-2.5" strokeWidth={2.25} />
              {delta > 0 ? "+" : ""}
              {deltaPct}%
            </span>
          ) : (
            <span className="mt-0.5 inline-block text-[9.5px] font-medium text-[#8A8D93]">
              au tarif
            </span>
          )}
        </div>
      </div>

      <p className="mt-2.5 line-clamp-2 rounded-md bg-[#FAFAFB] px-2.5 py-1.5 text-[11px] leading-snug text-[#4A4D54]">
        “{message}”
      </p>

      <div className="mt-2.5 flex flex-col gap-1.5 min-[520px]:flex-row min-[520px]:items-center min-[520px]:justify-end">
        <button
          type="button"
          onClick={() => onDecline?.(id)}
          className="inline-flex h-8 items-center justify-center gap-1.5 rounded-full border border-[#EFEFF1] bg-white px-3.5 text-[11.5px] font-semibold text-[#8A8D93] transition-colors hover:bg-[#F5F5F7] hover:text-[#0B0B0F]"
        >
          <X className="h-3 w-3" strokeWidth={2.25} />
          Décliner
        </button>
        <button
          type="button"
          onClick={() => onAccept?.(id)}
          className="inline-flex h-8 items-center justify-center gap-1.5 rounded-full bg-[#DFFF3F] px-3.5 text-[11.5px] font-semibold text-[#0B0B0F] transition-[filter] hover:brightness-[0.97]"
        >
          <Check className="h-3 w-3" strokeWidth={2.5} />
          Accepter
        </button>
      </div>
    </div>
  );
}
