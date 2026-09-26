"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import { MessageSquareText, Send, Star, X } from "lucide-react";
import { AppShell } from "@/components/app/app-shell";
import { Avatar } from "@/components/app/avatar";
import { EmptyState } from "@/components/app/empty-state";
import { PageHeader } from "@/components/app/page-header";
import { StatefulButton } from "@/components/library/stateful-button";
import { teacherMobileTabs, teacherNav } from "@/lib/nav";
import { mockTeacher } from "@/lib/mock/teacher";
import {
  mockRatingSummary,
  mockReviews,
  type RatingBucket,
  type TeacherReview,
} from "@/lib/mock/teacher-reviews";
import { cn } from "@/lib/utils";

/* ---------------- Filter model ---------------- */

type FilterKey = "all" | "positive" | "neutral" | "negative" | "todo";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "Tous" },
  { key: "positive", label: "Positifs (4-5)" },
  { key: "neutral", label: "Neutres (3)" },
  { key: "negative", label: "Négatifs (1-2)" },
  { key: "todo", label: "À répondre" },
];

function parseFilter(v: string | null): FilterKey {
  if (
    v === "positive" ||
    v === "neutral" ||
    v === "negative" ||
    v === "todo" ||
    v === "all"
  ) {
    return v;
  }
  return "all";
}

function applyFilter(reviews: TeacherReview[], filter: FilterKey) {
  switch (filter) {
    case "positive":
      return reviews.filter((r) => r.rating >= 4);
    case "neutral":
      return reviews.filter((r) => r.rating === 3);
    case "negative":
      return reviews.filter((r) => r.rating <= 2);
    case "todo":
      return reviews.filter((r) => !r.teacherResponse);
    default:
      return reviews;
  }
}

function filterCount(reviews: TeacherReview[], filter: FilterKey) {
  return applyFilter(reviews, filter).length;
}

/* ---------------- Page ---------------- */

export default function TeacherReviewsPage() {
  return (
    <Suspense fallback={null}>
      <ReviewsInner />
    </Suspense>
  );
}

function ReviewsInner() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const initialFilter = parseFilter(searchParams.get("filter"));
  const [filter, setFilter] = useState<FilterKey>(initialFilter);

  // Local mutable copy so optimistic reply-submits stick during the session.
  const [reviews, setReviews] = useState<TeacherReview[]>(mockReviews);
  const [replyOpen, setReplyOpen] = useState<Record<string, boolean>>({});
  const [replyDraft, setReplyDraft] = useState<Record<string, string>>({});

  useEffect(() => {
    const p = new URLSearchParams(Array.from(searchParams.entries()));
    if (filter === "all") p.delete("filter");
    else p.set("filter", filter);
    const qs = p.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const filtered = useMemo(() => applyFilter(reviews, filter), [reviews, filter]);

  const openReply = (id: string) => {
    setReplyOpen((prev) => ({ ...prev, [id]: true }));
    setReplyDraft((prev) => ({ ...prev, [id]: prev[id] ?? "" }));
  };
  const cancelReply = (id: string) => {
    setReplyOpen((prev) => ({ ...prev, [id]: false }));
  };
  const setDraft = (id: string, v: string) => {
    setReplyDraft((prev) => ({ ...prev, [id]: v.slice(0, 400) }));
  };
  const submitReply = async (id: string) => {
    const text = (replyDraft[id] ?? "").trim();
    if (!text) return;
    // Simulate the network round-trip so StatefulButton can play its loader+check.
    await new Promise((r) => setTimeout(r, 600));
    setReviews((prev) =>
      prev.map((r) => (r.id === id ? { ...r, teacherResponse: text } : r)),
    );
    setReplyOpen((prev) => ({ ...prev, [id]: false }));
  };

  const body = (
    <ReviewsBody
      filter={filter}
      setFilter={setFilter}
      reviews={reviews}
      filtered={filtered}
      replyOpen={replyOpen}
      replyDraft={replyDraft}
      openReply={openReply}
      cancelReply={cancelReply}
      setDraft={setDraft}
      submitReply={submitReply}
    />
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
      desktopMain={<DesktopFrame>{body}</DesktopFrame>}
      mobileHeader={{
        title: "Avis",
        subtitle: `${mockRatingSummary.avg.toFixed(1)}/5 · ${mockRatingSummary.count} avis`,
      }}
      mobileChildren={<MobileFrame>{body}</MobileFrame>}
    />
  );
}

/* ---------------- Layout wrappers ---------------- */

function DesktopFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="p-6">
      <PageHeader
        eyebrow={
          <>
            <span>Réputation</span>
            <span className="h-1 w-1 rounded-full bg-[#D5D7DB]" />
            <span className="font-medium text-[#0B0B0F]">
              {mockRatingSummary.count} avis reçus
            </span>
          </>
        }
        title="Avis"
        subline="Ce que tes élèves disent — et comment y répondre."
      />
      <div className="mt-6">{children}</div>
    </div>
  );
}

function MobileFrame({ children }: { children: React.ReactNode }) {
  return <div className="mt-3 px-4 pb-6">{children}</div>;
}

/* ---------------- Body ---------------- */

