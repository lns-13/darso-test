"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowUpRight,
  Calendar as CalendarIcon,
  ChevronDown,
  ChevronUp,
  Clock,
  Download,
  FileText,
  Play,
  Search,
  Video,
} from "lucide-react";
import { AppShell } from "@/components/app/app-shell";
import { PageHeader } from "@/components/app/page-header";
import { TabSwitcher } from "@/components/app/tab-switcher";
import { EmptyState } from "@/components/app/empty-state";
import { Avatar } from "@/components/app/avatar";
import { JoinSessionModal } from "@/components/app/join-session-modal";
import { SessionCard } from "@/components/app/session-card";
import {
  SessionDetailDrawer,
  type SessionDetailData,
  type SessionMaterial,
} from "@/components/app/session-detail-drawer";
import { studentMobileTabs, studentNav } from "@/lib/nav";
import { fadeQuick, springTight } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { downloadTextPdf } from "@/lib/download-pdf";

/* ---------------- MOCK: replace when API lands ---------------- */

const student = {
  firstName: "Sara",
  fullName: "Sara Bencheikh",
  level: "Terminale S · Lycée Descartes",
  initials: "SB",
};

// Today anchor — 2026-09-02 (Wed). All ISO times relative to this.
// Using explicit ISO strings so the mock is deterministic regardless of TZ.
const T = {
  // Within 10 min from "now" — should pulse
  in5min: "2026-09-02T14:05:00+01:00",
  in90min: "2026-09-02T15:30:00+01:00",
  liveNow: "2026-09-02T13:45:00+01:00",
  tomorrowEve: "2026-09-03T18:00:00+01:00",
  tomorrowNight: "2026-09-03T20:30:00+01:00",
  friday: "2026-09-04T17:00:00+01:00",
  nextTuesday: "2026-09-08T18:30:00+01:00",
  nextThursday: "2026-09-10T19:00:00+01:00",
  weekAgo: "2026-08-26T18:00:00+01:00",
  twoWeeksAgo: "2026-08-19T17:00:00+01:00",
  threeWeeksAgo: "2026-08-12T19:00:00+01:00",
  monthAgo: "2026-08-02T16:00:00+01:00",
};

type MockSession = SessionDetailData & {
  dot?: string;
};

