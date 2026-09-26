"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, CreditCard, Lock, X } from "lucide-react";
import { fadeQuick, springSoft } from "@/lib/motion";
import { cn } from "@/lib/utils";

export type NewCardPayload = {
  holder: string;
  last4: string;
  brand: "visa" | "mastercard" | "amex" | "cmi";
  expiry: string;
};

function detectBrand(cardNumber: string): NewCardPayload["brand"] {
  const digits = cardNumber.replace(/\s+/g, "");
  if (/^4/.test(digits)) return "visa";
  if (/^(5[1-5]|2[2-7])/.test(digits)) return "mastercard";
  if (/^3[47]/.test(digits)) return "amex";
  return "cmi";
}

function formatCardNumber(v: string) {
  return v
    .replace(/\D/g, "")
    .slice(0, 19)
    .replace(/(.{4})/g, "$1 ")
    .trim();
}

function formatExpiry(v: string) {
  const digits = v.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

export function AddCardModal({
  open,
  onClose,
  onAdd,
}: {
  open: boolean;
  onClose: () => void;
  onAdd?: (card: NewCardPayload) => void;
}) {
  const [holder, setHolder] = useState("");
  const [number, setNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [added, setAdded] = useState(false);

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
      setAdded(false);
      setHolder("");
      setNumber("");
      setExpiry("");
      setCvc("");
    }
  }, [open]);

  const digits = number.replace(/\s+/g, "");
  const canAdd =
    holder.trim().length >= 2 &&
    digits.length >= 13 &&
    /^\d\d\/\d\d$/.test(expiry) &&
    cvc.length >= 3;

  const submit = () => {
    onAdd?.({
      holder: holder.trim(),
      last4: digits.slice(-4),
      brand: detectBrand(digits),
      expiry,
    });
    setAdded(true);
    window.setTimeout(() => onClose(), 1200);
  };

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
            aria-label="Ajouter une carte"
            aria-modal="true"
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={springSoft}
            className="relative w-full max-w-[440px] overflow-hidden rounded-[22px] bg-white shadow-[0_24px_80px_rgba(10,11,20,0.28)]"
          >
            <div className="flex items-start justify-between gap-3 border-b border-[#EFEFF1] p-5">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.09em] text-[#8A8D93]">
                  Ajouter une carte
                </p>
                <h2 className="mt-1 font-[family-name:var(--font-cabinet)] text-[19px] font-bold leading-tight tracking-tight text-[#0B0B0F]">
                  Nouveau moyen de paiement
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

            {added ? (
              <div className="flex flex-col items-center gap-3 p-10">
                <div className="grid h-14 w-14 place-items-center rounded-full bg-[#DFFF3F]">
                  <Check className="h-6 w-6 text-[#0B0B0F]" strokeWidth={2.5} />
                </div>
                <p className="text-[14px] font-semibold text-[#0B0B0F]">
                  Carte ajoutée
                </p>
                <p className="text-[12px] text-[#6E7178]">
                  Elle apparaîtra dans tes moyens de paiement.
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-4 p-5">
                  <Field label="Nom du titulaire">
                    <input
                      value={holder}
                      onChange={(e) => setHolder(e.target.value)}
                      placeholder="Sara Bencheikh"
                      autoComplete="cc-name"
                      className="h-10 w-full rounded-[12px] border border-[#EFEFF1] bg-white px-3 text-[13px] text-[#0B0B0F] outline-none transition-colors focus:border-[#0B0B0F]"
                    />
                  </Field>
                  <Field label="Numéro de carte">
                    <div className="relative">
                      <input
                        value={number}
                        onChange={(e) => setNumber(formatCardNumber(e.target.value))}
                        placeholder="1234 5678 9012 3456"
                        inputMode="numeric"
                        autoComplete="cc-number"
                        className="h-10 w-full rounded-[12px] border border-[#EFEFF1] bg-white pl-3 pr-10 text-[13px] tabular-nums text-[#0B0B0F] outline-none transition-colors focus:border-[#0B0B0F]"
                      />
                      <CreditCard
                        className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8A8D93]"
                        strokeWidth={1.75}
                      />
                    </div>
                  </Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Expiration">
                      <input
                        value={expiry}
                        onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                        placeholder="MM/AA"
                        inputMode="numeric"
                        autoComplete="cc-exp"
                        className="h-10 w-full rounded-[12px] border border-[#EFEFF1] bg-white px-3 text-[13px] tabular-nums text-[#0B0B0F] outline-none transition-colors focus:border-[#0B0B0F]"
                      />
                    </Field>
                    <Field label="Cryptogramme">
                      <input
                        value={cvc}
                        onChange={(e) =>
                          setCvc(e.target.value.replace(/\D/g, "").slice(0, 4))
                        }
                        placeholder="•••"
                        inputMode="numeric"
                        autoComplete="cc-csc"
                        className="h-10 w-full rounded-[12px] border border-[#EFEFF1] bg-white px-3 text-[13px] tabular-nums text-[#0B0B0F] outline-none transition-colors focus:border-[#0B0B0F]"
                      />
                    </Field>
                  </div>

                  <p className="flex items-center gap-1.5 text-[11px] text-[#8A8D93]">
                    <Lock className="h-3 w-3" strokeWidth={1.75} />
                    Chiffré · CMI 3D Secure
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2 border-t border-[#EFEFF1] p-4">
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
                    disabled={!canAdd}
                    className={cn(
                      "h-9 rounded-full px-4 text-[12px] font-semibold transition-[filter,background-color]",
                      canAdd
                        ? "bg-[#0B0B0F] text-white hover:bg-[#1a1b21]"
                        : "cursor-not-allowed bg-[#F0F0F2] text-[#B0B3B8]",
                    )}
                  >
                    Ajouter la carte
                  </button>
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
