import { cn } from "@/lib/utils";

export function PageHeader({
  eyebrow,
  title,
  subline,
  actions,
  className,
}: {
  eyebrow?: React.ReactNode;
  title: string;
  subline?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-start justify-between gap-5", className)}>
      <div className="min-w-0">
        {eyebrow ? (
          <div className="flex items-center gap-2 text-[12px] text-[#8A8D93]">
            {eyebrow}
          </div>
        ) : null}
        <h1 className="mt-1.5 font-[family-name:var(--font-cabinet)] text-[26px] sm:text-[32px] md:text-[36px] font-bold leading-[1.05] tracking-[-0.02em] text-[#0B0B0F]">
          {title}
        </h1>
        {subline ? (
          <p className="mt-1.5 max-w-md text-[13px] text-[#6E7178]">{subline}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 items-center gap-1.5">{actions}</div>
      ) : null}
    </div>
  );
}
