"use client";

import { use, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { MessageThread } from "@/components/app/message-thread";
import type { Message, Thread } from "@/lib/mock/messages";
import {
  agencyMembership,
  mockCoWorkerThreads,
  mockTeacherThreads,
} from "@/lib/mock/teacher-messages";

/**
 * Deep-linked full-screen thread. Renders identically on desktop and mobile so
 * shared URLs work everywhere — the header's back chevron always returns to the
 * teacher inbox. Looks up the threadId across student threads (always) and
 * co-worker threads (only when agencyMembership is enabled).
 */
export default function TeacherThreadDeepLinkPage({
  params,
}: {
  params: Promise<{ threadId: string }>;
}) {
  const { threadId } = use(params);

  const pool: Thread[] = agencyMembership
    ? [...mockTeacherThreads, ...mockCoWorkerThreads]
    : mockTeacherThreads;

  const initial = pool.find((t) => t.id === threadId);
  const [thread, setThread] = useState<Thread | null>(initial ?? null);
  const [isTyping, setIsTyping] = useState(false);

  // Mark as read on mount.
  useEffect(() => {
    setThread((t) => (t && t.unread > 0 ? { ...t, unread: 0 } : t));
  }, []);

  // Typing simulation.
  const startedRef = useRef(false);
  useEffect(() => {
    if (!thread || startedRef.current) return;
    startedRef.current = true;
    const start = setTimeout(() => {
      setIsTyping(true);
      const stop = setTimeout(() => {
        setIsTyping(false);
        setThread((prev) => {
          if (!prev) return prev;
          const incoming: Message = {
            id: `sim-${Date.now()}`,
            from: prev.participant.id,
            content: "Merci Monsieur, c'est plus clair maintenant 🙏",
            time: new Date().toISOString(),
          };
          return {
            ...prev,
            messages: [...prev.messages, incoming],
            lastMessage: incoming.content,
            lastMessageTime: incoming.time,
          };
        });
      }, 2000);
      (start as unknown as { _stop?: NodeJS.Timeout })._stop = stop;
    }, 4000);
    return () => {
      clearTimeout(start);
      const stop = (start as unknown as { _stop?: NodeJS.Timeout })._stop;
      if (stop) clearTimeout(stop);
    };
  }, [thread]);

  const handleSend = useCallback((text: string) => {
    setThread((prev) => {
      if (!prev) return prev;
      const outgoing: Message = {
        id: `me-${Date.now()}`,
        from: "me",
        content: text,
        time: new Date().toISOString(),
        status: "sent",
      };
      return {
        ...prev,
        messages: [...prev.messages, outgoing],
        lastMessage: text,
        lastMessageTime: outgoing.time,
      };
    });
    window.setTimeout(() => bumpStatus(setThread, "delivered"), 600);
    window.setTimeout(() => bumpStatus(setThread, "read"), 1800);
  }, []);

  if (!thread) {
    return (
      <div className="grid min-h-[100dvh] place-items-center bg-[#EDEDEF] p-8">
        <div className="w-full max-w-sm rounded-[20px] border border-[#EFEFF1] bg-white p-8 text-center">
          <div className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-[#F5F5F7]">
            <MessageCircle className="h-5 w-5 text-[#0B0B0F]" strokeWidth={1.75} />
          </div>
          <p className="mt-3 font-[family-name:var(--font-cabinet)] text-[16px] font-bold text-[#0B0B0F]">
            Conversation introuvable
          </p>
          <p className="mt-1 text-[12px] text-[#6E7178]">
            Ce fil de discussion n&apos;existe plus ou a été supprimé.
          </p>
          <Link
            href="/teacher/messages"
            className="mt-4 inline-flex h-9 items-center rounded-full bg-[#0B0B0F] px-4 text-[12px] font-semibold text-white transition-colors hover:bg-[#1a1b21]"
          >
            Retour aux messages
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[100dvh] flex-col bg-white">
      <MessageThread
        thread={thread}
        variant="mobile"
        isTyping={isTyping}
        onSend={handleSend}
        backHref="/teacher/messages"
      />
    </div>
  );
}

function bumpStatus(
  setThread: React.Dispatch<React.SetStateAction<Thread | null>>,
  status: "delivered" | "read",
) {
  setThread((prev) => {
    if (!prev) return prev;
    const msgs = [...prev.messages];
    for (let i = msgs.length - 1; i >= 0; i--) {
      if (msgs[i].from === "me") {
        msgs[i] = { ...msgs[i], status };
        break;
      }
    }
    return { ...prev, messages: msgs };
  });
}
