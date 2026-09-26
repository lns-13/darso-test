"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { AuthField } from "@/components/auth/auth-field";
import { StatefulButton } from "@/components/library/stateful-button";
import { springSoft } from "@/lib/motion";
import { requestPasswordReset } from "@/lib/auth/actions";
import { RESET_REQUEST_INITIAL } from "@/lib/auth/state";

export function ForgotPasswordForm({ initialError }: { initialError?: string }) {
  const reduce = useReducedMotion();
  const [email, setEmail] = useState("");
  const [state, formAction, pending] = useActionState(
    requestPasswordReset,
    RESET_REQUEST_INITIAL,
  );

  // The "sent" card is a view, not a fact about the last submission: the two
  // buttons on it flip back to the form without re-sending anything.
  const [dismissed, setDismissed] = useState(false);
  const sent = state.status === "sent" && !dismissed;
  const formError =
    state.errors.form ?? (state.status === "idle" ? initialError : undefined);

  const transition = reduce ? { duration: 0 } : springSoft;

  const backToForm = () => {
    // Flip back with the email pre-filled so the user can immediately hit "Envoyer le lien" again.
    setDismissed(true);
    requestAnimationFrame(() => {
      const btn = document.querySelector<HTMLButtonElement>(
        'form button[type="submit"]',
      );
      btn?.focus();
    });
  };

  const useAnotherEmail = () => {
    setEmail("");
    setDismissed(true);
  };

  return (
    <div className="space-y-8">
      <header>
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8A8D93]">
          Mot de passe oublié
        </p>
        <h1
          className="mt-2 text-[26px] sm:text-[30px] md:text-[32px] font-extrabold leading-[1.05] tracking-[-0.035em] text-[#0B0B0F]"
          style={{ fontFamily: "var(--font-cabinet), system-ui, sans-serif" }}
        >
          On vous renvoie
          <br />
          un lien.
        </h1>
        <p className="mt-3 text-[13px] leading-relaxed text-[#4A4D54]">
          Indiquez l&apos;email de votre compte darso. Nous vous envoyons un lien
          sécurisé pour choisir un nouveau mot de passe.
        </p>
      </header>

      <AnimatePresence mode="wait" initial={false}>
        {!sent ? (
          <motion.form
            key="form"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={transition}
            action={formAction}
            onSubmit={() => setDismissed(false)}
            className="space-y-3.5"
            noValidate
          >
            <AuthField
              label="Email"
              id="email"
              name="email"
              type="text"
              inputMode="email"
              autoComplete="email"
              placeholder="vous@exemple.com"
              value={email}
              onValueChange={setEmail}
              error={state.errors.email}
            />

            <StatefulButton
              type="submit"
              status={pending ? "loading" : "idle"}
              disabled={pending}
              className="!min-w-full !bg-[#0B0B0F] !text-white !py-3 !text-[13px]"
            >
              Envoyer le lien
            </StatefulButton>

            {formError ? (
              <p aria-live="polite" className="text-center text-[12px] text-[#C53434]">
                {formError}
              </p>
            ) : null}
          </motion.form>
        ) : (
          <motion.div
            key="sent"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={transition}
            className="rounded-[16px] border border-[#EFEFF1] bg-white p-5 shadow-[0_1px_2px_rgba(10,11,20,0.04)]"
          >
            <div className="mb-2 inline-flex h-6 items-center gap-1.5 rounded-full bg-[#DFFF3F] px-2.5 text-[10px] font-semibold uppercase tracking-[0.09em] text-[#0B0B0F]">
              Envoyé
            </div>
            <p className="text-[14px] font-semibold text-[#0B0B0F]">
              Vérifiez votre boîte mail.
            </p>
            <p className="mt-1.5 text-[12.5px] leading-relaxed text-[#4A4D54]">
              Un lien de réinitialisation a été envoyé à{" "}
              <span className="font-semibold text-[#0B0B0F]">{state.email}</span>. Il
              expire dans 30 minutes.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
              <button
                type="button"
                onClick={backToForm}
                className="inline-flex h-8 items-center rounded-full border border-[#EFEFF1] bg-white px-3 text-[11.5px] font-semibold text-[#0B0B0F] transition hover:border-[#B0B3B8] hover:bg-[#F5F5F7]"
              >
                Renvoyer
              </button>
              <button
                type="button"
                onClick={useAnotherEmail}
                className="text-[11.5px] font-semibold text-[#0B0B0F] underline underline-offset-4 hover:no-underline"
              >
                Utiliser un autre email
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
