"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Bookmark, BookmarkX, ChevronDown, Check } from "lucide-react";
import { motion } from "motion/react";
import { AppShell } from "@/components/app/app-shell";
import { CourseCard, type CourseCardProps } from "@/components/app/course-card";
import { PageHeader } from "@/components/app/page-header";
import { SectionHeader } from "@/components/app/section-header";
import { EmptyState } from "@/components/app/empty-state";
import { TabSwitcher } from "@/components/app/tab-switcher";
import { TeacherCard, type TeacherCardProps } from "@/components/app/teacher-card";
import { studentMobileTabs, studentNav } from "@/lib/nav";
import { springSoft } from "@/lib/motion";
import { cn } from "@/lib/utils";

/* ---------------- MOCK: replace when API lands ---------------- */

const student = {
  firstName: "Sara",
  fullName: "Sara Bencheikh",
  level: "Terminale S · Lycée Descartes",
  initials: "SB",
};

type FavoriteSession = CourseCardProps & { id: string; savedAt: number };

// MOCK: replace when API lands
const favoriteSessionsSeed: FavoriteSession[] = [
  {
    id: "s1",
    subject: "Mathématiques",
    title: "Bac 2026 · Analyse & suites numériques",
    teacher: { name: "Youssef Amrani", initials: "YA" },
    rating: 4.9,
    sessionsGiven: 342,
    price: 220,
    nextSlot: "Ce soir · 20:00",
    tone: "soft-blue",
    savedAt: 8,
  },
  {
    id: "s2",
    subject: "Physique-Chimie",
    title: "Bac · Mécanique du solide & énergétique",
    teacher: { name: "Nadia Cherkaoui", initials: "NC" },
    rating: 4.8,
    sessionsGiven: 182,
    price: 200,
    nextSlot: "Demain · 18:00",
    tone: "cream",
    savedAt: 7,
  },
  {
    id: "s3",
    subject: "Anglais",
    title: "IELTS 7.0+ · speaking & writing intensif",
    teacher: { name: "Emma Whitfield", initials: "EW" },
    rating: 4.9,
    sessionsGiven: 214,
    price: 260,
    nextSlot: "Ce soir · 21:00",
    tone: "soft-blue",
    savedAt: 6,
  },
  {
    id: "s4",
    subject: "SVT",
    title: "Bac SVT · génétique & évolution accéléré",
    teacher: { name: "Karim El Fassi", initials: "KE" },
    rating: 4.9,
    sessionsGiven: 158,
    price: 180,
    nextSlot: "Mar. · 18:30",
    tone: "cream",
    savedAt: 5,
  },
  {
    id: "s5",
    subject: "Français",
    title: "EAF · commentaire composé & dissertation",
    teacher: { name: "Chloé Bernard", initials: "CB" },
    rating: 4.6,
    sessionsGiven: 74,
    price: 140,
    nextSlot: "Ven. · 16:00",
    tone: "cream",
    savedAt: 4,
  },
  {
    id: "s6",
    subject: "Histoire-Géo",
    title: "Grand oral · fiches méthode + entraînement",
    teacher: { name: "Amine Ouazzani", initials: "AO" },
    rating: 4.7,
    sessionsGiven: 47,
    price: 130,
    nextSlot: "Ven. · 19:00",
    tone: "lime",
    savedAt: 3,
  },
  {
    id: "s7",
    subject: "Mathématiques",
    title: "Dérivées & étude de fonctions — première S",
    teacher: { name: "Sofia El Idrissi", initials: "SI" },
    rating: 4.7,
    sessionsGiven: 128,
    price: 160,
    nextSlot: "Demain · 17:00",
    tone: "cream",
    savedAt: 2,
  },
];

type FavoriteTeacher = Omit<TeacherCardProps, "onBookmarkToggle" | "onClick"> & {
  savedAt: number;
};

