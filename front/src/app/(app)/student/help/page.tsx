"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  CalendarCheck2,
  CreditCard,
  Flag,
  HeadphonesIcon,
  Search,
  ShieldCheck,
  UserCog,
  type LucideIcon,
} from "lucide-react";
import { AppShell } from "@/components/app/app-shell";
import { PageHeader } from "@/components/app/page-header";
import { SectionHeader } from "@/components/app/section-header";
import { Eyebrow } from "@/components/app/eyebrow";
import { Pill } from "@/components/app/pill";
import { GooeyInput } from "@/components/library/gooey-input";
import { Accordion, type AccordionItemData } from "@/components/library/accordion";
import { studentMobileTabs, studentNav } from "@/lib/nav";
import { cn } from "@/lib/utils";

/* ---------------- MOCK: replace when API lands ---------------- */

const student = {
  firstName: "Sara",
  fullName: "Sara Bencheikh",
  level: "Terminale S · Lycée Descartes",
  initials: "SB",
};

type FaqCategory = {
  id: string;
  label: string;
  count: number;
  icon: LucideIcon;
  blurb: string;
};

const faqCategories: FaqCategory[] = [
  {
    id: "sessions",
    label: "Séances",
    count: 4,
    icon: CalendarCheck2,
    blurb: "Réserver, annuler, replays.",
  },
  {
    id: "payments",
    label: "Paiements",
    count: 4,
    icon: CreditCard,
    blurb: "Factures, remboursements, moyens de paiement.",
  },
  {
    id: "account",
    label: "Compte",
    count: 3,
    icon: UserCog,
    blurb: "Profil, notifications, préférences.",
  },
  {
    id: "security",
    label: "Sécurité",
    count: 4,
    icon: ShieldCheck,
    blurb: "Mots de passe, litiges, données personnelles.",
  },
];

const faqItems: (AccordionItemData & { categoryId: string })[] = [
  // Séances
  {
    id: "s1",
    categoryId: "sessions",
    question: "Comment réserver une séance avec un prof ?",
    answer:
      "Depuis la page Découvrir, choisis un prof, puis clique sur « Réserver ». Sélectionne un créneau proposé ou demande un horaire personnalisé. Le prof confirme sous 24 h et la séance apparaît dans « Mes séances ».",
  },
  {
    id: "s2",
    categoryId: "sessions",
    question: "Puis-je annuler ou reporter une séance ?",
    answer:
      "Oui, tu peux annuler gratuitement jusqu'à 12 h avant la séance depuis « Mes séances ». Au-delà, 50% du tarif est retenu pour indemniser le prof. Un report gratuit reste possible jusqu'à 2 h avant, si le prof accepte le nouveau créneau.",
  },
  {
    id: "s3",
    categoryId: "sessions",
    question: "Où retrouver l'enregistrement d'une séance en visio ?",
    answer:
      "Si ton prof a activé l'enregistrement, le replay est disponible pendant 30 jours dans le détail de la séance, onglet « Ressources ». Tu peux aussi télécharger la transcription automatique et les notes partagées.",
  },
  {
    id: "s4",
    categoryId: "sessions",
    question: "Le prof ne s'est pas connecté, que faire ?",
    answer:
      "Attends 10 minutes après l'heure prévue puis clique sur « Signaler une absence » dans la séance. Nous remboursons intégralement sous 48 h et l'incident est enregistré sur le profil du prof.",
  },

  // Paiements
  {
    id: "p1",
    categoryId: "payments",
    question: "Quels moyens de paiement acceptez-vous ?",
    answer:
      "Cartes bancaires (Visa, Mastercard, CIH), virement instantané, et le portefeuille darso rechargeable. Apple Pay et Google Pay arrivent début 2027.",
  },
  {
    id: "p2",
    categoryId: "payments",
    question: "Comment obtenir la facture d'une séance ?",
    answer:
      "Va dans Paiements → onglet « Factures », clique sur la transaction concernée, puis « Télécharger PDF ». Les factures sont générées automatiquement 24 h après la séance.",
  },
  {
    id: "p3",
    categoryId: "payments",
    question: "Sous combien de temps suis-je remboursé après annulation ?",
    answer:
      "Les remboursements sont initiés dès validation de l'annulation. Compte 2 à 5 jours ouvrés selon ta banque pour voir le crédit sur ton compte. Le remboursement sur le portefeuille darso est instantané.",
  },
  {
    id: "p4",
    categoryId: "payments",
    question: "Puis-je payer plusieurs séances en une seule fois ?",
    answer:
      "Oui, les packs de 5, 10 ou 20 séances bénéficient d'une remise jusqu'à 15%. Ils sont proposés directement sur la fiche du prof, onglet « Packs ».",
  },

  // Compte
  {
    id: "a1",
    categoryId: "account",
    question: "Comment modifier mon niveau scolaire ?",
    answer:
      "Rends-toi dans Profil → « Informations scolaires », clique sur « Modifier » et choisis ton nouveau niveau. Les recommandations de profs s'ajustent automatiquement à ta rentrée.",
  },
  {
    id: "a2",
    categoryId: "account",
    question: "Comment désactiver les notifications push ?",
    answer:
      "Va dans Notifications → « Préférences », puis désactive les catégories qui ne t'intéressent pas. Tu peux aussi couper toutes les notifications pendant tes heures de sommeil via le mode silencieux.",
  },
  {
    id: "a3",
    categoryId: "account",
    question: "Puis-je supprimer définitivement mon compte ?",
    answer:
      "Oui, depuis Profil → « Confidentialité » → « Supprimer mon compte ». La suppression est irréversible sous 30 jours et efface l'ensemble de tes données, à l'exception des factures que la loi nous oblige à conserver 10 ans.",
  },

  // Sécurité
  {
    id: "sec1",
    categoryId: "security",
    question: "J'ai oublié mon mot de passe, que faire ?",
    answer:
      "Depuis la page de connexion, clique sur « Mot de passe oublié ». Tu reçois un lien de réinitialisation par email valable 30 minutes. Si tu ne le reçois pas, vérifie tes spams ou contacte le support.",
  },
  {
    id: "sec2",
    categoryId: "security",
    question: "Comment activer la double authentification ?",
    answer:
      "Va dans Profil → « Sécurité » → « Authentification à deux facteurs ». Tu peux choisir SMS, email, ou une application (Google Authenticator, Authy). Nous recommandons fortement l'application pour plus de sécurité.",
  },
  {
    id: "sec3",
    categoryId: "security",
    question: "Comment ouvrir un litige contre un prof ?",
    answer:
      "Depuis « Aide », clique sur « Ouvrir un litige » et suis les 3 étapes. Tu sélectionnes la séance, décris le problème et joins des pièces justificatives. Notre équipe répond sous 4 h ouvrées.",
  },
  {
    id: "sec4",
    categoryId: "security",
    question: "Que devient ma carte bancaire enregistrée ?",
    answer:
      "Tes cartes sont chiffrées par notre prestataire PCI-DSS niveau 1 (Stripe). darso ne stocke jamais ton numéro complet. Tu peux supprimer une carte à tout moment depuis Paiements → « Moyens de paiement ».",
  },
];

