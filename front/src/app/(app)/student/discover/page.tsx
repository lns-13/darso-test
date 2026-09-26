"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Bookmark, Filter, Search, SlidersHorizontal } from "lucide-react";
import { AppShell } from "@/components/app/app-shell";
import { CourseCard, type CourseCardProps } from "@/components/app/course-card";
import { PageHeader } from "@/components/app/page-header";
import { SectionHeader } from "@/components/app/section-header";
import { EmptyState } from "@/components/app/empty-state";
import { TabSwitcher } from "@/components/app/tab-switcher";
import {
  FilterBar,
  createDefaultFilter,
  filterIsActive,
  type FilterValue,
} from "@/components/app/filter-bar";
import { FilterDrawer } from "@/components/app/filter-drawer";
import { ApplyModal, type ApplyTarget } from "@/components/app/apply-modal";
import { RequestCard, type RequestCardProps } from "@/components/app/request-card";
import { studentMobileTabs, studentNav } from "@/lib/nav";
import { cn } from "@/lib/utils";

/* ---------------- MOCK: replace when API lands ---------------- */

const student = {
  firstName: "Sara",
  fullName: "Sara Bencheikh",
  level: "Terminale S · Lycée Descartes",
  initials: "SB",
};

const SUBJECTS = [
  "Mathématiques",
  "Physique-Chimie",
  "Français",
  "Anglais",
  "SVT",
  "Histoire-Géo",
];
const LEVELS = ["Collège", "Seconde", "Première", "Terminale", "Prépa", "Fac"];
const DAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

const discoverCourses: (CourseCardProps & { level: string; days: string[] })[] = [
  {
    subject: "Mathématiques",
    level: "Terminale",
    days: ["Lun", "Mer", "Jeu"],
    title: "Bac 2026 · Analyse & suites numériques",
    teacher: { name: "Youssef Amrani", initials: "YA" },
    rating: 4.9,
    sessionsGiven: 342,
    price: 220,
    nextSlot: "Ce soir · 20:00",
    tone: "soft-blue",
  },
  {
    subject: "Mathématiques",
    level: "Première",
    days: ["Mar", "Ven"],
    title: "Dérivées & étude de fonctions — première S",
    teacher: { name: "Sofia El Idrissi", initials: "SI" },
    rating: 4.7,
    sessionsGiven: 128,
    price: 160,
    nextSlot: "Demain · 17:00",
    tone: "cream",
  },
  {
    subject: "Physique-Chimie",
    level: "Terminale",
    days: ["Mer", "Sam"],
    title: "Bac · Mécanique du solide & énergétique",
    teacher: { name: "Nadia Cherkaoui", initials: "NC" },
    rating: 4.8,
    sessionsGiven: 182,
    price: 200,
    nextSlot: "Demain · 18:00",
    tone: "cream",
  },
  {
    subject: "Physique-Chimie",
    level: "Prépa",
    days: ["Lun", "Jeu"],
    title: "MPSI · thermodynamique & cinétique chimique",
    teacher: { name: "Rachid Benhaddou", initials: "RB" },
    rating: 5.0,
    sessionsGiven: 89,
    price: 320,
    nextSlot: "Jeu. · 19:00",
    tone: "lime",
  },
  {
    subject: "Français",
    level: "Terminale",
    days: ["Mar", "Jeu", "Sam"],
    title: "DELF B2 · essai argumenté pour la fac",
    teacher: { name: "Marc Dupont", initials: "MD" },
    rating: 5.0,
    sessionsGiven: 96,
    price: 250,
    nextSlot: "Jeu. · 17:30",
    tone: "lime",
  },
  {
    subject: "Français",
    level: "Première",
    days: ["Mer", "Ven"],
    title: "EAF · commentaire composé & dissertation",
    teacher: { name: "Chloé Bernard", initials: "CB" },
    rating: 4.6,
    sessionsGiven: 74,
    price: 140,
    nextSlot: "Ven. · 16:00",
    tone: "cream",
  },
  {
    subject: "Anglais",
    level: "Terminale",
    days: ["Lun", "Mar", "Mer", "Jeu"],
    title: "IELTS 7.0+ · speaking & writing intensif",
    teacher: { name: "Emma Whitfield", initials: "EW" },
    rating: 4.9,
    sessionsGiven: 214,
    price: 260,
    nextSlot: "Ce soir · 21:00",
    tone: "soft-blue",
  },
  {
    subject: "Anglais",
    level: "Collège",
    days: ["Sam", "Dim"],
    title: "Cambridge KET · confiance à l'oral",
    teacher: { name: "Ibrahim Toure", initials: "IT" },
    rating: 4.5,
    sessionsGiven: 62,
    price: 110,
    nextSlot: "Sam. · 10:00",
    tone: "lime",
  },
  {
    subject: "SVT",
    level: "Terminale",
    days: ["Mar", "Jeu"],
    title: "Bac SVT · génétique & évolution accéléré",
    teacher: { name: "Karim El Fassi", initials: "KE" },
    rating: 4.9,
    sessionsGiven: 158,
    price: 180,
    nextSlot: "Mar. · 18:30",
    tone: "cream",
  },
  {
    subject: "SVT",
    level: "Première",
    days: ["Mer", "Sam"],
    title: "Métabolisme cellulaire & photosynthèse",
    teacher: { name: "Leila Bennani", initials: "LB" },
    rating: 4.8,
    sessionsGiven: 92,
    price: 150,
    nextSlot: "Mer. · 17:00",
    tone: "soft-blue",
  },
  {
    subject: "Histoire-Géo",
    level: "Terminale",
    days: ["Ven", "Sam"],
    title: "Grand oral · fiches méthode + entraînement",
    teacher: { name: "Amine Ouazzani", initials: "AO"},
    rating: 4.7,
    sessionsGiven: 47,
    price: 130,
    nextSlot: "Ven. · 19:00",
    tone: "lime",
  },
];