const sessions: MockSession[] = [
  {
    id: "s-live",
    title: "Analyse — dérivées & fonction composée",
    subject: "Mathématiques",
    teacher: { name: "Youssef Amrani", initials: "YA" },
    whenLabel: "Aujourd'hui · 13:45",
    when: T.liveNow,
    duration: "60 min",
    status: "live",
    dot: "#DFFF3F",
    agenda: [
      "Rappel dérivée d'une composée",
      "Application aux suites récurrentes",
      "Exercice type bac corrigé",
    ],
    notes: "Prépare la fiche § 3.2 et note tes 3 questions bloquantes.",
    materials: [
      { id: "m1", name: "Fiche exos — dérivées composées.pdf", size: "820 Ko", kind: "pdf" },
    ],
  },
  {
    id: "s-soon",
    title: "DELF B2 — essai argumenté pour la fac",
    subject: "Français",
    teacher: { name: "Marc Dupont", initials: "MD" },
    whenLabel: "Aujourd'hui · 14:05",
    when: T.in5min,
    duration: "45 min",
    status: "upcoming",
    dot: "#C4CFFF",
    agenda: [
      "Structure de l'essai argumenté",
      "Connecteurs logiques ciblés B2",
      "Correction de ton dernier essai",
    ],
    notes: "Relis les 4 connecteurs vus la dernière fois.",
    materials: [
      { id: "m2", name: "Grille DELF B2 — écrit.pdf", size: "410 Ko", kind: "pdf" },
      { id: "m3", name: "Corpus TV5 · argumentation", kind: "link" },
    ],
  },
  {
    id: "s-today-late",
    title: "Physique — mécanique du solide, TD 4",
    subject: "Physique-Chimie",
    teacher: { name: "Nadia Cherkaoui", initials: "NC" },
    whenLabel: "Aujourd'hui · 15:30",
    when: T.in90min,
    duration: "90 min",
    status: "upcoming",
    dot: "#F0EDE4",
    agenda: [
      "Théorème du moment cinétique",
      "Pendule pesant — étude complète",
      "Passage en revue TD 4 exos 3 à 6",
    ],
    notes: "Amène ton cahier TD, on corrige ensemble.",
    materials: [{ id: "m4", name: "TD4 — mécanique du solide.pdf", size: "1.2 Mo", kind: "pdf" }],
  },
  {
    id: "s-tomorrow-1",
    title: "SVT — génétique & brassages inter/intra",
    subject: "SVT",
    teacher: { name: "Karim El Fassi", initials: "KE" },
    whenLabel: "Demain · 18:00",
    when: T.tomorrowEve,
    duration: "75 min",
    status: "upcoming",
    dot: "#C4CFFF",
    agenda: ["Rappels méiose", "Brassage inter/intra chromosomique", "Exos bac"],
  },
  {
    id: "s-tomorrow-2",
    title: "Anglais IELTS — speaking part 2",
    subject: "Anglais",
    teacher: { name: "Emma Whitfield", initials: "EW" },
    whenLabel: "Demain · 20:30",
    when: T.tomorrowNight,
    duration: "45 min",
    status: "upcoming",
    dot: "#DFFF3F",
  },
  {
    id: "s-friday",
    title: "Français — commentaire Balzac",
    subject: "Français",
    teacher: { name: "Chloé Bernard", initials: "CB" },
    whenLabel: "Ven. 4 sept · 17:00",
    when: T.friday,
    duration: "60 min",
    status: "upcoming",
    dot: "#F0EDE4",
  },
  {
    id: "s-next-tue",
    title: "Maths — grand oral, structuration",
    subject: "Mathématiques",
    teacher: { name: "Youssef Amrani", initials: "YA" },
    whenLabel: "Mar. 8 sept · 18:30",
    when: T.nextTuesday,
    duration: "60 min",
    status: "upcoming",
    dot: "#C4CFFF",
  },
  {
    id: "s-next-thu",
    title: "Physique — thermodynamique, chapitre 2",
    subject: "Physique-Chimie",
    teacher: { name: "Rachid Benhaddou", initials: "RB" },
    whenLabel: "Jeu. 10 sept · 19:00",
    when: T.nextThursday,
    duration: "90 min",
    status: "upcoming",
    dot: "#F0EDE4",
  },
  {
    id: "s-past-1",
    title: "Analyse — limites & continuité",
    subject: "Mathématiques",
    teacher: { name: "Youssef Amrani", initials: "YA" },
    whenLabel: "Mer. 26 août · 18:00",
    when: T.weekAgo,
    duration: "60 min",
    status: "past",
    dot: "#C4CFFF",
    recordingUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    recordingPoster: "https://storage.googleapis.com/gtv-videos-bucket/sample/images/BigBuckBunny.jpg",
    notes:
      "Bon rythme sur les théorèmes de comparaison. À revoir :\n· Formes indéterminées en +∞\n· Continuité par morceaux (cas 2.b du TD)",
    materials: [
      { id: "p1", name: "Correction TD limites.pdf", size: "540 Ko", kind: "pdf" },
      { id: "p2", name: "Slides — continuité", kind: "slides", size: "3.1 Mo" },
    ],
  },
  {
    id: "s-past-2",
    title: "DELF B2 — compréhension orale",
    subject: "Français",
    teacher: { name: "Marc Dupont", initials: "MD" },
    whenLabel: "Mer. 19 août · 17:00",
    when: T.twoWeeksAgo,
    duration: "45 min",
    status: "past",
    dot: "#F0EDE4",
    recordingUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    recordingPoster: "https://storage.googleapis.com/gtv-videos-bucket/sample/images/ElephantsDream.jpg",
    notes: "Score simulation : 17/25. Objectif prochaine séance : 20/25.",
    materials: [{ id: "p3", name: "Transcription audio B2.pdf", size: "320 Ko", kind: "pdf" }],
  },
  {
    id: "s-past-3",
    title: "SVT — évolution & sélection naturelle",
    subject: "SVT",
    teacher: { name: "Karim El Fassi", initials: "KE" },
    whenLabel: "Mer. 12 août · 19:00",
    when: T.threeWeeksAgo,
    duration: "60 min",
    status: "past",
    dot: "#C4CFFF",
    notes: "Fiche synthèse OK. À creuser : dérive génétique.",
    materials: [{ id: "p4", name: "Fiche synthèse — évolution.pdf", size: "280 Ko", kind: "pdf" }],
  },
  {
    id: "s-past-4",
    title: "Physique — ondes mécaniques progressives",
    subject: "Physique-Chimie",
    teacher: { name: "Nadia Cherkaoui", initials: "NC" },
    whenLabel: "Dim. 2 août · 16:00",
    when: T.monthAgo,
    duration: "90 min",
    status: "past",
    dot: "#F0EDE4",
    recordingUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
  },
];

