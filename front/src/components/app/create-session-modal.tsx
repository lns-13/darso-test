"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import { SmoothInput } from "@/components/library/smooth-input";
import { StatefulButton } from "@/components/library/stateful-button";
import { fadeQuick, springSoft } from "@/lib/motion";
import { cn } from "@/lib/utils";

export type CreateSessionValues = {
  title: string;
  subject: string;
  level: string;
  type: "individual" | "group";
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  duration: string; // minutes
  price: string; // MAD
  recurrence: "none" | "weekly" | "monthly";
  description: string;
};

export type CreateSessionModalProps = {
  open: boolean;
  onClose: () => void;
  initial?: Partial<CreateSessionValues>;
  onSubmit?: (values: CreateSessionValues) => void | Promise<void>;
};

const SUBJECTS = [
  "Mathématiques",
  "Physique-Chimie",
  "SVT",
  "Français",
  "Anglais",
  "Philosophie",
  "Histoire-Géo",
  "Informatique",
];

const LEVELS = [
  "Collège · 6e à 3e",
  "Seconde",
  "Première",
  "Terminale S",
  "Terminale ES/L",
  "Prépa MPSI/PCSI",
  "Prépa MP/PC",
  "Universitaire",
  "Adulte",
];

const DEFAULT_VALUES: CreateSessionValues = {
  title: "",
  subject: SUBJECTS[0],
  level: LEVELS[3],
  type: "individual",
  date: "",
  time: "",
  duration: "60",
  price: "220",
  recurrence: "none",
  description: "",
};

