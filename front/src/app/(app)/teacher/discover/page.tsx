"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Filter, Search, SlidersHorizontal, UserPlus, X } from "lucide-react";
import { AppShell } from "@/components/app/app-shell";
import { PageHeader } from "@/components/app/page-header";
import { SectionHeader } from "@/components/app/section-header";
import { EmptyState } from "@/components/app/empty-state";
import { TabSwitcher } from "@/components/app/tab-switcher";
import {
  FilterBar,
  createDefaultFilter,
  filterIsActive,
  DEFAULT_PRICE_MIN,
  DEFAULT_PRICE_MAX,
  type FilterValue,
} from "@/components/app/filter-bar";
import { FilterDrawer } from "@/components/app/filter-drawer";
import { RequestCard, type RequestCardProps } from "@/components/app/request-card";
import { TeacherCard, type TeacherCardProps } from "@/components/app/teacher-card";
import {
  PostulateModal,
  type PostulateTarget,
} from "@/components/app/postulate-modal";
import { teacherMobileTabs, teacherNav } from "@/lib/nav";
import { mockTeacher } from "@/lib/mock/teacher";
import { cn } from "@/lib/utils";

/* ---------------- MOCK: replace when API lands ---------------- */

/** Simulates teacher profile completeness — flip to false to exercise the
 *  "complete your profile" empty state branch. */
const teacherHasCompletedProfile = true;

/** Extract a plain subject token from mockTeacher.subjectSpecialty
 *  (e.g. "Mathématiques · Bac & Prépa" → "Mathématiques"). */
const teacherPrimarySubject =
  mockTeacher.subjectSpecialty?.split("·")[0]?.trim() ?? "";

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

type TrendingTeacher = TeacherCardProps & {
  level: string;
  days: string[];
  trending?: boolean;
};

// MOCK: replace when API lands
const trendingTeachers: TrendingTeacher[] = [
  {
    id: "t-01",
    name: "Nadia Cherkaoui",
    subject: "Mathématiques",
    rating: 4.9,
    sessionsCount: 312,
    hourlyRate: 240,
    tone: "lime",
    level: "Terminale",
    days: ["Lun", "Mer", "Jeu"],
    trending: true,
  },
  {
    id: "t-02",
    name: "Rachid Benhaddou",
    subject: "Mathématiques",
    rating: 5.0,
    sessionsCount: 189,
    hourlyRate: 320,
    tone: "soft-blue",
    level: "Prépa",
    days: ["Mar", "Jeu", "Sam"],
    trending: true,
  },
  {
    id: "t-03",
    name: "Sofia El Idrissi",
    subject: "Mathématiques",
    rating: 4.7,
    sessionsCount: 128,
    hourlyRate: 180,
    tone: "cream",
    level: "Première",
    days: ["Mar", "Ven"],
  },
  {
    id: "t-04",
    name: "Karim El Fassi",
    subject: "SVT",
    rating: 4.9,
    sessionsCount: 158,
    hourlyRate: 210,
    tone: "cream",
    level: "Terminale",
    days: ["Mar", "Jeu"],
    trending: true,
  },
  {
    id: "t-05",
    name: "Emma Whitfield",
    subject: "Anglais",
    rating: 4.9,
    sessionsCount: 214,
    hourlyRate: 260,
    tone: "soft-blue",
    level: "Terminale",
    days: ["Lun", "Mar", "Mer", "Jeu"],
  },
  {
    id: "t-06",
    name: "Amine Ouazzani",
    subject: "Histoire-Géo",
    rating: 4.7,
    sessionsCount: 84,
    hourlyRate: 160,
    tone: "lime",
    level: "Terminale",
    days: ["Ven", "Sam"],
  },
  {
    id: "t-07",
    name: "Leila Bennani",
    subject: "SVT",
    rating: 4.8,
    sessionsCount: 92,
    hourlyRate: 170,
    tone: "cream",
    level: "Première",
    days: ["Mer", "Sam"],
  },
  {
    id: "t-08",
    name: "Marc Dupont",
    subject: "Français",
    rating: 5.0,
    sessionsCount: 96,
    hourlyRate: 250,
    tone: "lime",
    level: "Terminale",
    days: ["Mar", "Jeu", "Sam"],
  },
  {
    id: "t-09",
    name: "Ibrahim Toure",
    subject: "Anglais",
    rating: 4.5,
    sessionsCount: 62,
    hourlyRate: 110,
    tone: "neutral",
    level: "Collège",
    days: ["Sam", "Dim"],
  },
  {
    id: "t-10",
    name: "Chloé Bernard",
    subject: "Français",
    rating: 4.6,
    sessionsCount: 74,
    hourlyRate: 140,
    tone: "cream",
    level: "Première",
    days: ["Mer", "Ven"],
  },
];

