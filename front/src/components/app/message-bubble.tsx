"use client";

import { ArrowUpRight, FileText, ImageIcon, Mic } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { springSoft } from "@/lib/motion";
import type { MessageAttachment, MessageStatus } from "@/lib/mock/messages";

type Side = "sent" | "received";

export function MessageBubble({
  content,
  side,
  time,
  status,
  attachments,
  showTail = true,
}: {
  content: string;
  side: Side;
  time: string; // pre-formatted "14h05"
  status?: MessageStatus;
  attachments?: MessageAttachment[];
  /** whether to render the tail-round corner (last message of a group) */
  showTail?: boolean;
}) {
  const isSent = side === "sent";

  const bubbleClass = cn(
    "w-fit max-w-full px-3.5 py-2 text-[13px] leading-[1.35] rounded-[16px] whitespace-pre-wrap [overflow-wrap:anywhere]",
    isSent ? "bg-[#0B0B0F] text-white" : "bg-[#F0F0F2] text-[#0B0B0F]",
    // Tail (last in group)
    showTail && isSent ? "rounded-br-md" : "",
    showTail && !isSent ? "rounded-bl-md" : "",
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 6, scale: 0.99 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={springSoft}
      className={cn(
        "flex w-full min-w-0",
        isSent ? "justify-end" : "justify-start",
      )}
    >
      <div
        className={cn(
          "inline-flex max-w-[80%] flex-col",
          isSent ? "items-end" : "items-start",
        )}
      >
        {attachments && attachments.length > 0 ? (
          <div className="mb-1 flex flex-wrap gap-1.5">
            {attachments.map((att) => (
              <AttachmentChip key={att.id} attachment={att} side={side} />
            ))}
          </div>
        ) : null}

        {content ? <div className={bubbleClass}>{content}</div> : null}

        {showTail ? (
          <div
            className={cn(
              "mt-1 flex items-center gap-1 text-[10px] text-[#8A8D93]",
              isSent ? "flex-row-reverse" : "flex-row",
            )}
          >
            <span>{time}</span>
            {isSent && status ? <StatusTicks status={status} /> : null}
          </div>
        ) : null}
      </div>
    </motion.div>
  );
}

function StatusTicks({ status }: { status: MessageStatus }) {
  // grey ✓, grey ✓✓, lime ✓✓
  const color = status === "read" ? "#7BB300" : "#8A8D93";
  const double = status !== "sent";
  return (
    <span
      aria-label={`Statut: ${status}`}
      className="inline-flex items-center"
      style={{ color }}
    >
      <TickIcon />
      {double ? <TickIcon className="-ml-1.5" /> : null}
    </span>
  );
}

function TickIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 14 14"
      width={12}
      height={12}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M2.5 7.5 5.5 10.5 12 4" />
    </svg>
  );
}

function AttachmentChip({
  attachment,
  side,
}: {
  attachment: MessageAttachment;
  side: Side;
}) {
  const isSent = side === "sent";
  const Icon =
    attachment.kind === "image"
      ? ImageIcon
      : attachment.kind === "audio"
      ? Mic
      : attachment.kind === "link"
      ? ArrowUpRight
      : FileText;

  return (
    <div
      className={cn(
        "flex max-w-[240px] items-center gap-2 rounded-[12px] px-2.5 py-1.5 text-[11px] font-semibold",
        isSent
          ? "bg-white/10 text-white ring-1 ring-white/15"
          : "bg-white text-[#0B0B0F] ring-1 ring-[#EFEFF1]",
      )}
    >
      <span
        className={cn(
          "grid h-6 w-6 shrink-0 place-items-center rounded-[8px]",
          isSent ? "bg-white/10" : "bg-[#F5F5F7]",
        )}
      >
        <Icon className="h-3 w-3" strokeWidth={1.9} />
      </span>
      <span className="min-w-0 flex-1 truncate">{attachment.name}</span>
      {attachment.size ? (
        <span
          className={cn(
            "shrink-0 text-[10px] font-medium",
            isSent ? "text-white/60" : "text-[#8A8D93]",
          )}
        >
          {attachment.size}
        </span>
      ) : null}
    </div>
  );
}
