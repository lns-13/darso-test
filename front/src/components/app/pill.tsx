import { cn } from "@/lib/utils";

export type PillTone = "lime" | "dark" | "neutral" | "onDark";

const toneClasses: Record<PillTone, string> = {
  lime: "bg-[#DFFF3F] text-[#0B0B0F]",
  dark: "bg-[#0B0B0F] text-white",
  neutral: "bg-[#F0F0F2] text-[#0B0B0F]",
  onDark: "bg-white/10 text-[#DFFF3F]",
};

export function Pill({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: PillTone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-5 items-center gap-1 rounded-full px-1.5 text-[10px] font-semibold",
        toneClasses[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
