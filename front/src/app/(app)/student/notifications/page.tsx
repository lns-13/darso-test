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
import {
  NotificationRow,
  type NotificationCategory,
} from "@/components/app/notification-row";
import { studentMobileTabs, studentNav } from "@/lib/nav";
import { fadeQuick } from "@/lib/motion";
import { cn } from "@/lib/utils";

/* ---------------- Mock student ---------------- */

const student = {
  firstName: "Sara",
  fullName: "Sara Bencheikh",
  level: "Terminale S · Lycée Descartes",
  initials: "SB",
};

/* ---------------- Mock data ---------------- */

type NotifBucket = "today" | "yesterday" | "week";

type Notif = {
  id: string;
  category: NotificationCategory;
  title: string;
  body?: string;
  time: string;
  bucket: NotifBucket;
  unread: boolean;
  avatar?: { name: string; initials: string };
  action?: { label: string; href?: string };
};

const initialNotifications: Notif[] = [
  {
    id: "n1",
    category: "session",
    title: "Rappel · demain à 18h avec Youssef",
    body: "Bac 2026 · Analyse & suites numériques. Prépare tes exercices sur les limites.",
    time: "Il y a 12 min",
    bucket: "today",
    unread: true,
    action: { label: "Voir la séance", href: "/student/sessions" },
  },
  {
    id: "n2",
    category: "message",
    title: "Marc Dupont",
    body: "Ta correction est prête, j'ai laissé quelques notes en marge — passe-y un œil.",
    time: "Il y a 34 min",
    bucket: "today",
    unread: true,
    avatar: { name: "Marc Dupont", initials: "MD" },
    action: { label: "Répondre", href: "/student/messages" },
  },
  {
    id: "n3",
    category: "payment",
    title: "Paiement de 220 MAD confirmé",
    body: "Séance du 04/09 avec Youssef Amrani · reçu envoyé par email.",
    time: "Il y a 2 h",
    bucket: "today",
    unread: true,
    action: { label: "Reçu", href: "/student/payments" },
  },
  {
    id: "n4",
    category: "system",
    title: "Ton profil est complet à 80%",
    body: "Ajoute une photo et ton niveau pour recevoir de meilleures recommandations.",
    time: "Il y a 4 h",
    bucket: "today",
    unread: true,
    action: { label: "Compléter", href: "/student/profile" },
  },
  {
    id: "n5",
    category: "session",
    title: "Nouvelle proposition · Nadia Cherkaoui",
    body: "Physique-Chimie · mardi 20h — répond avant demain pour garder le créneau.",
    time: "Il y a 5 h",
    bucket: "today",
    unread: false,
    action: { label: "Voir", href: "/student/sessions" },
  },
  {
    id: "n6",
    category: "message",
    title: "Sofia El Idrissi",
    body: "Merci pour la séance ! J'ai partagé la fiche méthode dans le fil.",
    time: "Hier · 19:42",
    bucket: "yesterday",
    unread: false,
    avatar: { name: "Sofia El Idrissi", initials: "SI" },
    action: { label: "Ouvrir", href: "/student/messages" },
  },
  {
    id: "n7",
    category: "payment",
    title: "Paiement de 160 MAD confirmé",
    body: "Séance du 01/09 avec Sofia El Idrissi.",
    time: "Hier · 17:10",
    bucket: "yesterday",
    unread: false,
    action: { label: "Reçu", href: "/student/payments" },
  },
  {
    id: "n8",
    category: "session",
    title: "Séance terminée · laisse un avis",
    body: "Comment s'est passé le cours avec Emma Whitfield ? Ton retour aide la commu.",
    time: "Hier · 15:20",
    bucket: "yesterday",
    unread: false,
    action: { label: "Noter", href: "/student/reviews" },
  },
  {
    id: "n9",
    category: "system",
    title: "2 nouveaux profs de maths près de chez toi",
    body: "Deux profs viennent d'ouvrir des créneaux à Casablanca.",
    time: "Hier · 09:15",
    bucket: "yesterday",
    unread: false,
    action: { label: "Découvrir", href: "/student/discover" },
  },
  {
    id: "n10",
    category: "payment",
    title: "Carte •• 4821 · pense à mettre à jour",
    body: "Ta carte principale expire le mois prochain.",
    time: "Lun. · 11:02",
    bucket: "week",
    unread: false,
    action: { label: "Mettre à jour", href: "/student/payments" },
  },
  {
    id: "n11",
    category: "message",
    title: "Karim El Fassi",
    body: "Salut Sara, prête pour le chapitre sur la génétique jeudi ?",
    time: "Dim. · 20:45",
    bucket: "week",
    unread: false,
    avatar: { name: "Karim El Fassi", initials: "KE" },
    action: { label: "Répondre", href: "/student/messages" },
  },
  {
    id: "n12",
    category: "session",
    title: "Séance annulée · Rachid Benhaddou",
    body: "Le prof a annulé le créneau du 30/08 · aucun montant prélevé.",
    time: "Dim. · 08:12",
    bucket: "week",
    unread: false,
  },
  {
    id: "n13",
    category: "system",
    title: "Nouvelle fonctionnalité · favoris",
    body: "Épingle tes profs préférés depuis leur profil.",
    time: "Sam. · 14:30",
    bucket: "week",
    unread: false,
  },
  {
    id: "n14",
    category: "payment",
    title: "Remboursement de 100 MAD reçu",
    body: "Le remboursement pour la séance du 27/08 est dispo sur ton compte.",
    time: "Sam. · 10:05",
    bucket: "week",
    unread: false,
    action: { label: "Historique", href: "/student/payments" },
  },
  {
    id: "n15",
    category: "message",
    title: "Chloé Bernard",
    body: "Bonjour, j'ai une place le vendredi si ça t'intéresse pour le commentaire.",
    time: "Ven. · 18:40",
    bucket: "week",
    unread: false,
    avatar: { name: "Chloé Bernard", initials: "CB" },
    action: { label: "Répondre", href: "/student/messages" },
  },
];

