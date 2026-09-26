import Link from "next/link";

import { Logo } from "@/components/brand/logo";

export function HomeHeader() {
  return (
    <header className="sticky top-0 z-30 bg-white/55 pt-1.5 pb-1.5 backdrop-blur-xl backdrop-saturate-150 md:pt-2 md:pb-2">
      <div className="mx-auto flex w-full max-w-[1440px] items-center justify-between gap-4 px-3 sm:px-5 md:px-6">
        <Link
          href="/"
          className="shrink-0 outline-none focus-visible:rounded-md focus-visible:shadow-focus"
          aria-label="darso"
        >
          <Logo />
        </Link>

        <AuthButton signInLabel="Se connecter" />
      </div>
    </header>
  );
}

function AuthButton({ signInLabel }: { signInLabel: string }) {
  return (
    <Link
      href="/sign-in"
      className="inline-flex h-9 items-center rounded-full bg-foreground px-3.5 text-[13px] font-semibold text-background shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_6px_18px_-10px_rgba(10,11,14,0.25)] transition-[background-color,box-shadow,transform] duration-[260ms] [transition-timing-function:var(--ease-out)] motion-reduce:transition-none hover:-translate-y-[1px] hover:bg-primary-dark hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.10),0_10px_22px_-12px_rgba(10,11,14,0.30)] focus-visible:outline-none focus-visible:shadow-focus sm:h-10 sm:px-[18px] sm:text-[13.5px]"
    >
      {signInLabel}
    </Link>
  );
}
