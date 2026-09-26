"use client";

import { useId, useState, type ReactNode } from "react";
import { SmoothInput } from "@/components/library/smooth-input";
import { cn } from "@/lib/utils";

type AuthFieldProps = {
  label: string;
  id?: string;
  /** Form field name, so a <form action={...}> submits this value natively. */
  name?: string;
  type?: "text" | "password";
  inputMode?: "text" | "email" | "tel" | "numeric";
  autoComplete?: string;
  placeholder?: string;
  value: string;
  onValueChange: (v: string) => void;
  error?: string;
  trailing?: ReactNode;
};

export function AuthField({
  label,
  id: idProp,
  name,
  type = "text",
  inputMode,
  autoComplete,
  placeholder,
  value,
  onValueChange,
  error,
  trailing,
}: AuthFieldProps) {
  const reactId = useId();
  const id = idProp ?? reactId;
  const [focused, setFocused] = useState(false);

  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1.5 block text-[10.5px] font-semibold uppercase tracking-[0.09em] text-[#8A8D93]"
      >
        {label}
      </label>
      <div
        className={cn(
          "flex items-center gap-2 rounded-[14px] border bg-white pl-3.5 pr-1.5 py-1 transition",
          error
            ? "border-[#C53434] shadow-[0_0_0_3px_rgba(197,52,52,0.10)]"
            : focused
              ? "border-[#0B0B0F] shadow-[0_0_0_3px_rgba(11,11,15,0.06)]"
              : "border-[#EFEFF1] hover:border-[#B0B3B8]",
        )}
      >
        <div className="flex h-9 flex-1 items-center">
          <SmoothInput
            id={id}
            name={name}
            type={type}
            inputMode={inputMode}
            autoComplete={autoComplete}
            placeholder={placeholder}
            value={value}
            onChange={(e) => onValueChange(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            className="text-[13.5px] text-[#0B0B0F] placeholder:text-[#B0B3B8]"
            caretClassName="bg-[#0B0B0F]"
          />
        </div>
        {trailing ? (
          <div className="flex shrink-0 items-center">{trailing}</div>
        ) : null}
      </div>
      {error ? (
        <p className="mt-1 pl-1 text-[11px] font-medium text-[#C53434]">{error}</p>
      ) : null}
    </div>
  );
}
