"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronLeft,
  Flag,
  Paperclip,
  X,
} from "lucide-react";
import { AppShell } from "@/components/app/app-shell";
import { PageHeader } from "@/components/app/page-header";
import { Eyebrow } from "@/components/app/eyebrow";
import { Avatar } from "@/components/app/avatar";
import { StepIndicator } from "@/components/auth/step-indicator";
import { StatefulButton } from "@/components/library/stateful-button";
import { teacherMobileTabs, teacherNav } from "@/lib/nav";
import { mockTeacher } from "@/lib/mock/teacher";
import { cn } from "@/lib/utils";

/* ---------------- MOCK past sessions (teacher POV — student is the counterparty) ---------------- */

type PastSession = {
  id: string;
  title: string;
  student: string;
  studentInitials: string;
  date: string;
  amount: number;
};

const pastSessions: PastSession[] = [
  {
    id: "sess-t-921",
    title: "Analyse — dérivées & fonction composée",
    student: "Sara Bencheikh",
    studentInitials: "SB",
    date: "1 sept. · 20:00",
    amount: 220,
  },
  {
    id: "sess-t-918",
    title: "Algèbre linéaire — espaces vectoriels",
    student: "Lina Ouazzani",
    studentInitials: "LO",
    date: "31 août · 18:30",
    amount: 260,
  },
  {
    id: "sess-t-909",
    title: "Trigonométrie — équations & identités",
    student: "Amine Khattabi",
    studentInitials: "AK",
    date: "28 août · 17:00",
    amount: 180,
  },
  {
    id: "sess-t-901",
    title: "Bac 2026 · suites numériques (récurrence)",
    student: "Mehdi Tazi",
    studentInitials: "MT",
    date: "25 août · 19:30",
    amount: 200,
  },
];

const REASONS: { id: string; label: string; hint: string }[] = [
  { id: "no-show", label: "L'élève ne s'est pas connecté", hint: "Absence non prévenue à l'heure prévue." },
  { id: "payment", label: "Paiement manquant ou erroné", hint: "Payout absent, montant incorrect." },
  { id: "behaviour", label: "Comportement inapproprié", hint: "Propos ou attitude problématique." },
  { id: "cancellation", label: "Annulation abusive de dernière minute", hint: "Élève annule < 2 h avant, à répétition." },
  { id: "other", label: "Autre motif", hint: "Décris librement." },
];

type WizardState = {
  sessionId: string | null;
  reason: string | null;
  description: string;
  attachments: string[];
};

const STEPS = [
  { label: "Séance" },
  { label: "Motif" },
  { label: "Résumé" },
];

/* ---------------- Page ---------------- */

export default function TeacherHelpDisputePage() {
  const [current, setCurrent] = useState(0);
  const [state, setState] = useState<WizardState>({
    sessionId: null,
    reason: null,
    description: "",
    attachments: [],
  });

  const canNext = useMemo(() => {
    if (current === 0) return Boolean(state.sessionId);
    if (current === 1) return Boolean(state.reason) && state.description.trim().length >= 10;
    return true;
  }, [current, state]);

  const patch = (p: Partial<WizardState>) => setState((s) => ({ ...s, ...p }));

  const next = () => {
    if (!canNext) return;
    setCurrent((c) => Math.min(c + 1, STEPS.length - 1));
  };
  const back = () => setCurrent((c) => Math.max(c - 1, 0));

  const submit = async () => {
    await new Promise((r) => setTimeout(r, 900));
    // eslint-disable-next-line no-console
    console.log("[TeacherDispute] submitted", state);
  };

  const selectedSession = pastSessions.find((s) => s.id === state.sessionId) ?? null;
  const selectedReason = REASONS.find((r) => r.id === state.reason) ?? null;

  const body = (
    <WizardBody
      current={current}
      state={state}
      patch={patch}
      canNext={canNext}
      onBack={back}
      onNext={next}
      onSubmit={submit}
      selectedSession={selectedSession}
      selectedReason={selectedReason}
    />
  );

  const desktop = (
    <div className="p-6">
      <DesktopHeader current={current} />
      <div className="mt-6">{body}</div>
    </div>
  );

  const mobile = <div className="px-4 pt-2">{body}</div>;

  return (
    <AppShell
      nav={teacherNav}
      mobileTabs={teacherMobileTabs}
      user={{
        fullName: mockTeacher.fullName,
        level: mockTeacher.level,
        initials: mockTeacher.initials,
      }}
      desktopMain={desktop}
      mobileHeader={{
        title: "Ouvrir un litige",
        subtitle: `Étape ${current + 1} / ${STEPS.length}`,
        right: (
          <Link
            href="/teacher/help"
            aria-label="Retour à l'aide"
            className="grid h-10 w-10 place-items-center rounded-full bg-white text-[#0B0B0F] shadow-[0_1px_2px_rgba(10,11,20,0.04)]"
          >
            <X className="h-[17px] w-[17px]" strokeWidth={1.75} />
          </Link>
        ),
      }}
      mobileChildren={mobile}
    />
  );
}

