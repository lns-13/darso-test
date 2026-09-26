"use client";

import { useEffect, useRef, useState } from "react";
import { ImageIcon, Mic, Paperclip, Send, Smile } from "lucide-react";
import { cn } from "@/lib/utils";
import { ToolbarDeck } from "@/components/library/toolbar-deck";

export function MessageComposer({
  onSend,
  placeholder = "Écris ton message…",
  variant = "desktop",
}: {
  onSend: (text: string) => void;
  placeholder?: string;
  variant?: "desktop" | "mobile";
}) {
  const [text, setText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const canSend = text.trim().length > 0;

  // Auto-grow the textarea.
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 140)}px`;
  }, [text]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!canSend) return;
    onSend(text.trim());
    setText("");
    // Reset height too.
    requestAnimationFrame(() => {
      const ta = textareaRef.current;
      if (ta) ta.style.height = "auto";
    });
  };

  return (
    <div
      className={cn(
        "sticky bottom-0 z-10 bg-white/95 backdrop-blur",
        variant === "desktop" ? "border-t border-[#EFEFF1]" : "border-t border-[#EFEFF1]",
      )}
    >
      <form onSubmit={handleSubmit} className="px-3 py-2.5">
        <div className="flex items-end gap-2">
          {/* Toolbar (attachments) */}
          <ToolbarDeck
            className="mb-0.5"
            items={[
              { id: "attach", title: "Fichier", icon: Paperclip },
              { id: "image", title: "Image", icon: ImageIcon },
              { id: "emoji", title: "Emoji", icon: Smile },
              { id: "voice", title: "Voix", icon: Mic },
            ]}
          />

          {/* Input pill */}
          <div className="flex min-w-0 flex-1 items-end rounded-[20px] bg-[#F5F5F7] px-3 py-2 focus-within:bg-[#EDEDEF]">
            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              rows={1}
              placeholder={placeholder}
              className="min-h-[24px] w-full resize-none bg-transparent text-[13px] leading-[1.4] text-[#0B0B0F] outline-none placeholder:text-[#8A8D93]"
            />
          </div>

          {/* Send button */}
          <button
            type="submit"
            disabled={!canSend}
            aria-label="Envoyer"
            className={cn(
              "grid h-9 w-9 shrink-0 place-items-center rounded-full transition-all",
              canSend
                ? "bg-[#DFFF3F] text-[#0B0B0F] hover:brightness-[0.97]"
                : "bg-[#F0F0F2] text-[#B5B7BC]",
            )}
          >
            <Send className="h-3.5 w-3.5" strokeWidth={2} />
          </button>
        </div>
        <p className="mt-1.5 text-center text-[9.5px] text-[#A5A8AE]">
          Entrée pour envoyer · Maj + Entrée pour un saut de ligne
        </p>
      </form>
    </div>
  );
}
