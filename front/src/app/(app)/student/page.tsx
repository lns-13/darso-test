"use client";

import { createContext, useContext, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  Calendar,
  Check,
  ChevronsRight,
  Clock,
  GraduationCap,
  PanelRightOpen,
  Plus,
  SlidersHorizontal,
  User,
} from "lucide-react";
import { AdCarousel, type AdSlide } from "@/components/library/ad-carousel";
import { GooeyInput } from "@/components/library/gooey-input";
import { SlidingNumber } from "@/components/library/sliding-number";
import { TextMorph } from "@/components/library/text-morph";
import { AppShell, useAppShell } from "@/components/app/app-shell";
import { Applicant } from "@/components/app/applicant";
import {
  CandidatesDrawer,
  type Candidate,
} from "@/components/app/candidates-drawer";
import { CourseCard } from "@/components/app/course-card";
import {
  JoinSessionModal,
  type JoinSessionData,
} from "@/components/app/join-session-modal";
import { MessagePreview } from "@/components/app/message-preview";
import { NewRequestModal } from "@/components/app/new-request-modal";
import { PageHeader } from "@/components/app/page-header";
import {
  SessionDetailDrawer,
  type SessionDetailData,
} from "@/components/app/session-detail-drawer";
import { SectionHeader } from "@/components/app/section-header";
import { SessionRow } from "@/components/app/session-row";
import { studentMobileTabs, studentNav } from "@/lib/nav";
import {
  formatCountdown,
  formatDuration,
  formatLongDate,
  formatSessionWhen,
  formatShortDate,
  isJoinable,
  minutesUntil,
  sessionLifecycle,
} from "@/lib/data/derive";
import { cn } from "@/lib/utils";

/* ---------------- MOCK: replace when API lands ---------------- */

const student = {
  firstName: "Sara",
  fullName: "Sara Bencheikh",
  level: "Terminale S · Lycée Descartes",
  initials: "SB",
};

const trending = [
  {
    subject: "Mathématiques",
    title: "Bac 2026 · Analyse & suites numériques",
    teacher: { name: "Youssef Amrani", initials: "YA" },
    rating: 4.9,
    sessionsGiven: 342,
    price: 220,
    nextSlot: "Ce soir · 20:00",
    tone: "soft-blue" as const,
    slug: "youssef-amrani",
  },
  {
    subject: "Physique-Chimie",
    title: "Bac · Mécanique du solide & énergétique",
    teacher: { name: "Nadia Cherkaoui", initials: "NC" },
    rating: 4.8,
    sessionsGiven: 182,
    price: 200,
    nextSlot: "Demain · 18:00",
    tone: "cream" as const,
    slug: "nadia-cherkaoui",
  },
  {
    subject: "Français",
    title: "DELF B2 · essai argumenté pour la fac",
    teacher: { name: "Marc Dupont", initials: "MD" },
    rating: 5.0,
    sessionsGiven: 96,
    price: 250,
    nextSlot: "Jeu. · 17:30",
    tone: "lime" as const,
    slug: "marc-dupont",
  },
];

/**
 * The demo clock. Seeded from the same instant as the student sessions page and
 * the message mocks, so every relative label in the app agrees.
 *
 * It is a constant string rather than `new Date()` so the server render and the
 * first client render produce identical markup; the effect below then ticks
 * real time from that offset.
 */
const CLOCK_ANCHOR = "2026-09-02T14:00:00+01:00";

/**
 * `startsAt` and `durationMinutes` are the only stored facts about when a
 * session is. The French label, the lifecycle status and whether the join
 * button is live are all derived from them against the current clock.
 *
 * Previously this type carried `when` (a French label), `duration` ("60 min")
 * and `joinable` (a hand-authored boolean). Three consequences, all fixed here:
 * `when` meant a label on this page and an ISO timestamp in `SessionDetailData`
 * one import away; `toDetail` had to invent a timestamp with `new Date()`; and
 * `joinable` could not stay true to the clock, which is why the status line
 * below read `s.joinable ? "upcoming" : "upcoming"`.
 */
type UpcomingSession = {
  id: string;
  startsAt: string;
  durationMinutes: number;
  title: string;
  subject: string;
  teacher: string;
  teacherInitials: string;
  dot: string;
  agenda: string[];
  notes?: string;
};

