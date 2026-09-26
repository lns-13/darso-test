import type { Metadata } from "next";
import Link from "next/link";

import { ResetPasswordForm } from "./reset-password-form";

export const metadata: Metadata = {
  title: "Nouveau mot de passe · darso",
  description: "Choisissez un nouveau mot de passe pour votre compte darso.",
};

/**
 * Where the password-reset email lands, via /auth/callback?type=recovery.
 * The callback route does not validate the token itself — it just hands
 * it off here as a query param, and the form submits it alongside the new
 * password to POST /api/auth/password-reset/confirm/, which is where it
 * actually gets checked.
 *
 * So "no token in the URL" is the only thing this page can catch before
 * submission — an expired or already-used token still reaches the form
 * and only fails once submitted, surfaced as state.errors.form.
 */
export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <div className="space-y-8">
        <header>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8A8D93]">
            Lien expiré
          </p>
          <h1
            className="mt-2 text-[26px] sm:text-[30px] md:text-[32px] font-extrabold leading-[1.05] tracking-[-0.035em] text-[#0B0B0F]"
            style={{ fontFamily: "var(--font-cabinet), system-ui, sans-serif" }}
          >
            Ce lien n&apos;est
            <br />
            plus valide.
          </h1>
          <p className="mt-3 text-[13px] leading-relaxed text-[#4A4D54]">
            Les liens de réinitialisation expirent au bout de 30 minutes et ne
            servent qu&apos;une fois. Demandez-en un nouveau, et ouvrez-le sur
            l&apos;appareil depuis lequel vous l&apos;avez demandé.
          </p>
        </header>

        <Link
          href="/forgot-password"
          className="flex min-w-full items-center justify-center rounded-full bg-[#0B0B0F] px-3 py-3 text-[13px] font-semibold text-white transition-[filter] hover:brightness-[1.15]"
        >
          Demander un nouveau lien
        </Link>

        <p className="text-center text-[12.5px] text-[#4A4D54]">
          <Link
            href="/sign-in"
            className="font-semibold text-[#0B0B0F] underline-offset-4 hover:underline"
          >
            ← Retour à la connexion
          </Link>
        </p>
      </div>
    );
  }

  return <ResetPasswordForm token={token} />;
}
