import Link from "next/link";
import { LogIn, UserCog } from "lucide-react";

/**
 * The profile page edits the signed-in teacher's own rows through row level
 * security, so it needs a real session. Sign-in is Task 02 and the route
 * guards are Task 03; until those land `auth.getUser()` returns nobody here.
 *
 * This says that plainly instead of rendering a mock teacher, which is exactly
 * the thing this task exists to remove.
 */
export function ProfileSignedOut({
  reason,
}: {
  reason: "anonymous" | "not-teacher";
}) {
  const isAnonymous = reason === "anonymous";

  return (
    <div className="min-h-dvh bg-[#EDEDEF] p-2.5">
      <div className="mx-auto mt-10 max-w-[560px] rounded-[20px] bg-white p-6 shadow-[0_1px_2px_rgba(10,11,20,0.04)] md:p-8">
        <span
          aria-hidden
          className="grid h-11 w-11 place-items-center rounded-full bg-[#F5F5F7] text-[#0B0B0F]"
        >
          {isAnonymous ? (
            <LogIn className="h-5 w-5" strokeWidth={1.75} />
          ) : (
            <UserCog className="h-5 w-5" strokeWidth={1.75} />
          )}
        </span>
        <h1 className="mt-4 font-[family-name:var(--font-cabinet)] text-[24px] font-bold leading-[1.1] tracking-tight text-[#0B0B0F]">
          {isAnonymous
            ? "Connecte-toi pour gérer ton profil"
            : "Cet espace est réservé aux profs"}
        </h1>
        <p className="mt-2 text-[13.5px] leading-relaxed text-[#4A4D54]">
          {isAnonymous
            ? "Ton profil public, tes matières et tes disponibilités sont liés à ton compte. Connecte-toi pour les modifier."
            : "Ce compte est un compte élève. Le profil pro n'existe que pour les comptes prof."}
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          {isAnonymous ? (
            <Link
              href="/sign-in"
              className="inline-flex items-center justify-center rounded-full bg-[#0B0B0F] px-4 py-2.5 text-[12.5px] font-semibold text-white transition-colors hover:bg-[#1a1b21]"
            >
              Se connecter
            </Link>
          ) : (
            <Link
              href="/student/profile"
              className="inline-flex items-center justify-center rounded-full bg-[#0B0B0F] px-4 py-2.5 text-[12.5px] font-semibold text-white transition-colors hover:bg-[#1a1b21]"
            >
              Aller à mon profil élève
            </Link>
          )}
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-full border border-[#EFEFF1] px-4 py-2.5 text-[12.5px] font-semibold text-[#0B0B0F] transition-colors hover:bg-[#F5F5F7]"
          >
            Retour à l&apos;accueil
          </Link>
        </div>
      </div>
    </div>
  );
}