/* ---------------- Desktop header ---------------- */

function DesktopHeader({ current }: { current: number }) {
  return (
    <div className="space-y-5">
      <Link
        href="/teacher/help"
        className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[#8A8D93] transition-colors hover:text-[#0B0B0F]"
      >
        <ChevronLeft className="h-3.5 w-3.5" strokeWidth={2} />
        Retour à l'aide
      </Link>
      <PageHeader
        eyebrow={
          <>
            <span>Support prof</span>
            <span className="h-1 w-1 rounded-full bg-[#D5D7DB]" />
            <span className="font-medium text-[#0B0B0F]">Réponse sous 3 h ouvrées</span>
          </>
        }
        title="Ouvrir un litige"
        subline="Signale un problème avec un élève ou une séance en 3 étapes."
      />
      <div>
        <StepIndicator
          steps={STEPS.map((s) => ({ label: s.label }))}
          current={current}
        />
      </div>
    </div>
  );
}

/* ---------------- Wizard body ---------------- */

function WizardBody({
  current,
  state,
  patch,
  canNext,
  onBack,
  onNext,
  onSubmit,
  selectedSession,
  selectedReason,
}: {
  current: number;
  state: WizardState;
  patch: (p: Partial<WizardState>) => void;
  canNext: boolean;
  onBack: () => void;
  onNext: () => void;
  onSubmit: () => Promise<void>;
  selectedSession: PastSession | null;
  selectedReason: (typeof REASONS)[number] | null;
}) {
  return (
    <div className="mx-auto w-full max-w-[720px]">
      <div className="min-[900px]:hidden mb-4">
        <StepIndicator steps={STEPS.map((s) => ({ label: s.label }))} current={current} />
      </div>

      <div className="rounded-[20px] border border-[#EFEFF1] bg-white p-5 shadow-[0_1px_2px_rgba(10,11,20,0.04)]">
        {current === 0 ? (
          <StepSession
            selectedId={state.sessionId}
            onSelect={(id) => patch({ sessionId: id })}
          />
        ) : null}
        {current === 1 ? (
          <StepReason
            reason={state.reason}
            description={state.description}
            attachments={state.attachments}
            onReason={(r) => patch({ reason: r })}
            onDescription={(d) => patch({ description: d })}
            onAttachment={(name) =>
              patch({ attachments: [...state.attachments, name] })
            }
            onRemoveAttachment={(name) =>
              patch({
                attachments: state.attachments.filter((a) => a !== name),
              })
            }
          />
        ) : null}
        {current === 2 ? (
          <StepSummary
            session={selectedSession}
            reason={selectedReason}
            description={state.description}
            attachments={state.attachments}
          />
        ) : null}
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          disabled={current === 0}
          className={cn(
            "flex h-10 items-center gap-1.5 rounded-full border border-[#EFEFF1] bg-white px-4 text-[12.5px] font-semibold text-[#0B0B0F] transition-colors",
            current === 0 ? "opacity-40" : "hover:bg-[#F5F5F7]",
          )}
        >
          <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} />
          Retour
        </button>

        {current < STEPS.length - 1 ? (
          <button
            type="button"
            onClick={onNext}
            disabled={!canNext}
            className={cn(
              "flex h-10 items-center gap-1.5 rounded-full bg-[#0B0B0F] px-4 text-[12.5px] font-semibold text-white transition-[filter]",
              canNext ? "hover:brightness-[0.94]" : "opacity-40",
            )}
          >
            Continuer
            <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
          </button>
        ) : (
          <StatefulButton
            onClick={onSubmit}
            className="h-10 px-4 text-[12.5px]"
          >
            <span className="flex items-center gap-1.5">
              <Flag className="h-3.5 w-3.5" strokeWidth={2} />
              Envoyer le litige
            </span>
          </StatefulButton>
        )}
      </div>

      <p className="mt-3 text-[11px] text-[#8A8D93]">
        En envoyant ce litige, tu acceptes que darso partage les informations
        nécessaires avec l'élève concerné pour instruire ta demande.
      </p>
    </div>
  );
}

