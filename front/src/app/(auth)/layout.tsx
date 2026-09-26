import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { AuthMarketingPanel } from "@/components/auth/auth-marketing-panel";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh grid-cols-1 bg-[#EDEDEF] min-[900px]:grid-cols-[1fr_minmax(360px,44%)] min-[900px]:bg-white">
      <section className="relative flex min-h-dvh flex-col">
        <header className="flex items-center justify-between px-5 pt-5 min-[900px]:sticky min-[900px]:top-0 min-[900px]:z-10 min-[900px]:px-10 min-[900px]:pt-8">
          <Link
            href="/"
            aria-label="Retour à l'accueil darso"
            className="inline-flex items-center rounded-full transition hover:opacity-80"
          >
            <Logo />
          </Link>
          <Link
            href="/"
            className="text-[11.5px] font-medium text-[#4A4D54] transition hover:text-[#0B0B0F] min-[900px]:hidden"
          >
            ← Accueil
          </Link>
        </header>
        <main className="flex flex-1 items-center justify-center px-5 pb-14 pt-8 min-[900px]:px-10 min-[900px]:pt-4">
          <div className="w-full max-w-[380px]">{children}</div>
        </main>
      </section>
      <aside className="hidden min-[900px]:block">
        <AuthMarketingPanel />
      </aside>
    </div>
  );
}
