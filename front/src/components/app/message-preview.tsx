import { cn } from "@/lib/utils";
import { Avatar } from "./avatar";

export function MessagePreview({
  name,
  initials,
  preview,
  time,
  unread,
}: {
  name: string;
  initials: string;
  preview: string;
  time: string;
  unread: boolean;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <div className="relative shrink-0">
        <Avatar initials={initials} tone="neutral" size={32} />
        {unread ? (
          <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-[#DFFF3F]" />
        ) : null}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-[12px] font-semibold text-[#0B0B0F]">{name}</p>
          <span className="shrink-0 text-[10px] text-[#8A8D93]">{time}</span>
        </div>
        <p
          className={cn(
            "truncate text-[11px]",
            unread ? "font-medium text-[#0B0B0F]" : "text-[#8A8D93]",
          )}
        >
          {preview}
        </p>
      </div>
    </div>
  );
}
