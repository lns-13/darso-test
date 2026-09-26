import Link from "next/link";
import { ArrowLeft, Mail, MessageCircle, Phone } from "lucide-react";

export default function ContactPage() {
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
          Nous contacter
        </p>
        <h1 className="mt-1.5 font-[family-name:var(--font-cabinet)] text-[32px] font-bold leading-[1.05] tracking-tight text-[#0B0B0F]">
          Une question ? On est là.
        </h1>
        <p className="mt-3 max-w-lg text-[13.5px] leading-relaxed text-[#4A4D54]">
          Choisis le canal qui te va le mieux — l&apos;équipe support répond du lundi au samedi,
          de 8h à 22h, sous 4 h en moyenne.
        </p>

        <div className="mt-6 grid gap-2.5 sm:grid-cols-3">
          <Link
            href="/student/help/contact"
            className="flex flex-col gap-2 rounded-[16px] border border-[#EFEFF1] bg-white p-4 transition-colors hover:bg-[#F5F5F7]"
          >
            <MessageCircle className="h-5 w-5 text-[#0B0B0F]" strokeWidth={1.75} />
            <p className="text-[13px] font-semibold text-[#0B0B0F]">Formulaire</p>
            <p className="text-[11.5px] text-[#8A8D93]">Réponse sous 4 h</p>
          </Link>
          <a
            href="mailto:contact@darso.ma"
            className="flex flex-col gap-2 rounded-[16px] border border-[#EFEFF1] bg-white p-4 transition-colors hover:bg-[#F5F5F7]"
          >
            <Mail className="h-5 w-5 text-[#0B0B0F]" strokeWidth={1.75} />
            <p className="text-[13px] font-semibold text-[#0B0B0F]">contact@darso.ma</p>
            <p className="text-[11.5px] text-[#8A8D93]">Support par email</p>
          </a>
          <a
            href="tel:+212520000000"
            className="flex flex-col gap-2 rounded-[16px] border border-[#EFEFF1] bg-white p-4 transition-colors hover:bg-[#F5F5F7]"
          >
            <Phone className="h-5 w-5 text-[#0B0B0F]" strokeWidth={1.75} />
            <p className="text-[13px] font-semibold text-[#0B0B0F]">+212 5 20 00 00 00</p>
            <p className="text-[11.5px] text-[#8A8D93]">Lun–Sam · 8h–22h</p>
          </a>
        </div>
      </div>
    </main>
  );
}