/* ---------------- Page ---------------- */

export default function StudentHelpPage() {
  const [query, setQuery] = useState("");
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  const itemsByCategory = useMemo(() => {
    const map: Record<string, AccordionItemData[]> = {};
    for (const cat of faqCategories) map[cat.id] = [];
    for (const item of faqItems) {
      map[item.categoryId]?.push({
        id: item.id,
        question: item.question,
        answer: item.answer,
      });
    }
    return map;
  }, []);

  const scrollTo = (id: string) => {
    const el = sectionRefs.current[id];
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const setSectionRef = (id: string) => (el: HTMLElement | null) => {
    sectionRefs.current[id] = el;
  };

  const desktop = (
    <DesktopMain
      query={query}
      onQueryChange={setQuery}
      itemsByCategory={itemsByCategory}
      onCategoryClick={scrollTo}
      setSectionRef={setSectionRef}
    />
  );

  const mobile = (
    <MobileBody
      query={query}
      onQueryChange={setQuery}
      itemsByCategory={itemsByCategory}
      onCategoryClick={scrollTo}
      setSectionRef={setSectionRef}
    />
  );

  const rail = <DesktopRail />;

  return (
    <AppShell
      nav={studentNav}
      mobileTabs={studentMobileTabs}
      user={student}
      desktopMain={desktop}
      rail={rail}
      mobileHeader={{
        title: "Aide",
        subtitle: "Trouve une réponse ou contacte-nous",
      }}
      mobileChildren={mobile}
    />
  );
}

/* ================================================================
   DESKTOP
   ================================================================ */

function DesktopMain({
  query,
  onQueryChange,
  itemsByCategory,
  onCategoryClick,
  setSectionRef,
}: {
  query: string;
  onQueryChange: (v: string) => void;
  itemsByCategory: Record<string, AccordionItemData[]>;
  onCategoryClick: (id: string) => void;
  setSectionRef: (id: string) => (el: HTMLElement | null) => void;
}) {
  return (
    <div className="p-6">
      <PageHeader
        eyebrow={
          <>
            <span>Support</span>
            <span className="h-1 w-1 rounded-full bg-[#D5D7DB]" />
            <span className="font-medium text-[#0B0B0F]">Réponse moyenne : 4 h</span>
          </>
        }
        title="Aide & support"
        subline="Trouve une réponse ou contacte-nous."
      />

      <div className="mt-7">
        <HelpSearchBar value={query} onChange={onQueryChange} />
      </div>

      <div className="mt-8">
        <SectionHeader
          title="Parcourir par catégorie"
          subtitle="4 grands thèmes couvrent 95% des questions."
        />
        <div className="mt-3.5 grid grid-cols-2 gap-3 min-[1200px]:grid-cols-4">
          {faqCategories.map((cat) => (
            <CategoryCard key={cat.id} category={cat} onClick={() => onCategoryClick(cat.id)} />
          ))}
        </div>
      </div>

      <div className="mt-9 space-y-7">
        {faqCategories.map((cat) => (
          <section key={cat.id} ref={setSectionRef(cat.id)} id={`faq-${cat.id}`}>
            <SectionHeader
              title={cat.label}
              subtitle={cat.blurb}
              action={
                <Pill tone="neutral">{itemsByCategory[cat.id]?.length ?? 0} articles</Pill>
              }
            />
            <div className="mt-3">
              <Accordion
                items={itemsByCategory[cat.id] ?? []}
                query={query}
                emptyLabel={`Aucun article dans « ${cat.label} » ne correspond.`}
              />
            </div>
          </section>
        ))}
      </div>

      <div className="h-6" />
    </div>
  );
}

function DesktopRail() {
  return (
    <div className="sticky top-0 flex flex-col gap-2.5">
      <div className="relative overflow-hidden rounded-[20px] bg-white p-5 shadow-[0_1px_2px_rgba(10,11,20,0.04)]">
        <div className="grid h-10 w-10 place-items-center rounded-full bg-[#F5F5F7] text-[#0B0B0F]">
          <HeadphonesIcon className="h-5 w-5" strokeWidth={1.75} />
        </div>
        <Eyebrow className="mt-4">Support humain</Eyebrow>
        <h3 className="mt-1.5 font-[family-name:var(--font-cabinet)] text-[19px] font-bold leading-tight tracking-tight text-[#0B0B0F]">
          Besoin d'aide humaine ?
        </h3>
        <p className="mt-1.5 text-[12px] leading-relaxed text-[#6E7178]">
          Notre équipe support répond sous 4 h en moyenne, du lundi au samedi de
          8h à 22h.
        </p>

        <Link
          href="/student/help/contact"
          className="mt-4 flex h-10 items-center justify-center gap-1.5 rounded-full bg-[#DFFF3F] text-[12.5px] font-semibold text-[#0B0B0F] transition-[filter] hover:brightness-[0.97]"
        >
          Contacter le support
          <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2.25} />
        </Link>
        <Link
          href="/student/help/dispute"
          className="mt-2 flex h-10 items-center justify-center gap-1.5 rounded-full border border-[#EFEFF1] bg-white text-[12.5px] font-semibold text-[#0B0B0F] transition-colors hover:bg-[#F5F5F7]"
        >
          <Flag className="h-3.5 w-3.5" strokeWidth={2} />
          Ouvrir un litige
        </Link>

        <p className="mt-4 text-[10.5px] text-[#8A8D93]">
          Réponse moyenne : 4 h · Lun–Sam 8h–22h
        </p>
      </div>

      <div className="rounded-[20px] border border-[#EFEFF1] bg-white p-4">
        <Eyebrow>Astuce</Eyebrow>
        <p className="mt-1.5 text-[12px] leading-snug text-[#6E7178]">
          Tape un mot-clé dans la barre de recherche pour filtrer instantanément
          toutes les FAQ.
        </p>
      </div>
    </div>
  );
}

