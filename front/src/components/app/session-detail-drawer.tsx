"use client";

import { motion } from "motion/react";
import {
  ArrowUpRight,
  BookOpen,
  Calendar,
  ChevronLeft,
  Clock,
  Download,
  FileText,
  MessageSquare,
  RotateCcw,
  Video,
  X,
} from "lucide-react";
import { Avatar } from "@/components/app/avatar";
import { Eyebrow } from "@/components/app/eyebrow";
import { VideoPlayerExpandFrame } from "@/components/library/video-player-expand-frame";
import { cn } from "@/lib/utils";

export type SessionMaterial = {
  id: string;
  name: string;
  size?: string;
  kind?: "pdf" | "link" | "slides" | "notebook";
};

export type SessionDetailData = {
  id: string;
  title: string;
  subject: string;
  teacher: { name: string; initials: string };
  whenLabel: string;
  when: string; // ISO
  duration: string;
  status: "upcoming" | "live" | "past";
  recordingUrl?: string;
  recordingPoster?: string;
  notes?: string;
  materials?: SessionMaterial[];
  agenda?: string[];
};

const statusPill: Record<SessionDetailData["status"], string> = {
  live: "bg-[#DFFF3F] text-[#0B0B0F]",
  upcoming: "bg-[#0B0B0F] text-white",
  past: "bg-[#F0F0F2] text-[#4A4D54]",
};

const statusLabel: Record<SessionDetailData["status"], string> = {
  live: "En cours",
  upcoming: "À venir",
  past: "Terminée",
};

