"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowLeft } from "lucide-react";
import { StatefulButton } from "@/components/library/stateful-button";
import { StepIndicator } from "@/components/auth/step-indicator";
import { springSoft } from "@/lib/motion";
import { signUp } from "@/lib/auth/actions";
import { SIGN_UP_INITIAL } from "@/lib/auth/state";
import {
  MINOR_AGE,
  computeAge,
  isMinor as isMinorAge,
  validateIdentity,
  type FieldErrors,
} from "@/lib/auth/validation";
import { StepIdentity } from "./step-identity";
import { StepRole } from "./step-role";
import { StepTeacherNext } from "./step-teacher-next";

export type Role = "student" | "teacher";

export type IdentityState = {
  fullName: string;
  email: string;
  password: string;
  dobD: string;
  dobM: string;
  dobY: string;
  parentEmail: string;
};

export type IdentityErrors = FieldErrors;

const STEPS_BASE = [
  { key: "identity", label: "Identité" },
  { key: "role", label: "Rôle" },
  { key: "verify", label: "Vérification" },
] as const;

export function SignUpFlow() {
  const prefersReduced = useReducedMotion() ?? false;

  const [stepIndex, setStepIndex] = useState(0);
  const [identity, setIdentity] = useState<IdentityState>({
    fullName: "",
    email: "",
    password: "",
    dobD: "",
    dobM: "",
    dobY: "",
    parentEmail: "",
  });
  const [showPw, setShowPw] = useState(false);
  const [errors, setErrors] = useState<IdentityErrors>({});
  const [role, setRole] = useState<Role | null>(null);

  /**
   * The action keeps the (prevState, formData) shape the other three forms
   * consume through useActionState. This screen calls it inside a transition
   * instead: a three-step wizard needs the result to decide which step comes
   * next, and awaiting it here keeps that decision in the click handler
   * rather than in an effect that fires after the fact.
   */
  const [state, setState] = useState(SIGN_UP_INITIAL);
  const [pending, startTransition] = useTransition();

  /**
   * The account exists from this point on. Going back and submitting again
   * would only earn an "email already used" error, and the role is fixed at
   * creation by the trigger, so the earlier steps stop being reachable.
   */
  const accountCreated = state.status === "confirm";
  const [showConfirmation, setShowConfirmation] = useState(false);

  const age = useMemo(
    () => computeAge(identity.dobD, identity.dobM, identity.dobY),
    [identity.dobD, identity.dobM, identity.dobY],
  );
  const isMinor = isMinorAge(age);

  /**
   * Correcting a minor's birth date to an adult one used to leave the
   * guardian email sitting in state, hidden, and submit it anyway. Clear it
   * the moment the date says 18 or over — but only then, so a half-typed date
   * does not wipe what the person just entered. The server drops the value a
   * second time for the same reason: this is convenience, not enforcement.
   */
  const updateIdentity = (patch: Partial<IdentityState>) => {
    setIdentity((prev) => {
      const next = { ...prev, ...patch };
      const nextAge = computeAge(next.dobD, next.dobM, next.dobY);
      if (next.parentEmail && nextAge !== null && nextAge >= MINOR_AGE)
        next.parentEmail = "";
      return next;
    });
  };

  const identityLooksValid = useMemo(
    () => Object.keys(validateIdentity(identity)).length === 0,
    [identity],
  );

  const steps = useMemo(
    () =>
      STEPS_BASE.map((s, i) => ({
        label: s.label,
        disabled: i === 2 && role !== "teacher",
      })),
    [role],
  );

  const submit = () => {
    const payload = new FormData();
    payload.set("fullName", identity.fullName);
    payload.set("email", identity.email);
    payload.set("password", identity.password);
    payload.set("dobD", identity.dobD);
    payload.set("dobM", identity.dobM);
    payload.set("dobY", identity.dobY);
    payload.set("parentEmail", identity.parentEmail);
    payload.set("role", role ?? "student");

    startTransition(async () => {
      const result = await signUp(state, payload);
      setState(result);

      if (result.status === "confirm") {
        // A teacher gets the "what happens next" step, which now tells the
        // truth when it says the account is created. A student has nothing
        // left to read and goes straight to the confirmation card.
        if (role === "teacher") setStepIndex(2);
        else setShowConfirmation(true);
        return;
      }

      // Field-level errors belong to the identity step, so send the person
      // back to the fields they can actually fix. A whole-form error, such as
      // an address that is already registered, stays under the button.
      const fieldErrors = { ...result.errors };
      delete fieldErrors.form;
      if (Object.keys(fieldErrors).length > 0) {
        setErrors(result.errors);
        setStepIndex(0);
      }
    });
  };

  const goNext = () => {
    if (stepIndex === 0) {
      const nextErrors = validateIdentity(identity);
      setErrors(nextErrors);
      if (Object.keys(nextErrors).length) return;
      setStepIndex(1);
      return;
    }
    if (stepIndex === 1) {
      // One signUp call, at the end of the flow, with the role in the
      // metadata. The trigger reads that metadata once and fixes
      // profiles.role for good, so a user created any earlier would be a
      // student permanently.
      if (!role || pending || accountCreated) return;
      submit();
    }
  };

  const goBack = () => {
    if (stepIndex === 0 || accountCreated) return;
    setStepIndex((s) => s - 1);
  };

  const currentInvalid =
    (stepIndex === 0 && !identityLooksValid) || (stepIndex === 1 && !role);

  const ctaLabel =
    stepIndex === 0
      ? "Continuer"
      : stepIndex === 1
        ? role === "teacher"
          ? "Continuer vers la vérification"
          : "Continuer"
        : "";

  const stepEnter = prefersReduced ? { duration: 0 } : springSoft;

  return (
    <div className="space-y-6">
      <StepIndicator steps={steps} current={stepIndex} />

      {stepIndex > 0 && !accountCreated ? (
        <button
          type="button"
          onClick={goBack}
          className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-[#4A4D54] transition hover:text-[#0B0B0F]"
        >
          <ArrowLeft className="h-3 w-3" strokeWidth={2.25} />
          Retour
        </button>
      ) : null}

      <header>
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8A8D93]">
          {showConfirmation
            ? "Compte créé"
            : stepIndex === 0
              ? "Créer un compte"
              : stepIndex === 1
                ? "Choisissez votre rôle"
                : "Presque prêt"}
        </p>
        <h1
          className="mt-2 text-[24px] sm:text-[28px] md:text-[30px] font-extrabold leading-[1.05] tracking-[-0.035em] text-[#0B0B0F]"
          style={{ fontFamily: "var(--font-cabinet), system-ui, sans-serif" }}
        >
          {showConfirmation ? (
            <>
              Confirmez votre
              <br />
              adresse email.
            </>
          ) : stepIndex === 0 ? (
            <>
              Commençons par
              <br />
              faire connaissance.
            </>
          ) : stepIndex === 1 ? (
            <>
              Vous venez sur darso
              <br />
              plutôt pour…
            </>
          ) : (
            <>
              Bientôt en ligne
              <br />
              comme prof.
            </>
          )}
        </h1>
        <p className="mt-3 text-[13px] leading-relaxed text-[#4A4D54]">
          {showConfirmation
            ? "Dernière étape : un clic dans l'email que nous venons de vous envoyer."
            : stepIndex === 0
              ? "Quelques infos pour créer votre compte darso, en 30 secondes."
              : stepIndex === 1
                ? "Vous pourrez ajouter l'autre rôle plus tard depuis vos réglages."
                : "Encore une étape rapide pour débloquer les demandes d'élèves."}
        </p>
      </header>

      {showConfirmation ? (
        <div className="rounded-[16px] border border-[#EFEFF1] bg-white p-5">
          <div className="mb-2 inline-flex h-6 items-center gap-1.5 rounded-full bg-[#DFFF3F] px-2.5 text-[10px] font-semibold uppercase tracking-[0.09em] text-[#0B0B0F]">
            Envoyé
          </div>
          <p className="text-[14px] font-semibold text-[#0B0B0F]">
            Vérifiez votre boîte mail.
          </p>
          <p className="mt-1.5 text-[12.5px] leading-relaxed text-[#4A4D54]">
            Un lien de confirmation a été envoyé à{" "}
            <span className="font-semibold text-[#0B0B0F]">{state.email}</span>.
            Cliquez dessus pour activer votre compte darso. Pensez à regarder
            dans vos spams.
          </p>
          <p className="mt-3 text-[11.5px] leading-relaxed text-[#6E7178]">
            Une fois confirmé, vous serez connecté automatiquement.
          </p>
          <Link
            href="/sign-in"
            className="mt-3 inline-block text-[11.5px] font-semibold text-[#0B0B0F] underline underline-offset-4 hover:no-underline"
          >
            Retour à la connexion
          </Link>
        </div>
      ) : (
        <div className="relative">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={stepIndex}
              initial={{ opacity: 0, x: prefersReduced ? 0 : 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: prefersReduced ? 0 : -12 }}
              transition={stepEnter}
            >
              {stepIndex === 0 ? (
                <StepIdentity
                  values={identity}
                  onChange={updateIdentity}
                  errors={errors}
                  showPw={showPw}
                  onTogglePw={() => setShowPw((s) => !s)}
                  isMinor={isMinor}
                  reduceMotion={prefersReduced}
                />
              ) : stepIndex === 1 ? (
                <StepRole selected={role} onSelect={setRole} />
              ) : (
                <StepTeacherNext onContinue={() => setShowConfirmation(true)} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      )}

      {stepIndex < 2 && !showConfirmation ? (
        <div className="space-y-3">
          <StatefulButton
            type="button"
            onClick={goNext}
            status={pending ? "loading" : "idle"}
            disabled={currentInvalid || pending}
            className={
              "!min-w-full !bg-[#0B0B0F] !text-white !py-3 !text-[13px] " +
              (currentInvalid || pending ? "!opacity-50 !cursor-not-allowed" : "")
            }
          >
            {ctaLabel}
          </StatefulButton>

          {/*
            The identity step's button stays disabled until the form is
            locally valid, which left a server error like "this email is
            already used" with nowhere to render. This is that slot, matching
            the one the sign-in screen already styles.
          */}
          {state.errors.form ? (
            <p aria-live="polite" className="text-center text-[12px] text-[#C53434]">
              {state.errors.form}
            </p>
          ) : null}

          {stepIndex === 0 ? (
            <p className="text-center text-[12.5px] text-[#4A4D54]">
              Vous avez déjà un compte ?{" "}
              <Link
                href="/sign-in"
                className="font-semibold text-[#0B0B0F] underline-offset-4 hover:underline"
              >
                Se connecter
              </Link>
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
