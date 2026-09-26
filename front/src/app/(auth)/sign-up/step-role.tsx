"use client";

import { useState } from "react";
import { ArrowUpRight, Check } from "lucide-react";
import { TextMorph } from "@/components/library/text-morph";
import { cn } from "@/lib/utils";
import type { Role } from "./sign-up-flow";

// MOCK: replace when API lands
const ROLES: {
  id: Role;
  tone: "lime" | "dark";
  eyebrow: string;
  title: string;
  subtitle: string;
  perks: string[];
}[] = [
  {
    id: "student",
    tone: "lime",
    eyebrow: "Je veux apprendre",
    title: "Élève",
    subtitle: "Trouve un prof, réserve des séances, progresse à ton rythme.",
    perks: [
      "Accès à 240+ profs vérifiés",
      "Publie une demande en 30 s",
      "Chat, visio et suivi de progression",
    ],
  },
  {
    id: "teacher",
    tone: "dark",
    eyebrow: "Je veux enseigner",
    title: "Enseignant",
    subtitle: "Reçois des demandes d'élèves, fixe tes tarifs, gère ton agenda.",
    perks: [
      "Profil vérifié avec badge darso",
      "Paiements sécurisés hebdomadaires",
      "Outils de visio et de préparation",
    ],
  },
];

type Props = {
  selected: Role | null;
  onSelect: (role: Role) => void;
};

export function StepRole({ selected, onSelect }: Props) {
  return (
    <div className="grid grid-cols-1 gap-3 min-[520px]:grid-cols-2">
      {ROLES.map((r) => (
        <RoleCard
          key={r.id}
          role={r}
          selected={selected === r.id}
          onSelect={() => onSelect(r.id)}
        />
      ))}
    </div>
  );
}

function RoleCard({
  role,
  selected,
  onSelect,
}: {
  role: (typeof ROLES)[number];
  selected: boolean;
  onSelect: () => void;
}) {
  const [active, setActive] = useState(false);
  const isLime = role.tone === "lime";
  const morphLabel = active || selected ? "Continuer →" : role.title;

  return (
    <button
      type="button"
      onClick={onSelect}
      onMouseEnter={() => setActive(true)}
      onMouseLeave={() => setActive(false)}
      onFocus={() => setActive(true)}
      onBlur={() => setActive(false)}
      aria-pressed={selected}
      className={cn(
        "group relative flex min-h-[248px] flex-col justify-between overflow-hidden rounded-[20px] p-4 text-left transition-transform hover:-translate-y-0.5 focus:outline-none",
        isLime ? "bg-[#DFFF3F] text-[#0B0B0F]" : "bg-[#0B0B0F] text-white",
        selected
          ? isLime
            ? "ring-2 ring-[#0B0B0F] ring-offset-2 ring-offset-white"
            : "ring-2 ring-[#DFFF3F] ring-offset-2 ring-offset-white"
          : "ring-0",
      )}
    >
      {selected ? (
        <span
          aria-hidden
          className={cn(
            "absolute right-3 top-3 grid h-6 w-6 place-items-center rounded-full",
            isLime ? "bg-[#0B0B0F] text-[#DFFF3F]" : "bg-[#DFFF3F] text-[#0B0B0F]",
          )}
        >
          <Check className="h-3 w-3" strokeWidth={3} />
        </span>
      ) : null}

      <div>
        <p
          className={cn(
            "text-[10px] font-semibold uppercase tracking-[0.09em]",
            isLime ? "text-[#0B0B0F]/60" : "text-white/50",
          )}
        >
          {role.eyebrow}
        </p>
        <div
          className="mt-1.5 font-[family-name:var(--font-cabinet)] text-[24px] font-bold leading-[1.1] tracking-[-0.035em]"
        >
          <TextMorph>{morphLabel}</TextMorph>
        </div>
        <p
          className={cn(
            "mt-2 text-[12px] leading-snug",
            isLime ? "text-[#0B0B0F]/70" : "text-white/65",
          )}
        >
          {role.subtitle}
        </p>
      </div>

      <div className="mt-4 space-y-1.5">
        {role.perks.map((perk) => (
          <div key={perk} className="flex items-start gap-2">
            <span
              aria-hidden
              className={cn(
                "mt-1.5 h-1 w-1 shrink-0 rounded-full",
                isLime ? "bg-[#0B0B0F]" : "bg-[#DFFF3F]",
              )}
            />
            <p
              className={cn(
                "text-[11.5px] leading-snug",
                isLime ? "text-[#0B0B0F]/80" : "text-white/75",
              )}
            >
              {perk}
            </p>
          </div>
        ))}
        <div className="flex items-center justify-end pt-2">
          <span
            className={cn(
              "grid h-8 w-8 place-items-center rounded-full transition-transform group-hover:rotate-45",
              isLime ? "bg-[#0B0B0F] text-white" : "bg-[#DFFF3F] text-[#0B0B0F]",
            )}
          >
            <ArrowUpRight className="h-3.5 w-3.5" />
          </span>
        </div>
      </div>
    </button>
  );
}
