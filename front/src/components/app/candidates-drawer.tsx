"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, MessageSquare, Star, X } from "lucide-react";
import { Avatar } from "@/components/app/avatar";
import { fadeQuick, springSoft } from "@/lib/motion";
import { cn } from "@/lib/utils";

export type Candidate = {
  id?: string;
  name: string;
  initials: string;
  subject: string;
  rating: number;
  price: number;
  message?: string;
};

type Status = "pending" | "accepted" | "declined";

export function CandidatesDrawer({
  open,
  onClose,
  requestTitle,
  candidates,
}: {
  open: boolean;
  onClose: () => void;
  requestTitle: string;
  candidates: Candidate[];
}) {
  const [status, setStatus] = useState<Record<string, Status>>({});

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
    if (open) setStatus({});
  }, [open]);

  const accepted = Object.values(status).filter((s) => s === "accepted").length;

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-50"
          {...fadeQuick}
        >
          <div
            aria-hidden
            onClick={onClose}
            className="absolute inset-0 bg-[#0B0B0F]/40 backdrop-blur-sm"
          />
          <motion.aside
            role="dialog"
            aria-label="Candidatures"
            aria-modal="true"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={springSoft}
            className="absolute right-0 top-0 flex h-full w-full max-w-[440px] flex-col bg-white shadow-[-24px_0_60px_rgba(10,11,20,0.18)]"
          >
            <div className="flex items-start justify-between gap-3 border-b border-[#EFEFF1] p-5">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.09em] text-[#8A8D93]">
                  Ta demande
                </p>
                <h2 className="mt-1 truncate font-[family-name:var(--font-cabinet)] text-[17px] font-bold leading-tight tracking-tight text-[#0B0B0F]">
                  {requestTitle}
                </h2>
                <p className="mt-1 text-[11.5px] text-[#8A8D93]">
                  {candidates.length} candidature{candidates.length > 1 ? "s" : ""}
                  {accepted > 0 ? ` · ${accepted} acceptée${accepted > 1 ? "s" : ""}` : ""}
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

            <div className="scrollbar-none flex-1 overflow-y-auto p-4">
              {candidates.length === 0 ? (
                <div className="mt-16 text-center">
                  <p className="text-[13px] font-semibold text-[#0B0B0F]">
                    Aucune candidature pour le moment
                  </p>
                  <p className="mt-1 text-[11.5px] text-[#8A8D93]">
                    Les profs répondent en général sous 2 h.
                  </p>
                </div>
              ) : (
                <ul className="flex flex-col gap-2.5">
                  {candidates.map((c, i) => {
                    const key = c.id ?? `${c.name}-${i}`;
                    const s = status[key];
                    return (
                      <li
                        key={key}
                        className={cn(
                          "rounded-[16px] border p-3.5 transition-colors",
                          s === "accepted"
                            ? "border-[#0B0B0F] bg-[#0B0B0F]/[0.03]"
                            : s === "declined"
                              ? "border-[#EFEFF1] bg-[#FAFAFB] opacity-60"
                              : "border-[#EFEFF1] bg-white",
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <Avatar initials={c.initials} tone="neutral" size={40} />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-baseline justify-between gap-2">
                              <p className="truncate text-[13px] font-semibold text-[#0B0B0F]">
                                {c.name}
                              </p>
                              <p className="shrink-0 text-[12px] font-bold text-[#0B0B0F] tabular-nums">
                                {c.price}{" "}
                                <span className="text-[9.5px] font-medium text-[#8A8D93]">
                                  MAD/h
                                </span>
                              </p>
                            </div>
                            <div className="mt-0.5 flex items-center gap-1.5">
                              <Star
                                className="h-3 w-3 fill-[#0B0B0F] text-[#0B0B0F]"
                                strokeWidth={0}
                              />
                              <span className="text-[11px] font-semibold tabular-nums text-[#0B0B0F]">
                                {c.rating.toFixed(1)}
                              </span>
                              <span className="text-[11px] text-[#8A8D93]">
                                · {c.subject}
                              </span>
                            </div>
                            {c.message ? (
                              <p className="mt-2 line-clamp-3 text-[11.5px] leading-relaxed text-[#4A4D54]">
                                {c.message}
                              </p>
                            ) : null}
                          </div>
                        </div>

                        <div className="mt-3 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              setStatus((prev) => ({ ...prev, [key]: "accepted" }))
                            }
                            disabled={s === "declined"}
                            className={cn(
                              "flex flex-1 items-center justify-center gap-1.5 rounded-full py-2 text-[11.5px] font-semibold transition-colors",
                              s === "accepted"
                                ? "bg-[#DFFF3F] text-[#0B0B0F]"
                                : "bg-[#0B0B0F] text-white hover:bg-[#1a1b21] disabled:cursor-not-allowed disabled:opacity-40",
                            )}
                          >
                            {s === "accepted" ? (
                              <>
                                <Check className="h-3 w-3" strokeWidth={2.5} />
                                Accepté
                              </>
                            ) : (
                              "Accepter"
                            )}
                          </button>
                          <button
                            type="button"
                            aria-label={`Envoyer un message à ${c.name}`}
                            className="grid h-8 w-8 place-items-center rounded-full border border-[#EFEFF1] text-[#0B0B0F] transition-colors hover:bg-[#F5F5F7]"
                          >
                            <MessageSquare className="h-3.5 w-3.5" strokeWidth={1.75} />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setStatus((prev) => ({ ...prev, [key]: "declined" }))
                            }
                            disabled={s === "accepted"}
                            className="rounded-full border border-[#EFEFF1] px-3 py-2 text-[11.5px] font-semibold text-[#8A8D93] transition-colors hover:text-[#0B0B0F] disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            {s === "declined" ? "Refusé" : "Refuser"}
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </motion.aside>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
