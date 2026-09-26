"use client";

import { useState, type FormEvent } from "react";
import {
  ArrowLeft,
  BarChart3,
  Building2,
  Check,
  Mail,
  Sparkles,
  Users,
  Wallet,
} from "lucide-react";
import { AppShell } from "@/components/app/app-shell";
import { PageHeader } from "@/components/app/page-header";
import { SmoothInput } from "@/components/library/smooth-input";
import { StatefulButton } from "@/components/library/stateful-button";
import { teacherMobileTabs, teacherNav } from "@/lib/nav";
import { mockTeacher } from "@/lib/mock/teacher";
import { cn } from "@/lib/utils";

/* ================================================================
   PAGE
   ================================================================ */

export default function TeacherAgencyPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");

  const handleSubmit = async (e?: FormEvent) => {
    e?.preventDefault();
    if (!email.trim()) return;
    await new Promise((r) => setTimeout(r, 700));
    setSubmittedEmail(email.trim());
    setSubmitted(true);
    setEmail("");
  };

  const handleReset = () => {
    setSubmitted(false);
    setSubmittedEmail("");
  };

  return (
    <AppShell
      nav={teacherNav}
      mobileTabs={teacherMobileTabs}
      user={{
        fullName: mockTeacher.fullName,
        level: mockTeacher.level,
        initials: mockTeacher.initials,
      }}
      desktopMain={
        <div className="p-6">
          <PageHeader
            eyebrow={
              <>
                <Building2 className="h-3.5 w-3.5" strokeWidth={1.75} />
                <span>Espace agence</span>
                <span className="h-1 w-1 rounded-full bg-[#D5D7DB]" />
                <span className="font-medium text-[#0B0B0F]">
                  Arrivée prévue T4 2026
                </span>
              </>
            }
            title="Agence"
            subline="Regroupe tes profs, mutualise ta clientèle, un tableau de bord commun."
            actions={
              <span className="flex h-9 items-center gap-1.5 rounded-full bg-[#DFFF3F] px-3 text-[11.5px] font-semibold text-[#0B0B0F]">
                <Sparkles className="h-3.5 w-3.5" strokeWidth={2} />
                Accès prioritaire pour la liste d&apos;attente
              </span>
            }
          />

          <div className="mt-6 flex justify-center">
            <AgencyCard
              email={email}
              onEmailChange={setEmail}
              onSubmit={handleSubmit}
              submitted={submitted}
              submittedEmail={submittedEmail}
              onReset={handleReset}
            />
          </div>
        </div>
      }
      rail={null}
      mobileHeader={{
        title: "Agence",
        subtitle:
          "Regroupe tes profs, mutualise ta clientèle, un tableau de bord commun.",
      }}
      mobileChildren={
        <div className="mt-3 px-4 pb-6">
          <AgencyCard
            email={email}
            onEmailChange={setEmail}
            onSubmit={handleSubmit}
            submitted={submitted}
            submittedEmail={submittedEmail}
            onReset={handleReset}
          />
        </div>
      }
    />
  );
}

/* ================================================================
   Card
   ================================================================ */

type CardProps = {
  email: string;
  onEmailChange: (v: string) => void;
  onSubmit: (e?: FormEvent) => Promise<void>;
  submitted: boolean;
  submittedEmail: string;
  onReset: () => void;
};