export function CreateSessionModal({
  open,
  onClose,
  initial,
  onSubmit,
}: CreateSessionModalProps) {
  const [values, setValues] = useState<CreateSessionValues>(DEFAULT_VALUES);

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
    if (!open) return;
    setValues({ ...DEFAULT_VALUES, ...(initial ?? {}) });
  }, [open, initial]);

  const set = <K extends keyof CreateSessionValues>(k: K, v: CreateSessionValues[K]) =>
    setValues((prev) => ({ ...prev, [k]: v }));

  const handleSubmit = async () => {
    await onSubmit?.(values);
    await new Promise((r) => setTimeout(r, 200));
    onClose();
  };

  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-[60] flex items-end justify-center min-[900px]:items-center min-[900px]:p-6">
          <motion.button
            key="backdrop"
            aria-label="Fermer"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={fadeQuick}
            className="absolute inset-0 bg-[#0B0B0F]/50 backdrop-blur-[2px]"
          />

          <motion.div
            key="panel"
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={springSoft}
            className={cn(
              "relative flex w-full max-h-[92dvh] flex-col overflow-hidden rounded-t-[24px] bg-white shadow-[0_-4px_24px_rgba(10,11,20,0.15)]",
              "min-[900px]:max-w-[560px] min-[900px]:rounded-[20px] min-[900px]:shadow-[0_20px_60px_rgba(10,11,20,0.25)]",
            )}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3 border-b border-[#EFEFF1] px-5 pb-3 pt-5 min-[900px]:pt-6">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.09em] text-[#8A8D93]">
                  Nouvelle séance
                </p>
                <h2 className="mt-1 font-[family-name:var(--font-cabinet)] text-[22px] font-bold leading-tight tracking-tight text-[#0B0B0F]">
                  Créer une séance
                </h2>
              </div>
              <button
                onClick={onClose}
                aria-label="Fermer"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#F5F5F7] text-[#0B0B0F]"
              >
                <X className="h-4 w-4" strokeWidth={2} />
              </button>
            </div>

            {/* Body */}
            <div className="scrollbar-none flex-1 overflow-y-auto px-5 pb-4 pt-3">
              <Field label="Titre de la séance">
                <SmoothInput
                  value={values.title}
                  onChange={(e) => set("title", e.target.value)}
                  placeholder="Ex. Bac 2026 · Analyse & suites"
                  className="h-11 px-3 text-[13.5px] font-semibold text-[#0B0B0F]"
                  wrapperClassName="rounded-[12px] border border-[#EFEFF1] bg-white"
                />
              </Field>

              <div className="mt-3.5 grid grid-cols-2 gap-3">
                <Field label="Matière">
                  <NativeSelect
                    value={values.subject}
                    onChange={(v) => set("subject", v)}
                    options={SUBJECTS}
                  />
                </Field>
                <Field label="Niveau">
                  <NativeSelect
                    value={values.level}
                    onChange={(v) => set("level", v)}
                    options={LEVELS}
                  />
                </Field>
              </div>

              <Field label="Type">
                <div className="inline-flex h-9 items-center gap-0.5 rounded-full bg-[#F0F0F2] p-1">
                  {(
                    [
                      { k: "individual", label: "Individuel" },
                      { k: "group", label: "Groupe" },
                    ] as const
                  ).map((o) => (
                    <button
                      key={o.k}
                      type="button"
                      onClick={() => set("type", o.k)}
                      className={cn(
                        "h-7 rounded-full px-3 text-[12px] font-semibold transition-colors",
                        values.type === o.k
                          ? "bg-[#0B0B0F] text-white"
                          : "text-[#4A4D54] hover:text-[#0B0B0F]",
                      )}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </Field>

              <div className="mt-3.5 grid grid-cols-2 gap-3">
                <Field label="Date">
                  <input
                    type="date"
                    value={values.date}
                    onChange={(e) => set("date", e.target.value)}
                    className="h-11 w-full rounded-[12px] border border-[#EFEFF1] bg-white px-3 text-[13px] text-[#0B0B0F] focus:border-[#0B0B0F] focus:outline-none"
                  />
                </Field>
                <Field label="Heure">
                  <input
                    type="time"
                    value={values.time}
                    onChange={(e) => set("time", e.target.value)}
                    className="h-11 w-full rounded-[12px] border border-[#EFEFF1] bg-white px-3 text-[13px] text-[#0B0B0F] focus:border-[#0B0B0F] focus:outline-none"
                  />
                </Field>
              </div>

              <div className="mt-3.5 grid grid-cols-2 gap-3">
                <Field label="Durée" hint="minutes">
                  <SmoothInput
                    value={values.duration}
                    onChange={(e) => set("duration", e.target.value.replace(/\D/g, ""))}
                    placeholder="60"
                    inputMode="numeric"
                    className="h-11 px-3 text-[13px] font-semibold text-[#0B0B0F]"
                    wrapperClassName="rounded-[12px] border border-[#EFEFF1] bg-white"
                  />
                </Field>
                <Field label="Prix" hint="MAD">
                  <SmoothInput
                    value={values.price}
                    onChange={(e) => set("price", e.target.value.replace(/\D/g, ""))}
                    placeholder="220"
                    inputMode="numeric"
                    className="h-11 px-3 text-[13px] font-semibold text-[#0B0B0F]"
                    wrapperClassName="rounded-[12px] border border-[#EFEFF1] bg-white"
                  />
                </Field>
              </div>

              <Field label="Récurrence">
                <div className="inline-flex h-9 items-center gap-0.5 rounded-full bg-[#F0F0F2] p-1">
                  {(
                    [
                      { k: "none", label: "Ponctuelle" },
                      { k: "weekly", label: "Chaque semaine" },
                      { k: "monthly", label: "Chaque mois" },
                    ] as const
                  ).map((o) => (
                    <button
                      key={o.k}
                      type="button"
                      onClick={() => set("recurrence", o.k)}
                      className={cn(
                        "h-7 rounded-full px-3 text-[11.5px] font-semibold transition-colors",
                        values.recurrence === o.k
                          ? "bg-[#0B0B0F] text-white"
                          : "text-[#4A4D54] hover:text-[#0B0B0F]",
                      )}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </Field>

              <Field label="Description" hint="optionnel">
                <textarea
                  value={values.description}
                  onChange={(e) => set("description", e.target.value)}
                  rows={4}
                  placeholder="Objectifs, pré-requis, plan de la séance…"
                  className="w-full resize-none rounded-[12px] border border-[#EFEFF1] bg-white p-3 text-[13px] text-[#0B0B0F] placeholder:text-[#B0B3B8] focus:border-[#0B0B0F] focus:outline-none"
                />
              </Field>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 flex items-center gap-2.5 border-t border-[#EFEFF1] bg-white px-5 py-3">
              <button
                onClick={onClose}
                className="rounded-full border border-[#EFEFF1] px-4 py-2.5 text-[12.5px] font-semibold text-[#0B0B0F]"
              >
                Annuler
              </button>
              <div className="flex-1">
                <StatefulButton
                  onClick={handleSubmit}
                  className="w-full py-2.5 text-[12.5px]"
                >
                  Créer la séance
                </StatefulButton>
              </div>
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="mt-3.5 block">
      <div className="mb-1.5 flex items-baseline justify-between">
        <span className="text-[11.5px] font-semibold text-[#0B0B0F]">{label}</span>
        {hint ? <span className="text-[10.5px] text-[#8A8D93]">{hint}</span> : null}
      </div>
      {children}
    </label>
  );
}

function NativeSelect({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 w-full appearance-none rounded-[12px] border border-[#EFEFF1] bg-white pl-3 pr-8 text-[13px] font-semibold text-[#0B0B0F] focus:border-[#0B0B0F] focus:outline-none"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
      <span
        aria-hidden
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-[#8A8D93]"
      >
        ▾
      </span>
    </div>
  );
}
