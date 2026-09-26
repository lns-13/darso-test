import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

const KNOWN: Record<string, { title: string; blurb: string }> = {
  terms: {
    title: "Conditions générales d'utilisation",
    blurb:
      "Ce document définit les règles d'usage de la plateforme darso pour les élèves comme pour les professeurs.",
  },
  privacy: {
    title: "Politique de confidentialité",
    blurb:
      "Comment nous collectons, traitons et protégeons tes données personnelles conformément à la Loi 09-08 et au RGPD.",
  },
  cookies: {
    title: "Gestion des cookies",
    blurb:
      "Les cookies utilisés par darso pour faire fonctionner la plateforme, mesurer l'audience et personnaliser ton expérience.",
  },
  imprint: {
    title: "Mentions légales",
    blurb:
      "Éditeur du site, hébergeur, SIRET, capital social et coordonnées de la société darso SARL.",
  },
};

export default async function LegalPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const doc = KNOWN[slug];
  if (!doc) notFound();

  return (
    <main className="min-h-dvh bg-[#EDEDEF] p-2.5">
      <div className="mx-auto max-w-[720px] rounded-[20px] bg-white p-6 shadow-[0_1px_2px_rgba(10,11,20,0.04)] md:p-10">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-[11.5px] font-medium text-[#8A8D93] transition-colors hover:text-[#0B0B0F]"
        >
          <ArrowLeft className="h-3 w-3" strokeWidth={2} />
          Retour à l&apos;accueil
        </Link>
        <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#8A8D93]">
          Documents légaux
        </p>
        <h1 className="mt-1.5 font-[family-name:var(--font-cabinet)] text-[32px] font-bold leading-[1.05] tracking-tight text-[#0B0B0F]">
          {doc.title}
        </h1>
        <p className="mt-3 max-w-lg text-[13.5px] leading-relaxed text-[#4A4D54]">{doc.blurb}</p>

        <div className="mt-6 rounded-[16px] bg-[#F5F5F7] p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#8A8D93]">
            En cours de rédaction
          </p>
          <p className="mt-1.5 text-[12.5px] leading-relaxed text-[#4A4D54]">
            La version finale de ce document sera publiée avant l&apos;ouverture publique de darso.
            Pour toute question urgente, contacte notre équipe support depuis la page d&apos;aide.
          </p>
          <Link
            href="/student/help/contact"
            className="mt-3 inline-flex h-9 items-center gap-1.5 rounded-full bg-[#0B0B0F] px-4 text-[12px] font-semibold text-white transition-colors hover:bg-[#1a1b21]"
          >
            Contacter le support
          </Link>
        </div>
      </div>
    </main>
  );
}
