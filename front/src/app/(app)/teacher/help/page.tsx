"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Flag,
  HeadphonesIcon,
  Search,
} from "lucide-react";
import { AppShell } from "@/components/app/app-shell";
import { PageHeader } from "@/components/app/page-header";
import { SectionHeader } from "@/components/app/section-header";
import { Eyebrow } from "@/components/app/eyebrow";
import { Pill } from "@/components/app/pill";
import { GooeyInput } from "@/components/library/gooey-input";
import { Accordion, type AccordionItemData } from "@/components/library/accordion";
import { teacherMobileTabs, teacherNav } from "@/lib/nav";
import { mockTeacher } from "@/lib/mock/teacher";
import {
  teacherFaqCategories,
  teacherFaqItems,
  type TeacherFaqCategory,
} from "@/lib/mock/teacher-help";
import { cn } from "@/lib/utils";

/* ---------------- Page ---------------- */

export default function TeacherHelpPage() {
  const [query, setQuery] = useState("");
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  const itemsByCategory = useMemo(() => {
    const map: Record<string, AccordionItemData[]> = {};
    for (const cat of teacherFaqCategories) map[cat.id] = [];
    for (const item of teacherFaqItems) {
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
      nav={teacherNav}
      mobileTabs={teacherMobileTabs}
      user={{
        fullName: mockTeacher.fullName,
        level: mockTeacher.level,
        initials: mockTeacher.initials,
      }}
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
            <span>Support prof</span>
            <span className="h-1 w-1 rounded-full bg-[#D5D7DB]" />
            <span className="font-medium text-[#0B0B0F]">Réponse moyenne : 3 h</span>
          </>
        }
        title="Aide & support"
        subline="Réponses aux questions les plus fréquentes des profs darso."
      />

      <div className="mt-7">
        <HelpSearchBar value={query} onChange={onQueryChange} />
      </div>

      <div className="mt-8">
        <SectionHeader
          title="Parcourir par catégorie"
          subtitle="4 thèmes couvrent l'essentiel de la vie d'un prof sur darso."
        />
        <div className="mt-3.5 grid grid-cols-2 gap-3 min-[1200px]:grid-cols-4">
          {teacherFaqCategories.map((cat) => (
            <CategoryCard key={cat.id} category={cat} onClick={() => onCategoryClick(cat.id)} />
          ))}
        </div>
      </div>

      <div className="mt-9 space-y-7">
        {teacherFaqCategories.map((cat) => (
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
        <Eyebrow className="mt-4">Support prof dédié</Eyebrow>
        <h3 className="mt-1.5 font-[family-name:var(--font-cabinet)] text-[19px] font-bold leading-tight tracking-tight text-[#0B0B0F]">
          Une équipe pour les profs
        </h3>
        <p className="mt-1.5 text-[12px] leading-relaxed text-[#6E7178]">
          Réponse sous 3 h en moyenne, du lundi au samedi de 8h à 22h. Priorité
          aux profs vérifiés.
        </p>

        <Link
          href="/teacher/help/contact"
          className="mt-4 flex h-10 items-center justify-center gap-1.5 rounded-full bg-[#DFFF3F] text-[12.5px] font-semibold text-[#0B0B0F] transition-[filter] hover:brightness-[0.97]"
        >
          Contacter le support
          <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2.25} />
        </Link>
        <Link
          href="/teacher/help/dispute"
          className="mt-2 flex h-10 items-center justify-center gap-1.5 rounded-full border border-[#EFEFF1] bg-white text-[12.5px] font-semibold text-[#0B0B0F] transition-colors hover:bg-[#F5F5F7]"
        >
          <Flag className="h-3.5 w-3.5" strokeWidth={2} />
          Ouvrir un litige
        </Link>

        <p className="mt-4 text-[10.5px] text-[#8A8D93]">
          Réponse moyenne : 3 h · Lun–Sam 8h–22h
        </p>
      </div>

      <div className="rounded-[20px] border border-[#EFEFF1] bg-white p-4">
        <Eyebrow>Astuce</Eyebrow>
        <p className="mt-1.5 text-[12px] leading-snug text-[#6E7178]">
          Tape « payout », « CNSS » ou « badge » dans la recherche pour aller
          droit au but.
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
          {teacherFaqCategories.map((cat) => (
            <CategoryCard key={cat.id} category={cat} onClick={() => onCategoryClick(cat.id)} />
          ))}
        </div>
      </div>

      <div className="mt-6 space-y-5">
        {teacherFaqCategories.map((cat) => (
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
            Support prof dédié
          </h3>
          <p className="mt-1.5 text-[12px] leading-relaxed text-[#6E7178]">
            Réponse sous 3 h en moyenne — priorité aux profs vérifiés.
          </p>
          <div className="mt-4 space-y-2">
            <Link
              href="/teacher/help/contact"
              className="flex h-11 items-center justify-center gap-1.5 rounded-full bg-[#DFFF3F] text-[13px] font-semibold text-[#0B0B0F]"
            >
              Contacter le support
              <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2.25} />
            </Link>
            <Link
              href="/teacher/help/dispute"
              className="flex h-11 items-center justify-center gap-1.5 rounded-full border border-[#EFEFF1] bg-white text-[13px] font-semibold text-[#0B0B0F]"
            >
              <Flag className="h-3.5 w-3.5" strokeWidth={2} />
              Ouvrir un litige
            </Link>
          </div>
          <p className="mt-4 text-[10.5px] text-[#8A8D93]">
            Réponse moyenne : 3 h · Lun–Sam 8h–22h
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
  category: TeacherFaqCategory;
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
