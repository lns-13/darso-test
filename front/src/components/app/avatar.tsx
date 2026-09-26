import { cn } from "@/lib/utils";

export type AvatarTone = "neutral" | "brand" | "lime" | "soft-blue" | "cream";

const paletteByTone: Record<AvatarTone, string> = {
  neutral: "bg-[#F0F0F2] text-[#0B0B0F]",
  brand: "bg-[#0B0B0F] text-[#DFFF3F]",
  lime: "bg-[#DFFF3F] text-[#0B0B0F]",
  "soft-blue": "bg-[#C4CFFF] text-[#0B0B0F]",
  cream: "bg-[#F0EDE4] text-[#0B0B0F]",
};

/**
 * Initials by default, a photo when there is one.
 *
 * `src` is a fully built URL, not a storage path: `profiles.avatar_path` holds
 * an object path and the URL is derived at read time (see
 * `src/lib/data/teacher-profile.ts`). Passing null or omitting it keeps the
 * initials rendering every existing call site already relies on, so the tone
 * palette and sizing behaviour are unchanged.
 */
export function Avatar({
  initials,
  src,
  alt,
  tone = "neutral",
  size = 32,
  className,
}: {
  initials: string;
  src?: string | null;
  alt?: string;
  tone?: AvatarTone;
  size?: number;
  className?: string;
}) {
  const fontSize = Math.max(9, Math.round(size * 0.36));
  return (
    <div
      className={cn(
        "grid shrink-0 place-items-center overflow-hidden rounded-full font-semibold",
        paletteByTone[tone],
        className,
      )}
      style={{ width: size, height: size, fontSize }}
    >
      {src ? (
        // Native <img>: avatar URLs come from the Supabase storage host, and
        // next/image would need that host allow-listed in next.config.ts,
        // which is Task 05's bucket work rather than this component's.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt ?? initials}
          width={size}
          height={size}
          className="h-full w-full object-cover"
          draggable={false}
        />
      ) : (
        initials
      )}
    </div>
  );
}