/* ---------------- Step 1: pick session ---------------- */

function StepSession({
  selectedId,
  onSelect,
}: {
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div>
      <Eyebrow>Étape 1</Eyebrow>
      <h2 className="mt-1 font-[family-name:var(--font-cabinet)] text-[20px] font-bold tracking-tight text-[#0B0B0F]">
        Quelle séance est concernée ?
      </h2>
      <p className="mt-1 text-[12px] text-[#6E7178]">
        Choisis la séance concernée par le litige. Seules les séances des 30
        derniers jours sont éligibles.
      </p>

      <ul className="mt-4 space-y-2">
        {pastSessions.map((s) => {
          const active = selectedId === s.id;
          return (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => onSelect(s.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-[16px] border p-3 text-left transition-colors",
                  active
                    ? "border-[#0B0B0F] bg-[#FAFAFB]"
                    : "border-[#EFEFF1] bg-white hover:bg-[#FAFAFB]",
                )}
              >
                <Avatar initials={s.studentInitials} tone="brand" size={40} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-semibold text-[#0B0B0F]">
                    {s.title}
                  </p>
                  <p className="mt-0.5 truncate text-[11.5px] text-[#8A8D93]">
                    {s.student} · {s.date} · {s.amount} MAD
                  </p>
                </div>
                <span
                  className={cn(
                    "grid h-5 w-5 shrink-0 place-items-center rounded-full border",
                    active
                      ? "border-transparent bg-[#0B0B0F] text-[#DFFF3F]"
                      : "border-[#EFEFF1] bg-white",
                  )}
                >
                  {active ? <Check className="h-3 w-3" strokeWidth={3} /> : null}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* ---------------- Step 2: reason + description ---------------- */

function StepReason({
  reason,
  description,
  attachments,
  onReason,
  onDescription,
  onAttachment,
  onRemoveAttachment,
}: {
  reason: string | null;
  description: string;
  attachments: string[];
  onReason: (r: string) => void;
  onDescription: (d: string) => void;
  onAttachment: (name: string) => void;
  onRemoveAttachment: (name: string) => void;
}) {
  const minChars = 10;
  const charsLeft = Math.max(0, minChars - description.trim().length);

  const mockAttach = () => {
    const idx = attachments.length + 1;
    onAttachment(`piece-jointe-${idx}.pdf`);
  };

  return (
    <div>
      <Eyebrow>Étape 2</Eyebrow>
      <h2 className="mt-1 font-[family-name:var(--font-cabinet)] text-[20px] font-bold tracking-tight text-[#0B0B0F]">
        Décris le problème
      </h2>
      <p className="mt-1 text-[12px] text-[#6E7178]">
        Sélectionne un motif et ajoute autant de détails que possible.
      </p>

      <fieldset className="mt-4 space-y-2">
        <legend className="sr-only">Motif du litige</legend>
        {REASONS.map((r) => {
          const active = reason === r.id;
          return (
            <label
              key={r.id}
              className={cn(
                "flex cursor-pointer items-start gap-3 rounded-[16px] border p-3 transition-colors",
                active
                  ? "border-[#0B0B0F] bg-[#FAFAFB]"
                  : "border-[#EFEFF1] bg-white hover:bg-[#FAFAFB]",
              )}
            >
              <input
                type="radio"
                name="reason"
                value={r.id}
                checked={active}
                onChange={() => onReason(r.id)}
                className="sr-only"
              />
              <span
                aria-hidden
                className={cn(
                  "mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full border",
                  active ? "border-[#0B0B0F] bg-[#0B0B0F]" : "border-[#D5D7DB] bg-white",
                )}
              >
                {active ? <span className="h-1.5 w-1.5 rounded-full bg-[#DFFF3F]" /> : null}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[13px] font-semibold text-[#0B0B0F]">
                  {r.label}
                </span>
                <span className="mt-0.5 block text-[11.5px] text-[#8A8D93]">
                  {r.hint}
                </span>
              </span>
            </label>
          );
        })}
      </fieldset>

      <div className="mt-5">
        <label
          htmlFor="dispute-description"
          className="mb-1.5 block text-[11.5px] font-semibold uppercase tracking-[0.06em] text-[#6E7178]"
        >
          Détails
        </label>
        <textarea
          id="dispute-description"
          value={description}
          onChange={(e) => onDescription(e.target.value)}
          rows={5}
          placeholder="Explique ce qui s'est passé, quand, et ce que tu attends comme résolution…"
          className="w-full resize-none rounded-[16px] border border-[#EFEFF1] bg-white px-3.5 py-3 text-[13px] leading-relaxed text-[#0B0B0F] placeholder:text-[#8A8D93] focus:border-[#0B0B0F] focus:outline-none"
        />
        <p className="mt-1.5 text-[10.5px] text-[#8A8D93]">
          {charsLeft > 0
            ? `Encore ${charsLeft} caractère${charsLeft > 1 ? "s" : ""} minimum.`
            : "Merci, c'est assez détaillé."}
        </p>
      </div>

      <div className="mt-4">
        <p className="mb-1.5 text-[11.5px] font-semibold uppercase tracking-[0.06em] text-[#6E7178]">
          Pièces jointes (facultatif)
        </p>
        <button
          type="button"
          onClick={mockAttach}
          className="flex h-10 items-center gap-1.5 rounded-full border border-dashed border-[#D5D7DB] bg-white px-3.5 text-[12px] font-semibold text-[#0B0B0F] transition-colors hover:bg-[#F5F5F7]"
        >
          <Paperclip className="h-3.5 w-3.5" strokeWidth={2} />
          Ajouter un fichier
        </button>
        {attachments.length > 0 ? (
          <ul className="mt-2 space-y-1.5">
            {attachments.map((a) => (
              <li
                key={a}
                className="flex items-center justify-between gap-3 rounded-full bg-[#F5F5F7] px-3 py-1.5 text-[11.5px] text-[#0B0B0F]"
              >
                <span className="flex items-center gap-1.5">
                  <Paperclip className="h-3 w-3" strokeWidth={2} />
                  {a}
                </span>
                <button
                  type="button"
                  onClick={() => onRemoveAttachment(a)}
                  className="text-[#8A8D93] transition-colors hover:text-[#0B0B0F]"
                  aria-label={`Retirer ${a}`}
                >
                  <X className="h-3.5 w-3.5" strokeWidth={2} />
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}

/* ---------------- Step 3: summary ---------------- */

function StepSummary({
  session,
  reason,
  description,
  attachments,
}: {
  session: PastSession | null;
  reason: (typeof REASONS)[number] | null;
  description: string;
  attachments: string[];
}) {
  return (
    <div>
      <Eyebrow>Étape 3</Eyebrow>
      <h2 className="mt-1 font-[family-name:var(--font-cabinet)] text-[20px] font-bold tracking-tight text-[#0B0B0F]">
        Vérifie & envoie
      </h2>
      <p className="mt-1 text-[12px] text-[#6E7178]">
        Un dernier coup d'œil avant l'envoi à notre équipe support prof.
      </p>

      <dl className="mt-4 space-y-3">
        <SummaryRow label="Séance">
          {session ? (
            <span className="flex items-center gap-2">
              <Avatar initials={session.studentInitials} tone="brand" size={28} />
              <span>
                <span className="block text-[13px] font-semibold text-[#0B0B0F]">
                  {session.title}
                </span>
                <span className="block text-[11px] text-[#8A8D93]">
                  {session.student} · {session.date}
                </span>
              </span>
            </span>
          ) : (
            <span className="text-[12px] text-[#8A8D93]">—</span>
          )}
        </SummaryRow>
        <SummaryRow label="Motif">
          <span className="text-[13px] font-medium text-[#0B0B0F]">
            {reason?.label ?? "—"}
          </span>
        </SummaryRow>
        <SummaryRow label="Détails">
          <p className="whitespace-pre-wrap text-[12.5px] leading-relaxed text-[#0B0B0F]">
            {description || "—"}
          </p>
        </SummaryRow>
        <SummaryRow label="Pièces jointes">
          {attachments.length > 0 ? (
            <ul className="flex flex-wrap gap-1.5">
              {attachments.map((a) => (
                <li
                  key={a}
                  className="rounded-full bg-[#F5F5F7] px-2.5 py-1 text-[10.5px] font-medium text-[#0B0B0F]"
                >
                  {a}
                </li>
              ))}
            </ul>
          ) : (
            <span className="text-[12px] text-[#8A8D93]">Aucune</span>
          )}
        </SummaryRow>
      </dl>
    </div>
  );
}

function SummaryRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[100px_1fr] gap-3 border-t border-[#EFEFF1] pt-3 first:border-t-0 first:pt-0">
      <dt className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[#8A8D93]">
        {label}
      </dt>
      <dd className="min-w-0">{children}</dd>
    </div>
  );
}