/* ================================================================
   MOBILE
   ================================================================ */

function MobileBody({
  query,
  onQueryChange,
  itemsByCategory,
  onCategoryClick,
  setSectionRef,
}: {
  query: string;
  onQueryChange: (v: string) => void;
  itemsByCategory: Record<string, AccordionItemData[]>;
  onCategoryClick: (id: string) => void;
  setSectionRef: (id: string) => (el: HTMLElement | null) => void;
}) {
  return (
    <div className="px-4">
      <div className="mt-2">
        <HelpSearchBar value={query} onChange={onQueryChange} />
      </div>

      <div className="mt-5">
        <SectionHeader title="Catégories" subtitle="Toque une catégorie pour y aller." />
        <div className="mt-3 grid grid-cols-2 gap-2.5">
          {faqCategories.map((cat) => (
            <CategoryCard key={cat.id} category={cat} onClick={() => onCategoryClick(cat.id)} />
          ))}
        </div>
      </div>

      <div className="mt-6 space-y-5">
        {faqCategories.map((cat) => (
          <section key={cat.id} ref={setSectionRef(cat.id)} id={`faq-${cat.id}`}>
            <SectionHeader
              title={cat.label}
              action={
                <Pill tone="neutral">{itemsByCategory[cat.id]?.length ?? 0} articles</Pill>
              }
            />
            <div className="mt-3">
              <Accordion
                items={itemsByCategory[cat.id] ?? []}
                query={query}
                emptyLabel="Aucun résultat."
              />
            </div>
          </section>
        ))}
      </div>

      <div className="mt-6 overflow-hidden rounded-[20px] bg-white shadow-[0_1px_2px_rgba(10,11,20,0.04)]">
        <div className="p-5">
          <div className="grid h-10 w-10 place-items-center rounded-full bg-[#F5F5F7] text-[#0B0B0F]">
            <HeadphonesIcon className="h-5 w-5" strokeWidth={1.75} />
          </div>
          <h3 className="mt-3 font-[family-name:var(--font-cabinet)] text-[18px] font-bold leading-tight tracking-tight text-[#0B0B0F]">
            Besoin d'aide humaine ?
          </h3>
          <p className="mt-1.5 text-[12px] leading-relaxed text-[#6E7178]">
            Notre équipe répond sous 4 h en moyenne.
          </p>
          <div className="mt-4 space-y-2">
            <Link
              href="/student/help/contact"
              className="flex h-11 items-center justify-center gap-1.5 rounded-full bg-[#DFFF3F] text-[13px] font-semibold text-[#0B0B0F]"
            >
              Contacter le support
              <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2.25} />
            </Link>
            <Link
              href="/student/help/dispute"
              className="flex h-11 items-center justify-center gap-1.5 rounded-full border border-[#EFEFF1] bg-white text-[13px] font-semibold text-[#0B0B0F]"
            >
              <Flag className="h-3.5 w-3.5" strokeWidth={2} />
              Ouvrir un litige
            </Link>
          </div>
          <p className="mt-4 text-[10.5px] text-[#8A8D93]">
            Réponse moyenne : 4 h · Lun–Sam 8h–22h
          </p>
        </div>
      </div>

      <div className="h-6" />
    </div>
  );
}