// MOCK: replace when API lands
const favoriteTeachersSeed: FavoriteTeacher[] = [
  {
    id: "t1",
    name: "Youssef Amrani",
    subject: "Mathématiques",
    rating: 4.9,
    sessionsCount: 342,
    hourlyRate: 220,
    tone: "soft-blue",
    savedAt: 8,
  },
  {
    id: "t2",
    name: "Nadia Cherkaoui",
    subject: "Physique-Chimie",
    rating: 4.8,
    sessionsCount: 182,
    hourlyRate: 200,
    tone: "cream",
    savedAt: 7,
  },
  {
    id: "t3",
    name: "Karim El Fassi",
    subject: "SVT",
    rating: 4.9,
    sessionsCount: 158,
    hourlyRate: 180,
    tone: "lime",
    savedAt: 6,
  },
  {
    id: "t4",
    name: "Chloé Bernard",
    subject: "Français",
    rating: 4.6,
    sessionsCount: 74,
    hourlyRate: 140,
    tone: "cream",
    savedAt: 5,
  },
  {
    id: "t5",
    name: "Rachid Benhaddou",
    subject: "Physique-Chimie",
    rating: 5.0,
    sessionsCount: 89,
    hourlyRate: 320,
    tone: "lime",
    savedAt: 4,
  },
  {
    id: "t6",
    name: "Emma Whitfield",
    subject: "Anglais",
    rating: 4.9,
    sessionsCount: 214,
    hourlyRate: 260,
    tone: "soft-blue",
    savedAt: 3,
  },
  {
    id: "t7",
    name: "Amine Ouazzani",
    subject: "Histoire-Géo",
    rating: 4.7,
    sessionsCount: 47,
    hourlyRate: 130,
    tone: "neutral",
    savedAt: 2,
  },
  {
    id: "t8",
    name: "Leila Bennani",
    subject: "SVT",
    rating: 4.8,
    sessionsCount: 92,
    hourlyRate: 150,
    tone: "soft-blue",
    savedAt: 1,
  },
];

/* ---------------- Types ---------------- */

type TabKey = "sessions" | "teachers";
type SortKey = "recent" | "alpha";

const SORT_LABELS: Record<SortKey, string> = {
  recent: "Récents",
  alpha: "Alphabétique",
};

/* ---------------- Page ---------------- */

export default function StudentFavoritesPage() {
  return (
    <Suspense fallback={null}>
      <FavoritesInner />
    </Suspense>
  );
}

function FavoritesInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const initialTab: TabKey =
    searchParams.get("tab") === "teachers" ? "teachers" : "sessions";
  const initialSort: SortKey =
    searchParams.get("sort") === "alpha" ? "alpha" : "recent";

  const [tab, setTab] = useState<TabKey>(initialTab);
  const [sort, setSort] = useState<SortKey>(initialSort);

  // Optimistic bookmark state — bookmarked ids per collection
  const [bookmarkedSessionIds, setBookmarkedSessionIds] = useState<Set<string>>(
    () => new Set(favoriteSessionsSeed.map((s) => s.id)),
  );
  const [bookmarkedTeacherIds, setBookmarkedTeacherIds] = useState<Set<string>>(
    () => new Set(favoriteTeachersSeed.map((t) => t.id)),
  );

  // URL sync (debounced)
  const urlWriteTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const writeUrl = useCallback(
    (nextTab: TabKey, nextSort: SortKey) => {
      if (urlWriteTimer.current) clearTimeout(urlWriteTimer.current);
      urlWriteTimer.current = setTimeout(() => {
        const p = new URLSearchParams();
        p.set("tab", nextTab);
        if (nextSort !== "recent") p.set("sort", nextSort);
        const qs = p.toString();
        router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
      }, 200);
    },
    [pathname, router],
  );

  useEffect(() => {
    writeUrl(tab, sort);
    return () => {
      if (urlWriteTimer.current) clearTimeout(urlWriteTimer.current);
    };
  }, [tab, sort, writeUrl]);

  // Visible collections = seed items whose id is still bookmarked
  const visibleSessions = useMemo(() => {
    const list = favoriteSessionsSeed.filter((s) =>
      bookmarkedSessionIds.has(s.id),
    );
    return sortSessions(list, sort);
  }, [bookmarkedSessionIds, sort]);

  const visibleTeachers = useMemo(() => {
    const list = favoriteTeachersSeed.filter((t) =>
      bookmarkedTeacherIds.has(t.id),
    );
    return sortTeachers(list, sort);
  }, [bookmarkedTeacherIds, sort]);

  const totalCount = bookmarkedSessionIds.size + bookmarkedTeacherIds.size;

  const toggleSessionBookmark = useCallback((id: string, next: boolean) => {
    setBookmarkedSessionIds((prev) => {
      const n = new Set(prev);
      if (next) n.add(id);
      else n.delete(id);
      return n;
    });
  }, []);

  const toggleTeacherBookmark = useCallback((id: string, next: boolean) => {
    setBookmarkedTeacherIds((prev) => {
      const n = new Set(prev);
      if (next) n.add(id);
      else n.delete(id);
      return n;
    });
  }, []);

  const desktop = (
    <DesktopMain
      tab={tab}
      onTabChange={setTab}
      sort={sort}
      onSortChange={setSort}
      totalCount={totalCount}
      sessions={visibleSessions}
      teachers={visibleTeachers}
      onToggleSession={toggleSessionBookmark}
      onToggleTeacher={toggleTeacherBookmark}
    />
  );

  const mobile = (
    <MobileBody
      tab={tab}
      onTabChange={setTab}
      sort={sort}
      sessions={visibleSessions}
      teachers={visibleTeachers}
      onToggleSession={toggleSessionBookmark}
      onToggleTeacher={toggleTeacherBookmark}
    />
  );

  return (
    <AppShell
      nav={studentNav}
      mobileTabs={studentMobileTabs}
      user={student}
      desktopMain={desktop}
      mobileHeader={{
        title: "Favoris",
        subtitle: `${totalCount} enregistré${totalCount > 1 ? "s" : ""}`,
        right: <SortMenuButton value={sort} onChange={setSort} />,
      }}
      mobileChildren={mobile}
    />
  );
}

