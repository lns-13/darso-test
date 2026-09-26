import { HomeHeader } from "@/components/nav/home-header";
import { HomeHero } from "@/components/marketing/home-hero";
import { TrustStrip } from "@/components/landing/trust-strip";
import { TestimonialsBento } from "@/components/landing/testimonials-bento";
import { LandingFaq } from "@/components/landing/landing-faq";
import { SiteFooter } from "@/components/landing/site-footer";

export default function HomePage() {
  return (
    <>
      <HomeHeader />
      <main className="flex-1">
        <HomeHero />
        <TrustStrip />
        <TestimonialsBento />
        <LandingFaq />
      </main>
      <SiteFooter />
    </>
  );
}