function AgencyCard({
  email,
  onEmailChange,
  onSubmit,
  submitted,
  submittedEmail,
  onReset,
}: CardProps) {
  return (
    <div className="relative w-full max-w-[560px] overflow-hidden rounded-[20px] bg-white p-8 shadow-[0_1px_2px_rgba(10,11,20,0.04)]">
      {/* Hero */}
      <div className="flex flex-col items-center gap-4 pt-2 text-center">
        <div className="relative grid h-14 w-14 place-items-center rounded-2xl bg-[#0B0B0F] text-[#DFFF3F] shadow-[0_1px_2px_rgba(10,11,20,0.08)]">
          <Building2 className="h-6 w-6" strokeWidth={1.75} />
          <span className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-[#DFFF3F] text-[#0B0B0F] ring-4 ring-white">
            <Users className="h-2.5 w-2.5" strokeWidth={2.5} />
          </span>
        </div>

        <div className="max-w-md space-y-1.5">
          <h2 className="font-[family-name:var(--font-cabinet)] text-[26px] font-bold leading-[1.05] tracking-tight text-[#0B0B0F]">
            Bientôt disponible
          </h2>
          <p className="text-[13px] leading-relaxed text-[#6E7178]">
            L&apos;espace agence arrive au T4 2026. Rejoins la liste d&apos;attente
            pour un accès prioritaire.
          </p>
        </div>
      </div>

      {/* Form or confirmation */}
      <div className="mt-6">
        {submitted ? (
          <ConfirmationCard email={submittedEmail} onReset={onReset} />
        ) : (
          <WaitlistForm
            email={email}
            onEmailChange={onEmailChange}
            onSubmit={onSubmit}
          />
        )}
      </div>

      {/* Perks row */}
      <div className="mt-7 border-t border-[#EFEFF1] pt-5">
        <p className="text-center text-[10px] font-semibold uppercase tracking-[0.09em] text-[#8A8D93]">
          Ce qui t&apos;attend
        </p>
        <div className="mt-4 grid grid-cols-3 gap-2">
          <Perk
            icon={Wallet}
            title="Comptabilité"
            subtitle="mutualisée"
          />
          <Perk
            icon={Users}
            title="Réserve"
            subtitle="de leads"
          />
          <Perk
            icon={BarChart3}
            title="Analytics"
            subtitle="équipe"
          />
        </div>
      </div>
    </div>
  );
}

/* ================================================================
   Waitlist form
   ================================================================ */

function WaitlistForm({
  email,
  onEmailChange,
  onSubmit,
}: {
  email: string;
  onEmailChange: (v: string) => void;
  onSubmit: (e?: FormEvent) => Promise<void>;
}) {
  return (
    <form
      onSubmit={onSubmit}
      className="space-y-2.5"
      aria-label="Liste d'attente Agence"
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.09em] text-[#8A8D93]">
        Liste d&apos;attente
      </p>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
        <div className="flex h-11 flex-1 items-center gap-2 rounded-[12px] border border-[#EFEFF1] bg-[#F5F5F7] px-3.5 text-[13px] text-[#0B0B0F] transition-colors focus-within:border-[#0B0B0F] focus-within:bg-white">
          <Mail
            className="h-3.5 w-3.5 shrink-0 text-[#8A8D93]"
            strokeWidth={1.75}
          />
          <SmoothInput
            type="text"
            inputMode="email"
            autoComplete="email"
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            placeholder="ton@email.com"
            className="text-[13px] placeholder:text-[#9CA0A6]"
            aria-label="Adresse email"
            required
          />
        </div>
        <StatefulButton
          type="submit"
          onClick={async () => {
            if (!email.trim()) return;
            await onSubmit();
          }}
          className="h-11 min-w-[140px] px-5 text-[12px]"
        >
          Rejoindre
        </StatefulButton>
      </div>
      <p className="text-[10.5px] text-[#8A8D93]">
        Un seul email — pas de spam, promis.
      </p>
    </form>
  );
}

/* ================================================================
   Confirmation
   ================================================================ */

function ConfirmationCard({
  email,
  onReset,
}: {
  email: string;
  onReset: () => void;
}) {
  return (
    <div className="rounded-[16px] bg-[#DFFF3F] p-5 text-[#0B0B0F]">
      <div className="flex items-start gap-3">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#0B0B0F] text-[#DFFF3F]">
          <Check className="h-4 w-4" strokeWidth={2.5} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-[family-name:var(--font-cabinet)] text-[16px] font-bold leading-tight tracking-tight">
            Envoyé !
          </p>
          <p className="mt-1 text-[12px] leading-snug text-[#0B0B0F]/75">
            Nous te préviendrons dès que l&apos;espace agence est prêt.
          </p>
          {email ? (
            <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-[#0B0B0F]/10 px-2 py-1 text-[11px] font-semibold text-[#0B0B0F]">
              <Mail className="h-3 w-3" strokeWidth={2} />
              <span className="max-w-[220px] truncate">{email}</span>
            </p>
          ) : null}
          <button
            type="button"
            onClick={onReset}
            className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-[#0B0B0F]/70 underline-offset-2 transition-colors hover:text-[#0B0B0F] hover:underline"
          >
            <ArrowLeft className="h-3 w-3" strokeWidth={2.25} />
            Changer d&apos;email
          </button>
        </div>
      </div>
    </div>
  );
}

/* ================================================================
   Perk
   ================================================================ */

function Perk({
  icon: Icon,
  title,
  subtitle,
  className,
}: {
  icon: typeof Wallet;
  title: string;
  subtitle: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-1.5 rounded-[14px] border border-[#EFEFF1] bg-[#FAFAFB] px-2 py-3 text-center",
        className,
      )}
    >
      <div className="grid h-8 w-8 place-items-center rounded-full bg-white text-[#0B0B0F] shadow-[0_1px_2px_rgba(10,11,20,0.05)]">
        <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
      </div>
      <div className="leading-tight">
        <p className="text-[11px] font-semibold text-[#0B0B0F]">{title}</p>
        <p className="text-[10.5px] text-[#8A8D93]">{subtitle}</p>
      </div>
    </div>
  );
}
