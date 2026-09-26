"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";

import { AuthField } from "@/components/auth/auth-field";
import { StatefulButton } from "@/components/library/stateful-button";
import { updatePassword } from "@/lib/auth/actions";
import { UPDATE_PASSWORD_INITIAL } from "@/lib/auth/state";

export function ResetPasswordForm({ token }: { token: string }) {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [state, formAction, pending] = useActionState(
    updatePassword,
    UPDATE_PASSWORD_INITIAL,
  );

  return (
    <div className="space-y-8">
      <header>
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8A8D93]">
          Nouveau mot de passe
        </p>
        <h1
          className="mt-2 text-[26px] sm:text-[30px] md:text-[32px] font-extrabold leading-[1.05] tracking-[-0.035em] text-[#0B0B0F]"
          style={{ fontFamily: "var(--font-cabinet), system-ui, sans-serif" }}
        >
          Choisissez votre
          <br />
          nouveau mot de passe.
        </h1>
        <p className="mt-3 text-[13px] leading-relaxed text-[#4A4D54]">
          Vous pourrez vous connecter avec votre nouveau mot de passe juste
          après.
        </p>
      </header>

      <form action={formAction} className="space-y-3.5" noValidate>
        <input type="hidden" name="token" value={token} />

        <AuthField
          label="Nouveau mot de passe"
          id="password"
          name="password"
          type={showPw ? "text" : "password"}
          autoComplete="new-password"
          placeholder="8 caractères minimum"
          value={password}
          onValueChange={setPassword}
          error={state.errors.password}
          trailing={
            <button
              type="button"
              onClick={() => setShowPw((s) => !s)}
              aria-label={showPw ? "Masquer le mot de passe" : "Afficher le mot de passe"}
              className="grid h-7 w-7 place-items-center rounded-full text-[#8A8D93] transition hover:bg-[#F5F5F7] hover:text-[#0B0B0F]"
            >
              {showPw ? (
                <EyeOff className="h-3.5 w-3.5" strokeWidth={1.9} />
              ) : (
                <Eye className="h-3.5 w-3.5" strokeWidth={1.9} />
              )}
            </button>
          }
        />

        <AuthField
          label="Confirmez le mot de passe"
          id="passwordConfirm"
          name="passwordConfirm"
          type={showPw ? "text" : "password"}
          autoComplete="new-password"
          placeholder="••••••••"
          value={confirmation}
          onValueChange={setConfirmation}
          error={state.errors.passwordConfirm}
        />

        <StatefulButton
          type="submit"
          status={pending ? "loading" : "idle"}
          disabled={pending}
          className="!min-w-full !bg-[#0B0B0F] !text-white !py-3 !text-[13px]"
        >
          Mettre à jour
        </StatefulButton>

        {state.errors.form ? (
          <p aria-live="polite" className="text-center text-[12px] text-[#C53434]">
            {state.errors.form}
          </p>
        ) : null}
      </form>

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
