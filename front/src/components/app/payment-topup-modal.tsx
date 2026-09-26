"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, CreditCard, Wallet, X } from "lucide-react";
import { fadeQuick, springSoft } from "@/lib/motion";
import { cn } from "@/lib/utils";

const QUICK_AMOUNTS = [100, 200, 500, 1000] as const;

export type TopUpMethod = { id: string; label: string };

export function PaymentTopUpModal({
  open,
  onClose,
  currentBalance,
  methods,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  currentBalance: number;
  methods: TopUpMethod[];
  onConfirm?: (amount: number, methodId: string) => void;
}) {
  const [amount, setAmount] = useState<number>(200);
  const [custom, setCustom] = useState("");
  const [methodId, setMethodId] = useState(methods[0]?.id ?? "");
  const [confirmed, setConfirmed] = useState(false);

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
      setConfirmed(false);
      setAmount(200);
      setCustom("");
      setMethodId(methods[0]?.id ?? "");
    }
  }, [open, methods]);

  const finalAmount = custom.trim().length > 0 ? Number(custom) || 0 : amount;
  const canConfirm = finalAmount > 0 && methodId.length > 0;

  const confirm = () => {
    onConfirm?.(finalAmount, methodId);
    setConfirmed(true);
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
            aria-label="Recharger le portefeuille"
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
                  Recharger
                </p>
                <h2 className="mt-1 font-[family-name:var(--font-cabinet)] text-[19px] font-bold leading-tight tracking-tight text-[#0B0B0F]">
                  Ajouter du crédit
                </h2>
                <p className="mt-1 flex items-center gap-1.5 text-[11.5px] text-[#6E7178]">
                  <Wallet className="h-3 w-3" strokeWidth={1.75} />
                  Solde actuel :{" "}
                  <span className="font-semibold text-[#0B0B0F] tabular-nums">
                    {currentBalance} MAD
                  </span>
                </p>
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

            {confirmed ? (
              <div className="flex flex-col items-center gap-3 p-10">
                <div className="grid h-14 w-14 place-items-center rounded-full bg-[#DFFF3F]">
                  <Check className="h-6 w-6 text-[#0B0B0F]" strokeWidth={2.5} />
                </div>
                <p className="text-[14px] font-semibold text-[#0B0B0F]">
                  {finalAmount} MAD ajoutés
                </p>
                <p className="text-[12px] text-[#6E7178]">
                  Nouveau solde : {currentBalance + finalAmount} MAD
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-5 p-5">
                  <div>
                    <p className="mb-2 text-[10.5px] font-semibold uppercase tracking-[0.07em] text-[#8A8D93]">
                      Montant
                    </p>
                    <div className="grid grid-cols-4 gap-2">
                      {QUICK_AMOUNTS.map((v) => {
                        const active =
                          custom.trim().length === 0 && amount === v;
                        return (
                          <button
                            key={v}
                            type="button"
                            onClick={() => {
                              setAmount(v);
                              setCustom("");
                            }}
                            className={cn(
                              "flex h-11 items-center justify-center rounded-[12px] border text-[12.5px] font-semibold transition-colors",
                              active
                                ? "border-[#0B0B0F] bg-[#0B0B0F] text-white"
                                : "border-[#EFEFF1] bg-white text-[#0B0B0F] hover:bg-[#F5F5F7]",
                            )}
                          >
                            {v} MAD
                          </button>
                        );
                      })}
                    </div>
                    <div className="mt-2 flex items-center gap-2 rounded-[12px] border border-[#EFEFF1] bg-white px-3">
                      <span className="text-[11.5px] font-medium text-[#8A8D93]">
                        Autre montant
                      </span>
                      <input
                        type="number"
                        inputMode="numeric"
                        placeholder="—"
                        min={50}
                        max={5000}
                        value={custom}
                        onChange={(e) => setCustom(e.target.value)}
                        className="h-10 flex-1 bg-transparent text-right text-[13px] font-semibold tabular-nums text-[#0B0B0F] outline-none"
                      />
                      <span className="text-[11.5px] font-medium text-[#8A8D93]">
                        MAD
                      </span>
                    </div>
                  </div>

                  <div>
                    <p className="mb-2 text-[10.5px] font-semibold uppercase tracking-[0.07em] text-[#8A8D93]">
                      Moyen de paiement
                    </p>
                    <div className="flex flex-col gap-1.5">
                      {methods.map((m) => {
                        const active = m.id === methodId;
                        return (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => setMethodId(m.id)}
                            className={cn(
                              "flex items-center gap-3 rounded-[12px] border p-3 text-left transition-colors",
                              active
                                ? "border-[#0B0B0F] bg-[#0B0B0F]/[0.03]"
                                : "border-[#EFEFF1] bg-white hover:bg-[#F5F5F7]",
                            )}
                          >
                            <span className="grid h-9 w-9 place-items-center rounded-full bg-[#F5F5F7] text-[#0B0B0F]">
                              <CreditCard
                                className="h-3.5 w-3.5"
                                strokeWidth={1.75}
                              />
                            </span>
                            <span className="min-w-0 flex-1 truncate text-[12.5px] font-semibold text-[#0B0B0F]">
                              {m.label}
                            </span>
                            <span
                              className={cn(
                                "grid h-4 w-4 place-items-center rounded-full border",
                                active
                                  ? "border-[#0B0B0F] bg-[#0B0B0F] text-white"
                                  : "border-[#D5D7DB]",
                              )}
                            >
                              {active ? (
                                <Check className="h-2.5 w-2.5" strokeWidth={2.5} />
                              ) : null}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 border-t border-[#EFEFF1] p-4">
                  <p className="text-[11px] text-[#8A8D93]">
                    Sans frais · débit immédiat
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
                      onClick={confirm}
                      disabled={!canConfirm}
                      className={cn(
                        "h-9 rounded-full px-4 text-[12px] font-semibold transition-[filter,background-color]",
                        canConfirm
                          ? "bg-[#DFFF3F] text-[#0B0B0F] hover:brightness-[0.97]"
                          : "cursor-not-allowed bg-[#F0F0F2] text-[#B0B3B8]",
                      )}
                    >
                      Recharger {finalAmount > 0 ? `${finalAmount} MAD` : ""}
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
