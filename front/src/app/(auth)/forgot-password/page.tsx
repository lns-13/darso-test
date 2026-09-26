import type { Metadata } from "next";
import { ForgotPasswordForm } from "./forgot-password-form";
import { messageForErrorParam } from "@/lib/auth/validation";

export const metadata: Metadata = {
  title: "Mot de passe oublié · darso",
  description: "Recevez un lien pour réinitialiser votre mot de passe darso.",
};

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return <ForgotPasswordForm initialError={messageForErrorParam(error)} />;
}