/* ---------------- Types & helpers ---------------- */

type FilterKey = "all" | "unread" | "session" | "payment" | "message";

const bucketLabels: Record<NotifBucket, string> = {
  today: "Aujourd'hui",
  yesterday: "Hier",
  week: "Cette semaine",
};

const bucketOrder: NotifBucket[] = ["today", "yesterday", "week"];

function readTab(sp: URLSearchParams | ReadonlyURLSearchParams): FilterKey {
  const t = sp.get("tab");
  if (t === "unread" || t === "session" || t === "payment" || t === "message") return t;
  return "all";
}

type ReadonlyURLSearchParams = {
  get(k: string): string | null;
};

/* ---------------- Page ---------------- */

export default function StudentNotificationsPage() {
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

  const [notifications, setNotifications] = useState<Notif[]>(initialNotifications);
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
      case "session":
        return notifications.filter((n) => n.category === "session");
      case "payment":
        return notifications.filter((n) => n.category === "payment");
      case "message":
        return notifications.filter((n) => n.category === "message");
      default:
        return notifications;
    }
  }, [notifications, tab]);

  const grouped = useMemo(() => {
    const out: Record<NotifBucket, Notif[]> = { today: [], yesterday: [], week: [] };
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
    { key: "session", label: "Séances" },
    { key: "payment", label: "Paiements" },
    { key: "message", label: "Messages" },
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
          subline="Séances, paiements, messages et alertes système — au même endroit."
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
                href="/student/notifications/settings"
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
      nav={studentNav}
      mobileTabs={studentMobileTabs}
      user={student}
      desktopMain={desktop}
      mobileHeader={{
        title: "Notifications",
        subtitle:
          unreadCount > 0
            ? `${unreadCount} non lu${unreadCount > 1 ? "s" : ""}`
            : "Tout est à jour",
        right: (
          <Link
            href="/student/notifications/settings"
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
  grouped: Record<NotifBucket, Notif[]>;
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
    case "session":
      return "Aucune notif de séance";
    case "payment":
      return "Aucune notif de paiement";
    case "message":
      return "Aucun message récent";
    default:
      return "Rien à voir ici";
  }
}

function emptyBody(tab: FilterKey): string {
  switch (tab) {
    case "unread":
      return "Tes notifications non lues apparaîtront ici dès qu'il y en aura.";
    case "session":
      return "Les rappels de tes prochaines séances apparaîtront ici.";
    case "payment":
      return "Confirmations, remboursements et alertes de carte tomberont ici.";
    case "message":
      return "Les nouveaux messages de tes profs seront listés ici.";
    default:
      return "Rien de neuf pour l'instant — profite-en !";
  }
}