/* ================================================================
   PARTIALS
   ================================================================ */

function HelpSearchBar({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="mx-auto flex w-full max-w-[560px] items-center gap-2 rounded-full bg-white pl-3 pr-2 py-1.5 shadow-[0_2px_10px_rgba(10,11,20,0.05)] ring-1 ring-[#EFEFF1]">
      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#F5F5F7] text-[#0B0B0F]">
        <Search className="h-4 w-4" strokeWidth={1.75} />
      </div>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Cherche une question, un mot-clé..."
        className="min-w-0 flex-1 bg-transparent text-[13px] text-[#0B0B0F] placeholder:text-[#8A8D93] focus:outline-none"
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange("")}
          className="rounded-full px-2 py-1 text-[11px] font-medium text-[#8A8D93] transition-colors hover:bg-[#F5F5F7] hover:text-[#0B0B0F]"
        >
          Effacer
        </button>
      ) : null}
      <GooeyInput
        value={value}
        onValueChange={onChange}
        placeholder="Recherche…"
        collapsedWidth={36}
        expandedWidth={200}
      />
    </div>
  );
}

function CategoryCard({
  category,
  onClick,
}: {
  category: FaqCategory;
  onClick: () => void;
}) {
  const Icon = category.icon;
  return (
    <a
      href={`#faq-${category.id}`}
      onClick={(e) => {
        e.preventDefault();
        onClick();
        history.replaceState(null, "", `#faq-${category.id}`);
      }}
      className={cn(
        "group flex flex-col items-start gap-2.5 rounded-[20px] border border-[#EFEFF1] bg-white p-4 text-left transition-colors",
        "hover:bg-[#F5F5F7] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0B0B0F] focus-visible:ring-offset-2",
      )}
    >
      <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#DFFF3F] text-[#0B0B0F]">
        <Icon className="h-5 w-5" strokeWidth={1.75} />
      </div>
      <div className="min-w-0">
        <p className="font-[family-name:var(--font-cabinet)] text-[15px] font-bold leading-tight tracking-tight text-[#0B0B0F]">
          {category.label}
        </p>
        <p className="mt-0.5 truncate text-[11px] text-[#8A8D93]">
          {category.count} articles
        </p>
      </div>
    </a>
  );
}

