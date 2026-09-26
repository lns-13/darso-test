"use client";

import { AnimatePresence, motion } from "motion/react";
import { Eye, EyeOff } from "lucide-react";
import { AuthField } from "@/components/auth/auth-field";
import { SocialButton, SocialButtonNote } from "@/components/auth/social-button";
import { springSoft } from "@/lib/motion";
import type { IdentityState, IdentityErrors } from "./sign-up-flow";

type Props = {
  values: IdentityState;
  onChange: (patch: Partial<IdentityState>) => void;
  errors: IdentityErrors;
  showPw: boolean;
  onTogglePw: () => void;
  isMinor: boolean;
  reduceMotion: boolean;
};

export function StepIdentity({
  values,
  onChange,
  errors,
  showPw,
  onTogglePw,
  isMinor,
  reduceMotion,
}: Props) {
  return (
    <div className="space-y-3.5">
      <AuthField
        label="Nom complet"
        id="fullName"
        type="text"
        autoComplete="name"
        placeholder="Amine Benali"
        value={values.fullName}
        onValueChange={(v) => onChange({ fullName: v })}
        error={errors.fullName}
      />

      <AuthField
        label="Email"
        id="email"
        type="text"
        inputMode="email"
        autoComplete="email"
        placeholder="vous@exemple.com"
        value={values.email}
        onValueChange={(v) => onChange({ email: v })}
        error={errors.email}
      />

      <AuthField
        label="Mot de passe"
        id="password"
        type={showPw ? "text" : "password"}
        autoComplete="new-password"
        placeholder="8 caractères minimum"
        value={values.password}
        onValueChange={(v) => onChange({ password: v })}
        error={errors.password}
        trailing={
          <button
            type="button"
            onClick={onTogglePw}
            aria-label={showPw ? "Masquer le mot de passe" : "Afficher le mot de passe"}
            className="grid h-7 w-7 place-items-center rounded-full text-[#8A8D93] transition hover:bg-[#F5F5F7] hover:text-[#0B0B0F]"
          >
            {showPw ? (
              <EyeOff className="h-3.5 w-3.5" strokeWidth={1.9} />
            ) : (
              <Eye className="h-3.5 w-3.5" strokeWidth={1.9} />
            )}
          </button>
        }
      />

      <div>
        <p className="mb-1.5 block text-[10.5px] font-semibold uppercase tracking-[0.09em] text-[#8A8D93]">
          Date de naissance
        </p>
        <div className="grid grid-cols-3 gap-2">
          <DobPart
            id="dob-d"
            placeholder="JJ"
            value={values.dobD}
            onChange={(v) => onChange({ dobD: v.replace(/\D/g, "").slice(0, 2) })}
            max={2}
            invalid={Boolean(errors.dob)}
          />
          <DobPart
            id="dob-m"
            placeholder="MM"
            value={values.dobM}
            onChange={(v) => onChange({ dobM: v.replace(/\D/g, "").slice(0, 2) })}
            max={2}
            invalid={Boolean(errors.dob)}
          />
          <DobPart
            id="dob-y"
            placeholder="AAAA"
            value={values.dobY}
            onChange={(v) => onChange({ dobY: v.replace(/\D/g, "").slice(0, 4) })}
            max={4}
            invalid={Boolean(errors.dob)}
          />
        </div>
        {errors.dob ? (
          <p className="mt-1 pl-1 text-[11px] font-medium text-[#C53434]">{errors.dob}</p>
        ) : null}
      </div>

      <AnimatePresence initial={false}>
        {isMinor ? (
          <motion.div
            key="parental"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={reduceMotion ? { duration: 0 } : springSoft}
            className="overflow-hidden"
          >
            <div className="pt-0.5">
              <AuthField
                label="Email d'un parent ou tuteur"
                id="parentEmail"
                type="text"
                inputMode="email"
                autoComplete="email"
                placeholder="parent@exemple.com"
                value={values.parentEmail}
                onValueChange={(v) => onChange({ parentEmail: v })}
                error={errors.parentEmail}
              />
              <p className="mt-1.5 pl-1 text-[11px] leading-relaxed text-[#6E7178]">
                Comme vous avez moins de 18 ans, un consentement parental est requis.
              </p>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div className="pt-1.5">
        <div className="relative">
          <div className="absolute inset-0 flex items-center" aria-hidden>
            <div className="w-full border-t border-[#EFEFF1]" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-[#EDEDEF] px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8A8D93] min-[900px]:bg-white">
              ou continuer avec
            </span>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2.5">
          <SocialButton provider="google" />
          <SocialButton provider="apple" />
        </div>
        <SocialButtonNote />
      </div>
    </div>
  );
}

function DobPart({
  id,
  placeholder,
  value,
  onChange,
  max,
  invalid,
}: {
  id: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  max: number;
  invalid: boolean;
}) {
  return (
    <div
      className={
        "flex h-11 items-center rounded-[14px] border bg-white px-3 transition focus-within:border-[#0B0B0F] focus-within:shadow-[0_0_0_3px_rgba(11,11,15,0.06)] " +
        (invalid ? "border-[#C53434] shadow-[0_0_0_3px_rgba(197,52,52,0.10)]" : "border-[#EFEFF1] hover:border-[#B0B3B8]")
      }
    >
      <input
        id={id}
        type="text"
        inputMode="numeric"
        maxLength={max}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-transparent text-center text-[13.5px] tracking-[0.05em] text-[#0B0B0F] placeholder:text-[#B0B3B8] focus:outline-none"
      />
    </div>
  );
}
