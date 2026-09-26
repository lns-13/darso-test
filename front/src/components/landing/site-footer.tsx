"use client";

import Link from "next/link";
import { useState } from "react";
import { Globe } from "lucide-react";

import { Logo } from "@/components/brand/logo";
import { SmoothInput } from "@/components/library/smooth-input";
import { StatefulButton } from "@/components/library/stateful-button";

type FooterLink = { label: string; href: string };

const STUDENT_LINKS: FooterLink[] = [
  { label: "Accueil élève", href: "/student" },
  { label: "Découvrir des profs", href: "/student/discover" },
  { label: "Mes séances", href: "/student/sessions" },
  { label: "Favoris", href: "/student/favorites" },
  { label: "Paiements", href: "/student/payments" },
  { label: "Messages", href: "/student/messages" },
];

const TEACHER_LINKS: FooterLink[] = [
  { label: "Tableau de bord", href: "/teacher" },
  { label: "Découvrir", href: "/teacher/discover" },
  { label: "Séances", href: "/teacher/sessions" },
  { label: "Revenus", href: "/teacher/earnings" },
  { label: "Vérification", href: "/teacher/verification" },
  { label: "Agence", href: "/teacher/agency" },
];

const SUPPORT_LINKS: FooterLink[] = [
  { label: "Centre d'aide", href: "/student/help" },
  { label: "Contact", href: "/contact" },
  { label: "Conditions", href: "/legal/terms" },
  { label: "Confidentialité", href: "/legal/privacy" },
  { label: "Cookies", href: "/legal/cookies" },
  { label: "Mentions légales", href: "/legal/imprint" },
];

export function SiteFooter() {
  const [email, setEmail] = useState("");

  return (
    <footer className="bg-[#0B0B0F] text-white">
      <div className="container-wide py-14 md:py-20">
        {/* top: brand + link groups */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-12 md:gap-x-8">
          {/* brand column */}
          <div className="col-span-2 md:col-span-5">
            <div className="inline-block rounded-md bg-white px-2 py-1">
              <Logo />
            </div>
            <p className="mt-4 max-w-[320px] text-[13.5px] leading-relaxed text-white/60">
              La plateforme qui relie élèves et profs vérifiés. Réservez, apprenez, progressez — sans engagement.
            </p>

            <form
              onSubmit={(e) => e.preventDefault()}
              className="mt-6 max-w-[340px]"
              aria-label="Inscription à la newsletter"
            >
              <label
                htmlFor="footer-newsletter"
                className="mb-2 block text-[11.5px] font-semibold uppercase tracking-[0.14em] text-white/60"
              >
                Newsletter mensuelle
              </label>
              <div className="flex items-center gap-2 rounded-full border border-white/15 bg-white/5 pl-4 pr-1.5 py-1.5 text-white transition-colors focus-within:border-white/40">
                <SmoothInput
                  id="footer-newsletter"
                  type="text"
                  placeholder="votre@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="text-[13px] placeholder:text-white/35"
                  wrapperClassName="flex-1"
                  caretClassName="bg-white"
                />
                <StatefulButton
                  type="submit"
                  className="min-w-[84px] px-3 py-1.5 text-[11.5px]"
                >
                  Envoyer
                </StatefulButton>
              </div>
            </form>
          </div>

          <FooterColumn title="Élèves" links={STUDENT_LINKS} />
          <FooterColumn title="Profs" links={TEACHER_LINKS} />
          <FooterColumn title="Support" links={SUPPORT_LINKS} />
        </div>

        {/* bottom row */}
        <div className="mt-12 flex flex-col-reverse items-start gap-4 border-t border-white/10 pt-6 md:mt-16 md:flex-row md:items-center md:justify-between md:gap-6">
          <p className="text-[12px] text-white/50">
            &copy; 2026 darso. Tous droits réservés.
          </p>
          <div className="flex items-center gap-5">
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[12px] font-medium text-white/70 transition-colors hover:border-white/30 hover:text-white"
              aria-label="Changer la langue"
            >
              <Globe className="h-3.5 w-3.5" strokeWidth={1.8} />
              FR
            </button>
            <div className="flex items-center gap-3 text-white/50">
              <SocialLink href="https://instagram.com/darso" label="Instagram">
                <InstagramGlyph />
              </SocialLink>
              <SocialLink href="https://twitter.com/darso" label="Twitter / X">
                <XGlyph />
              </SocialLink>
              <SocialLink href="https://linkedin.com/company/darso" label="LinkedIn">
                <LinkedInGlyph />
              </SocialLink>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, links }: { title: string; links: FooterLink[] }) {
  return (
    <nav
      aria-label={title}
      className="col-span-1 md:col-span-2 lg:col-span-2 md:col-start-auto md:[&:nth-of-type(2)]:col-start-7"
    >
      <h3 className="text-[11.5px] font-semibold uppercase tracking-[0.14em] text-white/50">
        {title}
      </h3>
      <ul className="mt-4 space-y-2.5">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="text-[13px] leading-tight text-white/80 transition-colors hover:text-[#DFFF3F]"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function SocialLink({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      aria-label={label}
      target="_blank"
      rel="noopener noreferrer"
      className="grid h-8 w-8 place-items-center rounded-full border border-white/10 transition-colors hover:border-white/30 hover:text-white"
    >
      {children}
    </a>
  );
}

/* --- inline brand glyphs (lucide 1.x dropped Instagram/Twitter/LinkedIn) --- */

function InstagramGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

function XGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-3.5 w-3.5"
      fill="currentColor"
      aria-hidden
    >
      <path d="M17.9 3H21l-6.7 7.66L22 21h-6.19l-4.85-6.34L5.4 21H2.3l7.16-8.19L2 3h6.34l4.38 5.79L17.9 3Zm-1.08 16h1.71L7.28 4.9H5.44L16.82 19Z" />
    </svg>
  );
}

function LinkedInGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
      <path d="M4.98 3.5A2.5 2.5 0 1 1 5 8.5a2.5 2.5 0 0 1-.02-5ZM3 9.5h4V21H3V9.5Zm7 0h3.8v1.57h.05c.53-.96 1.83-1.97 3.77-1.97 4.03 0 4.78 2.51 4.78 5.78V21h-4v-5.4c0-1.29-.03-2.94-1.85-2.94-1.86 0-2.14 1.4-2.14 2.85V21h-4V9.5Z" />
    </svg>
  );
}
