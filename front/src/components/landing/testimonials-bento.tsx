"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, useReducedMotion, type MotionValue } from "motion/react";
import { cn } from "@/lib/utils";

type Tone = "white" | "lime" | "ink";

type Testimonial = {
  quote: string;
  author: string;
  role: string;
  tone: Tone;
  span: string;
  /** parallax offset range in px, e.g. [-6, 6]. */
  parallax?: [number, number];
};

// Alternating tones — never same tone in adjacent cells. Big centerpiece at
// index 2 (col-span-3 row-span-2, ink tone).
const TESTIMONIALS: Testimonial[] = [
  {
    quote: "J'ai trouvé mon prof de maths en 10 minutes. Trois séances plus tard, ma moyenne a bondi.",
    author: "Nadia",
    role: "Terminale S · Casablanca",
    tone: "white",
    span: "md:col-span-3 md:row-span-1",
    parallax: [-6, 6],
  },
  {
    quote: "Le paiement à la séance, sans engagement, c'est ce qui m'a convaincue.",
    author: "Yassine",
    role: "Parent · Rabat",
    tone: "lime",
    span: "md:col-span-3 md:row-span-1",
    parallax: [8, -4],
  },
  {
    quote:
      "darso m'a permis de remplir mon agenda en deux semaines. Les élèves arrivent déjà préparés, et la plateforme prend en charge tout ce qui m'ennuyait — planning, paiements, rappels.",
    author: "Karim B.",
    role: "Prof de physique · 6 ans d'expérience",
    tone: "ink",
    span: "md:col-span-3 md:row-span-2",
    parallax: [-10, 10],
  },
  {
    quote: "Je peux enfin choisir mes horaires. Et les rappels automatiques, c'est un vrai gain.",
    author: "Sofia",
    role: "Prof d'anglais",
    tone: "white",
    span: "md:col-span-3 md:row-span-1",
    parallax: [6, -6],
  },
  {
    quote: "Interface propre, profs sérieux, factures claires. Rien à redire.",
    author: "Mehdi",
    role: "Étudiant en prépa",
    tone: "lime",
    span: "md:col-span-2 md:row-span-1",
    parallax: [-4, 8],
  },
  {
    quote: "Réservation en un clic, annulation sans stress. C'est fluide.",
    author: "Amine",
    role: "Bac +2 · Tanger",
    tone: "white",
    span: "md:col-span-4 md:row-span-1",
    parallax: [4, -8],
  },
];

const TONE_STYLES: Record<Tone, string> = {
  white: "bg-white text-[#0B0B0F] border border-[#EFEFF1]",
  lime: "bg-[#DFFF3F] text-[#0B0B0F] border border-transparent",
  ink: "bg-[#0B0B0F] text-white border border-transparent",
};

const QUOTE_COLOR: Record<Tone, string> = {
  white: "text-[#0B0B0F]/10",
  lime: "text-[#0B0B0F]/20",
  ink: "text-white/15",
};

const META_COLOR: Record<Tone, string> = {
  white: "text-[#6E7178]",
  lime: "text-[#0B0B0F]/70",
  ink: "text-white/60",
};

export function TestimonialsBento() {
  const sectionRef = useRef<HTMLElement>(null);
  const prefersReducedMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  return (
    <section
      ref={sectionRef}
      aria-labelledby="testimonials-heading"
      className="bg-[#EDEDEF]"
    >
      <div className="container-wide py-16 md:py-24">
        <header className="mb-8 max-w-[560px] md:mb-12">
          <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#6E7178]">
            Ils en parlent mieux que nous
          </p>
          <h2
            id="testimonials-heading"
            className="mt-2 text-[32px] font-extrabold leading-[1.02] tracking-[-0.035em] text-[#0B0B0F] md:text-[44px]"
            style={{ fontFamily: "var(--font-cabinet), system-ui, sans-serif" }}
          >
            Des élèves qui progressent.
            <br />
            Des profs qui remplissent leur agenda.
          </h2>
        </header>

        {/* mobile: single-column stack */}
        <div className="grid grid-cols-1 gap-3 md:hidden">
          {TESTIMONIALS.map((t, i) => (
            <TestimonialCard key={i} testimonial={t} />
          ))}
        </div>

        {/* desktop: 6-col asymmetric bento */}
        <div className="hidden grid-cols-6 gap-3 md:grid md:auto-rows-[180px]">
          {TESTIMONIALS.map((t, i) => (
            <TestimonialCard
              key={i}
              testimonial={t}
              scrollProgress={prefersReducedMotion ? undefined : scrollYProgress}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function TestimonialCard({
  testimonial,
  scrollProgress,
}: {
  testimonial: Testimonial;
  scrollProgress?: MotionValue<number>;
}) {
  const parallax = testimonial.parallax ?? [0, 0];
  // Always call the hook (rules of hooks); fall back to a dummy MotionValue
  // when scrollProgress isn't provided so mobile still renders.
  const dummy = useScrollProgressFallback();
  const source = scrollProgress ?? dummy;
  const y = useTransform(source, [0, 1], parallax);

  return (
    <motion.article
      style={scrollProgress ? { y } : undefined}
      className={cn(
        "relative flex h-full flex-col justify-between overflow-hidden rounded-[20px] p-5 md:p-6",
        TONE_STYLES[testimonial.tone],
        testimonial.span,
      )}
    >
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute -top-2 -left-1 select-none text-[110px] font-black leading-none md:text-[140px]",
          QUOTE_COLOR[testimonial.tone],
        )}
        style={{ fontFamily: "var(--font-cabinet), system-ui, serif" }}
      >
        &ldquo;
      </span>

      <blockquote className="relative z-10 pt-6 text-[14px] font-medium leading-snug md:text-[15.5px] md:leading-relaxed">
        {testimonial.quote}
      </blockquote>

      <footer className="relative z-10 mt-4 flex items-center gap-2">
        <div>
          <div className="text-[13px] font-semibold leading-tight">
            {testimonial.author}
          </div>
          <div className={cn("text-[11.5px] leading-tight", META_COLOR[testimonial.tone])}>
            {testimonial.role}
          </div>
        </div>
      </footer>
    </motion.article>
  );
}

// Cheap fallback so useTransform always has a source. Window-scoped useScroll
// avoids a dangling target ref that would trip motion's "not hydrated" invariant.
function useScrollProgressFallback() {
  const { scrollYProgress } = useScroll();
  return scrollYProgress;
}
