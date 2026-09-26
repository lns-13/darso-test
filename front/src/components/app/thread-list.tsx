"use client";

import { useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { MessagePreview } from "./message-preview";
import { SmoothInput } from "@/components/library/smooth-input";
import type { Thread } from "@/lib/mock/messages";
import { formatRelativeShort } from "@/lib/mock/messages-helpers";

type Filter = "all" | "unread" | "teachers";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "Tous" },
  { id: "unread", label: "Non lus" },
  { id: "teachers", label: "Profs" },
];

export function ThreadList({
  threads,
  activeId,
  onSelect,
  onOpenSearch,
  variant = "desktop",
}: {
  threads: Thread[];
  activeId?: string | null;
  onSelect: (id: string) => void;
  onOpenSearch?: () => void;
  variant?: "desktop" | "mobile";
}) {
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return threads.filter((t) => {
      if (filter === "unread" && t.unread === 0) return false;
      // "teachers" — all mock participants are teachers, so it's a no-op
      // but reserved for future.
      if (!q) return true;
      return (
        t.participant.name.toLowerCase().includes(q) ||
        t.lastMessage.toLowerCase().includes(q)
      );
    });
  }, [threads, filter, query]);

  const totalUnread = threads.reduce((sum, t) => sum + t.unread, 0);

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Sticky top bar */}
      <div className="sticky top-0 z-10 shrink-0 bg-white/95 px-3 pb-2 pt-3 backdrop-blur">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="font-[family-name:var(--font-cabinet)] text-[17px] font-bold tracking-tight text-[#0B0B0F]">
              Messages
            </p>
            <p className="mt-0.5 text-[10.5px] text-[#8A8D93]">
              {threads.length} conversations
              {totalUnread > 0 ? ` · ${totalUnread} non lus` : ""}
            </p>
          </div>
          <button
            type="button"
            aria-label="Nouvelle conversation"
            className="grid h-8 w-8 place-items-center rounded-full bg-[#0B0B0F] text-white transition-transform hover:scale-[1.03]"
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={2} />
          </button>
        </div>

        {/* Search input */}
        <button
          type="button"
          onClick={onOpenSearch}
          className="mt-3 flex h-9 w-full items-center gap-2 rounded-full bg-[#F5F5F7] px-3 text-left text-[12px] text-[#8A8D93] transition-colors hover:bg-[#EDEDEF]"
        >
          <Search className="h-3.5 w-3.5" strokeWidth={1.75} />
          <span className="flex-1 truncate">Rechercher une conversation…</span>
          {variant === "desktop" ? (
            <span className="flex items-center gap-0.5 rounded-md border border-[#E4E5E8] bg-white px-1.5 py-0.5 text-[9.5px] font-semibold text-[#6E7178]">
              ⌘ K
            </span>
          ) : null}
        </button>

        {/* Filter chips */}
        <div className="mt-2 flex items-center gap-1">
          {FILTERS.map((f) => {
            const isActive = filter === f.id;
            const count =
              f.id === "unread" ? totalUnread : f.id === "all" ? threads.length : threads.length;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                className={cn(
                  "flex h-7 items-center gap-1.5 rounded-full px-2.5 text-[11px] font-semibold transition-colors",
                  isActive
                    ? "bg-[#0B0B0F] text-white"
                    : "bg-white text-[#6E7178] hover:bg-[#F5F5F7]",
                )}
              >
                <span>{f.label}</span>
                <span
                  className={cn(
                    "text-[10px]",
                    isActive ? "text-white/60" : "text-[#A5A8AE]",
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Hidden until user starts typing directly — kept for keyboard flow. */}
        <div className="sr-only">
          <SmoothInput
            aria-label="Recherche rapide"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher"
          />
        </div>
      </div>

      {/* List */}
      <div className="min-h-0 flex-1 overflow-y-auto px-1.5 py-1.5">
        {filtered.length === 0 ? (
          <div className="p-6 text-center text-[11.5px] text-[#8A8D93]">
            Aucun résultat.
          </div>
        ) : (
          <ul className="space-y-0.5">
            {filtered.map((t) => {
              const isActive = t.id === activeId;
              return (
                <li key={t.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(t.id)}
                    className={cn(
                      "w-full rounded-[14px] px-2 py-2 text-left transition-colors",
                      isActive
                        ? "bg-[#F0F0F2]"
                        : "hover:bg-[#F5F5F7]",
                    )}
                  >
                    <MessagePreview
                      name={t.participant.name}
                      initials={t.participant.initials}
                      preview={t.lastMessage}
                      time={formatRelativeShort(t.lastMessageTime)}
                      unread={t.unread > 0}
                    />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
