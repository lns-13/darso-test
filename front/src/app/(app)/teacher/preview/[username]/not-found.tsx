import Link from "next/link";
import { SearchX } from "lucide-react";

/**
 * Rendered by `notFound()` in this segment when no `teacher_profiles.username`
 * matches the slug in the URL. Before this task every username rendered the
 * same hardcoded teacher, so a typo silently produced a real-looking profile.
 */
export default function TeacherPreviewNotFound() {
  return (
    <div className="min-h-dvh bg-[#EDEDEF] p-2.5">
      {/* Same geometry as the signed-out profile card: the two "you cannot go
          further" surfaces should read as one family, not as two accidents. */}
      <div className="mx-auto mt-10 max-w-[560px] rounded-[20px] bg-white p-6 shadow-[0_1px_2px_rgba(10,11,20,0.04)] md:p-8">
        <div className="flex flex-col items-start gap-4">
          <span
            aria-hidden
            className="grid h-11 w-11 place-items-center rounded-full bg-[#F5F5F7] text-[#0B0B0F]"
          >
            <SearchX className="h-5 w-5" strokeWidth={1.75} />
          </span>
          <div>
            <h1 className="font-[family-name:var(--font-cabinet)] text-[26px] font-bold leading-[1.1] tracking-tight text-[#0B0B0F]">
              Ce profil n&apos;existe pas
            </h1>
            <p className="mt-2 max-w-[52ch] text-[13.5px] leading-relaxed text-[#4A4D54]">
              Le lien est peut-être incomplet, ou ce prof a changé son nom
              d&apos;utilisateur. Vérifie l&apos;adresse, ou crée un compte pour
              parcourir les profs disponibles.
            </p>
          </div>
          {/* This page is public and is reached signed out, so every action
              here has to be one a signed-out visitor can actually complete.
              /student/discover is behind the student guard and would bounce
              them straight to sign-in. */}
          <div className="mt-2 flex flex-wrap gap-2">
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-full bg-[#0B0B0F] px-4 py-2.5 text-[12.5px] font-semibold text-white transition-colors hover:bg-[#1a1b21] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B0B0F] focus-visible:ring-offset-2"
            >
              Retour à l&apos;accueil
            </Link>
            <Link
              href="/sign-up"
              className="inline-flex items-center justify-center rounded-full border border-[#EFEFF1] px-4 py-2.5 text-[12.5px] font-semibold text-[#0B0B0F] transition-colors hover:bg-[#F5F5F7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B0B0F] focus-visible:ring-offset-2"
            >
              Créer un compte
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
