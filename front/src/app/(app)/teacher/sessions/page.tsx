"use client";

import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import {
  AlertCircle,
  Ban,
  Calendar as CalendarIcon,
  CalendarPlus,
  ChevronLeft,
  ChevronRight,
  Clock,
  DoorOpen,
  Inbox,
  Link as LinkIcon,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { AppShell } from "@/components/app/app-shell";
import { PageHeader } from "@/components/app/page-header";
import { TabSwitcher } from "@/components/app/tab-switcher";
import { EmptyState } from "@/components/app/empty-state";
import { Avatar } from "@/components/app/avatar";
import { SessionCard } from "@/components/app/session-card";
import {
  SessionDetailDrawer,
  type SessionDetailData,
} from "@/components/app/session-detail-drawer";
import { InviteCard } from "@/components/app/invite-card";
import {
  CreateSessionModal,
  type CreateSessionValues,
} from "@/components/app/create-session-modal";
import {
  WeekGrid,
  hhmmToMinutes,
  minutesToHHMM,
  type WeekSlot,
} from "@/components/app/week-grid";
import { FloatingCircularMenu } from "@/components/library/floating-circular-menu";
import { teacherMobileTabs, teacherNav } from "@/lib/nav";
import { mockTeacher } from "@/lib/mock/teacher";
import { fadeQuick, springTight } from "@/lib/motion";
import { cn } from "@/lib/utils";

import {
  loadMyAvailabilityAction,
  saveMyAvailabilityAction,
} from "./actions";

/* ================================================================
   MOCK: replace when API lands
   ================================================================ */

const teacherAsUser = {
  fullName: mockTeacher.fullName,
  level: mockTeacher.level,
  initials: mockTeacher.initials,
};

const T = {
  liveNow: "2026-09-02T13:45:00+01:00",
  in20min: "2026-09-02T14:20:00+01:00",
  todayEve: "2026-09-02T19:30:00+01:00",
  tomorrowAft: "2026-09-03T16:00:00+01:00",
  tomorrowEve: "2026-09-03T18:30:00+01:00",
  thu: "2026-09-04T17:00:00+01:00",
  fri: "2026-09-05T20:00:00+01:00",
  weekAgo: "2026-08-26T18:00:00+01:00",
  twoWeeksAgo: "2026-08-19T17:00:00+01:00",
};

type TeacherSession = SessionDetailData & { dot?: string };

const activeSessions: TeacherSession[] = [
  {
    id: "ts-live",
    title: "Analyse — dérivées & fonction composée",
    subject: "Mathématiques",
    teacher: { name: "Sara Bencheikh", initials: "SB" },
    whenLabel: "Aujourd'hui · 13:45",
    when: T.liveNow,
    duration: "60 min",
    status: "live",
    dot: "#DFFF3F",
    agenda: [
      "Rappel dérivée d'une composée",
      "Correction TD § 3.2",
      "Sujet type bac guidé",
    ],
    notes: "Élève motivée, préfère les exos rédigés à l'oral.",
  },
  {
    id: "ts-soon",
    title: "Prépa MPSI — algèbre linéaire, colle 3",
    subject: "Mathématiques",
    teacher: { name: "Lina Ouazzani", initials: "LO" },
    whenLabel: "Aujourd'hui · 14:20",
    when: T.in20min,
    duration: "90 min",
    status: "upcoming",
    dot: "#C4CFFF",
    agenda: ["Bases & rang", "Applications linéaires", "Colle blanche 30 min"],
  },
  {
    id: "ts-eve",
    title: "Terminale — probabilités conditionnelles",
    subject: "Mathématiques",
    teacher: { name: "Mehdi Tazi", initials: "MT" },
    whenLabel: "Aujourd'hui · 19:30",
    when: T.todayEve,
    duration: "60 min",
    status: "upcoming",
    dot: "#F0EDE4",
  },
  {
    id: "ts-tom-1",
    title: "Trigo — cercle & formules d'addition",
    subject: "Mathématiques",
    teacher: { name: "Amine Khattabi", initials: "AK" },
    whenLabel: "Demain · 16:00",
    when: T.tomorrowAft,
    duration: "45 min",
    status: "upcoming",
    dot: "#DFFF3F",
  },
  {
    id: "ts-tom-2",
    title: "Suites récurrentes — méthodes rapides",
    subject: "Mathématiques",
    teacher: { name: "Zineb Kabbaj", initials: "ZK" },
    whenLabel: "Demain · 18:30",
    when: T.tomorrowEve,
    duration: "45 min",
    status: "upcoming",
    dot: "#C4CFFF",
  },
  {
    id: "ts-thu",
    title: "Analyse — intégration par parties",
    subject: "Mathématiques",
    teacher: { name: "Yasmine Alaoui", initials: "YAl" },
    whenLabel: "Jeu. 4 sept · 17:00",
    when: T.thu,
    duration: "60 min",
    status: "upcoming",
    dot: "#F0EDE4",
  },
  {
    id: "ts-past-1",
    title: "Analyse — limites & continuité",
    subject: "Mathématiques",
    teacher: { name: "Sara Bencheikh", initials: "SB" },
    whenLabel: "Mer. 26 août · 18:00",
    when: T.weekAgo,
    duration: "60 min",
    status: "past",
    dot: "#C4CFFF",
    notes: "À revoir : FI en +∞ et continuité par morceaux (§ 2.b).",
    materials: [{ id: "m1", name: "Correction TD limites.pdf", size: "540 Ko", kind: "pdf" }],
  },
  {
    id: "ts-past-2",
    title: "Prépa PCSI — algèbre 1er cycle",
    subject: "Mathématiques",
    teacher: { name: "Karim El Fassi", initials: "KE" },
    whenLabel: "Mer. 19 août · 17:00",
    when: T.twoWeeksAgo,
    duration: "90 min",
    status: "past",
    dot: "#F0EDE4",
  },
];

/* ---------------- Pending invites ---------------- */

type PendingInvite = {
  id: string;
  from: { name: string; initials: string; level?: string };
  subject?: string;
  targetTitle: string;
  when: string;
  price: number;
  note?: string;
};

const initialInvites: PendingInvite[] = [
  {
    id: "inv-01",
    from: { name: "Sara Bencheikh", initials: "SB", level: "Terminale S" },
    subject: "Mathématiques",
    targetTitle: "Bac 2026 · Analyse & suites numériques",
    when: "Mer. 3 sept · 18:00 (60 min)",
    price: 220,
    note: "J'aimerais préparer le contrôle continu du 12 sept — dérivées composées.",
  },
  {
    id: "inv-02",
    from: { name: "Amine Khattabi", initials: "AK", level: "1ère S" },
    subject: "Mathématiques",
    targetTitle: "Séance ponctuelle · fonctions trigo",
    when: "Jeu. 4 sept · 20:00 (45 min)",
    price: 180,
    note: "Cours du CNED à revoir. Séance de 45 min ce jeudi si possible.",
  },
  {
    id: "inv-03",
    from: { name: "Lina Ouazzani", initials: "LO", level: "Prépa MPSI" },
    subject: "Maths sup",
    targetTitle: "Cycle intensif · algèbre linéaire",
    when: "Sam. 6 sept · 10:00 (90 min)",
    price: 260,
    note: "Prête à payer plus pour un créneau samedi matin.",
  },
  {
    id: "inv-04",
    from: { name: "Mehdi Tazi", initials: "MT", level: "Terminale S" },
    subject: "Mathématiques",
    targetTitle: "Séance récurrente · révision hebdo",
    when: "Chaque mercredi · 19:00 (60 min)",
    price: 200,
    note: "Je bloque sur les récurrences. Peux-tu m'aider avant le DS ?",
  },
  {
    id: "inv-05",
    from: { name: "Rania Benjelloun", initials: "RB", level: "1ère S" },
    subject: "Mathématiques",
    targetTitle: "Séance ponctuelle · rappels dérivées",
    when: "Dim. 7 sept · 11:00 (30 min)",
    price: 160,
  },
];

/* ---------------- Availability (weekly base pattern) ---------------- */

// Availability is no longer a mock. It is `public.teacher_availability`, read
// and written through the server actions in ./actions.ts, and the rows already
// arrive in `WeekSlot` shape. The grid starts empty and fills in once the
// signed-in teacher's week has loaded.

type AvailabilityStatus =
  | "loading"
  | "ready"
  | "anonymous"
  | "not-teacher"
  | "error";

// Anchor: 2026-08-31 (Monday) — matches the "today" seed 2026-09-02 (Wed).
function getMondayOf(date: Date) {
  const d = new Date(date);
  const day = (d.getDay() + 6) % 7; // Mon = 0
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

function fmtRange(monday: Date) {
  const end = new Date(monday);
  end.setDate(end.getDate() + 6);
  const opt: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };
  return `${monday.toLocaleDateString("fr-FR", opt)} – ${end.toLocaleDateString(
    "fr-FR",
    opt,
  )} ${end.getFullYear()}`;
}

/* ================================================================
   Page shell
   ================================================================ */

export default function TeacherSessionsPage() {
  return (
    <Suspense fallback={null}>
      <Inner />
    </Suspense>
  );
}

type TabKey = "sessions" | "invites" | "availability";
type SubTab = "upcoming" | "today" | "past";

const TAB_META: { key: TabKey; label: string }[] = [
  { key: "sessions", label: "Séances" },
  { key: "invites", label: "Invites" },
  { key: "availability", label: "Disponibilités" },
];

const SUB_META: { key: SubTab; label: string }[] = [
  { key: "upcoming", label: "À venir" },
  { key: "today", label: "Aujourd'hui" },
  { key: "past", label: "Historique" },
];

function parseTab(v: string | null): TabKey {
  if (v === "invites" || v === "availability" || v === "sessions") return v;
  return "sessions";
}

function isSameLocalDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function Inner() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [tab, setTab] = useState<TabKey>(parseTab(searchParams.get("tab")));
  const [subTab, setSubTab] = useState<SubTab>("today");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mobileDetailId, setMobileDetailId] = useState<string | null>(null);

  const [invites, setInvites] = useState<PendingInvite[]>(initialInvites);
  const [handledInvites, setHandledInvites] = useState<Set<string>>(new Set());

  const [slots, setSlots] = useState<WeekSlot[]>([]);
  const [availabilityStatus, setAvailabilityStatus] =
    useState<AvailabilityStatus>("loading");
  const [availabilityNotice, setAvailabilityNotice] = useState<string | null>(
    null,
  );
  const [availabilityTimezone, setAvailabilityTimezone] = useState<
    string | null
  >(null);
  const [savingAvailability, startAvailabilitySave] = useTransition();

  // MOCK: blocked dates are calendar exceptions, not recurring availability.
  // Task 04 modelled the recurring week only, so these stay local state.
  const [blockedDates, setBlockedDates] = useState<string[]>([
    "2026-09-04",
    "2026-09-10",
  ]);

  const [weekOffset, setWeekOffset] = useState(0);
  const [now] = useState<Date>(() => new Date("2026-09-02T14:00:00+01:00"));

  const [createOpen, setCreateOpen] = useState(false);
  const [createInitial, setCreateInitial] = useState<Partial<CreateSessionValues> | undefined>(
    undefined,
  );

  // URL sync
  useEffect(() => {
    const p = new URLSearchParams(Array.from(searchParams.entries()));
    p.set("tab", tab);
    const qs = p.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  /* ---------------- Sessions tab data ---------------- */

  const filtered = useMemo(() => {
    const upcoming: TeacherSession[] = [];
    const today: TeacherSession[] = [];
    const past: TeacherSession[] = [];
    for (const s of activeSessions) {
      const d = new Date(s.when);
      if (s.status === "past") past.push(s);
      else if (isSameLocalDay(d, now) || s.status === "live") today.push(s);
      else upcoming.push(s);
    }
    upcoming.sort((a, b) => new Date(a.when).getTime() - new Date(b.when).getTime());
    today.sort((a, b) => new Date(a.when).getTime() - new Date(b.when).getTime());
    past.sort((a, b) => new Date(b.when).getTime() - new Date(a.when).getTime());
    return { upcoming, today, past };
  }, [now]);

  const currentList = filtered[subTab];
  const counts = {
    upcoming: filtered.upcoming.length,
    today: filtered.today.length,
    past: filtered.past.length,
  };

  useEffect(() => {
    if (currentList.length === 0) {
      setSelectedId(null);
      return;
    }
    if (!selectedId || !currentList.find((s) => s.id === selectedId)) {
      setSelectedId(currentList[0].id);
    }
  }, [subTab, currentList, selectedId]);

  const selected = useMemo(
    () => (selectedId ? activeSessions.find((s) => s.id === selectedId) ?? null : null),
    [selectedId],
  );
  const mobileDetail = useMemo(
    () => (mobileDetailId ? activeSessions.find((s) => s.id === mobileDetailId) ?? null : null),
    [mobileDetailId],
  );

  const pulsingFor = useCallback(
    (s: SessionDetailData) => {
      if (s.status === "live") return true;
      if (s.status !== "upcoming") return false;
      const mins = Math.round((new Date(s.when).getTime() - now.getTime()) / 60000);
      return mins <= 10 && mins >= -1;
    },
    [now],
  );

  /* ---------------- Invite handlers ---------------- */

  const visibleInvites = useMemo(
    () => invites.filter((i) => !handledInvites.has(i.id)),
    [invites, handledInvites],
  );

  const onInviteAccept = (id: string) => {
    setHandledInvites((prev) => new Set(prev).add(id));
  };
  const onInviteDecline = (id: string) => {
    setHandledInvites((prev) => new Set(prev).add(id));
  };

  /* ---------------- Week / slot handlers ---------------- */

  const weekStart = useMemo(() => {
    const monday = getMondayOf(now);
    monday.setDate(monday.getDate() + weekOffset * 7);
    return monday;
  }, [now, weekOffset]);

  const applyAvailabilityResult = useCallback(
    (result: Awaited<ReturnType<typeof loadMyAvailabilityAction>>) => {
      if (result.status === "ok") {
        setSlots(result.slots);
        setAvailabilityTimezone(result.timezone);
        setAvailabilityStatus("ready");
        setAvailabilityNotice(null);
        return;
      }
      if (result.status === "anonymous") {
        setAvailabilityStatus("anonymous");
        setAvailabilityNotice("Connecte-toi pour gérer tes disponibilités.");
      } else if (result.status === "not-teacher") {
        setAvailabilityStatus("not-teacher");
        setAvailabilityNotice(
          "Seuls les comptes prof publient des disponibilités.",
        );
      } else {
        setAvailabilityStatus("error");
        setAvailabilityNotice(result.message);
      }
    },
    [],
  );

  useEffect(() => {
    let cancelled = false;
    loadMyAvailabilityAction().then((result) => {
      if (!cancelled) applyAvailabilityResult(result);
    });
    return () => {
      cancelled = true;
    };
  }, [applyAvailabilityResult]);

  /**
   * Every edit replaces the whole week. The grid is updated first so the
   * interaction stays immediate, then the server action confirms it and hands
   * back the rows with their real ids. A refused write rolls the grid back
   * instead of leaving a slot on screen the database never accepted.
   */
  const persistSlots = useCallback(
    (next: WeekSlot[]) => {
      const previous = slots;
      setSlots(next);
      startAvailabilitySave(async () => {
        const result = await saveMyAvailabilityAction(next);
        if (result.status === "ok") {
          setSlots(result.slots);
          setAvailabilityTimezone(result.timezone);
          setAvailabilityStatus("ready");
          setAvailabilityNotice("Disponibilités enregistrées.");
          return;
        }
        setSlots(previous);
        if (result.status === "error") {
          setAvailabilityNotice(result.message);
        } else {
          setAvailabilityStatus(result.status);
          setAvailabilityNotice(
            "Connecte-toi avec un compte prof pour enregistrer tes créneaux.",
          );
        }
      });
    },
    [slots],
  );

  const onCreateSlot = (day: number, startMinutes: number, endMinutes: number) => {
    persistSlots([
      ...slots,
      {
        // Temporary id: the database generates the real one and the save
        // result replaces this row wholesale.
        id: `draft-${day}-${startMinutes}-${endMinutes}`,
        day,
        start: minutesToHHMM(startMinutes),
        end: minutesToHHMM(endMinutes),
      },
    ]);
  };

  const onDeleteSlot = (id: string) => {
    persistSlots(slots.filter((s) => s.id !== id));
  };

  const onSlotsChange = (updater: (prev: WeekSlot[]) => WeekSlot[]) => {
    persistSlots(updater(slots));
  };

  const onSlotClick = (id: string) => {
    // Clicking a slot has no editor yet; deletion is the X on the pill.
    void id;
  };

  /* ---------------- FAB actions ---------------- */

  const openCreate = (initial?: Partial<CreateSessionValues>) => {
    setCreateInitial(initial);
    setCreateOpen(true);
  };

  const fabActions = useMemo(
    () => [
      {
        key: "create",
        label: "Créer une séance",
        icon: CalendarPlus,
        onSelect: () => openCreate(),
        tone: "lime" as const,
      },
      {
        key: "block",
        label: "Bloquer un créneau",
        icon: Ban,
        onSelect: () => {
          setTab("availability");
        },
      },
      {
        key: "invite",
        label: "Créer un lien d'invite",
        icon: LinkIcon,
        onSelect: () => {
          if (typeof window !== "undefined") {
            window.alert("Lien d'invite copié (stub) — à brancher.");
          }
        },
      },
    ],
    [],
  );

  /* ---------------- Rendering blocks ---------------- */

  // Adapt SessionDetailDrawer for teacher (relabel via a small wrapper that swaps the CTA
  // by rendering a custom action row above and passing through others).
  // Simpler: SessionDetailDrawer accepts onJoin/onCancel/onReschedule already; the visible
  // label "Rejoindre la séance" is inside the component. Since we're constrained to not
  // modify the drawer, we render the drawer as-is (student experience is aligned enough
  // in French: "Rejoindre la séance" also reads well for a teacher opening a room).
  // The header CTA in the desktop toolbar handles the role-flipped copy.

  const desktopMain = (
    <div className="p-6">
      <PageHeader
        eyebrow={
          <>
            <span>Mes séances</span>
            <span className="h-1 w-1 rounded-full bg-[#D5D7DB]" />
            <span className="font-medium text-[#0B0B0F]">
              {counts.today} aujourd&apos;hui · {counts.upcoming} à venir ·{" "}
              {visibleInvites.length} invite{visibleInvites.length > 1 ? "s" : ""}
            </span>
          </>
        }
        title="Mes séances"
        subline="Gère ta semaine, tes invites et tes créneaux."
        actions={
          <>
            <button
              onClick={() => setTab("availability")}
              className="flex h-9 items-center gap-1.5 rounded-full border border-[#EFEFF1] px-3.5 text-[12px] font-semibold text-[#0B0B0F] transition-colors hover:bg-[#F5F5F7]"
            >
              <CalendarIcon className="h-3.5 w-3.5" strokeWidth={1.75} />
              Disponibilités
            </button>
            <button
              onClick={() => openCreate()}
              className="flex h-9 items-center gap-1.5 rounded-full bg-[#0B0B0F] px-3.5 text-[12px] font-semibold text-white transition-colors hover:bg-[#1a1b21]"
            >
              <Plus className="h-3.5 w-3.5" strokeWidth={2} />
              Créer une séance
            </button>
          </>
        }
      />

      <div className="mt-6">
        <TabSwitcher<TabKey>
          tabs={TAB_META.map((t) => ({
            key: t.key,
            label: t.label,
            count:
              t.key === "sessions"
                ? counts.today + counts.upcoming
                : t.key === "invites"
                ? visibleInvites.length
                : slots.length,
          }))}
          value={tab}
          onChange={setTab}
        />
      </div>

      <div className="mt-5">
        {tab === "sessions" ? (
          <SessionsPane
            subTab={subTab}
            onSubTabChange={setSubTab}
            counts={counts}
            list={currentList}
            selected={selected}
            onSelect={setSelectedId}
            pulseFor={pulsingFor}
          />
        ) : tab === "invites" ? (
          <InvitesPane
            list={visibleInvites}
            onAccept={onInviteAccept}
            onDecline={onInviteDecline}
          />
        ) : (
          <AvailabilityPane
            slots={slots}
            blockedDates={blockedDates}
            weekStart={weekStart}
            weekOffset={weekOffset}
            onPrev={() => setWeekOffset((v) => v - 1)}
            onNext={() => setWeekOffset((v) => v + 1)}
            onToday={() => setWeekOffset(0)}
            onCreateSlot={onCreateSlot}
            onDeleteSlot={onDeleteSlot}
            onSlotClick={onSlotClick}
            onBlockedChange={setBlockedDates}
            onSlotsChange={onSlotsChange}
            status={availabilityStatus}
            notice={availabilityNotice}
            timezone={availabilityTimezone}
            saving={savingAvailability}
          />
        )}
      </div>
    </div>
  );

  const mobileBody = (
    <>
      <div className="mt-2 px-4">
        <TabSwitcher<TabKey>
          tabs={TAB_META.map((t) => ({
            key: t.key,
            label: t.label,
            count:
              t.key === "sessions"
                ? counts.today + counts.upcoming
                : t.key === "invites"
                ? visibleInvites.length
                : slots.length,
          }))}
          value={tab}
          onChange={setTab}
          className="w-full"
        />
      </div>

      <AnimatePresence initial={false} mode="wait">
        {tab === "sessions" ? (
          <motion.div
            key="m-sessions"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={fadeQuick}
          >
            <MobileSessions
              subTab={subTab}
              onSubTabChange={setSubTab}
              counts={counts}
              list={currentList}
              pulseFor={pulsingFor}
              mobileDetail={mobileDetail}
              onOpenDetail={setMobileDetailId}
              onCloseDetail={() => setMobileDetailId(null)}
            />
          </motion.div>
        ) : tab === "invites" ? (
          <motion.div
            key="m-invites"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={fadeQuick}
            className="mt-3 space-y-2.5 px-4"
          >
            {visibleInvites.length === 0 ? (
              <EmptyState
                icon={Inbox}
                title="Pas de nouvelles invites."
                body="Tes prochaines invitations d'élèves s'afficheront ici."
              />
            ) : (
              visibleInvites.map((inv) => (
                <InviteCard
                  key={inv.id}
                  {...inv}
                  onAccept={onInviteAccept}
                  onDecline={onInviteDecline}
                />
              ))
            )}
            <div className="h-4" />
          </motion.div>
        ) : (
          <motion.div
            key="m-avail"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={fadeQuick}
            className="mt-3 px-4"
          >
            <MobileAvailability
              slots={slots}
              blockedDates={blockedDates}
              weekStart={weekStart}
              onDeleteSlot={onDeleteSlot}
              onCreateSlot={onCreateSlot}
              onBlockedChange={setBlockedDates}
              status={availabilityStatus}
              notice={availabilityNotice}
              timezone={availabilityTimezone}
              saving={savingAvailability}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );

  return (
    <>
      <AppShell
        nav={teacherNav}
        mobileTabs={teacherMobileTabs}
        user={teacherAsUser}
        desktopMain={desktopMain}
        mobileHeader={{
          title: "Mes séances",
          subtitle: `${counts.today} aujourd'hui · ${visibleInvites.length} invite${
            visibleInvites.length > 1 ? "s" : ""
          }`,
        }}
        mobileChildren={mobileBody}
      />

      {/* FAB — fixed above mobile tab bar */}
      <div className="fixed bottom-24 right-5 z-[70] md:bottom-8 md:right-8">
        <FloatingCircularMenu actions={fabActions} triggerLabel="Actions rapides" />
      </div>

      <CreateSessionModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        initial={createInitial}
        onSubmit={(v) => {
          // eslint-disable-next-line no-console
          console.info("[teacher-sessions] create session", v);
        }}
      />
    </>
  );
}

/* ================================================================
   Sessions pane — desktop
   ================================================================ */

function SessionsPane({
  subTab,
  onSubTabChange,
  counts,
  list,
  selected,
  onSelect,
  pulseFor,
}: {
  subTab: SubTab;
  onSubTabChange: (v: SubTab) => void;
  counts: Record<SubTab, number>;
  list: TeacherSession[];
  selected: TeacherSession | null;
  onSelect: (id: string) => void;
  pulseFor: (s: SessionDetailData) => boolean;
}) {
  return (
    <>
      <div className="mb-4">
        <TabSwitcher<SubTab>
          tabs={SUB_META.map((t) => ({ key: t.key, label: t.label, count: counts[t.key] }))}
          value={subTab}
          onChange={onSubTabChange}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 min-[1180px]:grid-cols-[minmax(0,1fr)_minmax(360px,400px)]">
        {/* List */}
        <div>
          {list.length === 0 ? (
            <EmptyState
              icon={CalendarIcon}
              title={emptyTitleFor(subTab)}
              body={emptyBodyFor(subTab)}
            />
          ) : (
            <div className="space-y-2">
              {list.map((s) => (
                <TeacherSessionCard
                  key={s.id}
                  session={s}
                  selected={selected?.id === s.id}
                  pulsing={pulseFor(s)}
                  onSelect={() => onSelect(s.id)}
                />
              ))}
            </div>
          )}
        </div>

        <aside className="min-[1180px]:sticky min-[1180px]:top-4 min-[1180px]:h-[calc(100dvh-3.75rem)]">
          <SessionDetailDrawer session={selected} pulsing={selected ? pulseFor(selected) : false} />
        </aside>
      </div>
    </>
  );
}

function TeacherSessionCard({
  session,
  selected,
  pulsing,
  onSelect,
}: {
  session: TeacherSession;
  selected: boolean;
  pulsing: boolean;
  onSelect: () => void;
}) {
  const isPast = session.status === "past";
  return (
    <div className="relative">
      <SessionCard
        id={session.id}
        title={session.title}
        subject={session.subject}
        teacher={session.teacher}
        whenLabel={session.whenLabel}
        when={session.when}
        duration={session.duration}
        status={session.status}
        dot={session.dot}
        selected={selected}
        pulsing={pulsing}
        onSelect={onSelect}
      />
      {!isPast ? (
        <div className="mt-1 flex flex-wrap items-center gap-1.5 pl-16 pr-3.5 pb-1 min-[900px]:hidden">
          <button
            type="button"
            onClick={onSelect}
            className="flex items-center gap-1 rounded-full bg-[#0B0B0F] px-2.5 py-1 text-[10.5px] font-semibold text-white"
          >
            <DoorOpen className="h-3 w-3" strokeWidth={2} />
            Ouvrir la salle
          </button>
          <button
            type="button"
            className="flex items-center gap-1 rounded-full border border-[#EFEFF1] px-2.5 py-1 text-[10.5px] font-semibold text-[#0B0B0F]"
          >
            <RotateCcw className="h-3 w-3" strokeWidth={1.75} />
            Reprogrammer
          </button>
        </div>
      ) : null}
    </div>
  );
}

function emptyTitleFor(sub: SubTab) {
  if (sub === "today") return "Aucune séance aujourd'hui";
  if (sub === "upcoming") return "Rien à venir pour l'instant";
  return "Pas encore d'historique";
}
function emptyBodyFor(sub: SubTab) {
  if (sub === "today") return "Profites-en pour préparer tes prochaines séances.";
  if (sub === "upcoming") return "Crée une séance ou accepte une invite pour remplir ta semaine.";
  return "Tes séances passées apparaîtront ici.";
}

/* ================================================================
   Invites pane — desktop
   ================================================================ */

function InvitesPane({
  list,
  onAccept,
  onDecline,
}: {
  list: PendingInvite[];
  onAccept: (id: string) => void;
  onDecline: (id: string) => void;
}) {
  if (list.length === 0) {
    return (
      <EmptyState
        icon={Inbox}
        title="Pas de nouvelles invites."
        body="Tes prochaines invitations d'élèves s'afficheront ici."
      />
    );
  }
  return (
    <div className="grid grid-cols-1 gap-3 min-[1080px]:grid-cols-2">
      {list.map((inv) => (
        <InviteCard key={inv.id} {...inv} onAccept={onAccept} onDecline={onDecline} />
      ))}
    </div>
  );
}

/* ================================================================
   Availability pane — desktop
   ================================================================ */

function AvailabilityPane({
  slots,
  blockedDates,
  weekStart,
  weekOffset,
  onPrev,
  onNext,
  onToday,
  onCreateSlot,
  onDeleteSlot,
  onSlotClick,
  onBlockedChange,
  onSlotsChange,
  status,
  notice,
  timezone,
  saving,
}: {
  status: AvailabilityStatus;
  notice: string | null;
  timezone: string | null;
  saving: boolean;
  slots: WeekSlot[];
  blockedDates: string[];
  weekStart: Date;
  weekOffset: number;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onCreateSlot: (day: number, s: number, e: number) => void;
  onDeleteSlot: (id: string) => void;
  onSlotClick: (id: string) => void;
  onBlockedChange: (v: string[]) => void;
  onSlotsChange: (updater: (prev: WeekSlot[]) => WeekSlot[]) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 min-[1180px]:grid-cols-[minmax(0,1fr)_320px]">
      {/* Left — grid */}
      <div>
        <div className="mb-3 flex items-center gap-2">
          <button
            type="button"
            onClick={onPrev}
            aria-label="Semaine précédente"
            className="grid h-8 w-8 place-items-center rounded-full border border-[#EFEFF1] text-[#0B0B0F] transition-colors hover:bg-[#F5F5F7]"
          >
            <ChevronLeft className="h-3.5 w-3.5" strokeWidth={1.75} />
          </button>
          <button
            type="button"
            onClick={onNext}
            aria-label="Semaine suivante"
            className="grid h-8 w-8 place-items-center rounded-full border border-[#EFEFF1] text-[#0B0B0F] transition-colors hover:bg-[#F5F5F7]"
          >
            <ChevronRight className="h-3.5 w-3.5" strokeWidth={1.75} />
          </button>
          <div className="ml-1 flex flex-col">
            <span className="text-[10px] font-semibold uppercase tracking-[0.06em] text-[#8A8D93]">
              {weekOffset === 0
                ? "Cette semaine"
                : weekOffset < 0
                ? `Il y a ${-weekOffset} sem.`
                : `Dans ${weekOffset} sem.`}
            </span>
            <span className="text-[13px] font-semibold text-[#0B0B0F]">
              {fmtRange(weekStart)}
            </span>
          </div>
          {weekOffset !== 0 ? (
            <button
              type="button"
              onClick={onToday}
              className="ml-auto rounded-full bg-[#F0F0F2] px-2.5 py-1 text-[11px] font-semibold text-[#0B0B0F] transition-colors hover:bg-[#EFEFF1]"
            >
              Aujourd&apos;hui
            </button>
          ) : null}
        </div>

        <AvailabilityNotice
          status={status}
          notice={notice}
          timezone={timezone}
          saving={saving}
        />

        <WeekGrid
          slots={slots}
          blockedDates={blockedDates}
          currentWeekStart={weekStart}
          onCreateSlot={onCreateSlot}
          onSlotClick={onSlotClick}
          onSlotDelete={onDeleteSlot}
        />
      </div>

      {/* Right — rules & blocked dates */}
      <aside className="space-y-3">
        <RecurringRuleCard onApply={onSlotsChange} />
        <BlockedDatesCard blockedDates={blockedDates} onChange={onBlockedChange} />
      </aside>
    </div>
  );
}

/**
 * Says what actually happened to the week: still loading, saved, refused, or
 * not editable because nobody is signed in. Without it an optimistic grid that
 * silently rolled back would look like the edit had worked.
 */
function AvailabilityNotice({
  status,
  notice,
  timezone,
  saving,
}: {
  status: AvailabilityStatus;
  notice: string | null;
  timezone: string | null;
  saving: boolean;
}) {
  const text = saving
    ? "Enregistrement…"
    : status === "loading"
      ? "Chargement de tes disponibilités…"
      : notice;

  if (!text && !timezone) return null;

  const isProblem =
    !saving &&
    (status === "anonymous" || status === "not-teacher" || status === "error");

  return (
    <div className="mb-2 flex flex-wrap items-center gap-x-2 gap-y-1">
      {text ? (
        <p
          role={isProblem ? "alert" : undefined}
          aria-live={isProblem ? "assertive" : "polite"}
          className={cn(
            "inline-flex items-center gap-1 text-[11px] font-medium",
            isProblem ? "text-[#C53434]" : "text-[#8A8D93]",
          )}
        >
          {/* An icon as well as the red: a refused save must not be signalled
              by colour alone. */}
          {isProblem ? (
            <AlertCircle aria-hidden className="h-3 w-3 shrink-0" strokeWidth={2} />
          ) : null}
          {text}
        </p>
      ) : null}
      {timezone ? (
        <p className="inline-flex items-center gap-1 text-[11px] text-[#8A8D93]">
          <Clock aria-hidden className="h-3 w-3" strokeWidth={1.75} />
          {timezone}
        </p>
      ) : null}
    </div>
  );
}

/* ---------------- Recurring rule card ---------------- */

const RULE_DAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

function RecurringRuleCard({
  onApply,
}: {
  onApply: (updater: (prev: WeekSlot[]) => WeekSlot[]) => void;
}) {
  const [selected, setSelected] = useState<boolean[]>([true, true, true, true, true, false, false]);
  const [start, setStart] = useState("14:00");
  const [end, setEnd] = useState("19:00");

  const toggle = (i: number) => {
    setSelected((prev) => prev.map((v, idx) => (idx === i ? !v : v)));
  };

  const applyRule = () => {
    const s = hhmmToMinutes(start);
    const e = hhmmToMinutes(end);
    if (e <= s) return;
    onApply((prev) => {
      const next = [...prev];
      selected.forEach((on, day) => {
        if (!on) return;
        next.push({
          id: `rule-${Date.now()}-${day}`,
          day,
          start,
          end,
        });
      });
      return next;
    });
  };

  return (
    <section className="rounded-[16px] border border-[#EFEFF1] bg-white p-4">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-[family-name:var(--font-cabinet)] text-[14px] font-bold text-[#0B0B0F]">
            Règle récurrente
          </h3>
          <p className="mt-0.5 text-[11px] text-[#8A8D93]">Appliqué à toutes les semaines.</p>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-7 gap-1">
        {RULE_DAYS.map((d, i) => (
          <button
            key={d}
            type="button"
            onClick={() => toggle(i)}
            aria-pressed={selected[i]}
            className={cn(
              "h-8 rounded-md text-[10.5px] font-semibold transition-colors",
              selected[i]
                ? "bg-[#0B0B0F] text-white"
                : "bg-[#F5F5F7] text-[#4A4D54] hover:bg-[#EFEFF1]",
            )}
          >
            {d}
          </button>
        ))}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <label className="block">
          <span className="text-[10.5px] font-semibold text-[#8A8D93]">Début</span>
          <input
            type="time"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            className="mt-1 h-9 w-full rounded-[10px] border border-[#EFEFF1] bg-white px-2.5 text-[12px] text-[#0B0B0F] focus:border-[#0B0B0F] focus:outline-none"
          />
        </label>
        <label className="block">
          <span className="text-[10.5px] font-semibold text-[#8A8D93]">Fin</span>
          <input
            type="time"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            className="mt-1 h-9 w-full rounded-[10px] border border-[#EFEFF1] bg-white px-2.5 text-[12px] text-[#0B0B0F] focus:border-[#0B0B0F] focus:outline-none"
          />
        </label>
      </div>

      <button
        type="button"
        onClick={applyRule}
        className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-full bg-[#DFFF3F] py-2 text-[12px] font-semibold text-[#0B0B0F] transition-[filter] hover:brightness-[0.97]"
      >
        <RotateCcw className="h-3.5 w-3.5" strokeWidth={2} />
        Appliquer chaque semaine
      </button>
    </section>
  );
}

function BlockedDatesCard({
  blockedDates,
  onChange,
}: {
  blockedDates: string[];
  onChange: (v: string[]) => void;
}) {
  const [newDate, setNewDate] = useState("");

  const add = () => {
    if (!newDate || blockedDates.includes(newDate)) return;
    onChange([...blockedDates, newDate].sort());
    setNewDate("");
  };

  const remove = (d: string) => {
    onChange(blockedDates.filter((x) => x !== d));
  };

  return (
    <section className="rounded-[16px] border border-[#EFEFF1] bg-white p-4">
      <h3 className="font-[family-name:var(--font-cabinet)] text-[14px] font-bold text-[#0B0B0F]">
        Dates bloquées
      </h3>
      <p className="mt-0.5 text-[11px] text-[#8A8D93]">
        Vacances, examens, congés — indispo intégrale sur la journée.
      </p>

      <div className="mt-3 flex items-center gap-1.5">
        <input
          type="date"
          value={newDate}
          onChange={(e) => setNewDate(e.target.value)}
          className="h-9 flex-1 rounded-[10px] border border-[#EFEFF1] bg-white px-2.5 text-[12px] text-[#0B0B0F] focus:border-[#0B0B0F] focus:outline-none"
        />
        <button
          type="button"
          onClick={add}
          className="grid h-9 w-9 place-items-center rounded-full bg-[#0B0B0F] text-white transition-colors hover:bg-[#1a1b21]"
          aria-label="Ajouter"
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={2} />
        </button>
      </div>

      <ul className="mt-3 divide-y divide-[#EFEFF1] overflow-hidden rounded-[12px] border border-[#EFEFF1]">
        {blockedDates.length === 0 ? (
          <li className="p-3 text-center text-[11.5px] text-[#8A8D93]">Aucune date bloquée.</li>
        ) : (
          blockedDates.map((d) => (
            <li key={d} className="flex items-center gap-2 px-3 py-2">
              <CalendarIcon className="h-3.5 w-3.5 text-[#8A8D93]" strokeWidth={1.75} />
              <span className="flex-1 text-[12px] font-semibold text-[#0B0B0F] tabular-nums">
                {formatBlockedDate(d)}
              </span>
              <button
                type="button"
                onClick={() => remove(d)}
                aria-label="Retirer"
                className="grid h-7 w-7 place-items-center rounded-full text-[#8A8D93] hover:bg-[#F5F5F7] hover:text-[#D95555]"
              >
                <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />
              </button>
            </li>
          ))
        )}
      </ul>
    </section>
  );
}

function formatBlockedDate(iso: string) {
  try {
    const [y, m, d] = iso.split("-").map((n) => parseInt(n, 10));
    const dt = new Date(y, (m ?? 1) - 1, d ?? 1);
    return dt.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" });
  } catch {
    return iso;
  }
}

/* ================================================================
   MOBILE — sessions & availability
   ================================================================ */

function MobileSessions({
  subTab,
  onSubTabChange,
  counts,
  list,
  pulseFor,
  mobileDetail,
  onOpenDetail,
  onCloseDetail,
}: {
  subTab: SubTab;
  onSubTabChange: (v: SubTab) => void;
  counts: Record<SubTab, number>;
  list: TeacherSession[];
  pulseFor: (s: SessionDetailData) => boolean;
  mobileDetail: TeacherSession | null;
  onOpenDetail: (id: string) => void;
  onCloseDetail: () => void;
}) {
  return (
    <>
      <div className="mt-3 px-4">
        <TabSwitcher<SubTab>
          tabs={SUB_META.map((t) => ({ key: t.key, label: t.label, count: counts[t.key] }))}
          value={subTab}
          onChange={onSubTabChange}
          className="w-full"
        />
      </div>

      <AnimatePresence initial={false} mode="wait">
        {mobileDetail ? (
          <motion.div
            key="m-detail"
            initial={{ x: 40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 40, opacity: 0 }}
            transition={fadeQuick}
            className="mt-3 min-h-[70dvh] px-4"
          >
            <SessionDetailDrawer
              session={mobileDetail}
              variant="fullscreen"
              onBack={onCloseDetail}
              pulsing={pulseFor(mobileDetail)}
            />
          </motion.div>
        ) : (
          <motion.div
            key="m-list"
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -20, opacity: 0 }}
            transition={fadeQuick}
            className="mt-3 space-y-2 px-4"
          >
            {list.length === 0 ? (
              <EmptyState
                icon={Search}
                title={emptyTitleFor(subTab)}
                body={emptyBodyFor(subTab)}
              />
            ) : (
              list.map((s) => (
                <MobileSessionRow
                  key={s.id}
                  s={s}
                  pulsing={pulseFor(s)}
                  onOpen={() => onOpenDetail(s.id)}
                />
              ))
            )}
            <div className="h-4" />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function MobileSessionRow({
  s,
  pulsing,
  onOpen,
}: {
  s: TeacherSession;
  pulsing: boolean;
  onOpen: () => void;
}) {
  const isLive = s.status === "live";
  const isPast = s.status === "past";
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
      className={cn(
        "cursor-pointer rounded-[16px] border p-3.5 transition-colors",
        isPast
          ? "border-[#EFEFF1] bg-[#F5F5F7]/60"
          : "border-[#EFEFF1] bg-white hover:border-[#D5D7DB]",
      )}
    >
      <div className="flex items-start gap-3">
        <div className="relative grid h-11 w-11 shrink-0 place-items-center rounded-[12px] bg-[#F5F5F7]">
          <CalendarIcon className="h-4 w-4 text-[#0B0B0F]" strokeWidth={1.75} />
          <span
            className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-white"
            style={{ backgroundColor: s.dot ?? "#C4CFFF" }}
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.06em] text-[#8A8D93]">
              {s.whenLabel}
            </p>
            {isLive ? (
              <span className="inline-flex h-4 items-center gap-1 rounded-full bg-[#DFFF3F] px-1.5 text-[9.5px] font-semibold text-[#0B0B0F]">
                <span className="h-1 w-1 animate-pulse rounded-full bg-[#0B0B0F]" />
                En cours
              </span>
            ) : null}
          </div>
          <p className="mt-0.5 line-clamp-2 text-[13.5px] font-semibold text-[#0B0B0F]">
            {s.title}
          </p>
          <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-[#8A8D93]">
            <Avatar initials={s.teacher.initials} size={14} tone="neutral" />
            <span className="truncate">{s.teacher.name}</span>
            <span className="h-0.5 w-0.5 rounded-full bg-[#D5D7DB]" />
            <Clock className="h-3 w-3" strokeWidth={1.75} />
            <span>{s.duration}</span>
          </div>
        </div>
      </div>
      {!isPast ? (
        <div className="mt-3">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpen();
            }}
            className={cn(
              "relative flex w-full items-center justify-center gap-1.5 rounded-full py-2 text-[12px] font-semibold transition-colors",
              isLive || pulsing
                ? "bg-[#DFFF3F] text-[#0B0B0F] hover:brightness-[0.97]"
                : "bg-[#0B0B0F] text-white hover:bg-[#1a1b21]",
            )}
          >
            {pulsing ? (
              <motion.span
                aria-hidden
                animate={{ scale: [1, 1.04, 1] }}
                transition={{ repeat: Infinity, duration: 1.6 }}
                className="pointer-events-none absolute inset-0 rounded-full ring-2 ring-[#DFFF3F]"
              />
            ) : null}
            <span className="relative flex items-center gap-1.5">
              <DoorOpen className="h-3.5 w-3.5" strokeWidth={2} />
              {isLive ? "Ouvrir la salle" : "Ouvrir la salle"}
            </span>
          </button>
        </div>
      ) : null}
    </div>
  );
}

/* ---------------- Mobile availability ---------------- */

const MOBILE_DAY_LABELS = ["L", "M", "M", "J", "V", "S", "D"];
const MOBILE_DAY_FULL = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];

function MobileAvailability({
  slots,
  blockedDates,
  weekStart,
  onDeleteSlot,
  onCreateSlot,
  onBlockedChange,
  status,
  notice,
  timezone,
  saving,
}: {
  slots: WeekSlot[];
  blockedDates: string[];
  weekStart: Date;
  onDeleteSlot: (id: string) => void;
  onCreateSlot: (day: number, s: number, e: number) => void;
  onBlockedChange: (v: string[]) => void;
  status: AvailabilityStatus;
  notice: string | null;
  timezone: string | null;
  saving: boolean;
}) {
  const [activeDay, setActiveDay] = useState(2); // Wednesday default
  const [showBlocked, setShowBlocked] = useState(false);
  const [newStart, setNewStart] = useState("14:00");
  const [newEnd, setNewEnd] = useState("15:00");

  const daySlots = slots
    .filter((s) => s.day === activeDay)
    .sort((a, b) => hhmmToMinutes(a.start) - hhmmToMinutes(b.start));

  const addSlot = () => {
    const s = hhmmToMinutes(newStart);
    const e = hhmmToMinutes(newEnd);
    if (e > s) onCreateSlot(activeDay, s, e);
  };

  return (
    <div className="space-y-3">
      <AvailabilityNotice
        status={status}
        notice={notice}
        timezone={timezone}
        saving={saving}
      />

      {/* Week strip */}
      <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#8A8D93]">
        {fmtRange(weekStart)}
      </div>
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {MOBILE_DAY_LABELS.map((d, i) => {
          const dayDate = new Date(weekStart);
          dayDate.setDate(dayDate.getDate() + i);
          const isActive = activeDay === i;
          return (
            <button
              key={i}
              type="button"
              onClick={() => setActiveDay(i)}
              className={cn(
                "flex h-14 w-11 shrink-0 flex-col items-center justify-center gap-0.5 rounded-[12px] border transition-colors",
                isActive
                  ? "border-[#0B0B0F] bg-[#0B0B0F] text-white"
                  : "border-[#EFEFF1] bg-white text-[#0B0B0F] hover:bg-[#F5F5F7]",
              )}
            >
              <span className="text-[10px] font-semibold uppercase tracking-[0.06em]">{d}</span>
              <span
                className={cn(
                  "text-[13px] font-bold tabular-nums",
                  isActive ? "text-white" : "text-[#0B0B0F]",
                )}
              >
                {dayDate.getDate()}
              </span>
            </button>
          );
        })}
      </div>

      {/* Day slots */}
      <section className="rounded-[16px] border border-[#EFEFF1] bg-white p-3">
        <div className="mb-2 flex items-baseline justify-between">
          <h3 className="text-[13px] font-semibold text-[#0B0B0F]">
            {MOBILE_DAY_FULL[activeDay]}
          </h3>
          <span className="text-[10.5px] text-[#8A8D93]">
            {daySlots.length} créneau{daySlots.length > 1 ? "x" : ""}
          </span>
        </div>
        {daySlots.length === 0 ? (
          <p className="rounded-[12px] border border-dashed border-[#EFEFF1] p-3 text-center text-[11.5px] text-[#8A8D93]">
            Aucun créneau ce jour.
          </p>
        ) : (
          <ul className="space-y-1.5">
            {daySlots.map((s) => (
              <li
                key={s.id}
                className="flex items-center gap-2 rounded-[10px] border border-[#EFEFF1] bg-white px-3 py-2"
              >
                <Clock className="h-3.5 w-3.5 text-[#8A8D93]" strokeWidth={1.75} />
                <span className="flex-1 text-[12.5px] font-semibold text-[#0B0B0F] tabular-nums">
                  {s.start} – {s.end}
                </span>
                <button
                  type="button"
                  onClick={() => onDeleteSlot(s.id)}
                  aria-label="Supprimer"
                  className="grid h-7 w-7 place-items-center rounded-full text-[#8A8D93] hover:bg-[#F5F5F7] hover:text-[#D95555]"
                >
                  <X className="h-3.5 w-3.5" strokeWidth={2} />
                </button>
              </li>
            ))}
          </ul>
        )}

        {/* Add form */}
        <div className="mt-3 flex items-center gap-1.5">
          <input
            type="time"
            value={newStart}
            onChange={(e) => setNewStart(e.target.value)}
            className="h-9 flex-1 rounded-[10px] border border-[#EFEFF1] bg-white px-2.5 text-[12px] text-[#0B0B0F] focus:border-[#0B0B0F] focus:outline-none"
          />
          <span className="text-[11px] text-[#8A8D93]">→</span>
          <input
            type="time"
            value={newEnd}
            onChange={(e) => setNewEnd(e.target.value)}
            className="h-9 flex-1 rounded-[10px] border border-[#EFEFF1] bg-white px-2.5 text-[12px] text-[#0B0B0F] focus:border-[#0B0B0F] focus:outline-none"
          />
          <button
            type="button"
            onClick={addSlot}
            className="grid h-9 w-9 place-items-center rounded-full bg-[#0B0B0F] text-white transition-colors hover:bg-[#1a1b21]"
            aria-label="Ajouter un créneau"
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={2} />
          </button>
        </div>
      </section>

      {/* Blocked dates collapsible */}
      <section className="rounded-[16px] border border-[#EFEFF1] bg-white">
        <button
          type="button"
          onClick={() => setShowBlocked((v) => !v)}
          className="flex w-full items-center justify-between p-3 text-left"
        >
          <div>
            <p className="text-[13px] font-semibold text-[#0B0B0F]">Dates bloquées</p>
            <p className="mt-0.5 text-[10.5px] text-[#8A8D93]">
              {blockedDates.length} journée{blockedDates.length > 1 ? "s" : ""} indispo
            </p>
          </div>
          <motion.span
            animate={{ rotate: showBlocked ? 45 : 0 }}
            transition={springTight}
            className="grid h-7 w-7 place-items-center rounded-full bg-[#F5F5F7] text-[#0B0B0F]"
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={2} />
          </motion.span>
        </button>
        <AnimatePresence initial={false}>
          {showBlocked ? (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={springTight}
              className="overflow-hidden"
            >
              <div className="border-t border-[#EFEFF1] p-3">
                <BlockedDatesCard
                  blockedDates={blockedDates}
                  onChange={onBlockedChange}
                />
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </section>

      <div className="h-4" />
    </div>
  );
}
