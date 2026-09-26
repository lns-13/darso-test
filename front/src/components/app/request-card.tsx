import { CalendarClock, Users } from "lucide-react";

export type RequestCardProps = {
  id: string;
  author: string;
  authorInitials?: string;
  level: string;
  subject: string;
  description?: string;
  title: string;
  budget: number;
  deadline: string;
  proposalsCount: number;
  tags: string[];
  ownPost?: boolean;
  onApply?: () => void;
};

export function RequestCard({
  author,
  authorInitials,
  level,
  subject,
  description,
  title,
  budget,
  deadline,
  proposalsCount,
  tags,
  ownPost = false,
  onApply,
}: RequestCardProps) {
  return (
    <article className="flex h-full flex-col rounded-[16px] border border-[#EFEFF1] bg-white p-4 transition-shadow hover:shadow-[0_4px_16px_rgba(10,11,20,0.06)]">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.09em] text-[#8A8D93]">
          {subject} · {level}
        </p>
        {ownPost ? (
          <span className="flex h-5 items-center gap-1 rounded-full bg-[#DFFF3F]/25 px-2 text-[10px] font-semibold text-[#0B0B0F]">
            Mon annonce
          </span>
        ) : (
          <span className="flex h-5 items-center gap-1 rounded-full bg-[#F5F5F7] px-2 text-[10px] font-medium text-[#4A4D54]">
            <Users className="h-2.5 w-2.5" strokeWidth={2.25} />
            {proposalsCount} prop.
          </span>
        )}
      </div>

      <h3 className="mt-1.5 font-[family-name:var(--font-cabinet)] text-[15.5px] font-bold leading-[1.2] tracking-tight text-[#0B0B0F] line-clamp-2">
        {title}
      </h3>

      {description ? (
        <p className="mt-1.5 line-clamp-2 text-[12px] leading-snug text-[#6E7178]">
          {description}
        </p>
      ) : null}

      {tags.length > 0 ? (
        <div className="mt-2.5 flex flex-wrap gap-1">
          {tags.slice(0, 4).map((t) => (
            <span
              key={t}
              className="rounded-full bg-[#F5F5F7] px-2 py-0.5 text-[10.5px] font-medium text-[#4A4D54]"
            >
              {t}
            </span>
          ))}
        </div>
      ) : null}

      <div className="mt-auto pt-3.5">
        <div className="flex items-end justify-between gap-3 border-t border-[#EFEFF1] pt-2.5">
          <div>
            <p className="text-[9.5px] font-medium uppercase tracking-[0.06em] text-[#B0B3B8]">
              Budget
            </p>
            <p className="text-[13px] font-bold text-[#0B0B0F] tabular-nums">
              {budget}{" "}
              <span className="text-[10px] font-medium text-[#8A8D93]">MAD/h</span>
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="flex items-center gap-1 rounded-full bg-[#F5F5F7] px-2 py-0.5 text-[10.5px] font-semibold text-[#0B0B0F]">
              <CalendarClock className="h-2.5 w-2.5" strokeWidth={2.25} />
              {deadline}
            </span>
            <p className="truncate text-[10.5px] text-[#8A8D93]">
              par {ownPost ? "toi" : author}
              {authorInitials ? "" : ""}
            </p>
          </div>
        </div>

        {ownPost ? (
          <button
            className="mt-2.5 w-full rounded-full border border-[#EFEFF1] bg-white py-2 text-[11.5px] font-semibold text-[#0B0B0F] transition-colors hover:bg-[#F5F5F7]"
            onClick={onApply}
          >
            Voir les {proposalsCount} propositions
          </button>
        ) : (
          <button
            onClick={onApply}
            className="mt-2.5 w-full rounded-full bg-[#0B0B0F] py-2 text-[11.5px] font-semibold text-white transition-colors hover:bg-[#1a1b21] min-[900px]:w-auto min-[900px]:self-start min-[900px]:px-4"
          >
            Postuler
          </button>
        )}
      </div>
    </article>
  );
}
