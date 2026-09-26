import type { Metadata } from "next";
import { SignUpFlow } from "./sign-up-flow";

export const metadata: Metadata = {
  title: "Créer un compte · darso",
  description: "Rejoignez darso comme élève ou enseignant.",
};

export default function SignUpPage() {
  return <SignUpFlow />;
}
