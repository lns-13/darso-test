import { cn } from "@/lib/utils";

export function Eyebrow({
  children,
  tone = "muted",
  className,
}: {
  children: React.ReactNode;
  tone?: "muted" | "onDark" | "onLime";
  className?: string;
}) {
  const toneClass = {
    muted: "text-[#8A8D93]",
    onDark: "text-white/50",
    onLime: "text-[#0B0B0F]/60",
  }[tone];
  return (
    <p
      className={cn(
        "text-[9.5px] font-semibold uppercase tracking-[0.09em]",
        toneClass,
        className,
      )}
    >
      {children}
    </p>
  );
}
