"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

type ButtonHTMLAttrs = React.ButtonHTMLAttributes<HTMLButtonElement>;

/**
 * Renders a button that gives brief visual + a11y feedback ("Bientôt")
 * for features not yet wired to a backend. Prevents dead-button gaps
 * while keeping the surface intentional.
 */
export function ComingSoonButton({
  className,
  children,
  flashClassName = "bg-[#DFFF3F] text-[#0B0B0F]",
  message = "Bientôt disponible",
  onClick,
  ...rest
}: ButtonHTMLAttrs & { flashClassName?: string; message?: string }) {
  const [flashed, setFlashed] = useState(false);

  return (
    <button
      type="button"
      {...rest}
      onClick={(e) => {
        setFlashed(true);
        window.setTimeout(() => setFlashed(false), 1400);
        onClick?.(e);
      }}
      aria-live="polite"
      title={flashed ? message : rest.title}
      className={cn(className, flashed && flashClassName)}
    >
      {flashed ? message : children}
    </button>
  );
}
