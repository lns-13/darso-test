"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CheckCircle2, ChevronDown, Wallet, X } from "lucide-react";
import { SmoothInput } from "@/components/library/smooth-input";
import { StatefulButton } from "@/components/library/stateful-button";
import { fadeQuick, springSoft } from "@/lib/motion";
import { cn } from "@/lib/utils";

export type WithdrawModalMethod = {
  id: string;
  label: string; // display label, e.g. "IBAN BMCE •• 4421"
  bankName?: string;
};

export type WithdrawModalProps = {
  open: boolean;
  onClose: () => void;
  availableBalance: number; // MAD
  methods: WithdrawModalMethod[];
  defaultMethodId?: string;
  currency?: string;
  onConfirm?: (payload: {
    amount: number;
    methodId: string;
    fee: number;
    net: number;
  }) => void | Promise<void>;
};

/** Mock fee model: 2% capped at 20 MAD. */
function computeFee(amount: number) {
  if (amount <= 0) return 0;
  return Math.min(Math.round(amount * 0.02), 20);
}

export function WithdrawModal({
  open,
  onClose,
  availableBalance,
  methods,
  defaultMethodId,
  currency = "MAD",
  onConfirm,
}: WithdrawModalProps) {
  const [amount, setAmount] = useState("");
  const [methodId, setMethodId] = useState<string>(
    defaultMethodId ?? methods[0]?.id ?? "",
  );
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
    if (!open) return;
    setAmount(String(Math.max(0, Math.min(availableBalance, availableBalance))));
    setMethodId(defaultMethodId ?? methods[0]?.id ?? "");
    setConfirmed(false);
  }, [open, availableBalance, defaultMethodId, methods]);

  const amountNum = Number(amount) || 0;
  const fee = useMemo(() => computeFee(amountNum), [amountNum]);
  const net = Math.max(0, amountNum - fee);
  const overBalance = amountNum > availableBalance;
  const belowMin = amountNum > 0 && amountNum < 100;
  const canSubmit =
    amountNum > 0 && !overBalance && !belowMin && methodId && confirmed;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    await onConfirm?.({ amount: amountNum, methodId, fee, net });
    await new Promise((r) => setTimeout(r, 250));
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
                  Retrait
                </p>
                <h2 className="mt-1 font-[family-name:var(--font-cabinet)] text-[22px] font-bold leading-tight tracking-tight text-[#0B0B0F]">
                  Demander un retrait
                </h2>
                <p className="mt-1 truncate text-[12px] text-[#6E7178]">
                  Versement bancaire · réception sous 48h ouvrées
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
              {/* Available balance */}
              <div className="flex items-center gap-3 rounded-[14px] bg-[#DFFF3F] p-3.5">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px] bg-[#0B0B0F] text-[#DFFF3F]">
                  <Wallet className="h-4 w-4" strokeWidth={1.75} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.09em] text-[#0B0B0F]/60">
                    Solde disponible
                  </p>
                  <p className="mt-0.5 font-[family-name:var(--font-cabinet)] text-[20px] font-bold leading-none tracking-tight text-[#0B0B0F] tabular-nums">
                    {availableBalance.toLocaleString("fr-FR")}{" "}
                    <span className="text-[13px] font-semibold text-[#0B0B0F]/60">
                      {currency}
                    </span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setAmount(String(availableBalance))}
                  className="rounded-full bg-[#0B0B0F] px-3 py-1.5 text-[10.5px] font-semibold text-white"
                >
                  Tout retirer
                </button>
              </div>

              {/* Amount */}
              <Field label="Montant à retirer" hint="Min. 100 MAD">
                <div
                  className={cn(
                    "flex items-center rounded-[12px] border bg-white",
                    overBalance || belowMin
                      ? "border-[#DC2626]"
                      : "border-[#EFEFF1] focus-within:border-[#0B0B0F]",
                  )}
                >
                  <SmoothInput
                    value={amount}
                    onChange={(e) =>
                      setAmount(e.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    placeholder="0"
                    inputMode="numeric"
                    className="h-11 px-3 text-[15px] font-semibold text-[#0B0B0F] tabular-nums"
                    wrapperClassName="flex-1"
                  />
                  <span className="pr-3 text-[12px] font-semibold text-[#8A8D93] tabular-nums">
                    {currency}
                  </span>
                </div>
                {overBalance ? (
                  <p className="mt-1.5 text-[10.5px] font-medium text-[#DC2626]">
                    Montant supérieur au solde disponible.
                  </p>
                ) : belowMin ? (
                  <p className="mt-1.5 text-[10.5px] font-medium text-[#DC2626]">
                    Le montant minimum est de 100 MAD.
                  </p>
                ) : null}
              </Field>

              {/* Method */}
              <Field
                label="Méthode de versement"
                hint={methods.length > 0 ? `${methods.length} enregistrée(s)` : undefined}
              >
                <div className="relative">
                  <select
                    value={methodId}
                    onChange={(e) => setMethodId(e.target.value)}
                    className="h-11 w-full appearance-none rounded-[12px] border border-[#EFEFF1] bg-white px-3 pr-9 text-[13px] font-semibold text-[#0B0B0F] focus:border-[#0B0B0F] focus:outline-none"
                  >
                    {methods.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.bankName ? `${m.bankName} — ` : ""}
                        {m.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#8A8D93]"
                    strokeWidth={1.75}
                  />
                </div>
              </Field>

              {/* Fee breakdown */}
              <div className="mt-4 space-y-1.5 rounded-[14px] border border-[#EFEFF1] bg-[#FAFAFB] p-3.5 text-[12px]">
                <Row label="Montant brut">
                  {amountNum.toLocaleString("fr-FR")} {currency}
                </Row>
                <Row label="Frais (2% · max 20 MAD)">
                  − {fee.toLocaleString("fr-FR")} {currency}
                </Row>
                <div className="mt-1 flex items-center justify-between border-t border-[#EFEFF1] pt-2 text-[13.5px] font-bold text-[#0B0B0F]">
                  <span>Net crédité</span>
                  <span className="tabular-nums">
                    {net.toLocaleString("fr-FR")} {currency}
                  </span>
                </div>
              </div>

              {/* Confirmation */}
              <label className="mt-4 flex cursor-pointer items-start gap-2.5 rounded-[12px] border border-[#EFEFF1] bg-white p-3">
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={(e) => setConfirmed(e.target.checked)}
                  className="sr-only"
                />
                <span
                  aria-hidden
                  className={cn(
                    "mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-[5px] border transition-colors",
                    confirmed
                      ? "border-[#0B0B0F] bg-[#0B0B0F] text-[#DFFF3F]"
                      : "border-[#D5D7DB] bg-white",
                  )}
                >
                  {confirmed ? (
                    <CheckCircle2 className="h-3 w-3" strokeWidth={2.5} />
                  ) : null}
                </span>
                <span className="text-[11.5px] leading-snug text-[#0B0B0F]">
                  Je confirme les coordonnées bancaires ci-dessus et j&apos;accepte
                  les délais de traitement (48h ouvrées).
                </span>
              </label>
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
                  className={cn(
                    "w-full py-2.5 text-[12.5px]",
                    !canSubmit && "cursor-not-allowed opacity-60",
                  )}
                  disabled={!canSubmit}
                >
                  Confirmer le retrait
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
        <span className="text-[11.5px] font-semibold text-[#0B0B0F]">
          {label}
        </span>
        {hint ? (
          <span className="text-[10.5px] text-[#8A8D93]">{hint}</span>
        ) : null}
      </div>
      {children}
    </label>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between text-[#6E7178]">
      <span>{label}</span>
      <span className="tabular-nums text-[#0B0B0F] font-semibold">
        {children}
      </span>
    </div>
  );
}