/* ---------------- Page ---------------- */

export default function StudentSessionsPage() {
  return (
    <Suspense fallback={null}>
      <SessionsInner />
    </Suspense>
  );
}

type TabKey = "upcoming" | "today" | "past";

const TAB_META: { key: TabKey; label: string; short?: string }[] = [
  { key: "upcoming", label: "À venir", short: "À venir" },
  { key: "today", label: "Aujourd'hui", short: "Aujourd'hui" },
  { key: "past", label: "Historique", short: "Historique" },
];

function parseTabParam(v: string | null): TabKey {
  if (v === "today" || v === "past" || v === "upcoming") return v;
  return "today";
}

function isSameLocalDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function minutesUntil(iso: string, now: Date) {
  const d = new Date(iso).getTime();
  return Math.round((d - now.getTime()) / 60000);
}

function SessionsInner() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const initialTab = parseTabParam(searchParams.get("tab"));
  const [tab, setTab] = useState<TabKey>(initialTab);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mobileDetailId, setMobileDetailId] = useState<string | null>(null);
  const [expandedPastId, setExpandedPastId] = useState<string | null>(null);
  const [joinSessionId, setJoinSessionId] = useState<string | null>(null);
  const [cancelledIds, setCancelledIds] = useState<Set<string>>(() => new Set());
  const [notice, setNotice] = useState<string | null>(null);

  // Ticks every 30s so pulse timing stays accurate.
  const [now, setNow] = useState<Date>(() => new Date("2026-09-02T14:00:00+01:00"));
  useEffect(() => {
    // Use real clock but seeded once from mock "today" to keep demo predictable.
    // If real "now" is far from mock, we still tick real time.
    const startReal = Date.now();
    const startMock = new Date("2026-09-02T14:00:00+01:00").getTime();
    const offset = startMock - startReal;
    const id = setInterval(() => {
      setNow(new Date(Date.now() + offset));
    }, 30000);
    return () => clearInterval(id);
  }, []);

  // Filter sessions per tab
  const filtered = useMemo(() => {
    const upcoming: MockSession[] = [];
    const today: MockSession[] = [];
    const past: MockSession[] = [];
    for (const s of sessions) {
      if (cancelledIds.has(s.id)) continue;
      const d = new Date(s.when);
      if (s.status === "past") {
        past.push(s);
      } else if (isSameLocalDay(d, now) || s.status === "live") {
        today.push(s);
      } else {
        upcoming.push(s);
      }
    }
    // sort
    upcoming.sort((a, b) => new Date(a.when).getTime() - new Date(b.when).getTime());
    today.sort((a, b) => new Date(a.when).getTime() - new Date(b.when).getTime());
    past.sort((a, b) => new Date(b.when).getTime() - new Date(a.when).getTime());
    return { upcoming, today, past };
  }, [now, cancelledIds]);

  const currentList = filtered[tab];

  // Auto-select first session on tab change (desktop only via layout).
  useEffect(() => {
    if (currentList.length === 0) {
      setSelectedId(null);
      return;
    }
    if (!selectedId || !currentList.find((s) => s.id === selectedId)) {
      setSelectedId(currentList[0].id);
    }
  }, [tab, currentList, selectedId]);

  // URL sync
  useEffect(() => {
    const p = new URLSearchParams(Array.from(searchParams.entries()));
    p.set("tab", tab);
    const qs = p.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const selected = useMemo(
    () => (selectedId ? sessions.find((s) => s.id === selectedId) ?? null : null),
    [selectedId],
  );
  const mobileDetail = useMemo(
    () => (mobileDetailId ? sessions.find((s) => s.id === mobileDetailId) ?? null : null),
    [mobileDetailId],
  );

  const shouldPulse = useCallback(
    (s: SessionDetailData) => {
      if (s.status === "live") return true;
      if (s.status !== "upcoming") return false;
      const mins = minutesUntil(s.when, now);
      return mins <= 10 && mins >= -1;
    },
    [now],
  );

  const counts = {
    upcoming: filtered.upcoming.length,
    today: filtered.today.length,
    past: filtered.past.length,
  };

  const joinSession = useMemo(
    () => (joinSessionId ? sessions.find((s) => s.id === joinSessionId) ?? null : null),
    [joinSessionId],
  );

  const openJoin = useCallback((id: string) => setJoinSessionId(id), []);
  const closeJoin = useCallback(() => setJoinSessionId(null), []);
  const cancelSession = useCallback(
    (id: string) => {
      setCancelledIds((prev) => new Set(prev).add(id));
      setNotice("Séance annulée");
      window.setTimeout(() => setNotice(null), 2200);
      setMobileDetailId(null);
    },
    [],
  );
  const messageTeacher = useCallback(
    () => {
      router.push("/student/messages");
    },
    [router],
  );
  const rescheduleFlash = useCallback(() => {
    setNotice("Reprogrammation — bientôt via l'app");
    window.setTimeout(() => setNotice(null), 2200);
  }, []);
  const downloadRecap = useCallback((s: SessionDetailData) => {
    downloadTextPdf(`Darso — Séance ${s.id}`, [
      `Séance : ${s.title}`,
      `Matière : ${s.subject}`,
      `Prof : ${s.teacher.name}`,
      `Quand : ${s.whenLabel}`,
      `Durée : ${s.duration}`,
      "",
      "Merci d'avoir utilisé Darso.",
    ]);
  }, []);
  const openWaitingRoom = useCallback(() => {
    const live = sessions.find(
      (s) => !cancelledIds.has(s.id) && (s.status === "live" || (s.status === "upcoming" && shouldPulse(s))),
    );
    if (live) setJoinSessionId(live.id);
    else {
      setNotice("Aucune séance dans les 10 min");
      window.setTimeout(() => setNotice(null), 2200);
    }
  }, [cancelledIds, shouldPulse]);
  const openCalendar = useCallback(() => setTab("upcoming"), []);

  const desktop = (
    <DesktopMain
      tab={tab}
      onTabChange={setTab}
      list={currentList}
      counts={counts}
      selected={selected}
      onSelect={setSelectedId}
      pulseFor={shouldPulse}
      expandedPastId={expandedPastId}
      onTogglePast={(id) => setExpandedPastId((v) => (v === id ? null : id))}
      onJoin={openJoin}
      onCancel={cancelSession}
      onMessage={messageTeacher}
      onReschedule={rescheduleFlash}
      onOpenWaitingRoom={openWaitingRoom}
      onOpenCalendar={openCalendar}
      onDownloadRecap={downloadRecap}
    />
  );

  const mobile = (
    <MobileBody
      tab={tab}
      onTabChange={setTab}
      list={currentList}
      counts={counts}
      pulseFor={shouldPulse}
      onOpenDetail={setMobileDetailId}
      expandedPastId={expandedPastId}
      onTogglePast={(id) => setExpandedPastId((v) => (v === id ? null : id))}
      mobileDetail={mobileDetail}
      onCloseDetail={() => setMobileDetailId(null)}
      onJoin={openJoin}
      onCancel={cancelSession}
      onMessage={messageTeacher}
      onReschedule={rescheduleFlash}
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
          title: "Mes séances",
          subtitle: `${counts.today} aujourd'hui · ${counts.upcoming} à venir`,
        }}
        mobileChildren={mobile}
      />

      <JoinSessionModal
        open={joinSession !== null}
        onClose={closeJoin}
        session={
          joinSession
            ? {
                title: joinSession.title,
                subject: joinSession.subject,
                teacher: joinSession.teacher,
                whenLabel: joinSession.whenLabel,
                duration: joinSession.duration,
              }
            : null
        }
      />

      {notice ? (
        <div
          role="status"
          aria-live="polite"
          className="pointer-events-none fixed bottom-24 left-1/2 z-[70] -translate-x-1/2 rounded-full bg-[#0B0B0F] px-4 py-2 text-[12px] font-semibold text-white shadow-[0_8px_24px_rgba(10,11,20,0.28)]"
        >
          {notice}
        </div>
      ) : null}
    </>
  );
}