const upcoming: UpcomingSession[] = [
  {
    id: "sess-1",
    // Inside the ten-minute join window at the anchor, which is what the old
    // `joinable: true` was trying to express.
    startsAt: "2026-09-02T14:05:00+01:00",
    durationMinutes: 60,
    title: "Analyse — dérivées & fonction composée",
    subject: "Mathématiques",
    teacher: "Youssef Amrani",
    teacherInitials: "YA",
    dot: "#C4CFFF",
    agenda: [
      "Revoir les règles de dérivation (produit, quotient, chaîne)",
      "3 exercices type Bac sur les fonctions composées",
      "Retour sur le DS #4 : questions bloquantes",
    ],
    notes:
      "Apporte ta fiche §3.2 et les 3 exercices que tu as marqués. On finit avec un mini-quiz.",
  },
  {
    id: "sess-2",
    startsAt: "2026-09-02T19:30:00+01:00",
    durationMinutes: 45,
    title: "DELF B2 — essai argumenté",
    subject: "Français",
    teacher: "Marc Dupont",
    teacherInitials: "MD",
    dot: "#DFFF3F",
    agenda: [
      "Plan d'un essai argumenté en 20 min",
      "Correction du plan sur « L'IA à l'école »",
    ],
  },
  {
    id: "sess-3",
    startsAt: "2026-09-03T16:00:00+01:00",
    durationMinutes: 90,
    title: "Physique — mécanique du solide",
    subject: "Physique-Chimie",
    teacher: "Nadia Cherkaoui",
    teacherInitials: "NC",
    dot: "#F0EDE4",
    agenda: [
      "Chapitre 4 : moment cinétique",
      "TP en direct : pendule pesant",
    ],
  },
];

function toDetail(s: UpcomingSession, now: Date): SessionDetailData {
  const startsAt = new Date(s.startsAt);
  return {
    id: s.id,
    title: s.title,
    subject: s.subject,
    teacher: { name: s.teacher, initials: s.teacherInitials },
    // Both halves now come from one stored timestamp: the label is formatted
    // from it, and `when` carries the ISO value the drawer expects instead of
    // a fresh `new Date()` that had nothing to do with the session.
    whenLabel: formatSessionWhen(startsAt, now),
    when: s.startsAt,
    duration: formatDuration(s.durationMinutes),
    status: sessionLifecycle(startsAt, s.durationMinutes, now),
    agenda: s.agenda,
    notes: s.notes,
  };
}

function toJoin(s: UpcomingSession, now: Date): JoinSessionData {
  return {
    title: s.title,
    subject: s.subject,
    teacher: { name: s.teacher, initials: s.teacherInitials },
    whenLabel: formatSessionWhen(new Date(s.startsAt), now),
    duration: formatDuration(s.durationMinutes),
  };
}

const openRequest = { title: "Bac SVT · révision génétique en 2 semaines", postedAgo: "publiée il y a 2 jours" };

const applicants = [
  { name: "Karim El Fassi", initials: "KE", subject: "SVT · 6 ans d'exp.", rating: 4.9, price: 140 },
  { name: "Leila Bennani", initials: "LB", subject: "SVT · 4 ans d'exp.", rating: 4.8, price: 120 },
  { name: "Omar Zerouali", initials: "OZ", subject: "SVT · 9 ans d'exp.", rating: 5.0, price: 200 },
];

const messages = [
  { name: "Youssef Amrani", initials: "YA", preview: "Voici la fiche d'exercices pour ce soir 📄", time: "5 min", unread: true },
  { name: "Marc Dupont", initials: "MD", preview: "On peut décaler la séance de 15 min ?", time: "1 h", unread: true },
  { name: "Nadia Cherkaoui", initials: "NC", preview: "Bravo pour ton dernier DS 👏", time: "3 h", unread: false },
];

const monthlyStats = { sessions: 12, teachers: 3, hours: 18 };

const appAds: AdSlide[] = [
  {
    id: "post",
    eyebrow: "Nouveau sur darso",
    title: "Poste une demande,",
    accent: "les profs postulent.",
    body: "Style Upwork — reçois 3 à 5 propositions en moins d'1 h.",
    cta: "Essayer",
    bg: "linear-gradient(135deg, #0B0B0F 0%, #1E1F27 100%)",
    fg: "light",
  },
  {
    id: "verified",
    eyebrow: "240+ profs vérifiés",
    title: "Prépare ton Bac",
    accent: "avec les meilleurs.",
    body: "Diplômes contrôlés, avis publics, satisfaction 4.8★ en moyenne.",
    cta: "Découvrir",
    bg: "linear-gradient(135deg, #DFFF3F 0%, #C4E029 100%)",
    fg: "dark",
  },
  {
    id: "referral",
    eyebrow: "Parrainage",
    title: "Invite un ami,",
    accent: "gagnez 100 MAD chacun.",
    body: "Crédit valable sur toutes tes prochaines séances.",
    cta: "Parrainer",
    bg: "linear-gradient(135deg, #C4CFFF 0%, #A6B4FF 100%)",
    fg: "dark",
  },
];

