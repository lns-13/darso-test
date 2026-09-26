// Ported from ../components/videoPlayerExpandFrame.tsx
// Adapted: original used `media-chrome/react`, which is not a project dep.
// This version uses the native <video> element with a minimal custom
// control bar (play / seek / mute) and preserves the same expand-frame
// clip-path animation on the modal pop-over.
"use client";

import { AnimatePresence, motion, useSpring } from "motion/react";
import { Pause, Play, Plus, Volume2, VolumeX } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

type VideoPlayerExpandFrameProps = {
  src: string;
  poster?: string;
  /** Trigger overlay content shown before the pop-over opens (defaults to a thumbnail with a play badge). */
  trigger?: React.ReactNode;
  className?: string;
  /** Optional label displayed to the right of the thumbnail on the trigger. */
  triggerLabel?: string;
};

export function VideoPlayerExpandFrame({
  src,
  poster,
  trigger,
  className,
  triggerLabel,
}: VideoPlayerExpandFrameProps) {
  const [open, setOpen] = useState(false);

  const SPRING = { mass: 0.1 };
  const x = useSpring(0, SPRING);
  const y = useSpring(0, SPRING);
  const opacity = useSpring(0, SPRING);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    opacity.set(1);
    const bounds = e.currentTarget.getBoundingClientRect();
    x.set(e.clientX - bounds.left);
    y.set(e.clientY - bounds.top);
  };

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onPointerMove={handlePointerMove}
        onPointerLeave={() => opacity.set(0)}
        onClick={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen(true);
          }
        }}
        className={cn(
          "group relative flex cursor-pointer items-center gap-3 overflow-hidden rounded-[16px] bg-[#0B0B0F] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#DFFF3F] focus-visible:ring-offset-2",
          className,
        )}
      >
        {trigger ? (
          trigger
        ) : (
          <>
            <div className="relative aspect-video w-full overflow-hidden">
              {poster ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={poster}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover opacity-90"
                />
              ) : (
                <video
                  src={src}
                  muted
                  loop
                  playsInline
                  className="absolute inset-0 h-full w-full object-cover opacity-90"
                />
              )}
              <motion.div
                style={{ x, y, opacity }}
                className="pointer-events-none absolute left-0 top-0 z-20 flex w-fit select-none items-center gap-1.5 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-[#0B0B0F] backdrop-blur"
              >
                <Play className="h-3 w-3 fill-[#0B0B0F]" />
                Lire
              </motion.div>
              <div className="absolute inset-0 grid place-items-center">
                <span className="grid h-11 w-11 place-items-center rounded-full bg-white/95 text-[#0B0B0F] shadow-[0_1px_2px_rgba(10,11,20,0.2)] transition-transform group-hover:scale-105">
                  <Play className="h-4 w-4 fill-[#0B0B0F]" />
                </span>
              </div>
              {triggerLabel ? (
                <span className="absolute bottom-2 left-2 rounded-full bg-black/50 px-2 py-0.5 text-[10.5px] font-semibold text-white backdrop-blur">
                  {triggerLabel}
                </span>
              ) : null}
            </div>
          </>
        )}
      </div>

      <AnimatePresence>
        {open ? <VideoPopOver src={src} onClose={() => setOpen(false)} /> : null}
      </AnimatePresence>
    </>
  );
}

function VideoPopOver({ src, onClose }: { src: string; onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(true);
  const [muted, setMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play();
      setPlaying(true);
    } else {
      v.pause();
      setPlaying(false);
    }
  }, []);

  const toggleMute = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  }, []);

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = videoRef.current;
    if (!v || !duration) return;
    const target = (Number(e.target.value) / 100) * duration;
    v.currentTime = target;
    setProgress(Number(e.target.value));
  };

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onTime = () => {
      if (!v.duration) return;
      setProgress((v.currentTime / v.duration) * 100);
    };
    const onLoaded = () => setDuration(v.duration);
    v.addEventListener("timeupdate", onTime);
    v.addEventListener("loadedmetadata", onLoaded);
    return () => {
      v.removeEventListener("timeupdate", onTime);
      v.removeEventListener("loadedmetadata", onLoaded);
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === " ") {
        e.preventDefault();
        togglePlay();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, togglePlay]);

  return (
    <div className="fixed left-0 top-0 z-[101] flex h-screen w-screen items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="absolute left-0 top-0 h-full w-full bg-[#0B0B0F]/85 backdrop-blur-lg"
        onClick={onClose}
      />
      <motion.div
        initial={{ clipPath: "inset(43.5% 43.5% 33.5% 43.5%)", opacity: 0 }}
        animate={{ clipPath: "inset(0 0 0 0)", opacity: 1 }}
        exit={{
          clipPath: "inset(43.5% 43.5% 33.5% 43.5%)",
          opacity: 0,
          transition: {
            duration: 0.8,
            type: "spring",
            stiffness: 100,
            damping: 20,
            opacity: { duration: 0.2, delay: 0.5 },
          },
        }}
        transition={{ duration: 1, type: "spring", stiffness: 100, damping: 20 }}
        className="relative aspect-video w-full max-w-5xl overflow-hidden rounded-[20px] bg-black shadow-[0_20px_60px_rgba(0,0,0,0.5)]"
      >
        <video
          ref={videoRef}
          src={src}
          autoPlay
          playsInline
          className="h-full w-full object-cover"
          onEnded={() => setPlaying(false)}
        />

        <button
          onClick={onClose}
          aria-label="Fermer"
          className="absolute right-3 top-3 z-10 grid h-8 w-8 place-items-center rounded-full bg-white/10 text-white backdrop-blur transition-colors hover:bg-white/20"
        >
          <Plus className="h-4 w-4 rotate-45" />
        </button>

        <div className="absolute inset-x-0 bottom-0 z-10 flex items-center gap-3 bg-gradient-to-t from-black/80 to-transparent px-4 py-4">
          <button
            onClick={togglePlay}
            aria-label={playing ? "Pause" : "Lire"}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/15 text-white transition-colors hover:bg-white/25"
          >
            {playing ? (
              <Pause className="h-3.5 w-3.5 fill-white" />
            ) : (
              <Play className="h-3.5 w-3.5 fill-white" />
            )}
          </button>
          <input
            type="range"
            min={0}
            max={100}
            step={0.1}
            value={progress}
            onChange={handleSeek}
            aria-label="Position"
            className="h-1 flex-1 cursor-pointer appearance-none rounded-full bg-white/20 accent-[#DFFF3F]"
          />
          <button
            onClick={toggleMute}
            aria-label={muted ? "Activer le son" : "Couper le son"}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/15 text-white transition-colors hover:bg-white/25"
          >
            {muted ? (
              <VolumeX className="h-3.5 w-3.5" strokeWidth={2} />
            ) : (
              <Volume2 className="h-3.5 w-3.5" strokeWidth={2} />
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
