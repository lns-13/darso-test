"use client";

import { cn } from "@/lib/utils";

type Provider = "google" | "apple";

const LABEL: Record<Provider, string> = {
  google: "Google",
  apple: "Apple",
};

function GoogleGlyph() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 18 18"
      className="h-4 w-4"
    >
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 01-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.81.54-1.85.87-3.04.87-2.34 0-4.32-1.58-5.03-3.7H.92v2.33A9 9 0 009 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.97 10.73A5.41 5.41 0 013.68 9c0-.6.1-1.19.29-1.73V4.94H.92A9 9 0 000 9c0 1.45.35 2.83.92 4.06l3.05-2.33z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 00.92 4.94l3.05 2.33C4.68 5.16 6.66 3.58 9 3.58z"
      />
    </svg>
  );
}

function AppleGlyph() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className="h-4 w-4 text-[#0B0B0F]"
      fill="currentColor"
    >
      <path d="M16.365 12.83c-.02-2.15 1.75-3.18 1.83-3.23-1-1.46-2.55-1.66-3.1-1.68-1.32-.13-2.58.78-3.25.78-.68 0-1.7-.76-2.8-.74-1.44.02-2.77.84-3.51 2.13-1.5 2.6-.38 6.44 1.07 8.55.71 1.03 1.55 2.19 2.66 2.15 1.07-.04 1.47-.69 2.76-.69 1.28 0 1.65.69 2.77.66 1.14-.02 1.87-1.05 2.57-2.09.81-1.2 1.14-2.36 1.16-2.42-.03-.01-2.22-.85-2.24-3.42zM14.2 6.28c.58-.71.98-1.7.87-2.68-.85.04-1.87.57-2.48 1.28-.54.62-1.02 1.63-.89 2.59.95.07 1.92-.48 2.5-1.19z" />
    </svg>
  );
}

/**
 * Deliberately inert. No social provider is enabled on the Supabase project —
 * every one of them is off in the auth settings — so a working-looking button
 * could only spin and resolve to nothing, which is what it used to do. It
 * stays visible and visibly disabled until a provider is actually turned on;
 * wiring it then means calling signInWithOAuth and pointing the provider at
 * /auth/callback, which already exists.
 */
export function SocialButton({ provider }: { provider: Provider }) {
  const label = LABEL[provider];

  return (
    <button
      type="button"
      disabled
      aria-disabled
      title="Bientôt disponible"
      className={cn(
        "group inline-flex h-11 items-center justify-center gap-2 rounded-[14px] border border-[#EFEFF1] bg-white text-[12.5px] font-semibold text-[#0B0B0F] transition",
        "disabled:cursor-not-allowed disabled:opacity-55",
      )}
    >
      {provider === "google" ? <GoogleGlyph /> : <AppleGlyph />}
      <span>{label}</span>
    </button>
  );
}

/** The one-line explanation that goes under a pair of SocialButtons. */
export function SocialButtonNote() {
  return (
    <p className="mt-2 text-center text-[11px] leading-relaxed text-[#8A8D93]">
      Connexion Google et Apple bientôt disponible.
    </p>
  );
}
