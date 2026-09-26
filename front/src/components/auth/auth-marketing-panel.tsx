"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion, AnimatePresence } from "motion/react";
import { springSoft } from "@/lib/motion";

// MOCK: replace when API lands
const QUOTES = [
  {
    quote:
      "En 3 séances, ma prof m'a débloqué sur les intégrales. Note passée de 8 à 15.",
    author: "Salma, Terminale S",
  },
  {
    quote:
      "Je choisis mes horaires, mes élèves, mes tarifs. darso me laisse enseigner comme je veux.",
    author: "Yassine, prof de maths",
  },
  {
    quote:
      "Enfin une plateforme qui prend au sérieux la préparation au Bac.",
    author: "Ines, 1ère spécialité maths",
  },
];

export function AuthMarketingPanel() {
  const [idx, setIdx] = useState(0);
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    if (prefersReduced) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % QUOTES.length), 6000);
    return () => clearInterval(t);
  }, [prefersReduced]);

  const current = QUOTES[idx];

  return (
    <div className="relative h-full min-h-dvh overflow-hidden bg-[#DFFF3F] p-8 xl:p-10">
      <div className="absolute inset-4 rounded-[28px] bg-gradient-to-br from-[#DFFF3F] via-[#DFFF3F] to-[#C4E029]" />

      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 -top-20 h-[420px] w-[420px] rounded-full bg-white/25 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-32 -left-24 h-[360px] w-[360px] rounded-full bg-[#0B0B0F]/10 blur-3xl"
      />

      <div className="relative flex h-full min-h-dvh flex-col justify-between">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-6 items-center gap-1.5 rounded-full bg-[#0B0B0F] px-2.5 text-[10px] font-semibold uppercase tracking-[0.09em] text-[#DFFF3F]">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#DFFF3F]" />
            En direct
          </span>
          <span className="text-[10.5px] font-semibold uppercase tracking-[0.09em] text-[#0B0B0F]/70">
            + 2 314 séances ce mois
          </span>
        </div>

        <div className="max-w-[520px]">
          <p
            className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[#0B0B0F]/60"
          >
            Cours particuliers · Maroc
          </p>
          <h2
            className="mt-4 text-[42px] font-extrabold leading-[0.98] tracking-[-0.035em] text-[#0B0B0F] xl:text-[54px]"
            style={{ fontFamily: "var(--font-cabinet), system-ui, sans-serif" }}
          >
            Le prof.
            <br />
            La séance.
            <br />
            <span className="relative inline-block">
              Le déclic.
              <span
                aria-hidden
                className="absolute -bottom-1 left-0 h-[10px] w-full rounded-full bg-[#0B0B0F]/15"
              />
            </span>
          </h2>
          <p className="mt-6 max-w-[440px] text-[13.5px] leading-relaxed text-[#0B0B0F]/75">
            Trouvez le prof qui correspond à votre matière, votre niveau, votre budget —
            et rejoignez la séance en un clic depuis n'importe où.
          </p>
        </div>

        <figure className="relative">
          <svg
            aria-hidden
            className="mb-3 h-6 w-6 text-[#0B0B0F]"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M7.2 6h3.6L9 12h2.7v6H6V12l1.2-6zm9 0h3.6L18 12h2.7v6H15V12l1.2-6z" />
          </svg>
          <AnimatePresence mode="wait">
            <motion.blockquote
              key={current.quote}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={prefersReduced ? { duration: 0 } : springSoft}
              className="max-w-[500px] text-[15.5px] font-medium leading-relaxed text-[#0B0B0F]"
              style={{ fontFamily: "var(--font-cabinet), system-ui, sans-serif" }}
            >
              &ldquo;{current.quote}&rdquo;
              <footer className="mt-3 text-[11px] font-semibold uppercase tracking-[0.09em] text-[#0B0B0F]/60">
                — {current.author}
              </footer>
            </motion.blockquote>
          </AnimatePresence>

          <div className="mt-6 flex items-center gap-1.5">
            {QUOTES.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setIdx(i)}
                aria-label={`Témoignage ${i + 1}`}
                className={
                  "h-1.5 rounded-full transition-all " +
                  (i === idx
                    ? "w-6 bg-[#0B0B0F]"
                    : "w-1.5 bg-[#0B0B0F]/25 hover:bg-[#0B0B0F]/45")
                }
              />
            ))}
          </div>
        </figure>
      </div>
    </div>
  );
}
