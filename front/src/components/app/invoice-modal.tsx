"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Download, X } from "lucide-react";
import { fadeQuick, springSoft } from "@/lib/motion";
import { cn } from "@/lib/utils";

export type InvoiceLineItem = {
  id: string;
  label: string;
  detail?: string;
  qty: number;
  unit: number;
};

export type InvoiceData = {
  number: string;
  issuedAt: string; // human formatted
  dueAt?: string;
  status: "payé" | "en attente" | "échoué" | "remboursé";
  billTo: {
    name: string;
    address?: string;
    email?: string;
  };
  items: InvoiceLineItem[];
  currency?: string; // default MAD
  vatRate?: number; // 0..1
  footer?: string;
};

export type InvoiceModalProps = {
  open: boolean;
  onClose: () => void;
  invoice: InvoiceData | null;
  eyebrow?: string;
  title?: string;
  readOnly?: boolean;
  onDownload?: () => void;
};

export function InvoiceModal({
  open,
  onClose,
  invoice,
  eyebrow,
  title,
  readOnly,
  onDownload,
}: InvoiceModalProps) {
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

  const currency = invoice?.currency ?? "MAD";
  const vatRate = invoice?.vatRate ?? 0.2;
  const subtotal = invoice
    ? invoice.items.reduce((sum, it) => sum + it.qty * it.unit, 0)
    : 0;
  const vat = subtotal * vatRate;
  const total = subtotal + vat;

  return (
    <AnimatePresence>
      {open && invoice ? (
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
              "relative flex w-full max-h-[92dvh] flex-col overflow-hidden rounded-t-[24px] bg-[#EDEDEF] shadow-[0_-4px_24px_rgba(10,11,20,0.15)]",
              "min-[900px]:max-w-[640px] min-[900px]:rounded-[20px] min-[900px]:shadow-[0_20px_60px_rgba(10,11,20,0.25)]",
            )}
          >
            <div className="flex items-start justify-between gap-3 bg-white px-5 pb-3 pt-5 min-[900px]:pt-6">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.09em] text-[#8A8D93]">
                  {eyebrow ?? "Facture"}
                </p>
                <h2 className="mt-1 font-[family-name:var(--font-cabinet)] text-[22px] font-bold leading-tight tracking-tight text-[#0B0B0F]">
                  {title ?? `Facture ${invoice.number}`}
                </h2>
                <p className="mt-1 truncate text-[12px] text-[#6E7178]">
                  Émise le {invoice.issuedAt}
                  {invoice.dueAt ? ` · Échéance ${invoice.dueAt}` : ""}
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

            <div className="scrollbar-none flex-1 overflow-y-auto px-4 pb-4 pt-1">
              <InvoicePreview
                invoice={invoice}
                currency={currency}
                subtotal={subtotal}
                vat={vat}
                total={total}
                vatRate={vatRate}
              />
            </div>

            <div className="sticky bottom-0 flex items-center justify-between gap-2.5 border-t border-[#EFEFF1] bg-white px-5 py-3">
              <button
                onClick={onClose}
                className="rounded-full border border-[#EFEFF1] px-4 py-2.5 text-[12.5px] font-semibold text-[#0B0B0F] transition-colors hover:bg-[#F5F5F7]"
              >
                Fermer
              </button>
              {!readOnly ? (
                <button
                  onClick={() => {
                    onDownload?.();
                  }}
                  className="flex items-center gap-1.5 rounded-full bg-[#0B0B0F] px-4 py-2.5 text-[12.5px] font-semibold text-white transition-colors hover:bg-[#1a1b21]"
                >
                  <Download className="h-3.5 w-3.5" strokeWidth={2} />
                  Télécharger le PDF
                </button>
              ) : null}
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}

function InvoicePreview({
  invoice,
  currency,
  subtotal,
  vat,
  total,
  vatRate,
}: {
  invoice: InvoiceData;
  currency: string;
  subtotal: number;
  vat: number;
  total: number;
  vatRate: number;
}) {
  const statusTone = statusToTone(invoice.status);
  return (
    <div className="rounded-[12px] bg-white p-5 shadow-[0_1px_2px_rgba(10,11,20,0.04)]">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="grid h-9 w-9 place-items-center rounded-[10px] bg-[#0B0B0F] text-[#DFFF3F]">
            <span className="font-[family-name:var(--font-cabinet)] text-[16px] font-bold">
              d
            </span>
          </div>
          <div>
            <p className="font-[family-name:var(--font-cabinet)] text-[15px] font-bold tracking-tight text-[#0B0B0F]">
              darso
            </p>
            <p className="text-[10px] text-[#8A8D93]">Marketplace éducative · Casablanca</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#8A8D93]">
            Facture
          </p>
          <p className="mt-0.5 text-[13px] font-bold tabular-nums text-[#0B0B0F]">
            {invoice.number}
          </p>
          <span
            className={cn(
              "mt-1 inline-flex h-5 items-center rounded-full px-1.5 text-[10px] font-semibold",
              statusTone,
            )}
          >
            {invoice.status}
          </span>
        </div>
      </div>

      {/* Meta */}
      <div className="mt-5 grid grid-cols-2 gap-4 rounded-[10px] bg-[#FAFAFB] p-3.5">
        <div>
          <p className="text-[9.5px] font-semibold uppercase tracking-[0.08em] text-[#8A8D93]">
            Facturé à
          </p>
          <p className="mt-1 text-[12px] font-semibold text-[#0B0B0F]">
            {invoice.billTo.name}
          </p>
          {invoice.billTo.address ? (
            <p className="mt-0.5 whitespace-pre-line text-[11px] leading-relaxed text-[#6E7178]">
              {invoice.billTo.address}
            </p>
          ) : null}
          {invoice.billTo.email ? (
            <p className="mt-0.5 text-[11px] text-[#6E7178]">{invoice.billTo.email}</p>
          ) : null}
        </div>
        <div className="text-right">
          <p className="text-[9.5px] font-semibold uppercase tracking-[0.08em] text-[#8A8D93]">
            Date d&apos;émission
          </p>
          <p className="mt-1 text-[12px] font-semibold text-[#0B0B0F] tabular-nums">
            {invoice.issuedAt}
          </p>
          {invoice.dueAt ? (
            <>
              <p className="mt-2 text-[9.5px] font-semibold uppercase tracking-[0.08em] text-[#8A8D93]">
                Échéance
              </p>
              <p className="mt-1 text-[12px] font-semibold text-[#0B0B0F] tabular-nums">
                {invoice.dueAt}
              </p>
            </>
          ) : null}
        </div>
      </div>

      {/* Items */}
      <div className="mt-5 overflow-hidden rounded-[10px] border border-[#EFEFF1]">
        <table className="w-full text-left">
          <thead className="text-[9.5px] font-semibold uppercase tracking-[0.08em] text-[#8A8D93]">
            <tr className="border-b border-[#EFEFF1]">
              <th scope="col" className="px-3 py-2 font-semibold">Description</th>
              <th scope="col" className="px-3 py-2 text-right font-semibold tabular-nums">
                Qté
              </th>
              <th scope="col" className="px-3 py-2 text-right font-semibold tabular-nums">
                PU
              </th>
              <th scope="col" className="px-3 py-2 text-right font-semibold tabular-nums">
                Total
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EFEFF1] text-[12px] text-[#0B0B0F]">
            {invoice.items.map((it) => (
              <tr key={it.id} className="even:bg-[#FAFAFB]">
                <td className="px-3 py-2.5">
                  <p className="font-semibold">{it.label}</p>
                  {it.detail ? (
                    <p className="mt-0.5 text-[10.5px] text-[#8A8D93]">{it.detail}</p>
                  ) : null}
                </td>
                <td className="px-3 py-2.5 text-right tabular-nums">{it.qty}</td>
                <td className="px-3 py-2.5 text-right tabular-nums">
                  {formatMoney(it.unit, currency)}
                </td>
                <td className="px-3 py-2.5 text-right font-semibold tabular-nums">
                  {formatMoney(it.qty * it.unit, currency)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="mt-4 flex justify-end">
        <div className="w-full max-w-[240px] space-y-1.5 text-[12px]">
          <div className="flex items-center justify-between text-[#6E7178]">
            <span>Sous-total</span>
            <span className="tabular-nums">{formatMoney(subtotal, currency)}</span>
          </div>
          <div className="flex items-center justify-between text-[#6E7178]">
            <span>TVA ({Math.round(vatRate * 100)}%)</span>
            <span className="tabular-nums">{formatMoney(vat, currency)}</span>
          </div>
          <div className="mt-1.5 flex items-center justify-between border-t border-[#EFEFF1] pt-2 text-[13.5px] font-bold text-[#0B0B0F]">
            <span>Total TTC</span>
            <span className="tabular-nums">{formatMoney(total, currency)}</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <p className="mt-6 border-t border-[#EFEFF1] pt-3 text-[10px] leading-relaxed text-[#8A8D93]">
        {invoice.footer ??
          "darso SAS · RC Casablanca 123456 · ICE 001234567890000. Facture générée automatiquement, valable sans signature. Merci pour ta confiance."}
      </p>
    </div>
  );
}

function statusToTone(status: InvoiceData["status"]) {
  switch (status) {
    case "payé":
    case "remboursé":
      return "bg-[#DFFF3F] text-[#0B0B0F]";
    case "en attente":
      return "bg-[#F5F5F7] text-[#0B0B0F]";
    case "échoué":
      return "border border-[#0B0B0F] text-[#DC2626]";
    default:
      return "bg-[#F5F5F7] text-[#0B0B0F]";
  }
}

function formatMoney(value: number, currency: string) {
  const formatted = value.toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${formatted} ${currency}`;
}
