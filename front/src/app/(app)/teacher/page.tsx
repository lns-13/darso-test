"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ComingSoonButton } from "@/components/app/coming-soon-button";
import {
  ArrowUpRight,
  Bell,
  Calendar,
  ChevronsRight,
  MessageCircle,
  PanelRightOpen,
  Plus,
  Sparkles,
  Star,
  Wallet,
} from "lucide-react";
import { SlidingNumber } from "@/components/library/sliding-number";
import { AppShell, useAppShell } from "@/components/app/app-shell";
import { ApplicationRow } from "@/components/app/application-row";
import { Avatar } from "@/components/app/avatar";
import { Eyebrow } from "@/components/app/eyebrow";
import { MatchingRequestCard } from "@/components/app/matching-request-card";
import { MessagePreview } from "@/components/app/message-preview";
import { NotificationRow } from "@/components/app/notification-row";
import { PageHeader } from "@/components/app/page-header";
import { SectionHeader } from "@/components/app/section-header";
import { SessionRow } from "@/components/app/session-row";
import { teacherMobileTabs, teacherNav } from "@/lib/nav";
import {
  mockAvgRating,
  mockMatchingRequests,
  mockMonthlyEarnings,
  mockPendingApplications,
  mockSessionsThisMonth,
  mockTeacher,
  mockUnreadTeacherMessages,
  mockUnreadTeacherNotifs,
  mockUpcomingSessions,
} from "@/lib/mock/teacher";
import { cn } from "@/lib/utils";

/* ================================================================
   PAGE
   ================================================================ */

export default function TeacherDashboardPage() {
  const [handled, setHandled] = useState<Set<string>>(new Set());

  const visibleApps = useMemo(
    () => mockPendingApplications.filter((a) => !handled.has(a.id)),
    [handled],
  );

  const handleAccept = (id: string) => {
    setHandled((prev) => new Set(prev).add(id));
  };
  const handleDecline = (id: string) => {
    setHandled((prev) => new Set(prev).add(id));
  };

  const handleApply = (id: string) => {
    // Stub: matching-request "postuler" — the proposal flow lives in Phase 3.d
    // eslint-disable-next-line no-console
    console.info("[teacher] apply to matching request", id);
  };

  const handleCreateSession = () => {
    // Stub — create session modal is built in P3.b
    // eslint-disable-next-line no-console
    console.info("[teacher] create session flow — see P3.b");
    if (typeof window !== "undefined") {
      window.alert("Créer une séance — flux à brancher (P3.b)");
    }
  };

  const nextSession = mockUpcomingSessions[0];
  const todaysCount = mockUpcomingSessions.filter((s) =>
    s.when.toLowerCase().startsWith("aujourd"),
  ).length;

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
        <DesktopMain
          visibleApps={visibleApps}
          onAccept={handleAccept}
          onDecline={handleDecline}
          onApply={handleApply}
          onCreateSession={handleCreateSession}
          nextSession={nextSession}
          todaysCount={todaysCount}
        />
      }
      rail={
        <RightRail
          visibleApps={visibleApps}
          onAccept={handleAccept}
          onDecline={handleDecline}
        />
      }
      mobileHeader={{
        title: `Bonjour, ${mockTeacher.firstName}`,
        subtitle: `${visibleApps.length} demande${visibleApps.length > 1 ? "s" : ""} à traiter · ${todaysCount} séance${todaysCount > 1 ? "s" : ""} aujourd'hui`,
      }}
      mobileChildren={
        <MobileBody
          visibleApps={visibleApps}
          onAccept={handleAccept}
          onDecline={handleDecline}
          onApply={handleApply}
          onCreateSession={handleCreateSession}
          nextSession={nextSession}
        />
      }
    />
  );
}

/* ================================================================
   DESKTOP
   ================================================================ */

type SessionShape = (typeof mockUpcomingSessions)[number];

type DesktopProps = {
  visibleApps: typeof mockPendingApplications;
  onAccept: (id: string) => void;
  onDecline: (id: string) => void;
  onApply: (id: string) => void;
  onCreateSession: () => void;
  nextSession: SessionShape;
  todaysCount: number;
};

