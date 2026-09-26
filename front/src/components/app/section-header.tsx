import Link from "next/link";

export function SectionHeader({
  title,
  subtitle,
  action,
  actionHref,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  actionHref?: string;
}) {
  return (
    <div className="flex items-end justify-between gap-5">
      <div>
        <h2 className="font-[family-name:var(--font-cabinet)] text-[18px] font-bold tracking-tight text-[#0B0B0F]">
          {title}
        </h2>
        {subtitle ? (
          <p className="mt-0.5 text-[11.5px] text-[#8A8D93]">{subtitle}</p>
        ) : null}
      </div>
      {action ? (
        typeof action === "string" ? (
          actionHref ? (
            <Link
              href={actionHref}
              className="shrink-0 text-[11.5px] font-medium text-[#8A8D93] transition-colors hover:text-[#0B0B0F]"
            >
              {action}
            </Link>
          ) : (
            <span className="shrink-0 text-[11.5px] font-medium text-[#8A8D93]">
              {action}
            </span>
          )
        ) : (
          action
        )
      ) : null}
    </div>
  );
}
