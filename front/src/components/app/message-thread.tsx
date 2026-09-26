"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, MoreHorizontal, Phone, Video } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/utils";
import { Avatar } from "./avatar";
import { MessageBubble } from "./message-bubble";
import { MessageComposer } from "./message-composer";
import type { Message, Thread } from "@/lib/mock/messages";
import {
  formatTimeHM,
  groupMessagesByDay,
} from "@/lib/mock/messages-helpers";

export function MessageThread({
  thread,
  variant = "desktop",
  isTyping = false,
  onSend,
  backHref,
}: {
  thread: Thread;
  variant?: "desktop" | "mobile";
  isTyping?: boolean;
  onSend?: (text: string) => void;
  backHref?: string;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const messages = thread.messages;
  const groups = useMemo(() => groupMessagesByDay(messages), [messages]);

  // Auto-scroll on mount, new message, and typing indicator toggle.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages.length, isTyping, thread.id]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 shrink-0 border-b border-[#EFEFF1] bg-white/95 px-4 py-3 backdrop-blur">
        <div className="flex items-center gap-3">
          {variant === "mobile" ? (
            <Link
              href={backHref ?? "/student/messages"}
              aria-label="Retour"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-[#0B0B0F] transition-colors hover:bg-[#F5F5F7]"
            >
              <ChevronLeft className="h-4 w-4" strokeWidth={2} />
            </Link>
          ) : null}

          <div className="relative">
            <Avatar
              initials={thread.participant.initials}
              tone="neutral"
              size={36}
            />
            {thread.participant.online ? (
              <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-[#7BB300]" />
            ) : null}
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-[13.5px] font-semibold text-[#0B0B0F]">
              {thread.participant.name}
            </p>
            <p className="mt-0.5 truncate text-[10.5px] text-[#8A8D93]">
              {thread.participant.role} · {thread.participant.lastSeen}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            <IconButton label="Appel audio" icon={Phone} />
            <IconButton label="Appel vidéo" icon={Video} />
            <IconButton label="Plus" icon={MoreHorizontal} />
          </div>
        </div>
      </div>

      {/* Messages column */}
      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        <div className="mx-auto flex max-w-[720px] flex-col gap-3">
          {groups.map((group) => (
            <div key={group.dayKey} className="flex flex-col gap-3">
              {/* Day divider */}
              <div className="my-2 flex items-center justify-center">
                <span className="rounded-full bg-[#F5F5F7] px-2.5 py-1 text-[9.5px] font-semibold uppercase tracking-[0.09em] text-[#8A8D93]">
                  {group.dividerLabel}
                </span>
              </div>

              {group.runs.map((run, runIdx) => {
                const side: "sent" | "received" = run.from === "me" ? "sent" : "received";
                return (
                  <div
                    key={`${group.dayKey}-${runIdx}`}
                    className={cn(
                      "flex flex-col gap-1",
                      runIdx > 0 ? "mt-2" : "",
                    )}
                  >
                    {run.items.map((msg: Message, i: number) => {
                      const isLast = i === run.items.length - 1;
                      return (
                        <MessageBubble
                          key={msg.id}
                          content={msg.content}
                          side={side}
                          time={formatTimeHM(msg.time)}
                          status={msg.status}
                          attachments={msg.attachments}
                          showTail={isLast}
                        />
                      );
                    })}
                  </div>
                );
              })}
            </div>
          ))}

          {/* Typing indicator */}
          <AnimatePresence>
            {isTyping ? (
              <motion.div
                key="typing"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18 }}
                className="flex justify-start"
              >
                <TypingBubble />
              </motion.div>
            ) : null}
          </AnimatePresence>

          <div className="h-2" />
        </div>
      </div>

      {/* Composer */}
      <MessageComposer
        variant={variant}
        onSend={(text) => onSend?.(text)}
        placeholder={`Écrire à ${thread.participant.name.split(" ")[0]}…`}
      />
    </div>
  );
}

function IconButton({
  label,
  icon: Icon,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
}) {
  const [pinged, setPinged] = useState(false);
  return (
    <button
      type="button"
      aria-label={label}
      onClick={() => {
        setPinged(true);
        window.setTimeout(() => setPinged(false), 900);
      }}
      className={cn(
        "grid h-8 w-8 place-items-center rounded-full text-[#6E7178] transition-colors hover:bg-[#F5F5F7] hover:text-[#0B0B0F]",
        pinged && "bg-[#DFFF3F] text-[#0B0B0F]",
      )}
      title={pinged ? "Bientôt disponible" : label}
    >
      <Icon className="h-3.5 w-3.5" strokeWidth={1.9} />
    </button>
  );
}

function TypingBubble() {
  return (
    <div className="flex items-center gap-1 rounded-[16px] rounded-bl-md bg-[#F0F0F2] px-3.5 py-2.5">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-[#8A8D93]"
          animate={{ y: [0, -3, 0], opacity: [0.5, 1, 0.5] }}
          transition={{
            duration: 0.9,
            repeat: Infinity,
            delay: i * 0.15,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}