function DesktopMain({
  visibleApps,
  onApply,
  onCreateSession,
  nextSession,
  todaysCount,
}: DesktopProps) {
  const { railOpen, openRail } = useAppShell();

  return (
    <div className="p-6">
      <PageHeader
        eyebrow={
          <>
            <span>Mercredi 2 septembre</span>
            <span className="h-1 w-1 rounded-full bg-[#D5D7DB]" />
            <span className="font-medium text-[#0B0B0F]">
              {todaysCount} séance{todaysCount > 1 ? "s" : ""} aujourd&apos;hui
            </span>
          </>
        }
        title={`Bonjour, ${mockTeacher.firstName}`}
        subline={
          <>
            <span className="font-semibold text-[#0B0B0F]">
              {visibleApps.length}
            </span>{" "}
            demande{visibleApps.length > 1 ? "s" : ""} à traiter · prochaine séance à{" "}
            <span className="font-semibold text-[#0B0B0F]">17:00</span>.
          </>
        }
        actions={
          <>
            <button
              aria-label="Calendrier"
              className="grid h-9 w-9 place-items-center rounded-full border border-[#EFEFF1] text-[#0B0B0F] transition-colors hover:bg-[#F5F5F7]"
            >
              <Calendar className="h-4 w-4" strokeWidth={1.75} />
            </button>
            <button
              onClick={onCreateSession}
              className="ml-0.5 flex h-9 items-center gap-1.5 rounded-full bg-[#0B0B0F] px-3.5 text-[12px] font-semibold text-white transition-colors hover:bg-[#1a1b21]"
            >
              <Plus className="h-3.5 w-3.5" strokeWidth={2.25} />
              Créer une séance
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

      {/* Hero grid — Next session + Lime create-session CTA */}
      <div className="mt-6 grid grid-cols-[1fr_320px] gap-2.5">
        <NextSessionCard s={nextSession} />
        <CreateSessionCTA onClick={onCreateSession} />
      </div>

      {/* Matching requests strip */}
      <section className="mt-7">
        <SectionHeader
          title="Demandes d'élèves qui matchent"
          subtitle="Postes récents dans ta spécialité"
          action="Voir toutes"
          actionHref="/teacher/discover"
        />
        <div
          className="scrollbar-none mt-3.5 flex snap-x snap-mandatory gap-2.5 overflow-x-auto pb-2"
          style={{ scrollPaddingInline: "0.25rem" }}
        >
          {mockMatchingRequests.map((r) => (
            <MatchingRequestCard key={r.id} {...r} onApply={onApply} />
          ))}
        </div>
      </section>

      {/* Upcoming sessions */}
      <section className="mt-7">
        <SectionHeader
          title="Prochaines séances"
          action="Voir toutes"
          actionHref="/teacher/sessions"
        />
        <div className="mt-3.5 divide-y divide-[#EFEFF1] overflow-hidden rounded-2xl border border-[#EFEFF1]">
          {mockUpcomingSessions.slice(0, 5).map((s) => (
            <SessionRow key={s.title} {...s} />
          ))}
        </div>
      </section>

      {/* Monthly recap — dark card */}
      <section className="mt-7 pb-2">
        <MonthlyRecapCard />
      </section>
    </div>
  );
}

function NextSessionCard({ s }: { s: SessionShape }) {
  const studentInitials = s.teacher
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <div className="relative flex flex-col overflow-hidden rounded-[20px] border border-[#EFEFF1] bg-white p-5 shadow-[0_1px_2px_rgba(10,11,20,0.04)]">
      <div className="flex items-center justify-between">
        <Eyebrow>Prochaine séance · {s.when}</Eyebrow>
        <span className="rounded-full bg-[#DFFF3F] px-1.5 py-0.5 text-[10px] font-semibold text-[#0B0B0F]">
          en direct dans 12 min
        </span>
      </div>
      <h2 className="mt-2 font-[family-name:var(--font-cabinet)] text-[24px] font-bold leading-[1.1] tracking-tight text-[#0B0B0F]">
        {s.title}
      </h2>
      <div className="mt-3.5 flex items-center gap-2.5">
        <Avatar initials={studentInitials} tone="neutral" size={32} />
        <div>
          <p className="text-[12.5px] font-semibold text-[#0B0B0F]">{s.teacher}</p>
          <p className="text-[11px] text-[#8A8D93]">
            {s.duration} · séance en visio
          </p>
        </div>
      </div>
      <div className="mt-auto flex items-center gap-3 pt-4">
        <ComingSoonButton
          message="La salle ouvre à H-5"
          className="flex items-center gap-1.5 rounded-full bg-[#0B0B0F] px-4 py-2 text-[12px] font-semibold text-white transition-colors hover:bg-[#1a1b21]"
          flashClassName="!bg-[#DFFF3F] !text-[#0B0B0F]"
        >
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#DFFF3F]" />
          Rejoindre
        </ComingSoonButton>
        <ComingSoonButton
          message="Bientôt"
          className="text-[11.5px] font-medium text-[#8A8D93] transition-colors hover:text-[#0B0B0F]"
          flashClassName="!text-[#0B0B0F]"
        >
          Reprogrammer
        </ComingSoonButton>
      </div>
    </div>
  );
}