/* ---------------- Page-level actions context ---------------- */

type StudentActions = {
  openNewRequest: () => void;
  openCandidates: () => void;
  openJoin: (session: UpcomingSession) => void;
  openDetail: (session: UpcomingSession) => void;
  goToDiscover: () => void;
  goToSessions: () => void;
  sessions: UpcomingSession[];
  candidates: Candidate[];
  request: { title: string; postedAgo: string };
  /** The demo clock, ticking. Every relative label derives from it. */
  now: Date;
  /** Minutes until the next session that has not finished, or null. */
  nextSessionInMinutes: number | null;
  sessionsToday: number;
};

const StudentActionsContext = createContext<StudentActions | null>(null);

function useStudentActions(): StudentActions {
  const v = useContext(StudentActionsContext);
  if (!v) throw new Error("StudentActions provider missing");
  return v;
}

/* ---------------- Page ---------------- */

export default function StudentDashboardPage() {
  const router = useRouter();
  const [newRequestOpen, setNewRequestOpen] = useState(false);
  const [candidatesOpen, setCandidatesOpen] = useState(false);
  const [joinSession, setJoinSession] = useState<UpcomingSession | null>(null);
  const [detailSession, setDetailSession] = useState<UpcomingSession | null>(null);
  const [sessions, setSessions] = useState<UpcomingSession[]>(upcoming);
  const [currentRequest, setCurrentRequest] = useState(openRequest);

  // Seeded from a constant so server and client render the same markup, then
  // ticked from the real clock at the same offset. Same approach as
  // student/sessions/page.tsx, so the two screens never disagree about "now".
  const [now, setNow] = useState<Date>(() => new Date(CLOCK_ANCHOR));
  useEffect(() => {
    const offset = new Date(CLOCK_ANCHOR).getTime() - Date.now();
    const id = setInterval(() => setNow(new Date(Date.now() + offset)), 30_000);
    return () => clearInterval(id);
  }, []);
  const [candidates] = useState<Candidate[]>(
    applicants.map((a, i) => ({
      id: `app-${i}`,
      name: a.name,
      initials: a.initials,
      subject: a.subject,
      rating: a.rating,
      price: a.price,
      message:
        i === 0
          ? "Salut Sara, je révise la génétique depuis 6 ans avec des Terminale S — je te propose 3 séances ciblées + 2 QCM d'entraînement."
          : i === 1
            ? "Bonjour, je peux t'aider à structurer la révision en 2 semaines. Dispo tous les soirs après 18h."
            : "Hello, prof de SVT depuis 9 ans, spécialisé en génétique. Je te fais un plan personnalisé + corrigés.",
    })),
  );

  // Both figures were hardcoded strings ("4 h 12 min", "2 séances aujourd'hui")
  // that could not follow the data. They are counts over the session list now.
  const upcomingSessions = sessions
    .map((s) => ({ s, startsAt: new Date(s.startsAt) }))
    .filter(({ s, startsAt }) => sessionLifecycle(startsAt, s.durationMinutes, now) !== "past")
    .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());

  const nextSessionInMinutes =
    upcomingSessions.length > 0 ? minutesUntil(upcomingSessions[0].startsAt, now) : null;

  const sessionsToday = sessions.filter((s) => {
    const d = new Date(s.startsAt);
    return (
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate()
    );
  }).length;

  const actions: StudentActions = {
    openNewRequest: () => setNewRequestOpen(true),
    openCandidates: () => setCandidatesOpen(true),
    openJoin: (s) => setJoinSession(s),
    openDetail: (s) => setDetailSession(s),
    goToDiscover: () => router.push("/student/discover"),
    goToSessions: () => router.push("/student/sessions"),
    sessions,
    candidates,
    request: currentRequest,
    now,
    nextSessionInMinutes,
    sessionsToday,
  };

  return (
    <StudentActionsContext.Provider value={actions}>
      <AppShell
        nav={studentNav}
        mobileTabs={studentMobileTabs}
        user={student}
        desktopMain={<DesktopMain />}
        rail={<RightRail />}
        mobileHeader={{
          title: `Bonjour, ${student.firstName}`,
          subtitle: `${formatShortDate(now)} · ${sessionsToday} séance${sessionsToday > 1 ? "s" : ""} aujourd'hui`,
        }}
        mobileChildren={<MobileBody />}
      />

      <NewRequestModal
        open={newRequestOpen}
        onClose={() => setNewRequestOpen(false)}
        onSubmit={(payload) => {
          setCurrentRequest({
            title: payload.title,
            postedAgo: "publiée à l'instant",
          });
        }}
      />

      <CandidatesDrawer
        open={candidatesOpen}
        onClose={() => setCandidatesOpen(false)}
        requestTitle={currentRequest.title}
        candidates={candidates}
      />

      <JoinSessionModal
        open={joinSession !== null}
        onClose={() => setJoinSession(null)}
        session={joinSession ? toJoin(joinSession, now) : null}
      />

      {detailSession ? (
        <SessionDetailModal
          session={toDetail(detailSession, now)}
          onClose={() => setDetailSession(null)}
          onJoin={() => {
            const s = detailSession;
            setDetailSession(null);
            if (s) setJoinSession(s);
          }}
          onCancel={() => {
            setSessions((prev) => prev.filter((x) => x.id !== detailSession.id));
            setDetailSession(null);
          }}
          onMessage={() => {
            const s = detailSession;
            setDetailSession(null);
            if (s) router.push("/student/messages");
          }}
          onReschedule={() => {
            // Local UX only: flash a small toast via alert-like state is overkill;
            // acknowledge by closing. Full reschedule requires backend.
            setDetailSession(null);
          }}
        />
      ) : null}
    </StudentActionsContext.Provider>
  );
}

