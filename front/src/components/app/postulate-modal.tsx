"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import { SmoothInput } from "@/components/library/smooth-input";
import { StatefulButton } from "@/components/library/stateful-button";
import { fadeQuick, springSoft } from "@/lib/motion";
import { cn } from "@/lib/utils";

export type PostulateTarget = {
  id: string;
  title: string;
  author: string;
  budget: number;
};

export type PostulateModalProps = {
  open: boolean;
  onClose: () => void;
  target: PostulateTarget | null;
};

/**
 * Teacher-flavored variant of ApplyModal — used from the Teacher Discover
 * page's tab-2 "Postuler" CTA to reply to a student request.
 *
 * Mirrors ApplyModal's animation/backdrop pattern exactly (mobile bottom
 * sheet, desktop centered) and adds a "Délai estimé" field on top of the
 * existing price / message / timing fields.
 */
export function PostulateModal({ open, onClose, target }: PostulateModalProps) {
  const [price, setPrice] = useState("");
  const [message, setMessage] = useState("");
  const [timeline, setTimeline] = useState("");
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
    setPrice(String(target.budget));
    setMessage("");
    setTimeline("");
    setTiming("");
  }, [open, target]);

  if (!target) {
    return (
      <AnimatePresence>{open ? <div className="hidden" /> : null}</AnimatePresence>
    );
  }

  const handleSubmit = async () => {
    console.log("[PostulateModal] submit", {
      target,
      price: Number(price),
      message,
      timeline,
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
                  Répondre à une demande
                </p>
                <h2 className="mt-1 font-[family-name:var(--font-cabinet)] text-[22px] font-bold leading-tight tracking-tight text-[#0B0B0F]">
                  {`Postuler à « ${target.title} »`}
                </h2>
                <p className="mt-1 truncate text-[12px] text-[#6E7178]">
                  publiée par {target.author}
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
                  Budget de l&apos;élève
                </p>
                <p className="mt-0.5 text-[12.5px] font-bold text-[#0B0B0F] tabular-nums">
                  {target.budget} MAD
                </p>
              </div>

              <Field label="Ton tarif proposé" hint="MAD par heure">
                <SmoothInput
                  value={price}
                  onChange={(e) => setPrice(e.target.value.replace(/\D/g, ""))}
                  placeholder="220"
                  inputMode="numeric"
                  className="h-11 px-3 text-[14px] font-semibold text-[#0B0B0F]"
                  wrapperClassName="rounded-[12px] border border-[#EFEFF1] bg-white"
                />
              </Field>

              <Field label="Ton délai estimé" hint="Ex. 2 sem. · 3 séances">
                <SmoothInput
                  value={timeline}
                  onChange={(e) => setTimeline(e.target.value)}
                  placeholder="2 semaines · 3 séances"
                  className="h-11 px-3 text-[13px] text-[#0B0B0F]"
                  wrapperClassName="rounded-[12px] border border-[#EFEFF1] bg-white"
                />
              </Field>

              <Field label="Message à l'élève" hint="120 caractères min.">
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  placeholder="Présente ton expérience, ta méthode et ce que tu proposes de couvrir en priorité."
                  className="w-full resize-none rounded-[12px] border border-[#EFEFF1] bg-white p-3 text-[13px] text-[#0B0B0F] placeholder:text-[#B0B3B8] focus:border-[#0B0B0F] focus:outline-none"
                />
                <div className="mt-1 text-right text-[10.5px] text-[#8A8D93] tabular-nums">
                  {message.length}/120
                </div>
              </Field>

              <Field label="Créneaux disponibles" hint="Ex. Lun-Mer soir">
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
                  Envoyer ma candidature
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
