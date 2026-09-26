"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import { SmoothInput } from "@/components/library/smooth-input";
import { StatefulButton } from "@/components/library/stateful-button";
import { fadeQuick, springSoft } from "@/lib/motion";
import { cn } from "@/lib/utils";

export type ApplyTarget =
  | { kind: "course"; title: string; teacher: string; price: number }
  | { kind: "request"; title: string; author: string; budget: number };

export type ApplyModalProps = {
  open: boolean;
  onClose: () => void;
  target: ApplyTarget | null;
  variant?: "student" | "teacher";
};

export function ApplyModal({
  open,
  onClose,
  target,
  variant = "student",
}: ApplyModalProps) {
  const [price, setPrice] = useState("");
  const [message, setMessage] = useState("");
  const [timing, setTiming] = useState("");

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
    if (!open || !target) return;
    const suggested = target.kind === "course" ? target.price : target.budget;
    setPrice(String(suggested));
    setMessage("");
    setTiming("");
  }, [open, target]);

  if (!target) {
    return (
      <AnimatePresence>{open ? <div className="hidden" /> : null}</AnimatePresence>
    );
  }

  const copy = getCopy(target, variant);

  const handleSubmit = async () => {
    console.log("[ApplyModal] submit", {
      target,
      variant,
      price: Number(price),
      message,
      timing,
    });
    await new Promise((r) => setTimeout(r, 400));
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
              "min-[900px]:max-w-[520px] min-[900px]:rounded-[20px] min-[900px]:shadow-[0_20px_60px_rgba(10,11,20,0.25)]",
            )}
          >
            <div className="flex items-start justify-between gap-3 px-5 pb-3 pt-5 min-[900px]:pt-6">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.09em] text-[#8A8D93]">
                  {copy.eyebrow}
                </p>
                <h2 className="mt-1 font-[family-name:var(--font-cabinet)] text-[22px] font-bold leading-tight tracking-tight text-[#0B0B0F]">
                  {copy.title}
                </h2>
                <p className="mt-1 truncate text-[12px] text-[#6E7178]">
                  {copy.sub}
                </p>
              </div>
              <button
                onClick={onClose}
                aria-label="Fermer"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#F5F5F7] text-[#0B0B0F]"
              >
                <X className="h-4 w-4" strokeWidth={2} />
              </button>
            </div>

            <div className="scrollbar-none flex-1 overflow-y-auto px-5 pb-4">
              <div className="rounded-[14px] bg-[#F5F5F7] p-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.09em] text-[#8A8D93]">
                  {copy.referenceLabel}
                </p>
                <p className="mt-0.5 text-[12.5px] font-bold text-[#0B0B0F] tabular-nums">
                  {copy.referenceValue} MAD
                </p>
              </div>

              <Field label={copy.priceLabel} hint="MAD par heure">
                <SmoothInput
                  value={price}
                  onChange={(e) => setPrice(e.target.value.replace(/\D/g, ""))}
                  placeholder="220"
                  inputMode="numeric"
                  className="h-11 px-3 text-[14px] font-semibold text-[#0B0B0F]"
                  wrapperClassName="rounded-[12px] border border-[#EFEFF1] bg-white"
                />
              </Field>

              <Field label={copy.messageLabel} hint="120 caractères min.">
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  placeholder={copy.messagePlaceholder}
                  className="w-full resize-none rounded-[12px] border border-[#EFEFF1] bg-white p-3 text-[13px] text-[#0B0B0F] placeholder:text-[#B0B3B8] focus:border-[#0B0B0F] focus:outline-none"
                />
              </Field>

              <Field label={copy.timingLabel} hint="Ex. Lun-Mer soir">
                <SmoothInput
                  value={timing}
                  onChange={(e) => setTiming(e.target.value)}
                  placeholder="Lun & Mer soir · 19h-21h"
                  className="h-11 px-3 text-[13px] text-[#0B0B0F]"
                  wrapperClassName="rounded-[12px] border border-[#EFEFF1] bg-white"
                />
              </Field>
            </div>

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
                  {copy.submitLabel}
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

function getCopy(target: ApplyTarget, variant: "student" | "teacher") {
  if (target.kind === "course") {
    return {
      eyebrow: "Réserver un prof",
      title: `Postuler à « ${target.title} »`,
      sub: `avec ${target.teacher}`,
      referenceLabel: "Tarif affiché",
      referenceValue: String(target.price),
      priceLabel: "Ton budget proposé",
      messageLabel: "Message au prof",
      messagePlaceholder:
        "Décris ton niveau actuel, ton objectif et pourquoi ce prof t'intéresse.",
      timingLabel: "Créneaux préférés",
      submitLabel: "Envoyer la demande",
    };
  }
  if (variant === "teacher") {
    return {
      eyebrow: "Répondre à une annonce",
      title: `Postuler à « ${target.title} »`,
      sub: `publiée par ${target.author}`,
      referenceLabel: "Budget de l'élève",
      referenceValue: String(target.budget),
      priceLabel: "Ton tarif proposé",
      messageLabel: "Message à l'élève",
      messagePlaceholder:
        "Présente ton expérience, ta méthode et ce que tu proposes de couvrir en priorité.",
      timingLabel: "Tes disponibilités",
      submitLabel: "Envoyer ma candidature",
    };
  }
  return {
    eyebrow: "Contacter cet élève",
    title: `Répondre à « ${target.title} »`,
    sub: `publiée par ${target.author}`,
    referenceLabel: "Budget indiqué",
    referenceValue: String(target.budget),
    priceLabel: "Ta contre-proposition",
    messageLabel: "Message",
    messagePlaceholder:
      "Explique pourquoi tu es intéressé·e et ce que tu peux apporter.",
    timingLabel: "Créneaux préférés",
    submitLabel: "Envoyer",
  };
}
