"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { BellOff, CheckCheck, Settings2 } from "lucide-react";
import { AppShell } from "@/components/app/app-shell";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";
import { TabSwitcher } from "@/components/app/tab-switcher";
import { NotificationRow } from "@/components/app/notification-row";
import { teacherMobileTabs, teacherNav } from "@/lib/nav";
import { fadeQuick } from "@/lib/motion";
import { cn } from "@/lib/utils";
import {
  mockTeacherNotifications,
  type TeacherNotifBucket,
  type TeacherNotification,
} from "@/lib/mock/teacher-notifications";
import { mockTeacher } from "@/lib/mock/teacher";

/* ---------------- Filters ---------------- */
/**
 * Teacher tabs: Tous · Non lus · Demandes · Paiements · Séances
 *   - "requests" → category === "session"  (candidatures & réservations)
 *   - "payments" → category === "payment"
 *   - "sessions" → category === "system" AND title starts with "Rappel"/"Séance"
 *                  (rappels et modifications de séances) — plus messages? no,
 *                  messages restent en filtre "Tous / Non lus".
 * We keep the underlying NotificationRow categories unchanged.
 */
type FilterKey = "all" | "unread" | "requests" | "payments" | "sessions";

const bucketLabels: Record<TeacherNotifBucket, string> = {
  today: "Aujourd'hui",
  yesterday: "Hier",
  week: "Cette semaine",
};

const bucketOrder: TeacherNotifBucket[] = ["today", "yesterday", "week"];

type ReadonlyURLSearchParams = { get(k: string): string | null };

function readTab(sp: ReadonlyURLSearchParams): FilterKey {
  const t = sp.get("tab");
  if (t === "unread" || t === "requests" || t === "payments" || t === "sessions")
    return t;
  return "all";
}

/**
 * Derive whether a notification is a "session-track" item (rappels, changements,
 * annulations de séances déjà bookées). We use category === "system" combined
 * with title heuristics so we do NOT invent new NotificationRow categories.
 */
function isSessionTrack(n: TeacherNotification): boolean {
  if (n.category !== "system") return false;
  const t = n.title.toLowerCase();
  return (
    t.startsWith("rappel") ||
    t.startsWith("séance") ||
    t.startsWith("seance")
  );
}

/* ---------------- Page ---------------- */

export default function TeacherNotificationsPage() {
  return (
    <Suspense fallback={null}>
      <NotificationsInner />
    </Suspense>
  );
}

function NotificationsInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [notifications, setNotifications] = useState<TeacherNotification[]>(
    mockTeacherNotifications,
  );
  const [tab, setTab] = useState<FilterKey>(() => readTab(searchParams));

  const urlTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const writeUrl = useCallback(
    (nextTab: FilterKey) => {
      if (urlTimer.current) clearTimeout(urlTimer.current);
      urlTimer.current = setTimeout(() => {
        const p = new URLSearchParams();
        if (nextTab !== "all") p.set("tab", nextTab);
        const qs = p.toString();
        router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
      }, 150);
    },
    [pathname, router],
  );

  useEffect(() => {
    writeUrl(tab);
    return () => {
      if (urlTimer.current) clearTimeout(urlTimer.current);
    };
  }, [tab, writeUrl]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => n.unread).length,
    [notifications],
  );

  const filtered = useMemo(() => {
    switch (tab) {
      case "unread":
        return notifications.filter((n) => n.unread);
      case "requests":
        return notifications.filter((n) => n.category === "session");
      case "payments":
        return notifications.filter((n) => n.category === "payment");
      case "sessions":
        return notifications.filter(isSessionTrack);
      default:
        return notifications;
    }
  }, [notifications, tab]);

  const grouped = useMemo(() => {
    const out: Record<TeacherNotifBucket, TeacherNotification[]> = {
      today: [],
      yesterday: [],
      week: [],
    };
    for (const n of filtered) out[n.bucket].push(n);
    return out;
  }, [filtered]);

  const handleMarkRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, unread: false } : n)),
    );
  }, []);

  const handleDismiss = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const handleMarkAll = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  }, []);

  const tabs: { key: FilterKey; label: string; count?: number }[] = [
    { key: "all", label: "Tous", count: notifications.length },
    { key: "unread", label: "Non lus", count: unreadCount },
    { key: "requests", label: "Demandes" },
    { key: "payments", label: "Paiements" },
    { key: "sessions", label: "Séances" },
  ];

  const list = (
    <NotificationList
      grouped={grouped}
      tab={tab}
      onMarkRead={handleMarkRead}
      onDismiss={handleDismiss}
    />
  );

  /* ---------- DESKTOP ---------- */
  const desktop = (
    <div className="flex min-h-full flex-col">
      <div className="px-6 pt-6">
        <PageHeader
          eyebrow={
            <>
              <span>Compte</span>
              <span className="h-1 w-1 rounded-full bg-[#D5D7DB]" />
              <span className="font-medium text-[#0B0B0F]">
                {unreadCount > 0
                  ? `${unreadCount} non lu${unreadCount > 1 ? "s" : ""}`
                  : "Tout est à jour"}
              </span>
            </>
          }
          title="Notifications"
          subline="Candidatures, paiements, rappels de séances et alertes — au même endroit."
          actions={
            <>
              <button
                type="button"
                onClick={handleMarkAll}
                disabled={unreadCount === 0}
                className={cn(
                  "flex h-9 items-center gap-1.5 rounded-full border border-[#EFEFF1] px-3.5 text-[12px] font-semibold text-[#0B0B0F] transition-colors",
                  unreadCount === 0
                    ? "cursor-not-allowed opacity-50"
                    : "hover:bg-[#F5F5F7]",
                )}
              >
                <CheckCheck className="h-3.5 w-3.5" strokeWidth={1.75} />
                Tout marquer lu
              </button>
              <Link
                href="/teacher/notifications/settings"
                className="grid h-9 w-9 place-items-center rounded-full border border-[#EFEFF1] text-[#0B0B0F] transition-colors hover:bg-[#F5F5F7]"
                aria-label="Préférences"
              >
                <Settings2 className="h-4 w-4" strokeWidth={1.75} />
              </Link>
            </>
          }
        />
      </div>

      <div className="sticky top-0 z-20 mt-5 border-b border-[#EFEFF1] bg-white/85 backdrop-blur-sm">
        <div className="mx-auto flex max-w-[760px] items-center justify-between px-6 py-3">
          <TabSwitcher<FilterKey> tabs={tabs} value={tab} onChange={setTab} />
        </div>
      </div>

      <div className="mx-auto w-full max-w-[720px] px-6 py-6">{list}</div>
    </div>
  );

  /* ---------- MOBILE ---------- */
  const mobile = (
    <>
      <div className="sticky top-14 z-20 -mx-0 border-b border-[#EFEFF1] bg-[#EDEDEF]/85 px-4 py-2.5 backdrop-blur-sm">
        <div className="scrollbar-none -mx-4 overflow-x-auto px-4">
          <TabSwitcher<FilterKey> tabs={tabs} value={tab} onChange={setTab} />
        </div>
      </div>

      <div className="px-4 pb-4 pt-4">
        {unreadCount > 0 ? (
          <button
            type="button"
            onClick={handleMarkAll}
            className="mb-3 flex w-full items-center justify-between rounded-full bg-[#0B0B0F] px-3.5 py-2 text-[11.5px] font-semibold text-white"
          >
            <span className="flex items-center gap-1.5">
              <CheckCheck className="h-3.5 w-3.5" strokeWidth={2} />
              Tout marquer lu
            </span>
            <span className="text-[10.5px] text-white/60">
              {unreadCount} non lu{unreadCount > 1 ? "s" : ""}
            </span>
          </button>
        ) : null}
        {list}
      </div>
    </>
  );

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
      mobileHeader={{
        title: "Notifications",
        subtitle:
          unreadCount > 0
            ? `${unreadCount} non lu${unreadCount > 1 ? "s" : ""}`
            : "Tout est à jour",
        right: (
          <Link
            href="/teacher/notifications/settings"
            aria-label="Préférences"
            className="grid h-10 w-10 place-items-center rounded-full bg-white text-[#0B0B0F] shadow-[0_1px_2px_rgba(10,11,20,0.04)]"
          >
            <Settings2 className="h-[17px] w-[17px]" strokeWidth={1.75} />
          </Link>
        ),
      }}
      mobileChildren={mobile}
    />
  );
}