export function SessionDetailDrawer({
  session,
  pulsing,
  onBack,
  onJoin,
  onReschedule,
  onCancel,
  onMessage,
  variant = "panel",
}: {
  session: SessionDetailData | null;
  pulsing?: boolean;
  onBack?: () => void;
  onJoin?: (id: string) => void;
  onReschedule?: (id: string) => void;
  onCancel?: (id: string) => void;
  onMessage?: (id: string) => void;
  variant?: "panel" | "fullscreen";
}) {
  if (!session) {
    return (
      <div className="flex h-full items-center justify-center rounded-[20px] border border-dashed border-[#EFEFF1] bg-white/50 p-6 text-center">
        <p className="max-w-[220px] text-[12px] text-[#8A8D93]">
          Sélectionne une séance dans la liste pour voir les détails, les notes et
          l&apos;enregistrement.
        </p>
      </div>
    );
  }

  const isPast = session.status === "past";
  const isLive = session.status === "live";
  const canJoin = session.status === "upcoming" || isLive;

  return (
    <div
      className={cn(
        "flex h-full flex-col overflow-hidden rounded-[20px] border border-[#EFEFF1] bg-white shadow-[0_1px_2px_rgba(10,11,20,0.04)]",
        variant === "fullscreen" && "rounded-none border-0 shadow-none",
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 border-b border-[#EFEFF1] p-4">
        <div className="flex min-w-0 items-start gap-3">
          {variant === "fullscreen" && onBack ? (
            <button
              onClick={onBack}
              aria-label="Retour"
              className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full border border-[#EFEFF1] text-[#0B0B0F] transition-colors hover:bg-[#F5F5F7]"
            >
              <ChevronLeft className="h-4 w-4" strokeWidth={1.75} />
            </button>
          ) : null}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Eyebrow>{session.subject}</Eyebrow>
              <span
                className={cn(
                  "inline-flex h-4 items-center gap-1 rounded-full px-1.5 text-[9.5px] font-semibold",
                  statusPill[session.status],
                )}
              >
                {isLive ? (
                  <span className="h-1 w-1 animate-pulse rounded-full bg-[#0B0B0F]" />
                ) : null}
                {statusLabel[session.status]}
              </span>
            </div>
            <h2 className="mt-1 font-[family-name:var(--font-cabinet)] text-[20px] font-bold leading-[1.15] tracking-tight text-[#0B0B0F]">
              {session.title}
            </h2>
            <div className="mt-2 flex items-center gap-2">
              <Avatar initials={session.teacher.initials} size={22} tone="neutral" />
              <div className="min-w-0">
                <p className="truncate text-[12px] font-semibold text-[#0B0B0F]">
                  {session.teacher.name}
                </p>
                <p className="text-[10.5px] text-[#8A8D93]">Prof · {session.subject}</p>
              </div>
            </div>
          </div>
        </div>
        {variant === "panel" && onBack ? (
          <button
            onClick={onBack}
            aria-label="Fermer"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-[#8A8D93] transition-colors hover:bg-[#F5F5F7] hover:text-[#0B0B0F]"
          >
            <X className="h-4 w-4" strokeWidth={1.75} />
          </button>
        ) : null}
      </div>

      {/* Scrollable body */}
      <div className="scrollbar-none flex-1 overflow-y-auto p-4">
        {/* When strip */}
        <div className="flex flex-wrap items-center gap-2 rounded-[14px] bg-[#F5F5F7] p-3">
          <div className="flex items-center gap-1.5 text-[11.5px] font-semibold text-[#0B0B0F]">
            <Calendar className="h-3.5 w-3.5 text-[#8A8D93]" strokeWidth={1.75} />
            {session.whenLabel}
          </div>
          <span className="h-1 w-1 rounded-full bg-[#D5D7DB]" />
          <div className="flex items-center gap-1.5 text-[11.5px] text-[#4A4D54]">
            <Clock className="h-3.5 w-3.5 text-[#8A8D93]" strokeWidth={1.75} />
            {session.duration}
          </div>
        </div>

        {/* Primary CTA */}
        {canJoin ? (
          <div className="mt-4">
            <button
              onClick={() => onJoin?.(session.id)}
              className={cn(
                "relative flex w-full items-center justify-center gap-2 rounded-full py-3 text-[13px] font-semibold transition-colors",
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
              <Video className="relative h-4 w-4" strokeWidth={2} />
              <span className="relative">Rejoindre la séance</span>
            </button>

            <div className="mt-2 grid grid-cols-3 gap-1.5">
              <button
                onClick={() => onReschedule?.(session.id)}
                className="flex items-center justify-center gap-1.5 rounded-full border border-[#EFEFF1] py-2 text-[11.5px] font-semibold text-[#0B0B0F] transition-colors hover:bg-[#F5F5F7]"
              >
                <RotateCcw className="h-3 w-3" strokeWidth={1.75} />
                Reprogrammer
              </button>
              <button
                onClick={() => onMessage?.(session.id)}
                className="flex items-center justify-center gap-1.5 rounded-full border border-[#EFEFF1] py-2 text-[11.5px] font-semibold text-[#0B0B0F] transition-colors hover:bg-[#F5F5F7]"
              >
                <MessageSquare className="h-3 w-3" strokeWidth={1.75} />
                Message
              </button>
              <button
                onClick={() => onCancel?.(session.id)}
                className="flex items-center justify-center gap-1.5 rounded-full border border-[#EFEFF1] py-2 text-[11.5px] font-semibold text-[#D95555] transition-colors hover:bg-[#FCF1F1]"
              >
                <X className="h-3 w-3" strokeWidth={2} />
                Annuler
              </button>
            </div>
          </div>
        ) : null}

        {/* Recording (past sessions) */}
        {isPast && session.recordingUrl ? (
          <section className="mt-5">
            <SectionLabel>Enregistrement</SectionLabel>
            <div className="mt-2">
              <VideoPlayerExpandFrame
                src={session.recordingUrl}
                poster={session.recordingPoster}
                triggerLabel={session.duration}
              />
            </div>
          </section>
        ) : null}

        {/* Agenda / plan */}
        {session.agenda && session.agenda.length > 0 ? (
          <section className="mt-5">
            <SectionLabel>Au programme</SectionLabel>
            <ol className="mt-2 space-y-1.5">
              {session.agenda.map((item, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2.5 text-[12.5px] text-[#0B0B0F]"
                >
                  <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full bg-[#F0F0F2] text-[10px] font-bold text-[#0B0B0F] tabular-nums">
                    {i + 1}
                  </span>
                  <span className="leading-snug">{item}</span>
                </li>
              ))}
            </ol>
          </section>
        ) : null}

        {/* Notes */}
        {session.notes ? (
          <section className="mt-5">
            <SectionLabel>{isPast ? "Notes de la séance" : "Notes préparatoires"}</SectionLabel>
            <div className="mt-2 rounded-[14px] border border-[#EFEFF1] bg-white p-3.5">
              <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.06em] text-[#8A8D93]">
                <BookOpen className="h-3 w-3" strokeWidth={1.75} />
                Par {session.teacher.name.split(" ")[0]}
              </div>
              <p className="mt-1.5 whitespace-pre-line text-[12.5px] leading-relaxed text-[#4A4D54]">
                {session.notes}
              </p>
            </div>
          </section>
        ) : null}

        {/* Materials */}
        {session.materials && session.materials.length > 0 ? (
          <section className="mt-5">
            <SectionLabel>Ressources ({session.materials.length})</SectionLabel>
            <ul className="mt-2 divide-y divide-[#EFEFF1] overflow-hidden rounded-[14px] border border-[#EFEFF1]">
              {session.materials.map((m) => (
                <li key={m.id}>
                  <button
                    type="button"
                    className="flex w-full items-center gap-3 p-3 text-left transition-colors hover:bg-[#F5F5F7]"
                  >
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px] bg-[#F5F5F7] text-[#0B0B0F]">
                      <FileText className="h-4 w-4" strokeWidth={1.75} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[12.5px] font-semibold text-[#0B0B0F]">
                        {m.name}
                      </span>
                      <span className="block text-[10.5px] text-[#8A8D93]">
                        {(m.kind ?? "pdf").toUpperCase()}
                        {m.size ? ` · ${m.size}` : ""}
                      </span>
                    </span>
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-[#8A8D93]">
                      {m.kind === "link" ? (
                        <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={1.75} />
                      ) : (
                        <Download className="h-3.5 w-3.5" strokeWidth={1.75} />
                      )}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {isPast && !session.recordingUrl && !session.notes && !session.materials?.length ? (
          <p className="mt-6 rounded-[14px] border border-dashed border-[#EFEFF1] p-4 text-center text-[12px] text-[#8A8D93]">
            Aucun contenu supplémentaire pour cette séance.
          </p>
        ) : null}
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[11px] font-semibold uppercase tracking-[0.07em] text-[#8A8D93]">
      {children}
    </h3>
  );
}