type BodyProps = {
  filter: FilterKey;
  setFilter: (f: FilterKey) => void;
  reviews: TeacherReview[];
  filtered: TeacherReview[];
  replyOpen: Record<string, boolean>;
  replyDraft: Record<string, string>;
  openReply: (id: string) => void;
  cancelReply: (id: string) => void;
  setDraft: (id: string, v: string) => void;
  submitReply: (id: string) => Promise<void>;
};

function ReviewsBody({
  filter,
  setFilter,
  reviews,
  filtered,
  replyOpen,
  replyDraft,
  openReply,
  cancelReply,
  setDraft,
  submitReply,
}: BodyProps) {
  return (
    <>
      <SummaryCard />

      <div className="mt-5 flex flex-wrap items-center gap-1.5">
        {FILTERS.map((f) => {
          const isActive = f.key === filter;
          const count = filterCount(reviews, f.key);
          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={cn(
                "inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[11.5px] font-semibold transition-colors",
                isActive
                  ? "bg-[#0B0B0F] text-white"
                  : "bg-white text-[#4A4D54] hover:text-[#0B0B0F]",
              )}
            >
              {f.label}
              <span
                className={cn(
                  "flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold tabular-nums",
                  isActive ? "bg-[#DFFF3F] text-[#0B0B0F]" : "bg-[#F0F0F2] text-[#4A4D54]",
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-5">
        {filtered.length === 0 ? (
          <EmptyState
            icon={MessageSquareText}
            title="Aucun avis pour ce filtre"
            body="Change de filtre pour voir d'autres retours de tes élèves."
          />
        ) : (
          <div className="space-y-2.5">
            {filtered.map((r) => (
              <ReviewCard
                key={r.id}
                review={r}
                replyOpen={!!replyOpen[r.id]}
                draft={replyDraft[r.id] ?? ""}
                onOpenReply={() => openReply(r.id)}
                onCancelReply={() => cancelReply(r.id)}
                onDraftChange={(v) => setDraft(r.id, v)}
                onSubmit={() => submitReply(r.id)}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

/* ---------------- Summary card ---------------- */

function SummaryCard() {
  const { avg, count, breakdown } = mockRatingSummary;
  const maxCount = Math.max(...(Object.values(breakdown) as number[]));

  return (
    <div className="rounded-[20px] bg-white p-6 shadow-[0_1px_2px_rgba(10,11,20,0.04)]">
      <div className="grid gap-6 min-[720px]:grid-cols-[minmax(180px,240px)_1fr] min-[720px]:gap-10">
        {/* Left: giant number + stars */}
        <div className="flex flex-col items-start">
          <span className="text-[10.5px] font-semibold uppercase tracking-[0.09em] text-[#8A8D93]">
            Note moyenne
          </span>
          <div className="mt-1.5 font-[family-name:var(--font-cabinet)] text-[64px] font-bold leading-none tracking-[-0.02em] text-[#0B0B0F] tabular-nums">
            {avg.toFixed(1)}
          </div>
          <div className="mt-3 flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((i) => {
              const filled = i <= Math.round(avg);
              return (
                <Star
                  key={i}
                  className={cn(
                    "h-4 w-4",
                    filled
                      ? "fill-[#0B0B0F] text-[#0B0B0F]"
                      : "fill-[#F0F0F2] text-[#F0F0F2]",
                  )}
                  strokeWidth={0}
                />
              );
            })}
          </div>
          <p className="mt-2 text-[11.5px] text-[#8A8D93]">
            Basée sur <span className="font-semibold text-[#0B0B0F] tabular-nums">{count}</span> avis
          </p>
        </div>

        {/* Right: 5-bar distribution */}
        <div className="flex flex-col gap-1.5">
          {([5, 4, 3, 2, 1] as RatingBucket[]).map((bucket, i) => {
            const value = breakdown[bucket];
            const pct = maxCount === 0 ? 0 : (value / maxCount) * 100;
            const isFive = bucket === 5;
            return (
              <div
                key={bucket}
                className="grid grid-cols-[24px_16px_1fr_36px] items-center gap-2.5"
              >
                <span className="text-[11.5px] font-semibold tabular-nums text-[#0B0B0F]">
                  {bucket}
                </span>
                <Star
                  className="h-3 w-3 fill-[#0B0B0F] text-[#0B0B0F]"
                  strokeWidth={0}
                />
                <div className="relative h-2 overflow-hidden rounded-full bg-[#F0F0F2]">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{
                      duration: 0.9,
                      delay: 0.05 * i,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    className={cn(
                      "absolute inset-y-0 left-0 rounded-full",
                      isFive ? "bg-[#DFFF3F]" : "bg-[#0B0B0F]",
                    )}
                  />
                </div>
                <span className="text-right text-[11px] font-semibold tabular-nums text-[#4A4D54]">
                  {value}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ---------------- Review card ---------------- */

function ReviewCard({
  review,
  replyOpen,
  draft,
  onOpenReply,
  onCancelReply,
  onDraftChange,
  onSubmit,
}: {
  review: TeacherReview;
  replyOpen: boolean;
  draft: string;
  onOpenReply: () => void;
  onCancelReply: () => void;
  onDraftChange: (v: string) => void;
  onSubmit: () => void;
}) {
  return (
    <div className="rounded-[20px] bg-white p-5 shadow-[0_1px_2px_rgba(10,11,20,0.04)]">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar initials={review.student.initials} tone="neutral" size={40} />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="truncate text-[13.5px] font-semibold text-[#0B0B0F]">
                {review.student.name}
              </p>
              {review.isNew ? (
                <span className="inline-flex h-4 items-center rounded-full bg-[#DFFF3F] px-1.5 text-[9.5px] font-bold uppercase tracking-wide text-[#0B0B0F]">
                  Nouveau
                </span>
              ) : null}
            </div>
            <p className="mt-0.5 text-[10.5px] font-semibold uppercase tracking-[0.07em] text-[#8A8D93]">
              {review.student.level} · {review.subject}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <StarRow value={review.rating} />
          <span className="text-[10.5px] tabular-nums text-[#8A8D93]">
            {formatDate(review.dateISO)}
          </span>
        </div>
      </div>

      <div className="mt-3.5">
        {review.title ? (
          <p className="font-[family-name:var(--font-cabinet)] text-[15.5px] font-bold leading-snug tracking-tight text-[#0B0B0F]">
            {review.title}
          </p>
        ) : null}
        <p
          className={cn(
            "text-[13px] leading-relaxed text-[#4A4D54]",
            review.title ? "mt-1.5" : "",
          )}
        >
          {review.body}
        </p>
      </div>

      {review.teacherResponse ? (
        <div className="mt-4 rounded-[14px] bg-[#F5F5F7] p-3.5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.09em] text-[#8A8D93]">
            Ta réponse
          </p>
          <p className="mt-1 text-[12.5px] leading-relaxed text-[#0B0B0F]">
            {review.teacherResponse}
          </p>
        </div>
      ) : replyOpen ? (
        <ReplyComposer
          draft={draft}
          onDraftChange={onDraftChange}
          onCancel={onCancelReply}
          onSubmit={onSubmit}
        />
      ) : (
        <div className="mt-4 flex items-center justify-between border-t border-[#EFEFF1] pt-3">
          <span className="text-[11px] text-[#8A8D93]">
            Aucune réponse envoyée.
          </span>
          <button
            onClick={onOpenReply}
            className="inline-flex h-8 items-center gap-1.5 rounded-full border border-[#EFEFF1] px-3 text-[11.5px] font-semibold text-[#0B0B0F] transition-colors hover:bg-[#F5F5F7]"
          >
            <MessageSquareText className="h-3.5 w-3.5" strokeWidth={1.75} />
            Répondre
          </button>
        </div>
      )}
    </div>
  );
}

function StarRow({ value }: { value: RatingBucket }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => {
        const filled = i <= value;
        return (
          <Star
            key={i}
            className={cn(
              "h-3.5 w-3.5",
              filled
                ? "fill-[#0B0B0F] text-[#0B0B0F]"
                : "fill-[#F0F0F2] text-[#F0F0F2]",
            )}
            strokeWidth={0}
          />
        );
      })}
    </div>
  );
}

/* ---------------- Reply composer ---------------- */

function ReplyComposer({
  draft,
  onDraftChange,
  onCancel,
  onSubmit,
}: {
  draft: string;
  onDraftChange: (v: string) => void;
  onCancel: () => void;
  onSubmit: () => void;
}) {
  const remaining = 400 - draft.length;
  const canSend = draft.trim().length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="mt-4"
    >
      <div className="rounded-[12px] border border-[#EFEFF1] bg-white transition-colors focus-within:border-[#0B0B0F]">
        <textarea
          value={draft}
          onChange={(e) => onDraftChange(e.target.value)}
          rows={3}
          maxLength={400}
          placeholder="Rédige une réponse chaleureuse et concrète…"
          className="block w-full resize-none rounded-[12px] bg-transparent px-3.5 py-3 text-[12.5px] leading-relaxed text-[#0B0B0F] placeholder:text-[#8A8D93] focus:outline-none"
        />
        <div className="flex items-center justify-between border-t border-[#EFEFF1] px-3 py-2">
          <span
            className={cn(
              "text-[10.5px] tabular-nums",
              remaining < 40 ? "text-[#B54708]" : "text-[#8A8D93]",
            )}
          >
            {remaining} caractères restants
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={onCancel}
              className="inline-flex h-7 items-center gap-1 rounded-full px-2.5 text-[11px] font-semibold text-[#8A8D93] transition-colors hover:text-[#0B0B0F]"
            >
              <X className="h-3 w-3" strokeWidth={2} />
              Annuler
            </button>
            <StatefulButton
              onClick={canSend ? onSubmit : undefined}
              disabled={!canSend}
              className={cn(
                "h-7 min-w-[92px] py-0 text-[11px]",
                !canSend && "opacity-60",
              )}
            >
              <span className="inline-flex items-center gap-1">
                <Send className="h-3 w-3" strokeWidth={2} />
                Envoyer
              </span>
            </StatefulButton>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ---------------- Helpers ---------------- */

function formatDate(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}
