"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bookmark, Menu } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Avatar } from "./avatar";

export function MobileHeader({
  title,
  subtitle,
  user,
  onOpenNav,
  right,
}: {
  title: string;
  subtitle?: string;
  user: { initials: string };
  onOpenNav: () => void;
  right?: React.ReactNode;
}) {
  const pathname = usePathname();
  const role = pathname?.startsWith("/teacher") ? "teacher" : "student";
  const favoritesHref = `/${role}/favorites`;
  const profileHref = `/${role}/profile`;

  return (
    <header className="sticky top-0 z-20 bg-[#EDEDEF]/90 px-4 pb-3 pt-6 backdrop-blur-xl backdrop-saturate-150">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <Link
            href={`/${role}`}
            aria-label="Accueil"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#0B0B0F]"
          >
            <Logo mark className="!text-[22px] !text-[#DFFF3F]" />
          </Link>
          <div className="min-w-0">
            <p className="truncate font-[family-name:var(--font-cabinet)] text-[17px] font-bold leading-none tracking-tight text-[#0B0B0F]">
              {title}
            </p>
            {subtitle ? (
              <p className="mt-1 truncate text-[10.5px] text-[#8A8D93]">{subtitle}</p>
            ) : null}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {right ??
            (role === "student" ? (
              <Link
                href={favoritesHref}
                aria-label="Favoris"
                className="grid h-10 w-10 place-items-center rounded-full bg-white text-[#0B0B0F] shadow-[0_1px_2px_rgba(10,11,20,0.04)]"
              >
                <Bookmark className="h-[17px] w-[17px]" strokeWidth={1.75} />
              </Link>
            ) : null)}
          <button
            type="button"
            onClick={onOpenNav}
            aria-label="Ouvrir le menu"
            className="relative grid h-10 w-10 place-items-center rounded-full bg-white text-[#0B0B0F] shadow-[0_1px_2px_rgba(10,11,20,0.04)]"
          >
            <Menu className="h-[17px] w-[17px]" strokeWidth={1.75} />
            <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-[#DFFF3F]" />
          </button>
          <Link
            href={profileHref}
            aria-label="Profil"
            className="h-10 w-10 shrink-0 overflow-hidden rounded-full"
          >
            <Avatar initials={user.initials} tone="brand" size={40} />
          </Link>
        </div>
      </div>
    </header>
  );
}
