"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, X } from "lucide-react";
import { fadeQuick, springSoft } from "@/lib/motion";
import { cn } from "@/lib/utils";

export type NewRequestPayload = {
  subject: string;
  level: string;
  title: string;
  description: string;
  budget: number;
  deadline: string;
};

const SUBJECTS = [
  "Mathématiques",
  "Physique-Chimie",
  "SVT",
  "Français",
  "Anglais",
  "Histoire-Géo",
  "Philosophie",
  "Économie",
];
const LEVELS = ["Collège", "Seconde", "Première", "Terminale", "Prépa"];
const DEADLINES = ["Cette semaine", "2 semaines", "1 mois", "Flexible"];

export function NewRequestModal({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit?: (payload: NewRequestPayload) => void;
}) {
  const [subject, setSubject] = useState(SUBJECTS[0]);
  const [level, setLevel] = useState("Terminale");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [budget, setBudget] = useState("150");
  const [deadline, setDeadline] = useState(DEADLINES[1]);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (open) {
      setSubmitted(false);
      setTitle("");
      setDescription("");
    }
  }, [open]);

  const submit = () => {
    onSubmit?.({
      subject,
      level,
      title: title.trim() || `${subject} · ${level}`,
      description: description.trim(),
      budget: Number(budget) || 0,
      deadline,
    });
    setSubmitted(true);
    window.setTimeout(() => onClose(), 900);
  };

  const canSubmit = description.trim().length > 6 && Number(budget) > 0;

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          {...fadeQuick}
        >
          <div
            aria-hidden
            onClick={onClose}
            className="absolute inset-0 bg-[#0B0B0F]/40 backdrop-blur-sm"
          />
          <motion.div
            role="dialog"
            aria-labelledby="new-request-title"
            aria-modal="true"
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={springSoft}
            className="relative flex max-h-[92dvh] w-full max-w-[520px] flex-col overflow-hidden rounded-[22px] bg-white shadow-[0_24px_80px_rgba(10,11,20,0.28)]"
          >
            <div className="flex items-center justify-between border-b border-[#EFEFF1] p-5">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.09em] text-[#8A8D93]">
                  Nouvelle demande
                </p>
                <h2
                  id="new-request-title"
                  className="mt-1 font-[family-name:var(--font-cabinet)] text-[20px] font-bold leading-tight tracking-tight text-[#0B0B0F]"
                >
                  Décris ce que tu cherches
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Fermer"
                className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-[#8A8D93] transition-colors hover:bg-[#F5F5F7] hover:text-[#0B0B0F]"
              >
                <X className="h-4 w-4" strokeWidth={1.75} />
              </button>
            </div>

            {submitted ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 p-10">
                <div className="grid h-14 w-14 place-items-center rounded-full bg-[#DFFF3F]">
                  <Check className="h-6 w-6 text-[#0B0B0F]" strokeWidth={2.5} />
                </div>
                <p className="text-[14px] font-semibold text-[#0B0B0F]">
                  Demande publiée
                </p>
                <p className="max-w-[280px] text-center text-[12px] text-[#6E7178]">
                  Les profs de la matière la verront apparaître dans leur fil dans quelques secondes.
                </p>
              </div>
            ) : (
              <>
                <div className="scrollbar-none flex-1 space-y-5 overflow-y-auto p-5">
                  <Field label="Matière">
                    <ChipList
                      value={subject}
                      options={SUBJECTS}
                      onChange={setSubject}
                    />
                  </Field>
                  <Field label="Niveau">
                    <ChipList value={level} options={LEVELS} onChange={setLevel} />
                  </Field>
                  <Field label="Titre (optionnel)">
                    <input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Ex : Révision dérivées composées"
                      className="h-10 w-full rounded-[12px] border border-[#EFEFF1] bg-white px-3 text-[13px] text-[#0B0B0F] outline-none transition-colors focus:border-[#0B0B0F]"
                    />
                  </Field>
                  <Field label="Décris ton objectif">
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Ex : Je bloque sur les dérivées composées, examen dans 2 semaines, besoin d'exercices corrigés et d'un plan de révision."
                      rows={4}
                      className="w-full resize-none rounded-[12px] border border-[#EFEFF1] bg-white p-3 text-[13px] leading-relaxed text-[#0B0B0F] outline-none transition-colors focus:border-[#0B0B0F]"
                    />
                    <p className="mt-1 text-[10.5px] text-[#8A8D93]">
                      {description.trim().length}/500 caractères
                    </p>
                  </Field>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Budget (MAD/h)">
                      <input
                        type="number"
                        inputMode="numeric"
                        min={50}
                        max={800}
                        value={budget}
                        onChange={(e) => setBudget(e.target.value)}
                        className="h-10 w-full rounded-[12px] border border-[#EFEFF1] bg-white px-3 text-[13px] font-semibold tabular-nums text-[#0B0B0F] outline-none transition-colors focus:border-[#0B0B0F]"
                      />
                    </Field>
                    <Field label="Deadline">
                      <ChipList
                        value={deadline}
                        options={DEADLINES}
                        onChange={setDeadline}
                      />
                    </Field>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 border-t border-[#EFEFF1] p-4">
                  <p className="text-[11px] text-[#8A8D93]">
                    Ta demande sera visible pendant 7 jours.
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="h-9 rounded-full border border-[#EFEFF1] px-4 text-[12px] font-semibold text-[#0B0B0F] transition-colors hover:bg-[#F5F5F7]"
                    >
                      Annuler
                    </button>
                    <button
                      type="button"
                      onClick={submit}
                      disabled={!canSubmit}
                      className={cn(
                        "h-9 rounded-full px-4 text-[12px] font-semibold transition-[filter,background-color]",
                        canSubmit
                          ? "bg-[#DFFF3F] text-[#0B0B0F] hover:brightness-[0.97]"
                          : "cursor-not-allowed bg-[#F0F0F2] text-[#B0B3B8]",
                      )}
                    >
                      Publier la demande
                    </button>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[10.5px] font-semibold uppercase tracking-[0.07em] text-[#8A8D93]">
        {label}
      </span>
      {children}
    </label>
  );
}

function ChipList({
  value,
  options,
  onChange,
}: {
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt) => {
        const active = opt === value;
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={cn(
              "rounded-full border px-2.5 py-1 text-[11.5px] font-semibold transition-colors",
              active
                ? "border-[#0B0B0F] bg-[#0B0B0F] text-white"
                : "border-[#EFEFF1] bg-white text-[#4A4D54] hover:text-[#0B0B0F]",
            )}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}
