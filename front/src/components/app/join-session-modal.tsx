"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Camera, CameraOff, Mic, MicOff, Video, X } from "lucide-react";
import { Avatar } from "@/components/app/avatar";
import { fadeQuick, springSoft } from "@/lib/motion";
import { cn } from "@/lib/utils";

export type JoinSessionData = {
  title: string;
  subject?: string;
  teacher: { name: string; initials: string };
  whenLabel: string;
  duration: string;
};

export function JoinSessionModal({
  open,
  onClose,
  session,
}: {
  open: boolean;
  onClose: () => void;
  session: JoinSessionData | null;
}) {
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [phase, setPhase] = useState<"lobby" | "connecting" | "connected">(
    "lobby",
  );

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (open) setPhase("lobby");
  }, [open, session]);

  const join = () => {
    setPhase("connecting");
    window.setTimeout(() => setPhase("connected"), 1400);
  };

  if (!session) return null;

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          {...fadeQuick}
        >
          <div
            aria-hidden
            onClick={onClose}
            className="absolute inset-0 bg-[#0B0B0F]/60 backdrop-blur-sm"
          />
          <motion.div
            role="dialog"
            aria-label={`Rejoindre ${session.title}`}
            aria-modal="true"
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={springSoft}
            className="relative w-full max-w-[440px] overflow-hidden rounded-[22px] bg-[#0B0B0F] text-white shadow-[0_24px_80px_rgba(10,11,20,0.5)]"
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="Fermer"
              className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
            >
              <X className="h-4 w-4" strokeWidth={1.75} />
            </button>

            <div className="relative aspect-[16/10] w-full overflow-hidden bg-gradient-to-br from-[#1E1F27] to-[#0B0B0F]">
              {camOn ? (
                <div className="absolute inset-0 grid place-items-center">
                  <Avatar
                    initials="SB"
                    tone="brand"
                    size={72}
                  />
                </div>
              ) : (
                <div className="absolute inset-0 grid place-items-center text-white/40">
                  <CameraOff className="h-8 w-8" strokeWidth={1.5} />
                </div>
              )}
              <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-2">
                <ControlToggle
                  active={micOn}
                  onToggle={() => setMicOn((v) => !v)}
                  label="Micro"
                  IconOn={Mic}
                  IconOff={MicOff}
                />
                <ControlToggle
                  active={camOn}
                  onToggle={() => setCamOn((v) => !v)}
                  label="Caméra"
                  IconOn={Camera}
                  IconOff={CameraOff}
                />
              </div>
            </div>

            <div className="p-5">
              {session.subject ? (
                <p className="text-[10px] font-semibold uppercase tracking-[0.09em] text-white/50">
                  {session.subject}
                </p>
              ) : null}
              <h2 className="mt-1 font-[family-name:var(--font-cabinet)] text-[19px] font-bold leading-tight tracking-tight text-white">
                {session.title}
              </h2>
              <div className="mt-3 flex items-center gap-2">
                <Avatar
                  initials={session.teacher.initials}
                  tone="neutral"
                  size={28}
                />
                <div>
                  <p className="text-[12.5px] font-semibold text-white">
                    {session.teacher.name}
                  </p>
                  <p className="text-[11px] text-white/50">
                    {session.whenLabel} · {session.duration}
                  </p>
                </div>
              </div>

              <div className="mt-5">
                {phase === "lobby" ? (
                  <button
                    type="button"
                    onClick={join}
                    className="flex w-full items-center justify-center gap-2 rounded-full bg-[#DFFF3F] py-3 text-[13px] font-semibold text-[#0B0B0F] transition-[filter] hover:brightness-[0.97]"
                  >
                    <Video className="h-4 w-4" strokeWidth={2} />
                    Rejoindre la salle
                  </button>
                ) : phase === "connecting" ? (
                  <div className="flex items-center justify-center gap-2 py-3 text-[13px] font-semibold text-white/80">
                    <ConnectingDots />
                    Connexion en cours…
                  </div>
                ) : (
                  <div className="rounded-[14px] bg-[#DFFF3F]/10 p-4 text-center">
                    <p className="text-[13px] font-semibold text-[#DFFF3F]">
                      Salle rejointe
                    </p>
                    <p className="mt-1 text-[11.5px] text-white/60">
                      Ton prof est notifié. Tu peux fermer cette fenêtre.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function ControlToggle({
  active,
  onToggle,
  label,
  IconOn,
  IconOff,
}: {
  active: boolean;
  onToggle: () => void;
  label: string;
  IconOn: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  IconOff: React.ComponentType<{ className?: string; strokeWidth?: number }>;
}) {
  const Icon = active ? IconOn : IconOff;
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={active}
      aria-label={label}
      className={cn(
        "grid h-10 w-10 place-items-center rounded-full transition-colors",
        active
          ? "bg-white/15 text-white hover:bg-white/25"
          : "bg-[#DC2626] text-white hover:bg-[#B91C1C]",
      )}
    >
      <Icon className="h-4 w-4" strokeWidth={1.75} />
    </button>
  );
}

function ConnectingDots() {
  return (
    <span className="inline-flex items-center gap-1">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-white/70"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{
            duration: 0.9,
            repeat: Infinity,
            delay: i * 0.15,
            ease: "easeInOut",
          }}
        />
      ))}
    </span>
  );
}