type StudentRequestItem = Omit<RequestCardProps, "onApply"> & {
  level: string;
  days: string[];
};

// MOCK: replace when API lands
const studentRequestsForDomain: StudentRequestItem[] = [
  {
    id: "req-d1",
    author: "Ilyas Berrada",
    authorInitials: "IB",
    level: "Terminale",
    subject: "Mathématiques",
    title: "Bac blanc · probabilités conditionnelles en 4 séances",
    description:
      "Objectif : maîtriser les probas cond. avant le bac blanc de fin sept.",
    tags: ["Bac blanc", "4 séances", "Soir 19h-20h"],
    budget: 200,
    deadline: "30 sept.",
    proposalsCount: 3,
    days: ["Lun", "Mer", "Jeu"],
  },
  {
    id: "req-d2",
    author: "Nour Sabri",
    authorInitials: "NS",
    level: "Prépa",
    subject: "Mathématiques",
    title: "MPSI · colle hebdo algèbre & espaces vectoriels",
    description: "Prépa intégrée Casa. 1h/sem, colleur sérieux uniquement.",
    tags: ["MPSI", "Récurrent", "Casa"],
    budget: 260,
    deadline: "récurrent",
    proposalsCount: 5,
    days: ["Mar", "Jeu"],
  },
  {
    id: "req-d3",
    author: "Adam Chraibi",
    authorInitials: "AC",
    level: "Première",
    subject: "Mathématiques",
    title: "Rattrapage urgent · fonctions & dérivées, DS samedi",
    description: "2 séances cette semaine, en ligne accepté.",
    tags: ["Urgent", "Dérivées", "Visio"],
    budget: 180,
    deadline: "6 sept.",
    proposalsCount: 2,
    days: ["Mar", "Jeu"],
  },
  {
    id: "req-d4",
    author: "Hamza Ouali",
    authorInitials: "HO",
    level: "Terminale",
    subject: "Mathématiques",
    title: "Intégrales — méthodologie + exos guidés",
    description: "4 séances d'1h. Rabat ou en ligne.",
    tags: ["Intégrales", "4 séances", "Rabat"],
    budget: 210,
    deadline: "20 sept.",
    proposalsCount: 4,
    days: ["Lun", "Mer"],
  },
  {
    id: "req-d5",
    author: "Zineb Kabbaj",
    authorInitials: "ZK",
    level: "Prépa",
    subject: "Mathématiques",
    title: "Suites récurrentes & convergence — méthodes rapides",
    description: "Colle vendredi, je veux les réflexes types en 2h.",
    tags: ["Colle", "MPSI", "Rapide"],
    budget: 280,
    deadline: "9 sept.",
    proposalsCount: 1,
    days: ["Jeu", "Ven"],
  },
  {
    id: "req-d6",
    author: "Malak Cherkaoui",
    authorInitials: "MC",
    level: "Première",
    subject: "Mathématiques",
    title: "Passer de 12 à 16 en maths ce trimestre",
    description: "Bonne base mais je perds des points en rédaction.",
    tags: ["Rédaction", "3 séances test"],
    budget: 220,
    deadline: "fin trim.",
    proposalsCount: 3,
    days: ["Sam"],
  },
  {
    id: "req-d7",
    author: "Yasmine Alaoui",
    authorInitials: "YA",
    level: "Terminale",
    subject: "Physique-Chimie",
    title: "Aide en spé physique · ondes & mécanique",
    description: "Cours perdu, besoin d'une remise à niveau avant le DS.",
    tags: ["Ondes", "DS proche"],
    budget: 190,
    deadline: "15 sept.",
    proposalsCount: 6,
    days: ["Mar", "Jeu"],
  },
  {
    id: "req-d8",
    author: "Layla F.",
    authorInitials: "LF",
    level: "Collège",
    subject: "Anglais",
    title: "3ème · préparer le Brevet en anglais",
    description: "Besoin de vocabulaire, grammaire et confiance à l'oral.",
    tags: ["Brevet", "Oral"],
    budget: 100,
    deadline: "Juin",
    proposalsCount: 3,
    days: ["Sam"],
  },
];

