import type { Metadata } from "next";
import { SignInForm } from "./sign-in-form";
import { messageForErrorParam } from "@/lib/auth/validation";

export const metadata: Metadata = {
  title: "Se connecter · darso",
  description: "Retrouvez votre espace darso.",
};

/**
 * /auth/callback sends a failed email link back here with an ?error= code.
 * Reading it on the server keeps the form component free of useSearchParams
 * and the Suspense boundary that would come with it.
 */
export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return <SignInForm initialError={messageForErrorParam(error)} />;
}
