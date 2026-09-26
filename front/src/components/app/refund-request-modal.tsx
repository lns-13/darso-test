"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronDown, Paperclip, X } from "lucide-react";
import { StatefulButton } from "@/components/library/stateful-button";
import { fadeQuick, springSoft } from "@/lib/motion";
import { cn } from "@/lib/utils";

export type RefundTransactionOption = {
  id: string;
  label: string; // e.g. "TX-4821 · Analyse & suites — 220,00 MAD"
};

export type RefundRequestModalProps = {
  open: boolean;
  onClose: () => void;
  transactions: RefundTransactionOption[];
  defaultTransactionId?: string;
  onSubmit?: (payload: {
    transactionId: string;
    reason: string;
    fileName: string | null;
  }) => void | Promise<void>;
};

export function RefundRequestModal({
  open,
  onClose,
  transactions,
  defaultTransactionId,
  onSubmit,
}: RefundRequestModalProps) {
  const [transactionId, setTransactionId] = useState<string>("");
  const [reason, setReason] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);

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
    setTransactionId(defaultTransactionId ?? transactions[0]?.id ?? "");
    setReason("");
    setFileName(null);
  }, [open, defaultTransactionId, transactions]);

  const handleSubmit = async () => {
    console.log("[RefundRequestModal] submit", { transactionId, reason, fileName });
    await onSubmit?.({ transactionId, reason, fileName });
    await new Promise((r) => setTimeout(r, 300));
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
                  Remboursement
                </p>
                <h2 className="mt-1 font-[family-name:var(--font-cabinet)] text-[22px] font-bold leading-tight tracking-tight text-[#0B0B0F]">
                  Demander un remboursement
                </h2>
                <p className="mt-1 text-[12px] text-[#6E7178]">
                  Précise la transaction et ta raison. On répond sous 48h ouvrées.
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
              <Field label="Transaction concernée" hint="Obligatoire">
                <div className="relative">
                  <select
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    className="h-11 w-full appearance-none rounded-[12px] border border-[#EFEFF1] bg-white pl-3 pr-9 text-[13px] font-semibold text-[#0B0B0F] focus:border-[#0B0B0F] focus:outline-none"
                  >
                    {transactions.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8A8D93]"
                    strokeWidth={1.75}
                  />
                </div>
              </Field>

              <Field label="Raison" hint="Sois précis·e — on lit tout">
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={4}
                  placeholder="Ex. Le prof n'a pas assuré la séance. J'ai attendu 15 min sans réponse."
                  className="w-full resize-none rounded-[12px] border border-[#EFEFF1] bg-white p-3 text-[13px] text-[#0B0B0F] placeholder:text-[#B0B3B8] focus:border-[#0B0B0F] focus:outline-none"
                />
              </Field>

              <Field label="Justificatif" hint="Optionnel · capture, PDF, image">
                <label className="flex cursor-pointer items-center gap-2.5 rounded-[12px] border border-dashed border-[#D5D7DB] bg-white px-3 py-2.5 text-[12px] text-[#6E7178] transition-colors hover:border-[#0B0B0F] hover:bg-[#F5F5F7]">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-[8px] bg-[#F5F5F7] text-[#0B0B0F]">
                    <Paperclip className="h-3.5 w-3.5" strokeWidth={1.75} />
                  </span>
                  <span className="min-w-0 flex-1 truncate font-medium text-[#0B0B0F]">
                    {fileName ?? "Ajouter un justificatif"}
                  </span>
                  <input
                    type="file"
                    className="hidden"
                    onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
                  />
                </label>
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
                  Envoyer la demande
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
