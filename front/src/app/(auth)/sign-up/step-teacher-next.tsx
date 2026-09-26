"use client";

import { BadgeCheck, FileText, ShieldCheck } from "lucide-react";
import { Pill } from "@/components/app/pill";
import { StatefulButton } from "@/components/library/stateful-button";

const STEPS = [
  {
    icon: BadgeCheck,
    title: "Vérification d'identité",
    body: "Photo de pièce d'identité + selfie, traité en 24–48 h.",
  },
  {
    icon: FileText,
    title: "Diplômes & parcours",
    body: "Ajoutez vos diplômes, expériences et une courte bio.",
  },
  {
    icon: ShieldCheck,
    title: "Mise en ligne",
    body: "Une fois validé, votre profil devient visible pour les élèves.",
  },
];

/**
 * Shown after signUp has actually created the teacher's account, so the
 * "Votre compte est créé" line below is now true.
 *
 * Neither button can go to /teacher: the project has email auto-confirm off,
 * so sign-up returns no session and the dashboard would be a dead end. Both
 * lead to the confirmation card instead, which is the real next step.
 */
export function StepTeacherNext({ onContinue }: { onContinue: () => void }) {
  return (
    <div className="space-y-5">
      <div className="rounded-[20px] border border-[#EFEFF1] bg-white p-5 shadow-[0_1px_2px_rgba(10,11,20,0.04)]">
        <Pill tone="neutral">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#C4E029]" />
          En attente de vérification
        </Pill>
        <p className="mt-3 text-[13px] leading-relaxed text-[#4A4D54]">
          Votre compte est créé. Pour recevoir vos premiers élèves, il vous reste
          à faire vérifier votre identité et vos diplômes — cela se fait depuis
          votre espace prof, à votre rythme.
        </p>
      </div>

      <ol className="space-y-2.5">
        {STEPS.map((s, i) => (
          <li
            key={s.title}
            className="flex items-start gap-3 rounded-[16px] border border-[#EFEFF1] bg-white p-3.5"
          >
            <span
              aria-hidden
              className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#0B0B0F] text-[#DFFF3F]"
            >
              <s.icon className="h-3.5 w-3.5" strokeWidth={2} />
            </span>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.09em] text-[#8A8D93]">
                Étape {i + 1}
              </p>
              <p className="mt-0.5 text-[13px] font-semibold text-[#0B0B0F]">
                {s.title}
              </p>
              <p className="mt-1 text-[12px] leading-relaxed text-[#4A4D54]">
                {s.body}
              </p>
            </div>
          </li>
        ))}
      </ol>

      <div className="space-y-2">
        <StatefulButton
          type="button"
          status="idle"
          onClick={onContinue}
          className="!min-w-full !bg-[#DFFF3F] !text-[#0B0B0F] !py-3 !text-[13px]"
        >
          Commencer la vérification
        </StatefulButton>
        <div className="text-center">
          <button
            type="button"
            onClick={onContinue}
            className="text-[12px] font-semibold text-[#4A4D54] underline-offset-4 hover:text-[#0B0B0F] hover:underline"
          >
            Terminer plus tard
          </button>
        </div>
      </div>
    </div>
  );
}
