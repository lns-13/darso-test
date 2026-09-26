import { cn } from "@/lib/utils";

export function Card({
  children,
  tone = "light",
  className,
  padding = "p-4",
}: {
  children: React.ReactNode;
  tone?: "light" | "dark";
  className?: string;
  padding?: string;
}) {
  const toneClass =
    tone === "dark"
      ? "bg-[#0B0B0F] text-white"
      : "bg-white text-[#0B0B0F]";
  return (
    <div
      className={cn(
        "rounded-[20px] shadow-[0_1px_2px_rgba(10,11,20,0.04)]",
        toneClass,
        padding,
        className,
      )}
    >
      {children}
    </div>
  );
}
