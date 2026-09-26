// Ported from ../components/imgRippleEffect.tsx
// The original used @react-three/fiber + drei + three.js + custom shaders to
// paint a mouse-following displacement onto an <img>. We cannot add those
// deps. This port keeps the "image + ripple" spirit with a lightweight
// motion/react implementation: a stack of expanding radial rings emitted on
// hover/click, plus a click-to-upload avatar surface with initials fallback.

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Camera } from "lucide-react";
import { cn } from "@/lib/utils";

type Ripple = { id: number; x: number; y: number };

type ImgRippleEffectProps = {
  src?: string | null;
  onFileChange?: (file: File) => void;
  size?: number;
  initials?: string;
  className?: string;
  disabled?: boolean;
};

export function ImgRippleEffect({
  src,
  onFileChange,
  size = 128,
  initials = "",
  className,
  disabled = false,
}: ImgRippleEffectProps) {
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const [preview, setPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const nextId = useRef(0);
  // Every URL.createObjectURL pins its blob in memory until it is revoked.
  // Held in a ref so the unmount cleanup below sees the current one without
  // re-running the effect (and revoking a live preview) on every change.
  const previewUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = null;
      }
    };
  }, []);

  const emit = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = nextId.current++;
    setRipples((prev) => [...prev, { id, x, y }]);
    // auto-cleanup after animation
    window.setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== id));
    }, 900);
  }, []);

  const handleFile = (file: File) => {
    if (file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      // Release the previous preview before replacing it: picking five photos
      // in a row used to leak five blobs, and none of them was ever revoked.
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = url;
      setPreview(url);
    }
    onFileChange?.(file);
  };

  const shown = preview ?? src ?? null;

  return (
    <div
      className={cn("inline-flex flex-col items-center gap-2", className)}
      style={{ width: size }}
    >
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label="Changer la photo de profil"
        onClick={(e) => {
          if (disabled) return;
          emit(e);
          inputRef.current?.click();
        }}
        onMouseMove={(e) => {
          if (disabled) return;
          // subtle: only emit on movement above a small threshold
          if (Math.random() < 0.06) emit(e);
        }}
        onKeyDown={(e) => {
          if (disabled) return;
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        className={cn(
          "group relative overflow-hidden rounded-full outline-none transition-transform",
          !disabled && "cursor-pointer hover:scale-[1.02] focus-visible:ring-2 focus-visible:ring-[#0B0B0F] focus-visible:ring-offset-2",
          shown ? "bg-[#F0F0F2]" : "bg-[#DFFF3F]",
        )}
        style={{ width: size, height: size }}
      >
        {shown ? (
          // Native <img> is fine here (mock/user-selected local URL); avoids
          // needing next/image config for arbitrary blobs.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={shown}
            alt="Avatar"
            className="h-full w-full object-cover"
            draggable={false}
          />
        ) : (
          <div
            className="grid h-full w-full place-items-center font-[family-name:var(--font-cabinet)] font-bold text-[#0B0B0F]"
            style={{ fontSize: Math.round(size * 0.36) }}
          >
            {initials || "?"}
          </div>
        )}

        {/* Hover veil + camera hint */}
        {!disabled ? (
          <div className="pointer-events-none absolute inset-0 flex items-end justify-center bg-gradient-to-t from-black/45 via-black/0 to-transparent pb-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            <div className="flex items-center gap-1 rounded-full bg-white/95 px-2 py-1 text-[10px] font-semibold text-[#0B0B0F]">
              <Camera className="h-3 w-3" strokeWidth={2} />
              Changer
            </div>
          </div>
        ) : null}

        {/* Ripples */}
        <AnimatePresence>
          {ripples.map((r) => (
            <motion.span
              key={r.id}
              initial={{ scale: 0, opacity: 0.55 }}
              animate={{ scale: 3.5, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
              className="pointer-events-none absolute rounded-full border-2 border-white/80"
              style={{
                left: r.x - size * 0.15,
                top: r.y - size * 0.15,
                width: size * 0.3,
                height: size * 0.3,
              }}
            />
          ))}
        </AnimatePresence>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          // reset so the same file can be picked again
          e.target.value = "";
        }}
      />
    </div>
  );
}
