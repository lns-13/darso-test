"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { MessageCircle, Search } from "lucide-react";
import { AppShell } from "@/components/app/app-shell";
import { EmptyState } from "@/components/app/empty-state";
import { ThreadList } from "@/components/app/thread-list";
import { MessageThread } from "@/components/app/message-thread";
import { Avatar } from "@/components/app/avatar";
import { SmoothInput } from "@/components/library/smooth-input";
import { teacherMobileTabs, teacherNav } from "@/lib/nav";
import { fadeQuick } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { mockTeacher } from "@/lib/mock/teacher";
import type { Message, Thread } from "@/lib/mock/messages";
import { formatRelativeShort } from "@/lib/mock/messages-helpers";
import {
  agencyMembership,
  mockCoWorkerThreads,
  mockTeacherThreads,
} from "@/lib/mock/teacher-messages";

type Tab = "students" | "coworkers";

export default function TeacherMessagesPage() {
  const router = useRouter();

  const [studentThreads, setStudentThreads] = useState<Thread[]>(mockTeacherThreads);
  const [coworkerThreads, setCoworkerThreads] = useState<Thread[]>(mockCoWorkerThreads);
  const [tab, setTab] = useState<Tab>("students");

  const threads = tab === "students" ? studentThreads : coworkerThreads;
  const setThreads = tab === "students" ? setStudentThreads : setCoworkerThreads;

  const [activeId, setActiveId] = useState<string | null>(
    mockTeacherThreads[0]?.id ?? null,
  );
  const [typingByThread, setTypingByThread] = useState<Record<string, boolean>>({});
  const [searchOpen, setSearchOpen] = useState(false);

  const activeThread = useMemo(
    () => threads.find((t) => t.id === activeId) ?? null,
    [threads, activeId],
  );

  /* --- swap active thread when tab changes --- */
  useEffect(() => {
    const first = (tab === "students" ? studentThreads : coworkerThreads)[0];
    setActiveId(first?.id ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  /* --- keep unread → read when a thread is opened --- */
  useEffect(() => {
    if (!activeId) return;
    setThreads((prev) =>
      prev.map((t) => (t.id === activeId && t.unread > 0 ? { ...t, unread: 0 } : t)),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId]);

  /* --- ⌘K to open search --- */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((v) => !v);
      } else if (e.key === "Escape" && searchOpen) {
        setSearchOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [searchOpen]);

  /* --- typing indicator simulation on active thread --- */
  const lastActiveRef = useRef<string | null>(null);
  useEffect(() => {
    if (!activeId) return;
    if (lastActiveRef.current === activeId) return;
    lastActiveRef.current = activeId;

    const startId = activeId;
    const start = setTimeout(() => {
      setTypingByThread((m) => ({ ...m, [startId]: true }));
      const stop = setTimeout(() => {
        setTypingByThread((m) => ({ ...m, [startId]: false }));
        setThreads((prev) =>
          prev.map((t) => {
            if (t.id !== startId) return t;
            const incoming: Message = {
              id: `sim-${Date.now()}`,
              from: t.participant.id,
              content: pickReply(t),
              time: new Date().toISOString(),
            };
            return {
              ...t,
              messages: [...t.messages, incoming],
              lastMessage: incoming.content,
              lastMessageTime: incoming.time,
            };
          }),
        );
      }, 2000);
      (start as unknown as { _stop?: NodeJS.Timeout })._stop = stop;
    }, 4000);
    return () => {
      clearTimeout(start);
      const stop = (start as unknown as { _stop?: NodeJS.Timeout })._stop;
      if (stop) clearTimeout(stop);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId]);

  const handleSelect = useCallback((id: string) => {
    setActiveId(id);
  }, []);

  const handleSend = useCallback(
    (text: string) => {
      if (!activeId) return;
      setThreads((prev) =>
        prev.map((t) => {
          if (t.id !== activeId) return t;
          const outgoing: Message = {
            id: `me-${Date.now()}`,
            from: "me",
            content: text,
            time: new Date().toISOString(),
            status: "sent",
          };
          return {
            ...t,
            messages: [...t.messages, outgoing],
            lastMessage: text,
            lastMessageTime: outgoing.time,
          };
        }),
      );
      window.setTimeout(() => bumpLastStatus(setThreads, activeId, "delivered"), 600);
      window.setTimeout(() => bumpLastStatus(setThreads, activeId, "read"), 1800);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeId],
  );

  const goToMobileThread = (id: string) => {
    router.push(`/teacher/messages/${id}`);
  };

  const totalUnread = threads.reduce((sum, t) => sum + t.unread, 0);
  const showTabs = agencyMembership;

  /* ---------------- DESKTOP ---------------- */
  const desktop = (
    <div className="h-[calc(100dvh-1rem)] p-4">
      <div className="grid h-full grid-cols-[minmax(280px,320px)_1fr] gap-0 overflow-hidden rounded-[20px] border border-[#EFEFF1] bg-white">
        {/* Left column */}
        <div className="flex min-h-0 flex-col border-r border-[#EFEFF1]">
          {showTabs ? <SubTabs tab={tab} onChange={setTab} /> : null}
          <div className="min-h-0 flex-1">
            <ThreadList
              threads={threads}
              activeId={activeId}
              onSelect={handleSelect}
              onOpenSearch={() => setSearchOpen(true)}
              variant="desktop"
            />
          </div>
        </div>
        {/* Right column */}
        <div className="min-h-0">
          {activeThread ? (
            <MessageThread
              thread={activeThread}
              variant="desktop"
              isTyping={!!typingByThread[activeThread.id]}
              onSend={handleSend}
            />
          ) : (
            <div className="grid h-full place-items-center p-8">
              <EmptyState
                icon={MessageCircle}
                title="Sélectionne une conversation"
                body={
                  tab === "students"
                    ? "Choisis un fil à gauche pour continuer la discussion avec ton élève."
                    : "Choisis un fil à gauche pour discuter avec un collègue."
                }
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );

  /* ---------------- MOBILE ---------------- */
  const mobile = (
    <div className="mt-2 flex h-[calc(100dvh-8.5rem)] flex-col overflow-hidden rounded-t-[20px] bg-white">
      {showTabs ? <SubTabs tab={tab} onChange={setTab} /> : null}
      <div className="min-h-0 flex-1">
        <ThreadList
          threads={threads}
          activeId={null}
          onSelect={goToMobileThread}
          onOpenSearch={() => setSearchOpen(true)}
          variant="mobile"
        />
      </div>
    </div>
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
          title: "Messages",
          subtitle:
            totalUnread > 0
              ? `${totalUnread} non lu${totalUnread > 1 ? "s" : ""}`
              : `${threads.length} conversations`,
        }}
        mobileChildren={mobile}
      />

      {/* Search overlay (⌘K) */}
      <AnimatePresence>
        {searchOpen ? (
          <SearchOverlay
            threads={threads}
            onClose={() => setSearchOpen(false)}
            onSelect={(id) => {
              setSearchOpen(false);
              setActiveId(id);
            }}
          />
        ) : null}
      </AnimatePresence>
    </>
  );
}

/* --- sub-tabs (only rendered when agencyMembership === true) --- */

function SubTabs({ tab, onChange }: { tab: Tab; onChange: (t: Tab) => void }) {
  return (
    <div className="flex items-center gap-1 border-b border-[#EFEFF1] px-3 py-2">
      {(
        [
          { id: "students", label: "Élèves" },
          { id: "coworkers", label: "Collègues" },
        ] as { id: Tab; label: string }[]
      ).map((t) => {
        const active = tab === t.id;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onChange(t.id)}
            className={cn(
              "rounded-full px-3 py-1 text-[11.5px] font-semibold transition-colors",
              active
                ? "bg-[#0B0B0F] text-white"
                : "text-[#6E7178] hover:bg-[#F5F5F7]",
            )}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

/* --- helpers --- */

function bumpLastStatus(
  setThreads: React.Dispatch<React.SetStateAction<Thread[]>>,
  threadId: string,
  status: "delivered" | "read",
) {
  setThreads((prev) =>
    prev.map((t) => {
      if (t.id !== threadId) return t;
      const msgs = [...t.messages];
      for (let i = msgs.length - 1; i >= 0; i--) {
        if (msgs[i].from === "me") {
          msgs[i] = { ...msgs[i], status };
          break;
        }
      }
      return { ...t, messages: msgs };
    }),
  );
}

function pickReply(t: Thread): string {
  const opts = [
    "Merci Monsieur, c'est plus clair maintenant 🙏",
    "Ok, je m'y mets tout de suite.",
    "Super, à la prochaine séance alors !",
    "D'accord, je note tout ça 👍",
  ];
  const idx = Math.abs(t.id.charCodeAt(0) + t.messages.length) % opts.length;
  return opts[idx];
}

/* --- search overlay --- */

function SearchOverlay({
  threads,
  onClose,
  onSelect,
}: {
  threads: Thread[];
  onClose: () => void;
  onSelect: (id: string) => void;
}) {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return threads.slice(0, 6);
    return threads.filter(
      (t) =>
        t.participant.name.toLowerCase().includes(s) ||
        t.lastMessage.toLowerCase().includes(s) ||
        t.participant.role.toLowerCase().includes(s),
    );
  }, [q, threads]);

  return (
    <motion.div
      key="overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={fadeQuick}
      className="fixed inset-0 z-50 grid place-items-start justify-items-center overflow-y-auto bg-[#0B0B0F]/50 px-4 py-[10vh] backdrop-blur-[2px]"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: -8, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -8, scale: 0.98 }}
        transition={{ duration: 0.18 }}
        className="w-full max-w-[560px] overflow-hidden rounded-[20px] bg-white p-4 shadow-[0_20px_60px_rgba(11,11,15,0.28)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex h-11 items-center gap-2 rounded-full bg-[#F5F5F7] px-3">
          <Search className="h-4 w-4 text-[#8A8D93]" strokeWidth={1.75} />
          <SmoothInput
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher un élève, un mot…"
            className="text-[13px] text-[#0B0B0F] placeholder:text-[#8A8D93]"
          />
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-[#E4E5E8] bg-white px-1.5 py-0.5 text-[10px] font-semibold text-[#6E7178] transition-colors hover:bg-[#F5F5F7]"
          >
            Échap
          </button>
        </div>

        <p className="mt-4 px-1 text-[9.5px] font-semibold uppercase tracking-[0.09em] text-[#8A8D93]">
          {q ? "Résultats" : "Conversations récentes"}
        </p>

        <ul className="mt-1.5 max-h-[50vh] space-y-0.5 overflow-y-auto">
          {filtered.length === 0 ? (
            <li className="px-2 py-6 text-center text-[11.5px] text-[#8A8D93]">
              Aucun résultat pour “{q}”.
            </li>
          ) : (
            filtered.map((t) => (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() => onSelect(t.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-[12px] px-2 py-2 text-left transition-colors hover:bg-[#F5F5F7]",
                  )}
                >
                  <Avatar initials={t.participant.initials} size={32} tone="neutral" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-[12.5px] font-semibold text-[#0B0B0F]">
                        {t.participant.name}
                      </p>
                      <span className="shrink-0 text-[10px] text-[#8A8D93]">
                        {formatRelativeShort(t.lastMessageTime)}
                      </span>
                    </div>
                    <p className="truncate text-[11px] text-[#6E7178]">{t.lastMessage}</p>
                  </div>
                </button>
              </li>
            ))
          )}
        </ul>
      </motion.div>
    </motion.div>
  );
}