type StudentRequest = Omit<RequestCardProps, "onApply"> & {
  level: string;
  days: string[];
  createdAt: string;
};

const studentRequests: StudentRequest[] = [
  {
    id: "r1",
    author: "Sara B.",
    authorInitials: "SB",
    level: "Terminale",
    subject: "SVT",
    title: "Bac SVT · révision génétique en 2 semaines",
    description:
      "Besoin d'un prof pour revoir génétique, brassage & évolution avant les blancs.",
    tags: ["Génétique", "Bac blanc", "2 semaines", "Visio"],
    budget: 180,
    deadline: "Fin sept.",
    proposalsCount: 5,
    ownPost: true,
    days: ["Lun", "Mer", "Jeu"],
    createdAt: "il y a 2 jours",
  },
  {
    id: "r2",
    author: "Sara B.",
    authorInitials: "SB",
    level: "Terminale",
    subject: "Mathématiques",
    title: "Grand oral maths · préparer le passage en 3 séances",
    description:
      "Sujet choisi. Cherche un prof pour le structurer et bosser l'argumentation.",
    tags: ["Grand oral", "3 séances", "Visio ok"],
    budget: 200,
    deadline: "20 oct.",
    proposalsCount: 2,
    ownPost: true,
    days: ["Sam", "Dim"],
    createdAt: "il y a 5 h",
  },
  {
    id: "r3",
    author: "Yasmine A.",
    authorInitials: "YA",
    level: "Première",
    subject: "Physique-Chimie",
    title: "Aide en spé physique · ondes & mécanique",
    description: "Cours perdu, besoin d'une remise à niveau rapide avant le DS.",
    tags: ["Ondes", "DS dans 2 sem.", "Casa"],
    budget: 150,
    deadline: "15 sept.",
    proposalsCount: 7,
    days: ["Mar", "Jeu"],
    createdAt: "il y a 1 j",
  },
  {
    id: "r4",
    author: "Omar T.",
    authorInitials: "OT",
    level: "Terminale",
    subject: "Français",
    title: "Prépa EAF · dissertation sur Balzac",
    description: "Note bloquée à 8. Cherche un prof pour méthode et corrections.",
    tags: ["EAF", "Dissertation", "Balzac"],
    budget: 170,
    deadline: "Fin oct.",
    proposalsCount: 4,
    days: ["Lun", "Mer"],
    createdAt: "il y a 3 j",
  },
  {
    id: "r5",
    author: "Layla F.",
    authorInitials: "LF",
    level: "Collège",
    subject: "Anglais",
    title: "3ème · préparer le Brevet en anglais",
    description: "Besoin de vocabulaire, grammaire et confiance à l'oral.",
    tags: ["Brevet", "Débutant", "Oral"],
    budget: 90,
    deadline: "Juin",
    proposalsCount: 3,
    days: ["Sam"],
    createdAt: "il y a 2 j",
  },
  {
    id: "r6",
    author: "Anas K.",
    authorInitials: "AK",
    level: "Prépa",
    subject: "Mathématiques",
    title: "MPSI · algèbre linéaire, matrices & espaces vectoriels",
    description: "Prof avec expérience prépa uniquement, tarif négociable.",
    tags: ["MPSI", "Algèbre", "Long terme"],
    budget: 300,
    deadline: "En continu",
    proposalsCount: 9,
    days: ["Mar", "Jeu", "Sam"],
    createdAt: "il y a 6 h",
  },
  {
    id: "r7",
    author: "Nawal Z.",
    authorInitials: "NZ",
    level: "Seconde",
    subject: "SVT",
    title: "Remise à niveau SVT · notions du programme 2nde",
    description: "Reprise après année compliquée. Rythme doux, bienveillance.",
    tags: ["Débutant", "Rythme calme"],
    budget: 100,
    deadline: "Sur 2 mois",
    proposalsCount: 6,
    days: ["Mer", "Sam"],
    createdAt: "il y a 4 j",
  },
  {
    id: "r8",
    author: "Hind M.",
    authorInitials: "HM",
    level: "Terminale",
    subject: "Histoire-Géo",
    title: "Grand oral HGGSP · sujet géopolitique de l'énergie",
    description:
      "Sujet validé. Besoin d'aide sur le plan, sources et présentation orale.",
    tags: ["Grand oral", "HGGSP", "Énergie"],
    budget: 220,
    deadline: "10 oct.",
    proposalsCount: 3,
    days: ["Ven", "Sam", "Dim"],
    createdAt: "il y a 1 j",
  },
];

