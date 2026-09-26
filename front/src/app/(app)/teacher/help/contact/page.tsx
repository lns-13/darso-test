"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ChevronDown,
  ChevronLeft,
  Clock3,
  HeadphonesIcon,
  Mail,
  MessageCircle,
  Paperclip,
  Phone,
  Send,
  X,
} from "lucide-react";
import { AppShell } from "@/components/app/app-shell";
import { PageHeader } from "@/components/app/page-header";
import { Eyebrow } from "@/components/app/eyebrow";
import { SmoothInput } from "@/components/library/smooth-input";
import { StatefulButton } from "@/components/library/stateful-button";
import { teacherMobileTabs, teacherNav } from "@/lib/nav";
import { mockTeacher } from "@/lib/mock/teacher";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  "Séances & élèves",
  "Paiements & fiscalité",
  "Vérification & compte",
  "Marketing & profil",
  "Signaler un bug",
  "Demande de fonctionnalité",
  "Autre",
];

/* ---------------- Page ---------------- */

export default function TeacherHelpContactPage() {
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [message, setMessage] = useState("");
  const [attachments, setAttachments] = useState<string[]>([]);

  const mockAttach = () => {
    setAttachments((prev) => [...prev, `piece-jointe-${prev.length + 1}.pdf`]);
  };

  const removeAttach = (name: string) => {
    setAttachments((prev) => prev.filter((a) => a !== name));
  };

  const canSubmit =
    subject.trim().length >= 3 && message.trim().length >= 10;

  const submit = async () => {
    if (!canSubmit) return;
    await new Promise((r) => setTimeout(r, 800));
    // eslint-disable-next-line no-console
    console.log("[TeacherContact] submitted", { subject, category, message, attachments });
  };

  const form = (
    <ContactForm
      subject={subject}
      onSubject={setSubject}
      category={category}
      onCategory={setCategory}
      message={message}
      onMessage={setMessage}
      attachments={attachments}
      onAttach={mockAttach}
      onRemoveAttach={removeAttach}
      canSubmit={canSubmit}
      onSubmit={submit}
    />
  );

  const desktop = (
    <div className="p-6">
      <Link
        href="/teacher/help"
        className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[#8A8D93] transition-colors hover:text-[#0B0B0F]"
      >
        <ChevronLeft className="h-3.5 w-3.5" strokeWidth={2} />
        Retour à l'aide
      </Link>

      <div className="mt-5">
        <PageHeader
          eyebrow={
            <>
              <span>Support prof</span>
              <span className="h-1 w-1 rounded-full bg-[#D5D7DB]" />
              <span className="font-medium text-[#0B0B0F]">Réponse moyenne : 3 h</span>
            </>
          }
          title="Contacter le support"
          subline="Blocage sur un paiement, une séance ou ton profil ? On te répond en moins de 3 heures."
        />
      </div>

      <div className="mt-7 grid gap-5 min-[1180px]:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div>{form}</div>
        <div className="min-[1180px]:sticky min-[1180px]:top-0 min-[1180px]:self-start">
          <InfoCard />
        </div>
      </div>

      <div className="h-6" />
    </div>
  );

  const mobile = (
    <div className="px-4 pt-2">
      {form}
      <div className="mt-5">
        <InfoCard />
      </div>
      <div className="h-6" />
    </div>
  );

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
        title: "Contact support",
        subtitle: "Réponse sous 3 h",
        right: (
          <Link
            href="/teacher/help"
            aria-label="Fermer"
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

/* ---------------- Form ---------------- */

function ContactForm({
  subject,
  onSubject,
  category,
  onCategory,
  message,
  onMessage,
  attachments,
  onAttach,
  onRemoveAttach,
  canSubmit,
  onSubmit,
}: {
  subject: string;
  onSubject: (v: string) => void;
  category: string;
  onCategory: (v: string) => void;
  message: string;
  onMessage: (v: string) => void;
  attachments: string[];
  onAttach: () => void;
  onRemoveAttach: (name: string) => void;
  canSubmit: boolean;
  onSubmit: () => Promise<void>;
}) {
  return (
    <div className="rounded-[20px] border border-[#EFEFF1] bg-white p-5 shadow-[0_1px_2px_rgba(10,11,20,0.04)]">
      <div className="space-y-5">
        <Field label="Sujet" htmlFor="contact-subject">
          <div className="flex h-11 items-center rounded-[16px] border border-[#EFEFF1] bg-white px-3.5 text-[13px] text-[#0B0B0F] focus-within:border-[#0B0B0F]">
            <SmoothInput
              id="contact-subject"
              value={subject}
              onChange={(e) => onSubject(e.target.value)}
              placeholder="Résume ta demande en une phrase…"
              className="text-[13px] placeholder:text-[#8A8D93]"
              caretClassName="bg-[#0B0B0F]"
            />
          </div>
        </Field>

        <Field label="Catégorie" htmlFor="contact-category">
          <div className="relative">
            <select
              id="contact-category"
              value={category}
              onChange={(e) => onCategory(e.target.value)}
              className={cn(
                "h-11 w-full appearance-none rounded-[16px] border border-[#EFEFF1] bg-white pl-3.5 pr-10 text-[13px] font-medium text-[#0B0B0F]",
                "focus:border-[#0B0B0F] focus:outline-none",
              )}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <ChevronDown
              className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8A8D93]"
              strokeWidth={2}
            />
          </div>
        </Field>

        <Field label="Message" htmlFor="contact-message">
          <textarea
            id="contact-message"
            value={message}
            onChange={(e) => onMessage(e.target.value)}
            rows={6}
            placeholder="Décris ta situation, les étapes déjà tentées, et ce dont tu as besoin…"
            className="w-full resize-none rounded-[16px] border border-[#EFEFF1] bg-white px-3.5 py-3 text-[13px] leading-relaxed text-[#0B0B0F] placeholder:text-[#8A8D93] focus:border-[#0B0B0F] focus:outline-none"
          />
          <p className="mt-1.5 text-[10.5px] text-[#8A8D93]">
            {message.trim().length < 10
              ? `Encore ${10 - message.trim().length} caractères min.`
              : `${message.trim().length} caractères.`}
          </p>
        </Field>

        <Field label="Pièces jointes (facultatif)">
          <button
            type="button"
            onClick={onAttach}
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
                    onClick={() => onRemoveAttach(a)}
                    className="text-[#8A8D93] transition-colors hover:text-[#0B0B0F]"
                    aria-label={`Retirer ${a}`}
                  >
                    <X className="h-3.5 w-3.5" strokeWidth={2} />
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </Field>
      </div>

      <div className="mt-6 flex items-center justify-between gap-3 border-t border-[#EFEFF1] pt-4">
        <p className="text-[11px] text-[#8A8D93]">
          Réponse par email à{" "}
          <span className="font-medium text-[#0B0B0F]">youssef@darso.ma</span>.
        </p>
        <div
          className={cn(
            "transition-opacity",
            canSubmit ? "opacity-100" : "opacity-50 pointer-events-none",
          )}
        >
          <StatefulButton onClick={onSubmit} className="h-10 px-4 text-[12.5px]">
            <span className="flex items-center gap-1.5">
              <Send className="h-3.5 w-3.5" strokeWidth={2} />
              Envoyer
            </span>
          </StatefulButton>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Info card ---------------- */

function InfoCard() {
  return (
    <div className="flex flex-col gap-2.5">
      <div className="relative overflow-hidden rounded-[20px] bg-white p-5 shadow-[0_1px_2px_rgba(10,11,20,0.04)]">
        <div className="grid h-10 w-10 place-items-center rounded-full bg-[#F5F5F7] text-[#0B0B0F]">
          <HeadphonesIcon className="h-5 w-5" strokeWidth={1.75} />
        </div>
        <Eyebrow className="mt-4">Support prof dédié</Eyebrow>
        <h3 className="mt-1.5 font-[family-name:var(--font-cabinet)] text-[18px] font-bold leading-tight tracking-tight text-[#0B0B0F]">
          Réponse moyenne : 3 h
        </h3>
        <p className="mt-1.5 text-[12px] leading-relaxed text-[#6E7178]">
          Les profs vérifiés bénéficient d'une file prioritaire. La plupart des
          tickets sont résolus en un seul échange.
        </p>

        <ul className="mt-4 space-y-2.5 border-t border-[#EFEFF1] pt-4">
          <InfoRow icon={Clock3} label="Lundi – Samedi" value="8h → 22h (GMT+1)" />
          <InfoRow icon={Mail} label="Email prof" value="profs@darso.ma" />
          <InfoRow icon={Phone} label="Ligne prof" value="+212 5 22 00 00 01" />
          <InfoRow
            icon={MessageCircle}
            label="Chat en direct"
            value="Disponible en semaine"
          />
        </ul>
      </div>

      <div className="rounded-[20px] border border-[#EFEFF1] bg-white p-4">
        <Eyebrow>Urgence pédagogique ?</Eyebrow>
        <p className="mt-1.5 text-[12px] leading-snug text-[#6E7178]">
          Pour un incident pendant une séance en cours, appelle-nous directement
          — la ligne prof est priorisée.
        </p>
      </div>
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Clock3;
  label: string;
  value: string;
}) {
  return (
    <li className="flex items-center gap-3">
      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#F5F5F7] text-[#0B0B0F]">
        <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
      </div>
      <div className="min-w-0">
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.06em] text-[#8A8D93]">
          {label}
        </p>
        <p className="truncate text-[12.5px] font-medium text-[#0B0B0F]">
          {value}
        </p>
      </div>
    </li>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="mb-1.5 block text-[11.5px] font-semibold uppercase tracking-[0.06em] text-[#6E7178]"
      >
        {label}
      </label>
      {children}
    </div>
  );
}