/* ---------------- List / groups ---------------- */

function NotificationList({
  grouped,
  tab,
  onMarkRead,
  onDismiss,
}: {
  grouped: Record<TeacherNotifBucket, TeacherNotification[]>;
  tab: FilterKey;
  onMarkRead: (id: string) => void;
  onDismiss: (id: string) => void;
}) {
  const total = bucketOrder.reduce((s, b) => s + grouped[b].length, 0);

  if (total === 0) {
    return (
      <motion.div
        key={`empty-${tab}`}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={fadeQuick}
      >
        <EmptyState
          icon={BellOff}
          title={emptyTitle(tab)}
          body={emptyBody(tab)}
        />
      </motion.div>
    );
  }

  return (
    <AnimatePresence mode="popLayout" initial={false}>
      <motion.div key={tab} layout className="space-y-6">
        {bucketOrder.map((bucket) => {
          const items = grouped[bucket];
          if (items.length === 0) return null;
          return (
            <section key={bucket}>
              <div className="mb-2.5 flex items-center gap-2">
                <span className="rounded-full bg-white px-2.5 py-1 text-[9.5px] font-semibold uppercase tracking-[0.09em] text-[#6E7178] ring-1 ring-[#EFEFF1]">
                  {bucketLabels[bucket]}
                </span>
                <span className="h-px flex-1 bg-[#EFEFF1]" />
                <span className="text-[10.5px] font-semibold text-[#8A8D93]">
                  {items.length}
                </span>
              </div>
              <div className="space-y-2">
                <AnimatePresence initial={false}>
                  {items.map((n) => (
                    <NotificationRow
                      key={n.id}
                      id={n.id}
                      category={n.category}
                      title={n.title}
                      body={n.body}
                      time={n.time}
                      unread={n.unread}
                      avatar={n.avatar}
                      action={n.action}
                      onMarkRead={onMarkRead}
                      onDismiss={onDismiss}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </section>
          );
        })}
      </motion.div>
    </AnimatePresence>
  );
}

function emptyTitle(tab: FilterKey): string {
  switch (tab) {
    case "unread":
      return "Tout est à jour";
    case "requests":
      return "Aucune demande en attente";
    case "payments":
      return "Aucune notif de paiement";
    case "sessions":
      return "Aucun rappel de séance";
    default:
      return "Rien à voir ici";
  }
}

function emptyBody(tab: FilterKey): string {
  switch (tab) {
    case "unread":
      return "Tes notifications non lues apparaîtront ici dès qu'il y en aura.";
    case "requests":
      return "Les nouvelles candidatures d'élèves tomberont ici.";
    case "payments":
      return "Paiements reçus, retraits et alertes IBAN s'affichent ici.";
    case "sessions":
      return "Les rappels de tes prochains créneaux apparaîtront ici.";
    default:
      return "Rien de neuf pour l'instant — profite-en !";
  }
}
