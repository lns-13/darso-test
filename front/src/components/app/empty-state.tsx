import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon: Icon,
  title,
  body,
  action,
  className,
}: {
  icon?: LucideIcon;
  title: string;
  body?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-3 rounded-[20px] border border-dashed border-[#EFEFF1] bg-white/50 px-6 py-10 text-center",
        className,
      )}
    >
      {Icon ? (
        <div className="grid h-11 w-11 place-items-center rounded-full bg-[#F5F5F7] text-[#0B0B0F]">
          <Icon className="h-5 w-5" strokeWidth={1.75} />
        </div>
      ) : null}
      <div className="max-w-sm space-y-1">
        <p className="font-[family-name:var(--font-cabinet)] text-[16px] font-bold tracking-tight text-[#0B0B0F]">
          {title}
        </p>
        {body ? <p className="text-[12px] leading-snug text-[#6E7178]">{body}</p> : null}
      </div>
      {action ? <div className="pt-1">{action}</div> : null}
    </div>
  );
}