function CreateSessionCTA({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="group relative flex flex-col overflow-hidden rounded-[20px] bg-[#DFFF3F] p-5 text-left text-[#0B0B0F] transition-transform hover:-translate-y-0.5"
    >
      <div className="flex items-center justify-between">
        <span className="grid h-9 w-9 place-items-center rounded-full bg-[#0B0B0F] text-[#DFFF3F]">
          <Plus className="h-4 w-4" strokeWidth={2.5} />
        </span>
        <Sparkles className="h-4 w-4 text-[#0B0B0F]/50" strokeWidth={1.75} />
      </div>
      <p className="mt-4 font-[family-name:var(--font-cabinet)] text-[22px] font-bold leading-[1.1] tracking-tight">
        Créer une séance
      </p>
      <p className="mt-1.5 text-[12px] leading-snug text-[#0B0B0F]/70">
        Publie un créneau, les élèves postulent en un clic.
      </p>
      <div className="mt-auto flex items-center justify-between pt-4">
        <span className="text-[10.5px] font-semibold uppercase tracking-[0.09em] text-[#0B0B0F]/60">
          Style Upwork
        </span>
        <span className="grid h-8 w-8 place-items-center rounded-full bg-[#0B0B0F] text-white transition-transform group-hover:rotate-45">
          <ArrowUpRight className="h-3.5 w-3.5" />
        </span>
      </div>
    </button>
  );
}

/* ---------- Right rail (desktop) ---------- */