/* Modal wrapper that presents SessionDetailDrawer centered. */
function SessionDetailModal({
  session,
  onClose,
  onJoin,
  onCancel,
  onMessage,
  onReschedule,
}: {
  session: SessionDetailData;
  onClose: () => void;
  onJoin: () => void;
  onCancel: () => void;
  onMessage: () => void;
  onReschedule: () => void;
}) {
  useEscapeToClose(onClose);
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Séance : ${session.title}`}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div
        aria-hidden
        onClick={onClose}
        className="absolute inset-0 bg-[#0B0B0F]/40 backdrop-blur-sm"
      />
      <div className="relative flex max-h-[92dvh] w-full max-w-[520px] flex-col overflow-hidden">
        <SessionDetailDrawer
          session={session}
          onBack={onClose}
          onJoin={onJoin}
          onCancel={onCancel}
          onMessage={onMessage}
          onReschedule={onReschedule}
        />
      </div>
    </div>
  );
}

function useEscapeToClose(onClose: () => void) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);
}

/* ================================================================
   DESKTOP MAIN
   ================================================================ */

function DesktopMain() {
  const { railOpen, openRail } = useAppShell();
  const {
    openNewRequest,
    openJoin,
    openDetail,
    goToSessions,
    sessions,
    now,
    nextSessionInMinutes,
    sessionsToday,
  } = useStudentActions();
  return (
    <div className="p-6">
      <PageHeader
        eyebrow={
          <>
            <span>{formatLongDate(now)}</span>
            <span className="h-1 w-1 rounded-full bg-[#D5D7DB]" />
            <span className="font-medium text-[#0B0B0F]">
              {sessionsToday} séance{sessionsToday > 1 ? "s" : ""} aujourd&apos;hui
            </span>
          </>
        }
        title={`Bonjour, ${student.firstName}`}
        subline={
          <>
            {applicants.length} profs ont postulé à ta demande.{" "}
            {nextSessionInMinutes === null ? (
              "Aucune séance à venir."
            ) : (
              <>
                Prochaine séance dans{" "}
                <span className="font-semibold text-[#0B0B0F]">
                  {formatCountdown(nextSessionInMinutes)}
                </span>
                .
              </>
            )}
          </>
        }
        actions={
          <>
            <GooeyInput placeholder="Chercher un prof, une matière…" />
            <Link
              href="/student/sessions"
              aria-label="Voir mes séances"
              onClick={(e) => {
                e.preventDefault();
                goToSessions();
              }}
              className="grid h-9 w-9 place-items-center rounded-full border border-[#EFEFF1] text-[#0B0B0F] transition-colors hover:bg-[#F5F5F7]"
            >
              <Calendar className="h-4 w-4" strokeWidth={1.75} />
            </Link>
            <button
              type="button"
              onClick={openNewRequest}
              className="ml-0.5 flex h-9 items-center gap-1.5 rounded-full bg-[#0B0B0F] px-3.5 text-[12px] font-semibold text-white transition-colors hover:bg-[#1a1b21]"
            >
              <Plus className="h-3.5 w-3.5" strokeWidth={2.25} />
              Nouvelle demande
            </button>
            {!railOpen ? (
              <button
                onClick={openRail}
                aria-label="Afficher le panneau"
                className="ml-0.5 grid h-9 w-9 place-items-center rounded-full border border-[#EFEFF1] text-[#0B0B0F] transition-colors hover:bg-[#F5F5F7]"
              >
                <PanelRightOpen className="h-4 w-4" strokeWidth={1.75} />
              </button>
            ) : null}
          </>
        }
      />

      <div className="mt-6">
        <AdCarousel slides={appAds} interval={5000} height={148} />
      </div>

      <div className="mt-6 grid grid-cols-2 gap-2.5">
        <QuickAction
          tone="lime"
          eyebrow="Poste une demande"
          title="Besoin d'un prof précis ?"
          hoverTitle="Publie-la en 30 secondes"
          body="Décris ton objectif, laisse les profs postuler — style Upwork."
          onClick={openNewRequest}
        />
        <QuickAction
          tone="dark"
          eyebrow="Parcourir"
          title="Trouve un prof par matière"
          hoverTitle="240+ profs vérifiés"
          body="Filtre par matière, tarif et disponibilité."
          href="/student/discover"
        />
      </div>

      <section className="mt-7">
        <SectionHeader
          title="Tendances de la semaine"
          subtitle="Les profs les plus réservés en Terminale S"
          action="Tout voir"
          actionHref="/student/discover"
        />
        <div className="mt-3.5 grid grid-cols-3 gap-2.5">
          {trending.map((course) => (
            <CourseCard
              key={course.title}
              {...course}
              href={`/teacher/preview/${course.slug}`}
            />
          ))}
        </div>
      </section>

      <section className="mt-7 pb-2">
        <SectionHeader
          title="Tes prochaines séances"
          action="Tout voir"
          actionHref="/student/sessions"
        />
        <div className="mt-3.5 divide-y divide-[#EFEFF1] overflow-hidden rounded-2xl border border-[#EFEFF1]">
          {sessions.slice(0, 3).map((session) => (
            <SessionRow
              key={session.id}
              when={formatSessionWhen(new Date(session.startsAt), now)}
              title={session.title}
              teacher={session.teacher}
              duration={formatDuration(session.durationMinutes)}
              dot={session.dot}
              joinable={isJoinable(
                new Date(session.startsAt),
                session.durationMinutes,
                now,
              )}
              onSelect={() => openDetail(session)}
              onJoin={() => openJoin(session)}
              onDetails={() => openDetail(session)}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

function RightRail() {
  const { closeRail } = useAppShell();
  const { openCandidates, request, candidates } = useStudentActions();
  return (
    <>
      <div className="rounded-[20px] bg-white p-4 shadow-[0_1px_2px_rgba(10,11,20,0.04)]">
        <div className="flex items-center justify-between">
          <h3 className="text-[13px] font-semibold text-[#0B0B0F]">Candidatures en attente</h3>
          <div className="flex items-center gap-1.5">
            <span className="rounded-full bg-[#DFFF3F] px-1.5 py-0.5 text-[10px] font-semibold text-[#0B0B0F]">
              {candidates.length} nouvelles
            </span>
            <button
              onClick={closeRail}
              aria-label="Réduire le panneau"
              className="grid h-6 w-6 place-items-center rounded-md text-[#8A8D93] transition-colors hover:bg-[#F5F5F7] hover:text-[#0B0B0F]"
            >
              <ChevronsRight className="h-3.5 w-3.5" strokeWidth={2} />
            </button>
          </div>
        </div>
        <div className="mt-2 rounded-md bg-[#F5F5F7] p-2">
          <p className="text-[9.5px] font-semibold uppercase tracking-[0.07em] text-[#8A8D93]">
            Ta demande
          </p>
          <p className="mt-0.5 truncate text-[11.5px] font-semibold text-[#0B0B0F]">
            {request.title}
          </p>
          <p className="text-[10px] text-[#8A8D93]">{request.postedAgo}</p>
        </div>
        <div className="mt-3 space-y-3">
          {candidates.map((a) => (
            <Applicant
              key={a.id ?? a.name}
              name={a.name}
              initials={a.initials}
              subject={a.subject}
              rating={a.rating}
              price={a.price}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={openCandidates}
          className="mt-3.5 flex w-full items-center justify-center gap-1.5 rounded-full bg-[#0B0B0F] py-2 text-[11.5px] font-semibold text-white transition-colors hover:bg-[#1a1b21]"
        >
          Voir les {candidates.length} candidatures
          <ArrowUpRight className="h-3 w-3" strokeWidth={2} />
        </button>
      </div>

      <div className="rounded-[20px] bg-white p-4 shadow-[0_1px_2px_rgba(10,11,20,0.04)]">
        <div className="flex items-center justify-between">
          <h3 className="text-[13px] font-semibold text-[#0B0B0F]">Messages</h3>
          <Link
            href="/student/messages"
            className="text-[10.5px] font-medium text-[#8A8D93] transition-colors hover:text-[#0B0B0F]"
          >
            Boîte de réception
          </Link>
        </div>
        <div className="mt-3 space-y-3">
          {messages.map((m) => (
            <MessagePreview key={m.name} {...m} />
          ))}
        </div>
      </div>

      <div className="rounded-[20px] bg-[#0B0B0F] p-4 text-white shadow-[0_1px_2px_rgba(10,11,20,0.04)]">
        <div className="flex items-center justify-between">
          <span className="text-[9.5px] font-semibold uppercase tracking-[0.09em] text-white/50">
            Septembre en cours
          </span>
          <span className="flex h-5 items-center gap-1 rounded-full bg-white/10 px-1.5 text-[9.5px] font-semibold text-[#DFFF3F]">
            <Check className="h-2.5 w-2.5" strokeWidth={2.5} />
            dans les temps
          </span>
        </div>
        <div className="mt-2.5 font-[family-name:var(--font-cabinet)] text-[34px] font-bold leading-none tracking-tight">
          <SlidingNumber value={monthlyStats.hours} />
          <span className="text-[15px] font-semibold text-white/50"> h</span>
        </div>
        <p className="mt-1 text-[11px] text-white/60">
          en {monthlyStats.sessions} séances avec {monthlyStats.teachers} profs
        </p>
        <div className="mt-3.5 flex items-end gap-1">
          {[35, 55, 30, 70, 45, 90, 60].map((h, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-1">
              <div
                className={cn("w-full rounded-sm", i === 5 ? "bg-[#DFFF3F]" : "bg-white/15")}
                style={{ height: `${h * 0.45}px` }}
              />
              <span className="text-[8.5px] font-medium text-white/40">
                {["L", "M", "M", "J", "V", "S", "D"][i]}
              </span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

/* ================================================================
   MOBILE — custom IA, horizontal-scroll sections
   ================================================================ */

function MobileBody() {
  return (
    <>
      <MobileAds />
      <StatsStrip />
      <HeroGrid />
      <MobileTrending />
      <MobileApplications />
      <MobileMessages />
      <MobileMonthlyStat />
    </>
  );
}

function MobileAds() {
  return (
    <div className="mt-2 px-4">
      <AdCarousel slides={appAds} interval={5000} height={128} />
    </div>
  );
}

function StatsStrip() {
  const { nextSessionInMinutes } = useStudentActions();
  const stats = [
    {
      icon: Clock,
      value:
        nextSessionInMinutes === null ? "—" : formatCountdown(nextSessionInMinutes),
      label: "avant la séance",
      accent: true,
    },
    { icon: Calendar, value: "18 h", label: "ce mois", accent: false },
    { icon: GraduationCap, value: "12", label: "séances", accent: false },
    { icon: User, value: "3", label: "profs", accent: false },
  ];
  return (
    <div
      className="scrollbar-none mt-3 flex snap-x snap-mandatory gap-2 overflow-x-auto px-4 pb-1"
      style={{ scrollPaddingInline: "1rem" }}
    >
      {stats.map((s, i) => (
        <div
          key={i}
          className={cn(
            "flex shrink-0 snap-start items-center gap-2 rounded-full border px-3 py-2",
            s.accent
              ? "border-transparent bg-[#0B0B0F] text-white"
              : "border-[#EFEFF1] bg-white text-[#0B0B0F]",
          )}
        >
          <s.icon
            className={cn("h-3.5 w-3.5", s.accent ? "text-[#DFFF3F]" : "text-[#8A8D93]")}
            strokeWidth={1.75}
          />
          <span className="text-[12.5px] font-bold">{s.value}</span>
          <span className={cn("text-[11px]", s.accent ? "text-white/60" : "text-[#8A8D93]")}>
            {s.label}
          </span>
        </div>
      ))}
    </div>
  );
}

function HeroGrid() {
  const { sessions, openJoin, openDetail, openNewRequest, now, nextSessionInMinutes } =
    useStudentActions();
  const s = sessions[0];
  const joinable = isJoinable(new Date(s.startsAt), s.durationMinutes, now);
  return (
    <div className="mt-3 grid grid-cols-2 gap-2 px-4">
      <button
        type="button"
        onClick={() => (joinable ? openJoin(s) : openDetail(s))}
        className="relative flex flex-col overflow-hidden rounded-[18px] bg-[#0B0B0F] p-3.5 text-left text-white shadow-[0_1px_2px_rgba(10,11,20,0.04)] transition-transform active:scale-[0.99]"
      >
        <p className="text-[9.5px] font-semibold uppercase tracking-[0.09em] text-white/50">
          Prochaine ·{" "}
          {nextSessionInMinutes === null
            ? "rien de prévu"
            : `dans ${formatCountdown(nextSessionInMinutes)}`}
        </p>
        <p className="mt-1 font-[family-name:var(--font-cabinet)] text-[16px] font-bold leading-[1.15] tracking-tight text-white line-clamp-2">
          {s.title}
        </p>
        <p className="mt-1 truncate text-[10.5px] text-white/50">
          {s.teacher.split(" ")[0]} · {formatDuration(s.durationMinutes)}
        </p>
        <div className="mt-auto pt-3">
          <span className="flex w-full items-center justify-center gap-1.5 rounded-full bg-[#DFFF3F] py-1.5 text-[11.5px] font-semibold text-[#0B0B0F]">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#0B0B0F]" />
            {joinable ? "Rejoindre" : "Voir la séance"}
          </span>
        </div>
      </button>

      <button
        type="button"
        onClick={openNewRequest}
        className="group relative flex flex-col overflow-hidden rounded-[18px] bg-[#DFFF3F] p-3.5 text-left text-[#0B0B0F] transition-transform active:scale-[0.99]"
      >
        <p className="text-[9.5px] font-semibold uppercase tracking-[0.09em] text-[#0B0B0F]/60">
          Poste une demande
        </p>
        <p className="mt-1 font-[family-name:var(--font-cabinet)] text-[16px] font-bold leading-[1.15] tracking-tight">
          Besoin d&apos;un prof précis ?
        </p>
        <p className="mt-1 text-[10.5px] leading-snug text-[#0B0B0F]/70 line-clamp-2">
          Décris ton objectif, laisse les profs postuler.
        </p>
        <div className="mt-auto flex items-center justify-between pt-3">
          <span className="text-[10.5px] font-semibold text-[#0B0B0F]">Style Upwork</span>
          <span className="grid h-8 w-8 place-items-center rounded-full bg-[#0B0B0F] text-white transition-transform group-hover:rotate-45">
            <Plus className="h-3.5 w-3.5" />
          </span>
        </div>
      </button>
    </div>
  );
}

function MobileTrending() {
  return (
    <section className="mt-5">
      <div className="flex items-end justify-between px-4">
        <div>
          <h2 className="font-[family-name:var(--font-cabinet)] text-[17px] font-bold tracking-tight text-[#0B0B0F]">
            Tendances de la semaine
          </h2>
          <p className="mt-0.5 text-[11px] text-[#8A8D93]">Les plus réservés en Terminale S</p>
        </div>
        <Link
          href="/student/discover"
          className="flex items-center gap-1 text-[11.5px] font-medium text-[#8A8D93] transition-colors hover:text-[#0B0B0F]"
        >
          <SlidersHorizontal className="h-3 w-3" strokeWidth={2} />
          Filtrer
        </Link>
      </div>
      <div
        className="scrollbar-none mt-3 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1"
        style={{ scrollPaddingInline: "1rem" }}
      >
        {trending.map((course) => (
          <div key={course.title} className="w-[74vw] max-w-[280px] shrink-0 snap-start">
            <CourseCard {...course} href={`/teacher/preview/${course.slug}`} />
          </div>
        ))}
      </div>
    </section>
  );
}

function MobileApplications() {
  const { openCandidates, request, candidates } = useStudentActions();
  return (
    <section className="mt-5 px-4">
      <div className="rounded-[20px] bg-white p-4 shadow-[0_1px_2px_rgba(10,11,20,0.04)]">
        <div className="flex items-center justify-between">
          <h3 className="text-[13px] font-semibold text-[#0B0B0F]">Candidatures en attente</h3>
          <span className="rounded-full bg-[#DFFF3F] px-1.5 py-0.5 text-[10px] font-semibold text-[#0B0B0F]">
            {candidates.length} nouvelles
          </span>
        </div>
        <div className="mt-2 rounded-md bg-[#F5F5F7] p-2">
          <p className="text-[9.5px] font-semibold uppercase tracking-[0.07em] text-[#8A8D93]">
            Ta demande
          </p>
          <p className="mt-0.5 truncate text-[11.5px] font-semibold text-[#0B0B0F]">
            {request.title}
          </p>
        </div>
        <div className="mt-3 space-y-3">
          {candidates.map((a) => (
            <Applicant
              key={a.id ?? a.name}
              name={a.name}
              initials={a.initials}
              subject={a.subject}
              rating={a.rating}
              price={a.price}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={openCandidates}
          className="mt-3.5 flex w-full items-center justify-center gap-1.5 rounded-full bg-[#0B0B0F] py-2.5 text-[12px] font-semibold text-white transition-colors hover:bg-[#1a1b21]"
        >
          Voir les {candidates.length} candidatures
          <ArrowUpRight className="h-3 w-3" strokeWidth={2} />
        </button>
      </div>
    </section>
  );
}

function MobileMessages() {
  return (
    <section className="mt-3 px-4">
      <div className="rounded-[20px] bg-white p-4 shadow-[0_1px_2px_rgba(10,11,20,0.04)]">
        <div className="flex items-center justify-between">
          <h3 className="text-[13px] font-semibold text-[#0B0B0F]">Messages</h3>
          <Link
            href="/student/messages"
            className="text-[10.5px] font-medium text-[#8A8D93] transition-colors hover:text-[#0B0B0F]"
          >
            Boîte de réception
          </Link>
        </div>
        <div className="mt-3 space-y-3">
          {messages.map((m) => (
            <MessagePreview key={m.name} {...m} />
          ))}
        </div>
      </div>
    </section>
  );
}

function MobileMonthlyStat() {
  return (
    <section className="mt-3 px-4">
      <div className="rounded-[20px] bg-[#0B0B0F] p-4 text-white shadow-[0_1px_2px_rgba(10,11,20,0.04)]">
        <div className="flex items-center justify-between">
          <span className="text-[9.5px] font-semibold uppercase tracking-[0.09em] text-white/50">
            Septembre en cours
          </span>
          <span className="flex h-5 items-center gap-1 rounded-full bg-white/10 px-1.5 text-[9.5px] font-semibold text-[#DFFF3F]">
            <Check className="h-2.5 w-2.5" strokeWidth={2.5} />
            dans les temps
          </span>
        </div>
        <div className="mt-2.5 flex items-end justify-between">
          <div>
            <div className="font-[family-name:var(--font-cabinet)] text-[28px] sm:text-[32px] md:text-[36px] font-bold leading-none tracking-tight">
              <SlidingNumber value={monthlyStats.hours} />
              <span className="text-[15px] font-semibold text-white/50"> h</span>
            </div>
            <p className="mt-1 text-[11px] text-white/60">
              {monthlyStats.sessions} séances · {monthlyStats.teachers} profs
            </p>
          </div>
          <div className="flex items-end gap-1">
            {[35, 55, 30, 70, 45, 90, 60].map((h, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <div
                  className={cn("w-3 rounded-sm", i === 5 ? "bg-[#DFFF3F]" : "bg-white/15")}
                  style={{ height: `${h * 0.5}px` }}
                />
                <span className="text-[8.5px] font-medium text-white/40">
                  {["L", "M", "M", "J", "V", "S", "D"][i]}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ================================================================
   PAGE-LEVEL HELPERS (student-specific — not shared yet)
   ================================================================ */

function QuickAction({
  tone,
  eyebrow,
  title,
  hoverTitle,
  body,
  onClick,
  href,
}: {
  tone: "lime" | "dark";
  eyebrow: string;
  title: string;
  hoverTitle: string;
  body: string;
  onClick?: () => void;
  href?: string;
}) {
  const isLime = tone === "lime";
  const [hover, setHover] = useState(false);
  const Wrapper = (href ? Link : "button") as React.ElementType;
  const wrapperProps = (href ? { href } : { type: "button", onClick }) as Record<string, unknown>;
  return (
    <Wrapper
      {...wrapperProps}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className={cn(
        "group relative flex h-[148px] flex-col justify-between overflow-hidden rounded-[18px] p-4 text-left transition-transform hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0B0B0F] focus-visible:ring-offset-2",
        isLime ? "bg-[#DFFF3F] text-[#0B0B0F]" : "bg-[#0B0B0F] text-white",
      )}
    >
      <div>
        <p
          className={cn(
            "text-[10px] font-semibold uppercase tracking-[0.09em]",
            isLime ? "text-[#0B0B0F]/60" : "text-white/50",
          )}
        >
          {eyebrow}
        </p>
        <p className="mt-1.5 font-[family-name:var(--font-cabinet)] text-[19px] font-bold leading-[1.15] tracking-tight">
          <TextMorph>{hover ? hoverTitle : title}</TextMorph>
        </p>
      </div>
      <div className="flex items-end justify-between">
        <p
          className={cn(
            "max-w-[190px] text-[11.5px] leading-snug",
            isLime ? "text-[#0B0B0F]/70" : "text-white/60",
          )}
        >
          {body}
        </p>
        <span
          className={cn(
            "grid h-8 w-8 place-items-center rounded-full transition-transform group-hover:rotate-45",
            isLime ? "bg-[#0B0B0F] text-white" : "bg-white text-[#0B0B0F]",
          )}
        >
          {isLime ? <Plus className="h-3.5 w-3.5" /> : <ArrowUpRight className="h-3.5 w-3.5" />}
        </span>
      </div>
    </Wrapper>
  );
}