/* ---------------- Page ---------------- */

export default function StudentDiscoverPage() {
  return (
    <Suspense fallback={null}>
      <DiscoverInner />
    </Suspense>
  );
}

type TabKey = "courses" | "requests";

function DiscoverInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const initialTab: TabKey = searchParams.get("tab") === "requests" ? "requests" : "courses";
  const [tab, setTab] = useState<TabKey>(initialTab);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [applyTarget, setApplyTarget] = useState<ApplyTarget | null>(null);

  const [coursesFilter, setCoursesFilter] = useState<FilterValue>(() =>
    tab === "courses" ? readFilterFromParams(searchParams) : createDefaultFilter(),
  );
  const [requestsFilter, setRequestsFilter] = useState<FilterValue>(() =>
    tab === "requests" ? readFilterFromParams(searchParams) : createDefaultFilter(),
  );

  const activeFilter = tab === "courses" ? coursesFilter : requestsFilter;
  const setActiveFilter = tab === "courses" ? setCoursesFilter : setRequestsFilter;

  const urlWriteTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const writeUrl = useCallback(
    (nextTab: TabKey, nextFilter: FilterValue) => {
      if (urlWriteTimer.current) clearTimeout(urlWriteTimer.current);
      urlWriteTimer.current = setTimeout(() => {
        const p = new URLSearchParams();
        p.set("tab", nextTab);
        if (nextFilter.subject) p.set("subject", nextFilter.subject);
        if (nextFilter.level) p.set("level", nextFilter.level);
        if (nextFilter.priceMin !== 50) p.set("pmin", String(nextFilter.priceMin));
        if (nextFilter.priceMax !== 400) p.set("pmax", String(nextFilter.priceMax));
        if (nextFilter.ratingMin > 0) p.set("rmin", String(nextFilter.ratingMin));
        if (nextFilter.days.length > 0) p.set("days", nextFilter.days.join(","));
        const qs = p.toString();
        router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
      }, 200);
    },
    [pathname, router],
  );

  useEffect(() => {
    writeUrl(tab, activeFilter);
    return () => {
      if (urlWriteTimer.current) clearTimeout(urlWriteTimer.current);
    };
  }, [tab, activeFilter, writeUrl]);

  const patchFilter = useCallback(
    (patch: Partial<FilterValue>) => {
      setActiveFilter((prev) => ({ ...prev, ...patch }));
    },
    [setActiveFilter],
  );

  const resetFilter = useCallback(() => {
    setActiveFilter(createDefaultFilter());
  }, [setActiveFilter]);

  const filteredCourses = useMemo(
    () => filterCourses(discoverCourses, coursesFilter),
    [coursesFilter],
  );
  const filteredRequests = useMemo(
    () => filterRequests(studentRequests, requestsFilter),
    [requestsFilter],
  );

  const openApplyForCourse = (c: CourseCardProps) =>
    setApplyTarget({
      kind: "course",
      title: c.title,
      teacher: c.teacher.name,
      price: c.price,
    });
  const openApplyForRequest = (r: StudentRequest) =>
    setApplyTarget({
      kind: "request",
      title: r.title,
      author: r.author,
      budget: r.budget,
    });

  const desktop = (
    <DesktopMain
      tab={tab}
      onTabChange={setTab}
      filter={activeFilter}
      onPatch={patchFilter}
      onReset={resetFilter}
      courses={filteredCourses}
      requests={filteredRequests}
      countCourses={discoverCourses.length}
      countRequests={studentRequests.length}
      onApplyCourse={openApplyForCourse}
      onApplyRequest={openApplyForRequest}
    />
  );

  const mobile = (
    <MobileBody
      tab={tab}
      onTabChange={setTab}
      onOpenFilters={() => setDrawerOpen(true)}
      filter={activeFilter}
      courses={filteredCourses}
      requests={filteredRequests}
      onApplyCourse={openApplyForCourse}
      onApplyRequest={openApplyForRequest}
    />
  );

  return (
    <>
      <AppShell
        nav={studentNav}
        mobileTabs={studentMobileTabs}
        user={student}
        desktopMain={desktop}
        mobileHeader={{
          title: "Découvrir",
          subtitle: "Trouve ton prochain prof ou réponds à une annonce",
          right: (
            <MobileHeaderActions
              onOpenFilters={() => setDrawerOpen(true)}
              filterActive={filterIsActive(activeFilter)}
            />
          ),
        }}
        mobileChildren={mobile}
      />

      <FilterDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        subjects={SUBJECTS}
        levels={LEVELS}
        days={DAYS}
        value={activeFilter}
        onChange={patchFilter}
        onReset={resetFilter}
        resultCount={tab === "courses" ? filteredCourses.length : filteredRequests.length}
      />

      <ApplyModal
        open={applyTarget !== null}
        onClose={() => setApplyTarget(null)}
        target={applyTarget}
        variant="student"
      />
    </>
  );
}