function RightRail({
  visibleApps,
  onAccept,
  onDecline,
}: {
  visibleApps: typeof mockPendingApplications;
  onAccept: (id: string) => void;
  onDecline: (id: string) => void;
}) {
  const { closeRail } = useAppShell();
  return (
    <>
      <div className="rounded-[20px] bg-white p-4 shadow-[0_1px_2px_rgba(10,11,20,0.04)]">
        <div className="flex items-center justify-between">
          <h3 className="text-[13px] font-semibold text-[#0B0B0F]">À traiter</h3>
          <div className="flex items-center gap-1.5">
            <span className="rounded-full bg-[#DFFF3F] px-1.5 py-0.5 text-[10px] font-semibold text-[#0B0B0F] tabular-nums">
              {visibleApps.length} nouvelles
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
        <p className="mt-1 text-[11px] text-[#8A8D93]">
          Élèves ayant postulé à tes séances & demandes.
        </p>

        {visibleApps.length === 0 ? (
          <div className="mt-3 rounded-[14px] border border-dashed border-[#EFEFF1] bg-[#FAFAFB] p-4 text-center">
            <p className="text-[11.5px] font-semibold text-[#0B0B0F]">
              Boîte vide — bien joué !
            </p>
            <p className="mt-0.5 text-[10.5px] text-[#8A8D93]">
              De nouvelles demandes arrivent en journée.
            </p>
          </div>
        ) : (
          <div className="mt-3 space-y-2">
            {visibleApps.slice(0, 4).map((a) => (
              <ApplicationRow
                key={a.id}
                {...a}
                onAccept={onAccept}
                onDecline={onDecline}
              />
            ))}
          </div>
        )}
        {visibleApps.length > 4 ? (
          <button className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-full bg-[#0B0B0F] py-2 text-[11.5px] font-semibold text-white">
            Voir les {visibleApps.length} demandes
            <ArrowUpRight className="h-3 w-3" strokeWidth={2} />
          </button>
        ) : null}
      </div>

      <div className="rounded-[20px] bg-white p-4 shadow-[0_1px_2px_rgba(10,11,20,0.04)]">
        <div className="flex items-center justify-between">
          <h3 className="text-[13px] font-semibold text-[#0B0B0F]">Messages</h3>
          <Link
            href="/teacher/messages"
            className="text-[10.5px] font-medium text-[#8A8D93] transition-colors hover:text-[#0B0B0F]"
          >
            Boîte de réception
          </Link>
        </div>
        <div className="mt-3 space-y-3">
          {mockUnreadTeacherMessages.slice(0, 3).map((m) => (
            <MessagePreview key={m.name} {...m} />
          ))}
        </div>
      </div>

      <div className="rounded-[20px] bg-white p-4 shadow-[0_1px_2px_rgba(10,11,20,0.04)]">
        <div className="flex items-center justify-between">
          <h3 className="text-[13px] font-semibold text-[#0B0B0F]">Notifications</h3>
          <span className="rounded-full bg-[#F5F5F7] px-1.5 py-0.5 text-[10px] font-semibold text-[#4A4D54] tabular-nums">
            {mockUnreadTeacherNotifs.filter((n) => n.unread).length} non lues
          </span>
        </div>
        <div className="mt-3 space-y-2">
          {mockUnreadTeacherNotifs.slice(0, 2).map((n) => (
            <NotificationRow key={n.id} {...n} />
          ))}
        </div>
      </div>
    </>
  );
}

/* ---------- Monthly recap (dark card) ---------- */

function MonthlyRecapCard() {
  const spark = [40, 55, 30, 70, 45, 90, 60];
  return (
    <div className="rounded-[20px] bg-[#0B0B0F] p-6 text-white shadow-[0_1px_2px_rgba(10,11,20,0.04)]">
      <div className="flex items-center justify-between">
        <span className="text-[9.5px] font-semibold uppercase tracking-[0.09em] text-white/50">
          Aperçu du mois · Septembre
        </span>
        <span className="flex h-5 items-center gap-1 rounded-full bg-white/10 px-1.5 text-[9.5px] font-semibold text-[#DFFF3F]">
          <Sparkles className="h-2.5 w-2.5" strokeWidth={2.25} />
          +18% vs août
        </span>
      </div>
      <div className="mt-4 grid grid-cols-[1.2fr_1fr_1fr_1fr] items-end gap-6">
        <div>
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.07em] text-white/50">
            Revenus
          </p>
          <div className="mt-1 font-[family-name:var(--font-cabinet)] text-[38px] font-bold leading-none tracking-tight text-[#DFFF3F] tabular-nums">
            <SlidingNumber value={mockMonthlyEarnings} />
            <span className="ml-1 text-[15px] font-semibold text-white/50">MAD</span>
          </div>
        </div>
        <div>
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.07em] text-white/50">
            Séances
          </p>
          <div className="mt-1 font-[family-name:var(--font-cabinet)] text-[32px] font-bold leading-none tracking-tight tabular-nums">
            <SlidingNumber value={mockSessionsThisMonth} />
          </div>
          <p className="mt-1.5 text-[11px] text-white/60">réalisées ce mois-ci</p>
        </div>
        <div>
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.07em] text-white/50">
            Note moyenne
          </p>
          <div className="mt-1 flex items-baseline gap-1.5 font-[family-name:var(--font-cabinet)] text-[32px] font-bold leading-none tracking-tight tabular-nums">
            {mockAvgRating.toFixed(1)}
            <Star
              className="h-4 w-4 fill-[#DFFF3F] text-[#DFFF3F]"
              strokeWidth={0}
            />
          </div>
          <p className="mt-1.5 text-[11px] text-white/60">sur 34 avis</p>
        </div>
        <div className="flex h-[86px] items-end gap-1.5">
          {spark.map((h, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-1">
              <div
                className={cn(
                  "w-full rounded-sm",
                  i === 5 ? "bg-[#DFFF3F]" : "bg-white/15",
                )}
                style={{ height: `${h * 0.6}px` }}
              />
              <span className="text-[8.5px] font-medium text-white/40">
                {["L", "M", "M", "J", "V", "S", "D"][i]}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ================================================================
   MOBILE
   ================================================================ */

type MobileProps = {
  visibleApps: typeof mockPendingApplications;
  onAccept: (id: string) => void;
  onDecline: (id: string) => void;
  onApply: (id: string) => void;
  onCreateSession: () => void;
  nextSession: SessionShape;
};

function MobileBody({
  visibleApps,
  onAccept,
  onDecline,
  onApply,
  onCreateSession,
  nextSession,
}: MobileProps) {
  return (
    <>
      <MobileHero s={nextSession} onCreate={onCreateSession} />
      <MobileMatching onApply={onApply} />
      <MobileTodo
        visibleApps={visibleApps}
        onAccept={onAccept}
        onDecline={onDecline}
      />
      <MobileSessions />
      <MobileMonthly />
      <MobileMessagesSection />
      <MobileNotifsSection />
    </>
  );
}

function MobileHero({
  s,
  onCreate,
}: {
  s: SessionShape;
  onCreate: () => void;
}) {
  const studentInitials = s.teacher
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <div className="mt-3 px-4">
      <div className="relative flex flex-col overflow-hidden rounded-[18px] bg-[#0B0B0F] p-4 text-white">
        <p className="text-[9.5px] font-semibold uppercase tracking-[0.09em] text-white/50">
          Prochaine séance · {s.when}
        </p>
        <p className="mt-1 font-[family-name:var(--font-cabinet)] text-[18px] font-bold leading-[1.15] tracking-tight line-clamp-2">
          {s.title}
        </p>
        <div className="mt-2.5 flex items-center gap-2">
          <Avatar initials={studentInitials} tone="lime" size={26} />
          <p className="truncate text-[11px] text-white/70">
            {s.teacher} · {s.duration}
          </p>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <button className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-[#DFFF3F] py-2 text-[12px] font-semibold text-[#0B0B0F]">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#0B0B0F]" />
            Rejoindre
          </button>
          <button className="rounded-full border border-white/15 px-3 py-2 text-[11px] font-semibold text-white/80">
            Reprogrammer
          </button>
        </div>
      </div>

      <button
        onClick={onCreate}
        className="mt-2.5 flex w-full items-center justify-between rounded-[18px] bg-[#DFFF3F] p-4 text-left text-[#0B0B0F] transition-transform active:scale-[0.99]"
      >
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.09em] text-[#0B0B0F]/60">
            Nouvelle séance
          </p>
          <p className="mt-0.5 font-[family-name:var(--font-cabinet)] text-[17px] font-bold leading-[1.1] tracking-tight">
            Créer une séance
          </p>
          <p className="mt-0.5 text-[11px] text-[#0B0B0F]/70">
            Publie un créneau, les élèves postulent.
          </p>
        </div>
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#0B0B0F] text-white">
          <Plus className="h-4 w-4" strokeWidth={2.5} />
        </span>
      </button>
    </div>
  );
}

function MobileMatching({ onApply }: { onApply: (id: string) => void }) {
  return (
    <section className="mt-5">
      <div className="px-4">
        <h2 className="font-[family-name:var(--font-cabinet)] text-[17px] font-bold tracking-tight text-[#0B0B0F]">
          Demandes qui matchent
        </h2>
        <p className="mt-0.5 text-[11px] text-[#8A8D93]">
          Postes récents dans ta spécialité
        </p>
      </div>
      <div
        className="scrollbar-none mt-3 flex snap-x snap-mandatory gap-2.5 overflow-x-auto px-4 pb-1"
        style={{ scrollPaddingInline: "1rem" }}
      >
        {mockMatchingRequests.map((r) => (
          <MatchingRequestCard key={r.id} {...r} onApply={onApply} />
        ))}
      </div>
    </section>
  );
}

function MobileTodo({
  visibleApps,
  onAccept,
  onDecline,
}: {
  visibleApps: typeof mockPendingApplications;
  onAccept: (id: string) => void;
  onDecline: (id: string) => void;
}) {
  return (
    <section className="mt-5 px-4">
      <div className="rounded-[20px] bg-white p-4 shadow-[0_1px_2px_rgba(10,11,20,0.04)]">
        <div className="flex items-center justify-between">
          <h3 className="text-[13px] font-semibold text-[#0B0B0F]">À traiter</h3>
          <span className="rounded-full bg-[#DFFF3F] px-1.5 py-0.5 text-[10px] font-semibold text-[#0B0B0F] tabular-nums">
            {visibleApps.length} nouvelles
          </span>
        </div>
        {visibleApps.length === 0 ? (
          <div className="mt-3 rounded-[14px] border border-dashed border-[#EFEFF1] bg-[#FAFAFB] p-4 text-center">
            <p className="text-[11.5px] font-semibold text-[#0B0B0F]">
              Rien à traiter — bien joué !
            </p>
          </div>
        ) : (
          <div className="mt-3 space-y-2">
            {visibleApps.slice(0, 4).map((a) => (
              <ApplicationRow
                key={a.id}
                {...a}
                onAccept={onAccept}
                onDecline={onDecline}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function MobileSessions() {
  return (
    <section className="mt-3 px-4">
      <div className="flex items-end justify-between">
        <h3 className="font-[family-name:var(--font-cabinet)] text-[17px] font-bold tracking-tight text-[#0B0B0F]">
          Prochaines séances
        </h3>
        <Link
          href="/teacher/sessions"
          className="text-[11.5px] font-medium text-[#8A8D93] transition-colors hover:text-[#0B0B0F]"
        >
          Voir toutes
        </Link>
      </div>
      <div className="mt-3 divide-y divide-[#EFEFF1] overflow-hidden rounded-2xl border border-[#EFEFF1] bg-white">
        {mockUpcomingSessions.slice(0, 4).map((s) => (
          <SessionRow key={s.title} {...s} />
        ))}
      </div>
    </section>
  );
}

function MobileMonthly() {
  return (
    <section className="mt-3 px-4">
      <div className="rounded-[20px] bg-[#0B0B0F] p-4 text-white">
        <div className="flex items-center justify-between">
          <span className="text-[9.5px] font-semibold uppercase tracking-[0.09em] text-white/50">
            Aperçu du mois · Septembre
          </span>
          <span className="flex h-5 items-center gap-1 rounded-full bg-white/10 px-1.5 text-[9.5px] font-semibold text-[#DFFF3F]">
            <Wallet className="h-2.5 w-2.5" strokeWidth={2.25} />
            +18%
          </span>
        </div>
        <div className="mt-3 flex items-end justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.07em] text-white/50">
              Revenus
            </p>
            <div className="mt-0.5 font-[family-name:var(--font-cabinet)] text-[32px] font-bold leading-none tracking-tight text-[#DFFF3F] tabular-nums">
              <SlidingNumber value={mockMonthlyEarnings} />
              <span className="ml-1 text-[13px] font-semibold text-white/50">
                MAD
              </span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-semibold uppercase tracking-[0.07em] text-white/50">
              Séances / Note
            </p>
            <p className="mt-0.5 font-[family-name:var(--font-cabinet)] text-[22px] font-bold leading-none tracking-tight tabular-nums">
              {mockSessionsThisMonth}
              <span className="mx-1.5 text-white/30">·</span>
              {mockAvgRating.toFixed(1)}
              <Star
                className="ml-1 inline-block h-3.5 w-3.5 fill-[#DFFF3F] text-[#DFFF3F]"
                strokeWidth={0}
              />
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function MobileMessagesSection() {
  return (
    <section className="mt-3 px-4">
      <div className="rounded-[20px] bg-white p-4 shadow-[0_1px_2px_rgba(10,11,20,0.04)]">
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-1.5 text-[13px] font-semibold text-[#0B0B0F]">
            <MessageCircle className="h-3.5 w-3.5" strokeWidth={1.75} />
            Messages non lus
          </h3>
          <Link
            href="/teacher/messages"
            className="text-[10.5px] font-medium text-[#8A8D93] transition-colors hover:text-[#0B0B0F]"
          >
            Voir tout
          </Link>
        </div>
        <div className="mt-3 space-y-3">
          {mockUnreadTeacherMessages.slice(0, 3).map((m) => (
            <MessagePreview key={m.name} {...m} />
          ))}
        </div>
      </div>
    </section>
  );
}

function MobileNotifsSection() {
  return (
    <section className="mt-3 px-4">
      <div className="rounded-[20px] bg-white p-4 shadow-[0_1px_2px_rgba(10,11,20,0.04)]">
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-1.5 text-[13px] font-semibold text-[#0B0B0F]">
            <Bell className="h-3.5 w-3.5" strokeWidth={1.75} />
            Notifications
          </h3>
          <span className="rounded-full bg-[#F5F5F7] px-1.5 py-0.5 text-[10px] font-semibold text-[#4A4D54] tabular-nums">
            {mockUnreadTeacherNotifs.filter((n) => n.unread).length} non lues
          </span>
        </div>
        <div className="mt-3 space-y-2">
          {mockUnreadTeacherNotifs.slice(0, 3).map((n) => (
            <NotificationRow key={n.id} {...n} />
          ))}
        </div>
      </div>
    </section>
  );
}