/* ================================================================
   DESKTOP — 2-col list + sticky detail
   ================================================================ */

function DesktopMain({
  tab,
  onTabChange,
  list,
  counts,
  selected,
  onSelect,
  pulseFor,
  expandedPastId,
  onTogglePast,
  onJoin,
  onCancel,
  onMessage,
  onReschedule,
  onOpenWaitingRoom,
  onOpenCalendar,
  onDownloadRecap,
}: {
  tab: TabKey;
  onTabChange: (t: TabKey) => void;
  list: MockSession[];
  counts: Record<TabKey, number>;
  selected: MockSession | null;
  onSelect: (id: string) => void;
  pulseFor: (s: SessionDetailData) => boolean;
  expandedPastId: string | null;
  onTogglePast: (id: string) => void;
  onJoin: (id: string) => void;
  onCancel: (id: string) => void;
  onMessage: (id: string) => void;
  onReschedule: (id: string) => void;
  onOpenWaitingRoom: () => void;
  onOpenCalendar: () => void;
  onDownloadRecap: (s: SessionDetailData) => void;
}) {
  return (
    <div className="p-6">
      <PageHeader
        eyebrow={
          <>
            <span>Mes séances</span>
            <span className="h-1 w-1 rounded-full bg-[#D5D7DB]" />
            <span className="font-medium text-[#0B0B0F]">
              {counts.today} aujourd&apos;hui · {counts.upcoming} à venir
            </span>
          </>
        }
        title="Séances"
        subline="Rejoins tes cours en un clic, retrouve tes enregistrements et tes notes."
        actions={
          <>
            <button
              type="button"
              onClick={onOpenCalendar}
              className="flex h-9 items-center gap-1.5 rounded-full border border-[#EFEFF1] px-3.5 text-[12px] font-semibold text-[#0B0B0F] transition-colors hover:bg-[#F5F5F7]"
            >
              <CalendarIcon className="h-3.5 w-3.5" strokeWidth={1.75} />
              Vue à venir
            </button>
            <button
              type="button"
              onClick={onOpenWaitingRoom}
              className="flex h-9 items-center gap-1.5 rounded-full bg-[#0B0B0F] px-3.5 text-[12px] font-semibold text-white transition-colors hover:bg-[#1a1b21]"
            >
              <Video className="h-3.5 w-3.5" strokeWidth={2} />
              Salle d&apos;attente
            </button>
          </>
        }
      />

      <div className="mt-6">
        <TabSwitcher<TabKey>
          tabs={TAB_META.map((t) => ({ key: t.key, label: t.label, count: counts[t.key] }))}
          value={tab}
          onChange={onTabChange}
        />
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 min-[1180px]:grid-cols-[minmax(0,1fr)_minmax(360px,400px)]">
        {/* List */}
        <div>
          {list.length === 0 ? (
            <EmptyState
              icon={CalendarIcon}
              title={emptyTitleFor(tab)}
              body={emptyBodyFor(tab)}
            />
          ) : (
            <div className="space-y-2">
              {list.map((s) =>
                s.status === "past" ? (
                  <PastRow
                    key={s.id}
                    session={s}
                    selected={selected?.id === s.id}
                    expanded={expandedPastId === s.id}
                    onSelect={() => onSelect(s.id)}
                    onToggle={() => onTogglePast(s.id)}
                  />
                ) : (
                  <SessionCard
                    key={s.id}
                    id={s.id}
                    title={s.title}
                    subject={s.subject}
                    teacher={s.teacher}
                    whenLabel={s.whenLabel}
                    when={s.when}
                    duration={s.duration}
                    status={s.status}
                    dot={s.dot}
                    selected={selected?.id === s.id}
                    pulsing={pulseFor(s)}
                    onSelect={onSelect}
                  />
                ),
              )}
            </div>
          )}
        </div>

        {/* Sticky detail */}
        <aside className="min-[1180px]:sticky min-[1180px]:top-4 min-[1180px]:h-[calc(100dvh-3.75rem)]">
          <SessionDetailDrawer
            session={selected}
            pulsing={selected ? pulseFor(selected) : false}
            onJoin={onJoin}
            onCancel={onCancel}
            onMessage={onMessage}
            onReschedule={onReschedule}
          />
          {selected && selected.status === "past" ? (
            <button
              type="button"
              onClick={() => onDownloadRecap(selected)}
              className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-full border border-[#EFEFF1] bg-white py-2 text-[12px] font-semibold text-[#0B0B0F] transition-colors hover:bg-[#F5F5F7]"
            >
              <Download className="h-3.5 w-3.5" strokeWidth={1.75} />
              Télécharger le récap PDF
            </button>
          ) : null}
        </aside>
      </div>
    </div>
  );
}

function emptyTitleFor(tab: TabKey) {
  if (tab === "today") return "Aucune séance aujourd'hui";
  if (tab === "upcoming") return "Rien à venir pour l'instant";
  return "Pas encore d'historique";
}
function emptyBodyFor(tab: TabKey) {
  if (tab === "today") return "Profites-en pour réviser ou poster une nouvelle demande.";
  if (tab === "upcoming") return "Trouve un prof dans la marketplace pour réserver ta prochaine séance.";
  return "Tes séances passées apparaîtront ici avec l'enregistrement et les notes du prof.";
}

/* ================================================================
   PAST ROW (expandable — used on both desktop and mobile lists)
   ================================================================ */

function PastRow({
  session,
  selected,
  expanded,
  onSelect,
  onToggle,
}: {
  session: MockSession;
  selected?: boolean;
  expanded: boolean;
  onSelect: () => void;
  onToggle: () => void;
}) {
  return (
    <div
      className={cn(
        "rounded-[16px] border transition-colors",
        selected ? "border-[#0B0B0F]" : "border-[#EFEFF1]",
        expanded ? "bg-white" : "bg-[#F5F5F7]/60",
      )}
    >
      <div className="flex items-stretch gap-3.5 p-3.5">
        <div
          role="button"
          tabIndex={0}
          onClick={onSelect}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onSelect();
            }
          }}
          className="flex min-w-0 flex-1 cursor-pointer items-center gap-3.5 rounded-[12px] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0B0B0F] focus-visible:ring-offset-2"
        >
          <div className="relative grid h-11 w-11 shrink-0 place-items-center rounded-[12px] bg-[#EDEDEF] text-[#8A8D93]">
            <CalendarIcon className="h-4 w-4" strokeWidth={1.75} />
            <span
              className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-white"
              style={{ backgroundColor: session.dot ?? "#C4CFFF" }}
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.06em] text-[#A5A8AE]">
                {session.whenLabel}
              </p>
              <span className="inline-flex h-4 items-center rounded-full bg-[#F0F0F2] px-1.5 text-[9.5px] font-semibold text-[#6E7178]">
                Terminée
              </span>
            </div>
            <p className="mt-0.5 truncate text-[13.5px] font-semibold text-[#4A4D54]">
              {session.title}
            </p>
            <div className="mt-1 flex items-center gap-2 text-[11px] text-[#8A8D93]">
              <Avatar initials={session.teacher.initials} size={16} tone="neutral" />
              <span className="truncate">{session.teacher.name}</span>
              <span className="h-0.5 w-0.5 shrink-0 rounded-full bg-[#D5D7DB]" />
              <span className="flex shrink-0 items-center gap-1">
                <Clock className="h-3 w-3" strokeWidth={1.75} />
                {session.duration}
              </span>
              {session.recordingUrl ? (
                <>
                  <span className="h-0.5 w-0.5 shrink-0 rounded-full bg-[#D5D7DB]" />
                  <span className="flex shrink-0 items-center gap-1 text-[#4A4D54]">
                    <Play className="h-3 w-3 fill-[#4A4D54]" />
                    Enregistrée
                  </span>
                </>
              ) : null}
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          aria-label={expanded ? "Réduire" : "Développer"}
          aria-expanded={expanded}
          className="grid h-8 w-8 shrink-0 place-items-center self-center rounded-full border border-[#EFEFF1] bg-white text-[#0B0B0F] transition-colors hover:bg-[#F5F5F7]"
        >
          {expanded ? (
            <ChevronUp className="h-3.5 w-3.5" strokeWidth={1.75} />
          ) : (
            <ChevronDown className="h-3.5 w-3.5" strokeWidth={1.75} />
          )}
        </button>
      </div>

      <AnimatePresence initial={false}>
        {expanded ? (
          <motion.div
            key="expanded"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={springTight}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-1 gap-3 border-t border-[#EFEFF1] p-3.5 min-[600px]:grid-cols-[minmax(0,180px)_minmax(0,1fr)]">
              {session.recordingUrl ? (
                <div className="aspect-video w-full overflow-hidden rounded-[12px] bg-[#0B0B0F]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <div className="relative h-full w-full">
                    {session.recordingPoster ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={session.recordingPoster}
                        alt=""
                        className="absolute inset-0 h-full w-full object-cover opacity-80"
                      />
                    ) : null}
                    <div className="absolute inset-0 grid place-items-center">
                      <span className="grid h-9 w-9 place-items-center rounded-full bg-white/95 text-[#0B0B0F]">
                        <Play className="h-3.5 w-3.5 fill-[#0B0B0F]" />
                      </span>
                    </div>
                    <span className="absolute bottom-1.5 left-1.5 rounded-full bg-black/50 px-1.5 py-0.5 text-[9.5px] font-semibold text-white">
                      {session.duration}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="grid aspect-video w-full place-items-center rounded-[12px] border border-dashed border-[#EFEFF1] text-center text-[10.5px] text-[#8A8D93]">
                  Aucun enregistrement
                </div>
              )}
              <div className="min-w-0">
                {session.notes ? (
                  <>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.07em] text-[#8A8D93]">
                      Notes du prof
                    </p>
                    <p className="mt-1 whitespace-pre-line text-[12px] leading-relaxed text-[#4A4D54]">
                      {session.notes}
                    </p>
                  </>
                ) : (
                  <p className="text-[11.5px] text-[#8A8D93]">Pas de notes pour cette séance.</p>
                )}

                {session.materials && session.materials.length > 0 ? (
                  <ul className="mt-3 flex flex-wrap gap-1.5">
                    {session.materials.map((m: SessionMaterial) => (
                      <li key={m.id}>
                        <button className="flex items-center gap-1.5 rounded-full border border-[#EFEFF1] bg-white px-2.5 py-1 text-[10.5px] font-semibold text-[#0B0B0F] transition-colors hover:bg-[#F5F5F7]">
                          {m.kind === "link" ? (
                            <ArrowUpRight className="h-3 w-3" strokeWidth={1.75} />
                          ) : (
                            <FileText className="h-3 w-3" strokeWidth={1.75} />
                          )}
                          <span className="max-w-[180px] truncate">{m.name}</span>
                          {m.kind !== "link" ? (
                            <Download className="h-3 w-3 text-[#8A8D93]" strokeWidth={1.75} />
                          ) : null}
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}

                <button
                  type="button"
                  onClick={onSelect}
                  className="mt-3 flex items-center gap-1 text-[11px] font-semibold text-[#0B0B0F] hover:underline"
                >
                  Voir tous les détails
                  <ArrowUpRight className="h-3 w-3" strokeWidth={2} />
                </button>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

/* ================================================================
   MOBILE — full-width list, tap → in-page detail
   ================================================================ */

function MobileBody({
  tab,
  onTabChange,
  list,
  counts,
  pulseFor,
  onOpenDetail,
  expandedPastId,
  onTogglePast,
  mobileDetail,
  onCloseDetail,
  onJoin,
  onCancel,
  onMessage,
  onReschedule,
}: {
  tab: TabKey;
  onTabChange: (t: TabKey) => void;
  list: MockSession[];
  counts: Record<TabKey, number>;
  pulseFor: (s: SessionDetailData) => boolean;
  onOpenDetail: (id: string) => void;
  expandedPastId: string | null;
  onTogglePast: (id: string) => void;
  mobileDetail: MockSession | null;
  onCloseDetail: () => void;
  onJoin: (id: string) => void;
  onCancel: (id: string) => void;
  onMessage: (id: string) => void;
  onReschedule: (id: string) => void;
}) {
  return (
    <>
      <div className="mt-2 px-4">
        <TabSwitcher<TabKey>
          tabs={TAB_META.map((t) => ({ key: t.key, label: t.label, count: counts[t.key] }))}
          value={tab}
          onChange={onTabChange}
          className="w-full"
        />
      </div>

      <AnimatePresence initial={false} mode="wait">
        {mobileDetail ? (
          <motion.div
            key="mobile-detail"
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
              onJoin={onJoin}
              onCancel={onCancel}
              onMessage={onMessage}
              onReschedule={onReschedule}
            />
          </motion.div>
        ) : (
          <motion.div
            key="mobile-list"
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -20, opacity: 0 }}
            transition={fadeQuick}
            className="mt-3 space-y-2 px-4"
          >
            {list.length === 0 ? (
              <EmptyState
                icon={Search}
                title={emptyTitleFor(tab)}
                body={emptyBodyFor(tab)}
              />
            ) : (
              list.map((s) =>
                s.status === "past" ? (
                  <PastRow
                    key={s.id}
                    session={s}
                    expanded={expandedPastId === s.id}
                    onSelect={() => onOpenDetail(s.id)}
                    onToggle={() => onTogglePast(s.id)}
                  />
                ) : (
                  <MobileUpcomingRow
                    key={s.id}
                    s={s}
                    pulsing={pulseFor(s)}
                    onOpen={() => onOpenDetail(s.id)}
                  />
                ),
              )
            )}
            <div className="h-4" />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function MobileUpcomingRow({
  s,
  pulsing,
  onOpen,
}: {
  s: MockSession;
  pulsing: boolean;
  onOpen: () => void;
}) {
  const isLive = s.status === "live";
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
      className="cursor-pointer rounded-[16px] border border-[#EFEFF1] bg-white p-3.5 transition-colors hover:border-[#D5D7DB]"
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
          <p className="mt-0.5 truncate text-[11px] text-[#8A8D93]">
            {s.teacher.name} · {s.duration}
          </p>
        </div>
      </div>
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
            {isLive || pulsing ? (
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#0B0B0F]" />
            ) : null}
            {isLive ? "Rejoindre maintenant" : "Rejoindre"}
          </span>
        </button>
      </div>
    </div>
  );
}