/* ================================================================
   DESKTOP
   ================================================================ */

function DesktopMain({
  tab,
  onTabChange,
  filter,
  onPatch,
  onReset,
  courses,
  requests,
  countCourses,
  countRequests,
  onApplyCourse,
  onApplyRequest,
}: {
  tab: TabKey;
  onTabChange: (t: TabKey) => void;
  filter: FilterValue;
  onPatch: (patch: Partial<FilterValue>) => void;
  onReset: () => void;
  courses: (CourseCardProps & { level: string; days: string[] })[];
  requests: StudentRequest[];
  countCourses: number;
  countRequests: number;
  onApplyCourse: (c: CourseCardProps) => void;
  onApplyRequest: (r: StudentRequest) => void;
}) {
  return (
    <div className="p-6">
      <PageHeader
        eyebrow={
          <>
            <span>Marketplace</span>
            <span className="h-1 w-1 rounded-full bg-[#D5D7DB]" />
            <span className="font-medium text-[#0B0B0F]">
              {countCourses} profs · {countRequests} annonces
            </span>
          </>
        }
        title="Découvrir"
        subline="Parcours les cours des profs ou réponds aux annonces des élèves — style Upwork."
        actions={
          <Link
            href="/student/favorites"
            className="flex h-9 items-center gap-1.5 rounded-full border border-[#EFEFF1] px-3.5 text-[12px] font-semibold text-[#0B0B0F] transition-colors hover:bg-[#F5F5F7]"
          >
            <Bookmark className="h-3.5 w-3.5" strokeWidth={1.75} />
            Favoris
          </Link>
        }
      />

      <div className="mt-6">
        <TabSwitcher<TabKey>
          tabs={[
            { key: "courses", label: "Cours & profs", count: countCourses },
            { key: "requests", label: "Annonces d'élèves", count: countRequests },
          ]}
          value={tab}
          onChange={onTabChange}
        />
      </div>

      <div className="mt-4 border-b border-[#EFEFF1] pb-4">
        <FilterBar
          subjects={SUBJECTS}
          levels={LEVELS}
          days={DAYS}
          value={filter}
          onChange={onPatch}
          onReset={onReset}
        />
      </div>

      <div className="mt-5 flex items-baseline justify-between">
        <p className="text-[11.5px] text-[#8A8D93]">
          {tab === "courses"
            ? `${courses.length} cours correspondent à ta recherche`
            : `${requests.length} annonces d'élèves`}
        </p>
        {filterIsActive(filter) ? (
          <button
            onClick={onReset}
            className="text-[11.5px] font-medium text-[#8A8D93] hover:text-[#0B0B0F]"
          >
            Effacer les filtres
          </button>
        ) : null}
      </div>

      <div className="mt-3.5 pb-2">
        {tab === "courses" ? (
          courses.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 min-[1200px]:grid-cols-3">
              {courses.map((c) => (
                <CourseCardTile key={c.title} c={c} onApply={onApplyCourse} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Search}
              title="Aucun cours ne correspond"
              body="Élargis tes filtres ou publie une annonce pour recevoir des propositions."
            />
          )
        ) : requests.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 min-[1200px]:grid-cols-3">
            {requests.map((r) => (
              <RequestCard
                key={r.id}
                {...r}
                onApply={() => onApplyRequest(r)}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Search}
            title="Aucune annonce ne correspond"
            body="Essaie une autre matière ou remets les filtres à zéro."
          />
        )}
      </div>
    </div>
  );
}

/* ================================================================
   MOBILE — subject-grouped horizontal strips
   ================================================================ */

function MobileHeaderActions({
  onOpenFilters,
  filterActive,
}: {
  onOpenFilters: () => void;
  filterActive: boolean;
}) {
  return (
    <>
      <button
        aria-label="Recherche"
        onClick={onOpenFilters}
        className="grid h-10 w-10 place-items-center rounded-full bg-white text-[#0B0B0F] shadow-[0_1px_2px_rgba(10,11,20,0.04)]"
      >
        <Search className="h-[17px] w-[17px]" strokeWidth={1.75} />
      </button>
      <button
        onClick={onOpenFilters}
        aria-label="Filtres"
        className="relative grid h-10 w-10 place-items-center rounded-full bg-white text-[#0B0B0F] shadow-[0_1px_2px_rgba(10,11,20,0.04)]"
      >
        <SlidersHorizontal className="h-[17px] w-[17px]" strokeWidth={1.75} />
        {filterActive ? (
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-[#DFFF3F]" />
        ) : null}
      </button>
    </>
  );
}

function MobileBody({
  tab,
  onTabChange,
  onOpenFilters,
  filter,
  courses,
  requests,
  onApplyCourse,
  onApplyRequest,
}: {
  tab: TabKey;
  onTabChange: (t: TabKey) => void;
  onOpenFilters: () => void;
  filter: FilterValue;
  courses: (CourseCardProps & { level: string; days: string[] })[];
  requests: StudentRequest[];
  onApplyCourse: (c: CourseCardProps) => void;
  onApplyRequest: (r: StudentRequest) => void;
}) {
  const grouped = useMemo(() => groupBy(courses, (c) => c.subject), [courses]);
  const { pinned, groupedRequests } = useMemo(() => {
    const p = requests.filter((r) => r.ownPost);
    const rest = requests.filter((r) => !r.ownPost);
    return { pinned: p, groupedRequests: groupBy(rest, (r) => r.subject) };
  }, [requests]);

  return (
    <>
      <div className="mt-2 px-4">
        <TabSwitcher<TabKey>
          tabs={[
            { key: "courses", label: "Cours", count: courses.length },
            { key: "requests", label: "Annonces", count: requests.length },
          ]}
          value={tab}
          onChange={onTabChange}
          className="w-full"
        />
      </div>

      {filterIsActive(filter) ? (
        <div className="mt-3 px-4">
          <button
            onClick={onOpenFilters}
            className="flex w-full items-center justify-between rounded-full bg-[#0B0B0F] px-3.5 py-2 text-[11.5px] font-semibold text-white"
          >
            <span className="flex items-center gap-1.5">
              <Filter className="h-3 w-3" strokeWidth={2.25} />
              Filtres actifs
            </span>
            <span className="text-[10.5px] text-white/60">Modifier</span>
          </button>
        </div>
      ) : null}

      {tab === "courses" ? (
        courses.length === 0 ? (
          <div className="mt-5 px-4">
            <EmptyState
              icon={Search}
              title="Aucun cours ne correspond"
              body="Élargis tes filtres pour voir plus de résultats."
            />
          </div>
        ) : (
          Object.entries(grouped).map(([subject, list]) => (
            <MobileStrip
              key={subject}
              title={subject}
              count={list.length}
              subtitle={`${list.length} cours disponibles`}
            >
              {list.map((c) => (
                <CourseCardTile
                  key={c.title}
                  c={c}
                  onApply={onApplyCourse}
                  className="min-w-[240px] max-w-[240px] shrink-0 snap-start"
                />
              ))}
            </MobileStrip>
          ))
        )
      ) : (
        <>
          {pinned.length > 0 ? (
            <MobileStrip
              title="Mes annonces"
              count={pinned.length}
              subtitle="Épinglées en haut"
            >
              {pinned.map((r) => (
                <div
                  key={r.id}
                  className="min-w-[260px] max-w-[260px] shrink-0 snap-start"
                >
                  <RequestCard {...r} onApply={() => onApplyRequest(r)} />
                </div>
              ))}
            </MobileStrip>
          ) : null}

          {Object.keys(groupedRequests).length === 0 && pinned.length === 0 ? (
            <div className="mt-5 px-4">
              <EmptyState
                icon={Search}
                title="Aucune annonce ne correspond"
                body="Change de matière ou remets les filtres à zéro."
              />
            </div>
          ) : (
            Object.entries(groupedRequests).map(([subject, list]) => (
              <MobileStrip
                key={subject}
                title={subject}
                count={list.length}
                subtitle={`${list.length} élève${list.length > 1 ? "s" : ""} en recherche`}
              >
                {list.map((r) => (
                  <div
                    key={r.id}
                    className="min-w-[260px] max-w-[260px] shrink-0 snap-start"
                  >
                    <RequestCard {...r} onApply={() => onApplyRequest(r)} />
                  </div>
                ))}
              </MobileStrip>
            ))
          )}
        </>
      )}

      <div className="h-6" />
    </>
  );
}

function CourseCardTile({
  c,
  onApply,
  className,
}: {
  c: CourseCardProps;
  onApply: (c: CourseCardProps) => void;
  className?: string;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onApply(c)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onApply(c);
        }
      }}
      className={cn(
        "cursor-pointer text-left rounded-[16px] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0B0B0F] focus-visible:ring-offset-2",
        className,
      )}
    >
      <CourseCard {...c} />
    </div>
  );
}