/* ================================================================
   DESKTOP
   ================================================================ */

function DesktopMain({
  tab,
  onTabChange,
  sort,
  onSortChange,
  totalCount,
  sessions,
  teachers,
  onToggleSession,
  onToggleTeacher,
}: {
  tab: TabKey;
  onTabChange: (t: TabKey) => void;
  sort: SortKey;
  onSortChange: (s: SortKey) => void;
  totalCount: number;
  sessions: FavoriteSession[];
  teachers: FavoriteTeacher[];
  onToggleSession: (id: string, next: boolean) => void;
  onToggleTeacher: (id: string, next: boolean) => void;
}) {
  return (
    <div className="p-6">
      <PageHeader
        eyebrow={
          <>
            <span>Ma bibliothèque</span>
            <span className="h-1 w-1 rounded-full bg-[#D5D7DB]" />
            <span className="font-medium text-[#0B0B0F]">
              {totalCount} enregistré{totalCount > 1 ? "s" : ""}
            </span>
          </>
        }
        title="Favoris"
        subline="Retrouve les séances mises de côté et les profs que tu veux garder à portée."
        actions={<SortMenu value={sort} onChange={onSortChange} />}
      />

      <div className="mt-6">
        <TabSwitcher<TabKey>
          tabs={[
            { key: "sessions", label: "Séances", count: sessions.length },
            { key: "teachers", label: "Profs", count: teachers.length },
          ]}
          value={tab}
          onChange={onTabChange}
        />
      </div>

      <div className="mt-5 flex items-baseline justify-between">
        <p className="text-[11.5px] text-[#8A8D93]">
          Triés par{" "}
          <span className="font-semibold text-[#0B0B0F]">
            {SORT_LABELS[sort].toLowerCase()}
          </span>
        </p>
      </div>

      <div className="mt-3.5 pb-2">
        {tab === "sessions" ? (
          sessions.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 min-[1200px]:grid-cols-3">
              {sessions.map((s) => (
                <SessionTile
                  key={s.id}
                  session={s}
                  onToggle={onToggleSession}
                  bookmarked
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={BookmarkX}
              title="Aucune séance en favoris"
              body="Explore la marketplace et enregistre les cours qui t'intéressent pour les retrouver ici."
            />
          )
        ) : teachers.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 min-[1200px]:grid-cols-3">
            {teachers.map((t) => (
              <TeacherCard
                key={t.id}
                {...t}
                bookmarked
                onBookmarkToggle={onToggleTeacher}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={BookmarkX}
            title="Aucun prof en favoris"
            body="Épingle les profs que tu veux garder sous la main pour les recontacter facilement."
          />
        )}
      </div>
    </div>
  );
}

/* ================================================================
   MOBILE
   ================================================================ */

function MobileBody({
  tab,
  onTabChange,
  sort,
  sessions,
  teachers,
  onToggleSession,
  onToggleTeacher,
}: {
  tab: TabKey;
  onTabChange: (t: TabKey) => void;
  sort: SortKey;
  sessions: FavoriteSession[];
  teachers: FavoriteTeacher[];
  onToggleSession: (id: string, next: boolean) => void;
  onToggleTeacher: (id: string, next: boolean) => void;
}) {
  // Group by subject when > 6 items, otherwise single strip
  const sessionGroups = useMemo(
    () => (sessions.length > 6 ? groupBy(sessions, (s) => s.subject) : null),
    [sessions],
  );
  const teacherGroups = useMemo(
    () => (teachers.length > 6 ? groupBy(teachers, (t) => t.subject) : null),
    [teachers],
  );

  return (
    <>
      <div className="mt-2 px-4">
        <TabSwitcher<TabKey>
          tabs={[
            { key: "sessions", label: "Séances", count: sessions.length },
            { key: "teachers", label: "Profs", count: teachers.length },
          ]}
          value={tab}
          onChange={onTabChange}
          className="w-full"
        />
      </div>

      <div className="mt-3 px-4">
        <p className="text-[11px] text-[#8A8D93]">
          Trié par{" "}
          <span className="font-semibold text-[#0B0B0F]">
            {SORT_LABELS[sort].toLowerCase()}
          </span>
        </p>
      </div>

      {tab === "sessions" ? (
        sessions.length === 0 ? (
          <div className="mt-5 px-4">
            <EmptyState
              icon={BookmarkX}
              title="Aucune séance en favoris"
              body="Enregistre les cours qui t'intéressent depuis Découvrir."
            />
          </div>
        ) : sessionGroups ? (
          Object.entries(sessionGroups).map(([subject, list]) => (
            <MobileStrip
              key={subject}
              title={subject}
              count={list.length}
              subtitle={`${list.length} séance${list.length > 1 ? "s" : ""} enregistrée${list.length > 1 ? "s" : ""}`}
            >
              {list.map((s) => (
                <SessionTile
                  key={s.id}
                  session={s}
                  onToggle={onToggleSession}
                  bookmarked
                  className="min-w-[260px] max-w-[260px] shrink-0 snap-start"
                />
              ))}
            </MobileStrip>
          ))
        ) : (
          <MobileStrip
            title="Toutes les séances"
            count={sessions.length}
            subtitle="Glisse pour parcourir"
          >
            {sessions.map((s) => (
              <SessionTile
                key={s.id}
                session={s}
                onToggle={onToggleSession}
                bookmarked
                className="min-w-[260px] max-w-[260px] shrink-0 snap-start"
              />
            ))}
          </MobileStrip>
        )
      ) : teachers.length === 0 ? (
        <div className="mt-5 px-4">
          <EmptyState
            icon={BookmarkX}
            title="Aucun prof en favoris"
            body="Épingle des profs pour les retrouver rapidement."
          />
        </div>
      ) : teacherGroups ? (
        Object.entries(teacherGroups).map(([subject, list]) => (
          <MobileStrip
            key={subject}
            title={subject}
            count={list.length}
            subtitle={`${list.length} prof${list.length > 1 ? "s" : ""} enregistré${list.length > 1 ? "s" : ""}`}
          >
            {list.map((t) => (
              <div
                key={t.id}
                className="min-w-[260px] max-w-[260px] shrink-0 snap-start"
              >
                <TeacherCard
                  {...t}
                  bookmarked
                  onBookmarkToggle={onToggleTeacher}
                />
              </div>
            ))}
          </MobileStrip>
        ))
      ) : (
        <MobileStrip
          title="Tous les profs"
          count={teachers.length}
          subtitle="Glisse pour parcourir"
        >
          {teachers.map((t) => (
            <div
              key={t.id}
              className="min-w-[260px] max-w-[260px] shrink-0 snap-start"
            >
              <TeacherCard
                {...t}
                bookmarked
                onBookmarkToggle={onToggleTeacher}
              />
            </div>
          ))}
        </MobileStrip>
      )}

      <div className="h-6" />
    </>
  );
}

/* ================================================================
   TILES / STRIPS
   ================================================================ */

function SessionTile({
  session,
  onToggle,
  bookmarked,
  className,
}: {
  session: FavoriteSession;
  onToggle: (id: string, next: boolean) => void;
  bookmarked: boolean;
  className?: string;
}) {
  const handleClick = () => {
    if (typeof window !== "undefined") {
      window.location.hash = `session-${session.id}`;
    }
  };

  const handleKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={cn(
        "relative cursor-pointer text-left rounded-[16px] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0B0B0F] focus-visible:ring-offset-2",
        className,
      )}
    >
      <CourseCard
        {...session}
        bookmarked={bookmarked}
        onBookmarkToggle={(next) => onToggle(session.id, next)}
      />
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
        className="scrollbar-none mt-3 flex snap-x snap-mandatory gap-2.5 overflow-x-auto px-4 pb-1"
        style={{ scrollPaddingInline: "1rem" }}
      >
        {children}
      </div>
    </section>
  );
}

/* ================================================================
   SORT MENUS
   ================================================================ */

function SortMenu({
  value,
  onChange,
}: {
  value: SortKey;
  onChange: (s: SortKey) => void;
}) {
  return (
    <details className="group relative shrink-0">
      <summary
        className={cn(
          "flex h-9 cursor-pointer list-none items-center gap-1.5 rounded-full border px-3.5 text-[12px] font-semibold transition-colors [&::-webkit-details-marker]:hidden",
          "border-[#EFEFF1] bg-white text-[#0B0B0F] hover:bg-[#F5F5F7]",
        )}
      >
        <span>
          Trier <span className="mx-1 opacity-40">·</span>
          <span className="font-medium">{SORT_LABELS[value]}</span>
        </span>
        <ChevronDown className="h-3 w-3" strokeWidth={2} />
      </summary>
      <div className="absolute right-0 top-10 z-30 min-w-[180px] rounded-[14px] border border-[#EFEFF1] bg-white p-2 shadow-[0_8px_24px_rgba(10,11,20,0.08)]">
        <div className="flex flex-col">
          {(Object.keys(SORT_LABELS) as SortKey[]).map((opt) => {
            const isActive = opt === value;
            return (
              <button
                key={opt}
                type="button"
                onClick={(e) => {
                  onChange(opt);
                  // Close the <details> after selection
                  const details = (e.currentTarget.closest(
                    "details",
                  ) as HTMLDetailsElement | null);
                  if (details) details.open = false;
                }}
                className={cn(
                  "flex items-center justify-between rounded-md px-2.5 py-1.5 text-left text-[12px] transition-colors hover:bg-[#F5F5F7]",
                  isActive ? "font-semibold text-[#0B0B0F]" : "text-[#4A4D54]",
                )}
              >
                {SORT_LABELS[opt]}
                {isActive ? <Check className="h-3.5 w-3.5" strokeWidth={2.25} /> : null}
              </button>
            );
          })}
        </div>
      </div>
    </details>
  );
}

function SortMenuButton({
  value,
  onChange,
}: {
  value: SortKey;
  onChange: (s: SortKey) => void;
}) {
  // Compact icon-style button for the mobile header slot
  return (
    <details className="group relative">
      <summary
        aria-label="Trier"
        className="grid h-10 w-10 cursor-pointer list-none place-items-center rounded-full bg-white text-[#0B0B0F] shadow-[0_1px_2px_rgba(10,11,20,0.04)] [&::-webkit-details-marker]:hidden"
      >
        <Bookmark className="h-[17px] w-[17px]" strokeWidth={1.75} />
      </summary>
      <div className="absolute right-0 top-11 z-40 min-w-[180px] rounded-[14px] border border-[#EFEFF1] bg-white p-2 shadow-[0_8px_24px_rgba(10,11,20,0.08)]">
        <p className="px-2 pb-1 pt-0.5 text-[9.5px] font-semibold uppercase tracking-[0.09em] text-[#8A8D93]">
          Trier
        </p>
        <div className="flex flex-col">
          {(Object.keys(SORT_LABELS) as SortKey[]).map((opt) => {
            const isActive = opt === value;
            return (
              <button
                key={opt}
                type="button"
                onClick={(e) => {
                  onChange(opt);
                  const details = (e.currentTarget.closest(
                    "details",
                  ) as HTMLDetailsElement | null);
                  if (details) details.open = false;
                }}
                className={cn(
                  "flex items-center justify-between rounded-md px-2.5 py-1.5 text-left text-[12px] transition-colors hover:bg-[#F5F5F7]",
                  isActive ? "font-semibold text-[#0B0B0F]" : "text-[#4A4D54]",
                )}
              >
                {SORT_LABELS[opt]}
                {isActive ? <Check className="h-3.5 w-3.5" strokeWidth={2.25} /> : null}
              </button>
            );
          })}
        </div>
      </div>
    </details>
  );
}

/* ================================================================
   HELPERS
   ================================================================ */

function sortSessions(list: FavoriteSession[], key: SortKey): FavoriteSession[] {
  const copy = [...list];
  if (key === "recent") {
    copy.sort((a, b) => b.savedAt - a.savedAt);
  } else {
    copy.sort((a, b) => a.title.localeCompare(b.title, "fr"));
  }
  return copy;
}

function sortTeachers(list: FavoriteTeacher[], key: SortKey): FavoriteTeacher[] {
  const copy = [...list];
  if (key === "recent") {
    copy.sort((a, b) => b.savedAt - a.savedAt);
  } else {
    copy.sort((a, b) => a.name.localeCompare(b.name, "fr"));
  }
  return copy;
}

function groupBy<T>(list: T[], key: (t: T) => string): Record<string, T[]> {
  const out: Record<string, T[]> = {};
  for (const item of list) {
    const k = key(item);
    (out[k] ??= []).push(item);
  }
  return out;
}