/* ---------------- Page ---------------- */

export default function TeacherDiscoverPage() {
  return (
    <Suspense fallback={null}>
      <DiscoverInner />
    </Suspense>
  );
}

type TabKey = "teachers" | "requests";

function DiscoverInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const initialTab: TabKey =
    searchParams.get("tab") === "requests" ? "requests" : "teachers";
  const [tab, setTab] = useState<TabKey>(initialTab);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [postulateTarget, setPostulateTarget] = useState<PostulateTarget | null>(
    null,
  );

  // Track whether the current subject filter was pre-filled from the
  // teacher's specialty so we can render the "Voir tout" clear-banner.
  const initialSubjectFromUrl = searchParams.get("subject");
  const [subjectPrefilledFromDomain, setSubjectPrefilledFromDomain] = useState(
    initialSubjectFromUrl === null && teacherPrimarySubject !== "",
  );

  const [teachersFilter, setTeachersFilter] = useState<FilterValue>(() => {
    const f = readFilterFromParams(searchParams);
    if (
      tab === "teachers" &&
      !initialSubjectFromUrl &&
      teacherPrimarySubject &&
      SUBJECTS.includes(teacherPrimarySubject)
    ) {
      f.subject = teacherPrimarySubject;
    }
    return tab === "teachers" ? f : createDefaultFilter();
  });
  const [requestsFilter, setRequestsFilter] = useState<FilterValue>(() => {
    const f = readFilterFromParams(searchParams);
    if (
      tab === "requests" &&
      !initialSubjectFromUrl &&
      teacherPrimarySubject &&
      SUBJECTS.includes(teacherPrimarySubject)
    ) {
      f.subject = teacherPrimarySubject;
    }
    return tab === "requests" ? f : createDefaultFilter();
  });

  // Pre-fill the *other* tab's subject too so the domain filter follows
  // the teacher across tab switches — but only if it wasn't already set.
  useEffect(() => {
    if (!teacherPrimarySubject || !SUBJECTS.includes(teacherPrimarySubject))
      return;
    if (initialSubjectFromUrl) return;
    setTeachersFilter((prev) =>
      prev.subject ? prev : { ...prev, subject: teacherPrimarySubject },
    );
    setRequestsFilter((prev) =>
      prev.subject ? prev : { ...prev, subject: teacherPrimarySubject },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeFilter = tab === "teachers" ? teachersFilter : requestsFilter;
  const setActiveFilter =
    tab === "teachers" ? setTeachersFilter : setRequestsFilter;

  const urlWriteTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const writeUrl = useCallback(
    (nextTab: TabKey, nextFilter: FilterValue) => {
      if (urlWriteTimer.current) clearTimeout(urlWriteTimer.current);
      urlWriteTimer.current = setTimeout(() => {
        const p = new URLSearchParams();
        p.set("tab", nextTab);
        if (nextFilter.subject) p.set("subject", nextFilter.subject);
        if (nextFilter.level) p.set("level", nextFilter.level);
        if (nextFilter.priceMin !== DEFAULT_PRICE_MIN)
          p.set("pmin", String(nextFilter.priceMin));
        if (nextFilter.priceMax !== DEFAULT_PRICE_MAX)
          p.set("pmax", String(nextFilter.priceMax));
        if (nextFilter.ratingMin > 0)
          p.set("rmin", String(nextFilter.ratingMin));
        if (nextFilter.days.length > 0)
          p.set("days", nextFilter.days.join(","));
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
      // Any manual subject change disables the pre-filled banner.
      if ("subject" in patch) setSubjectPrefilledFromDomain(false);
      setActiveFilter((prev) => ({ ...prev, ...patch }));
    },
    [setActiveFilter],
  );

  const resetFilter = useCallback(() => {
    setSubjectPrefilledFromDomain(false);
    setActiveFilter(createDefaultFilter());
  }, [setActiveFilter]);

  const clearDomainPrefill = useCallback(() => {
    setSubjectPrefilledFromDomain(false);
    setActiveFilter((prev) => ({ ...prev, subject: null }));
  }, [setActiveFilter]);

  const filteredTeachers = useMemo(
    () => filterTeachers(trendingTeachers, teachersFilter),
    [teachersFilter],
  );
  const filteredRequests = useMemo(
    () => filterRequests(studentRequestsForDomain, requestsFilter),
    [requestsFilter],
  );

  const openPostulate = (r: StudentRequestItem) =>
    setPostulateTarget({
      id: r.id,
      title: r.title,
      author: r.author,
      budget: r.budget,
    });

  // Empty-domain edge case (defensive branch for future teachers with no
  // specialty yet — currently mockTeacher HAS one, so this is unreachable).
  if (!teacherHasCompletedProfile) {
    return (
      <AppShell
        nav={teacherNav}
        mobileTabs={teacherMobileTabs}
        user={{
          fullName: mockTeacher.fullName,
          level: mockTeacher.level,
          initials: mockTeacher.initials,
        }}
        desktopMain={
          <div className="p-6">
            <PageHeader
              title="Découvrir"
              subline="Trouve des collègues à observer ou réponds aux demandes des élèves de ta discipline."
            />
            <div className="mt-8">
              <EmptyState
                icon={UserPlus}
                title="Complète ton profil"
                body="Complète ton profil pour voir les demandes qui te correspondent."
                action={
                  <Link
                    href="/teacher/profile"
                    className="rounded-full bg-[#0B0B0F] px-4 py-2 text-[12px] font-semibold text-white transition-colors hover:bg-[#1a1b21]"
                  >
                    Aller au profil
                  </Link>
                }
              />
            </div>
          </div>
        }
        mobileHeader={{
          title: "Découvrir",
          subtitle: "Complète ton profil pour débloquer les demandes",
        }}
        mobileChildren={
          <div className="mt-5 px-4">
            <EmptyState
              icon={UserPlus}
              title="Complète ton profil"
              body="Complète ton profil pour voir les demandes qui te correspondent."
              action={
                <Link
                  href="/teacher/profile"
                  className="rounded-full bg-[#0B0B0F] px-4 py-2 text-[12px] font-semibold text-white"
                >
                  Aller au profil
                </Link>
              }
            />
          </div>
        }
      />
    );
  }

  const desktop = (
    <DesktopMain
      tab={tab}
      onTabChange={setTab}
      filter={activeFilter}
      onPatch={patchFilter}
      onReset={resetFilter}
      teachers={filteredTeachers}
      requests={filteredRequests}
      countTeachers={trendingTeachers.length}
      countRequests={studentRequestsForDomain.length}
      onPostulate={openPostulate}
      subjectPrefilledFromDomain={subjectPrefilledFromDomain}
      onClearDomainPrefill={clearDomainPrefill}
    />
  );

  const mobile = (
    <MobileBody
      tab={tab}
      onTabChange={setTab}
      onOpenFilters={() => setDrawerOpen(true)}
      filter={activeFilter}
      teachers={filteredTeachers}
      requests={filteredRequests}
      onPostulate={openPostulate}
      subjectPrefilledFromDomain={subjectPrefilledFromDomain}
      onClearDomainPrefill={clearDomainPrefill}
    />
  );

  return (
    <>
      <AppShell
        nav={teacherNav}
        mobileTabs={teacherMobileTabs}
        user={{
          fullName: mockTeacher.fullName,
          level: mockTeacher.level,
          initials: mockTeacher.initials,
        }}
        desktopMain={desktop}
        mobileHeader={{
          title: "Découvrir",
          subtitle: "Profs à observer ou demandes de ta discipline",
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
        resultCount={
          tab === "teachers" ? filteredTeachers.length : filteredRequests.length
        }
      />

      <PostulateModal
        open={postulateTarget !== null}
        onClose={() => setPostulateTarget(null)}
        target={postulateTarget}
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
  teachers,
  requests,
  countTeachers,
  countRequests,
  onPostulate,
  subjectPrefilledFromDomain,
  onClearDomainPrefill,
}: {
  tab: TabKey;
  onTabChange: (t: TabKey) => void;
  filter: FilterValue;
  onPatch: (patch: Partial<FilterValue>) => void;
  onReset: () => void;
  teachers: TrendingTeacher[];
  requests: StudentRequestItem[];
  countTeachers: number;
  countRequests: number;
  onPostulate: (r: StudentRequestItem) => void;
  subjectPrefilledFromDomain: boolean;
  onClearDomainPrefill: () => void;
}) {
  return (
    <div className="p-6">
      <PageHeader
        eyebrow={
          <>
            <span>Marketplace prof</span>
            <span className="h-1 w-1 rounded-full bg-[#D5D7DB]" />
            <span className="font-medium text-[#0B0B0F]">
              {countTeachers} profs · {countRequests} demandes
            </span>
          </>
        }
        title="Découvrir"
        subline="Trouve des collègues à observer ou réponds aux demandes des élèves de ta discipline."
      />

      <div className="mt-6">
        <TabSwitcher<TabKey>
          tabs={[
            { key: "teachers", label: "Profs & tendances", count: countTeachers },
            { key: "requests", label: "Demandes d'élèves", count: countRequests },
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

      {subjectPrefilledFromDomain && filter.subject ? (
        <DomainPrefillBanner
          subject={filter.subject}
          onClear={onClearDomainPrefill}
        />
      ) : null}

      <div className="mt-5 flex items-baseline justify-between">
        <p className="text-[11.5px] text-[#8A8D93]">
          {tab === "teachers"
            ? `${teachers.length} prof${teachers.length > 1 ? "s" : ""} à découvrir`
            : `${requests.length} demande${requests.length > 1 ? "s" : ""} d'élèves`}
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
        {tab === "teachers" ? (
          teachers.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 min-[1200px]:grid-cols-3">
              {teachers.map((t) => (
                <TeacherCardTile key={t.id} t={t} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Search}
              title="Aucun prof ne correspond"
              body="Élargis tes filtres ou consulte une autre matière."
            />
          )
        ) : requests.length > 0 ? (
          <div className="grid grid-cols-1 gap-3 min-[1200px]:grid-cols-2">
            {requests.map((r) => (
              <RequestCard
                key={r.id}
                {...r}
                onApply={() => onPostulate(r)}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Search}
            title="Aucune demande ne correspond"
            body="Change de matière ou remets les filtres à zéro."
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
        onClick={() => console.log("[TeacherDiscover] search tapped")}
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
  teachers,
  requests,
  onPostulate,
  subjectPrefilledFromDomain,
  onClearDomainPrefill,
}: {
  tab: TabKey;
  onTabChange: (t: TabKey) => void;
  onOpenFilters: () => void;
  filter: FilterValue;
  teachers: TrendingTeacher[];
  requests: StudentRequestItem[];
  onPostulate: (r: StudentRequestItem) => void;
  subjectPrefilledFromDomain: boolean;
  onClearDomainPrefill: () => void;
}) {
  const groupedTeachers = useMemo(
    () => groupBy(teachers, (t) => t.subject),
    [teachers],
  );
  const groupedRequests = useMemo(
    () => groupBy(requests, (r) => r.subject),
    [requests],
  );

  return (
    <>
      <div className="mt-2 px-4">
        <TabSwitcher<TabKey>
          tabs={[
            { key: "teachers", label: "Profs", count: teachers.length },
            { key: "requests", label: "Demandes", count: requests.length },
          ]}
          value={tab}
          onChange={onTabChange}
          className="w-full"
        />
      </div>

      {subjectPrefilledFromDomain && filter.subject ? (
        <div className="mt-3 px-4">
          <MobileDomainPrefillPill
            subject={filter.subject}
            onClear={onClearDomainPrefill}
          />
        </div>
      ) : null}

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

      {tab === "teachers" ? (
        teachers.length === 0 ? (
          <div className="mt-5 px-4">
            <EmptyState
              icon={Search}
              title="Aucun prof ne correspond"
              body="Élargis tes filtres pour voir plus de résultats."
            />
          </div>
        ) : teachers.length < 6 ? (
          <MobileStrip
            title="Suggestions"
            count={teachers.length}
            subtitle={`${teachers.length} prof${teachers.length > 1 ? "s" : ""} à découvrir`}
          >
            {teachers.map((t) => (
              <TeacherCardTile
                key={t.id}
                t={t}
                className="min-w-[240px] max-w-[240px] shrink-0 snap-start"
              />
            ))}
          </MobileStrip>
        ) : (
          Object.entries(groupedTeachers).map(([subject, list]) => (
            <MobileStrip
              key={subject}
              title={subject}
              count={list.length}
              subtitle={`${list.length} prof${list.length > 1 ? "s" : ""} à découvrir`}
            >
              {list.map((t) => (
                <TeacherCardTile
                  key={t.id}
                  t={t}
                  className="min-w-[240px] max-w-[240px] shrink-0 snap-start"
                />
              ))}
            </MobileStrip>
          ))
        )
      ) : requests.length === 0 ? (
        <div className="mt-5 px-4">
          <EmptyState
            icon={Search}
            title="Aucune demande ne correspond"
            body="Change de matière ou remets les filtres à zéro."
          />
        </div>
      ) : requests.length < 6 ? (
        <MobileStrip
          title="Demandes récentes"
          count={requests.length}
          subtitle={`${requests.length} élève${requests.length > 1 ? "s" : ""} en recherche`}
        >
          {requests.map((r) => (
            <div
              key={r.id}
              className="min-w-[260px] max-w-[260px] shrink-0 snap-start"
            >
              <RequestCard {...r} onApply={() => onPostulate(r)} />
            </div>
          ))}
        </MobileStrip>
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
                <RequestCard {...r} onApply={() => onPostulate(r)} />
              </div>
            ))}
          </MobileStrip>
        ))
      )}

      <div className="h-6" />
    </>
  );
}

function TeacherCardTile({
  t,
  className,
}: {
  t: TrendingTeacher;
  className?: string;
}) {
  return (
    <div className={cn("relative", className)}>
      {t.trending ? (
        <span className="absolute left-3 top-3 z-10 rounded-full bg-[#DFFF3F] px-2 py-0.5 text-[10px] font-semibold text-[#0B0B0F]">
          Tendance
        </span>
      ) : null}
      <TeacherCard {...t} />
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

/* ---------------- Domain-prefill banners ---------------- */

function DomainPrefillBanner({
  subject,
  onClear,
}: {
  subject: string;
  onClear: () => void;
}) {
  return (
    <div className="mt-3 flex items-center gap-2">
      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F5F5F7] px-3 py-1.5 text-[11.5px] font-medium text-[#0B0B0F]">
        Filtré par ta spécialité :{" "}
        <span className="font-semibold">{subject}</span>
        <button
          type="button"
          onClick={onClear}
          aria-label="Voir tout"
          className="grid h-4 w-4 place-items-center rounded-full bg-[#0B0B0F]/10 text-[#0B0B0F] transition-colors hover:bg-[#0B0B0F] hover:text-white"
        >
          <X className="h-2.5 w-2.5" strokeWidth={2.5} />
        </button>
      </span>
      <button
        type="button"
        onClick={onClear}
        className="text-[11px] font-medium text-[#8A8D93] transition-colors hover:text-[#0B0B0F]"
      >
        Voir tout
      </button>
    </div>
  );
}

function MobileDomainPrefillPill({
  subject,
  onClear,
}: {
  subject: string;
  onClear: () => void;
}) {
  return (
    <div className="flex w-full items-center justify-between rounded-full bg-[#F5F5F7] px-3 py-1.5">
      <span className="truncate text-[11.5px] text-[#0B0B0F]">
        Filtré par ta spécialité :{" "}
        <span className="font-semibold">{subject}</span>
      </span>
      <button
        type="button"
        onClick={onClear}
        className="ml-2 shrink-0 text-[11px] font-semibold text-[#0B0B0F]"
      >
        Voir tout
      </button>
    </div>
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
    priceMin: Number(sp.get("pmin")) || DEFAULT_PRICE_MIN,
    priceMax: Number(sp.get("pmax")) || DEFAULT_PRICE_MAX,
    ratingMin: Number(sp.get("rmin")) || 0,
    days: (sp.get("days") ?? "").split(",").filter(Boolean),
  };
}

function filterTeachers(list: TrendingTeacher[], f: FilterValue) {
  return list.filter((t) => {
    if (f.subject && t.subject !== f.subject) return false;
    if (f.level && t.level !== f.level) return false;
    if (t.hourlyRate < f.priceMin || t.hourlyRate > f.priceMax) return false;
    if (f.ratingMin > 0 && t.rating < f.ratingMin) return false;
    if (f.days.length > 0 && !f.days.some((d) => t.days.includes(d)))
      return false;
    return true;
  });
}

function filterRequests(list: StudentRequestItem[], f: FilterValue) {
  return list.filter((r) => {
    if (f.subject && r.subject !== f.subject) return false;
    if (f.level && r.level !== f.level) return false;
    if (r.budget < f.priceMin || r.budget > f.priceMax) return false;
    if (f.days.length > 0 && !f.days.some((d) => r.days.includes(d)))
      return false;
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
