"use client";

import { Check, Clock, X } from "lucide-react";
import { Avatar } from "@/components/app/avatar";
import { Eyebrow } from "@/components/app/eyebrow";
import { cn } from "@/lib/utils";

export type InviteCardProps = {
  id: string;
  from: { name: string; initials: string; level?: string };
  subject?: string;
  targetTitle: string;
  when: string;
  price: number;
  note?: string;
  onAccept?: (id: string) => void;
  onDecline?: (id: string) => void;
  className?: string;
};

export function InviteCard({
  id,
  from,
  subject,
  targetTitle,
  when,
  price,
  note,
  onAccept,
  onDecline,
  className,
}: InviteCardProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-[16px] border border-[#EFEFF1] bg-white p-4 transition-colors hover:border-[#D5D7DB]",
        className,
      )}
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        <Avatar initials={from.initials} size={40} tone="soft-blue" />
        <div className="min-w-0 flex-1">
          {subject ? <Eyebrow>{subject}</Eyebrow> : null}
          <p className="mt-0.5 truncate text-[14px] font-semibold text-[#0B0B0F]">
            {from.name}
          </p>
          {from.level ? (
            <p className="truncate text-[11px] text-[#8A8D93]">{from.level}</p>
          ) : null}
        </div>
        <span className="inline-flex h-5 shrink-0 items-center rounded-full bg-[#F0F0F2] px-2 text-[10px] font-semibold text-[#4A4D54]">
          Nouvelle
        </span>
      </div>

      {/* Body */}
      <div className="rounded-[12px] bg-[#F5F5F7] p-3">
        <p className="text-[12.5px] font-semibold leading-snug text-[#0B0B0F]">
          {targetTitle}
        </p>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-[#6E7178]">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" strokeWidth={1.75} />
            {when}
          </span>
          <span className="h-0.5 w-0.5 rounded-full bg-[#D5D7DB]" />
          <span className="font-semibold text-[#0B0B0F] tabular-nums">{price} MAD</span>
        </div>
        {note ? (
          <p className="mt-2 line-clamp-2 text-[11.5px] leading-snug text-[#4A4D54]">
            « {note} »
          </p>
        ) : null}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onDecline?.(id)}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-[#EFEFF1] py-2 text-[12px] font-semibold text-[#0B0B0F] transition-colors hover:bg-[#F5F5F7]"
        >
          <X className="h-3.5 w-3.5" strokeWidth={2} />
          Décliner
        </button>
        <button
          type="button"
          onClick={() => onAccept?.(id)}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-[#DFFF3F] py-2 text-[12px] font-semibold text-[#0B0B0F] transition-[filter] hover:brightness-[0.97]"
        >
          <Check className="h-3.5 w-3.5" strokeWidth={2} />
          Accepter
        </button>
      </div>
    </div>
  );
}