function MobileStrip({
  title,
  subtitle,
  count,
  children,
}: {
  title: string;
  subtitle?: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-5">
      <div className="px-4">
        <SectionHeader
          title={title}
          subtitle={subtitle}
          action={
            <span className="rounded-full bg-[#F0F0F2] px-2 py-0.5 text-[10.5px] font-semibold text-[#0B0B0F]">
              {count}
            </span>
          }
        />
      </div>
      <div
        className={cn(
          "scrollbar-none mt-3 flex snap-x snap-mandatory gap-2.5 overflow-x-auto px-4 pb-1",
        )}
        style={{ scrollPaddingInline: "1rem" }}
      >
        {children}
      </div>
    </section>
  );
}

/* ================================================================
   HELPERS
   ================================================================ */

type ReadableParams = { get(k: string): string | null };

function readFilterFromParams(sp: ReadableParams): FilterValue {
  return {
    subject: sp.get("subject"),
    level: sp.get("level"),
    priceMin: Number(sp.get("pmin")) || 50,
    priceMax: Number(sp.get("pmax")) || 400,
    ratingMin: Number(sp.get("rmin")) || 0,
    days: (sp.get("days") ?? "").split(",").filter(Boolean),
  };
}

function filterCourses(
  list: (CourseCardProps & { level: string; days: string[] })[],
  f: FilterValue,
) {
  return list.filter((c) => {
    if (f.subject && c.subject !== f.subject) return false;
    if (f.level && c.level !== f.level) return false;
    if (c.price < f.priceMin || c.price > f.priceMax) return false;
    if (f.ratingMin > 0 && c.rating < f.ratingMin) return false;
    if (f.days.length > 0 && !f.days.some((d) => c.days.includes(d))) return false;
    return true;
  });
}

function filterRequests(list: StudentRequest[], f: FilterValue) {
  return list.filter((r) => {
    if (f.subject && r.subject !== f.subject) return false;
    if (f.level && r.level !== f.level) return false;
    if (r.budget < f.priceMin || r.budget > f.priceMax) return false;
    if (f.days.length > 0 && !f.days.some((d) => r.days.includes(d))) return false;
    return true;
  });
}

function groupBy<T>(list: T[], key: (t: T) => string): Record<string, T[]> {
  const out: Record<string, T[]> = {};
  for (const item of list) {
    const k = key(item);
    (out[k] ??= []).push(item);
  }
  return out;
}
