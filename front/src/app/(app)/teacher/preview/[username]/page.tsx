import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Award, Calendar, Clock, MessageCircle, Star } from "lucide-react";

import { Avatar } from "@/components/app/avatar";
import { groupByDay } from "@/lib/availability";
import { serverDb } from "@/lib/data/db";
import { getPublicTeacherProfile } from "@/lib/data/teacher-profile";
import { formatMinorAmount } from "@/lib/money";

type PageParams = { params: Promise<{ username: string }> };

export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const { username } = await params;
  const profile = await getPublicTeacherProfile(username);
  if (!profile) return { title: "Profil introuvable · darso" };
  return {
    title: `${profile.fullName} · darso`,
    description: profile.tagline ?? undefined,
  };
}

export default async function TeacherPublicPreviewPage({ params }: PageParams) {
  const { username } = await params;

  // Read through the security_invoker view with the ordinary server client, so
  // anon's own RLS decides what comes back. No admin client here: this page is
  // deliberately readable signed out and needs no elevation.
  const p = await getPublicTeacherProfile(username);
  if (!p) notFound();

  // "Aperçu public" is the owner previewing their own shop window. Compare
  // user ids rather than the slug the visitor typed.
  const db = await serverDb();
  const {
    data: { user },
  } = await db.auth.getUser();
  const isSelf = user?.id === p.userId;

  const rate = formatMinorAmount(p.hourlyRateMinor, p.currency);
  const days = groupByDay(p.availability);

  return (
    <div className="min-h-dvh bg-[#EDEDEF] p-2.5">
      <div className="mx-auto max-w-[860px] rounded-[20px] bg-white p-6 shadow-[0_1px_2px_rgba(10,11,20,0.04)] md:p-10">
        <div className="flex items-center justify-between gap-3">
          {isSelf ? (
            <Link
              href="/teacher/profile"
              className="inline-flex items-center gap-1.5 text-[11.5px] font-medium text-[#8A8D93] transition-colors hover:text-[#0B0B0F]"
            >
              <ArrowLeft aria-hidden className="h-3 w-3" strokeWidth={2} />
              Retour au profil privé
            </Link>
          ) : (
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-[11.5px] font-medium text-[#8A8D93] transition-colors hover:text-[#0B0B0F]"
            >
              <ArrowLeft aria-hidden className="h-3 w-3" strokeWidth={2} />
              Retour à l&apos;accueil
            </Link>
          )}
          {isSelf ? (
            <span className="rounded-full bg-[#DFFF3F] px-2.5 py-1 text-[10.5px] font-semibold text-[#0B0B0F]">
              Aperçu public
            </span>
          ) : null}
        </div>

        <section className="mt-6 flex flex-col items-start gap-5 md:flex-row md:items-center">
          <Avatar
            initials={p.initials}
            src={p.avatarUrl}
            alt={p.fullName}
            tone="brand"
            size={96}
          />
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-[#8A8D93]">
              @{p.username}
            </p>
            <h1 className="mt-1 font-[family-name:var(--font-cabinet)] text-[32px] font-bold leading-[1.05] tracking-tight text-[#0B0B0F]">
              {p.fullName}
            </h1>
            {p.tagline ? (
              <p className="mt-1 text-[13px] text-[#6E7178]">{p.tagline}</p>
            ) : null}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {/* Rating and review count are aggregates. No review rows exist
                  yet, so this shows what is true rather than a stored number. */}
              <span className="inline-flex items-center gap-1 rounded-full bg-[#F5F5F7] px-2.5 py-1 text-[11.5px] font-semibold text-[#0B0B0F]">
                <Star
                  aria-hidden
                  className="h-3 w-3 fill-[#DFFF3F]"
                  color="#0B0B0F"
                  strokeWidth={2}
                />
                {p.rating.count > 0 && p.rating.average !== null
                  ? `${p.rating.average.toFixed(1)} · ${p.rating.count} avis`
                  : "Nouveau profil"}
              </span>
              {p.yearsExperience !== null ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-[#F5F5F7] px-2.5 py-1 text-[11.5px] text-[#4A4D54]">
                  <Award aria-hidden className="h-3 w-3" strokeWidth={2} />
                  {p.yearsExperience} an{p.yearsExperience > 1 ? "s" : ""}{" "}
                  d&apos;expérience
                </span>
              ) : null}
              {rate ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-[#0B0B0F] px-2.5 py-1 text-[11.5px] font-semibold text-white">
                  {rate.amount} {rate.currency}/h
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-[#F5F5F7] px-2.5 py-1 text-[11.5px] font-semibold text-[#8A8D93]">
                  Tarif à définir
                </span>
              )}
            </div>
          </div>
          <div className="flex w-full shrink-0 flex-col gap-2 md:w-auto">
            <Link
              href="/sign-up"
              className="inline-flex items-center justify-center gap-1.5 rounded-full bg-[#0B0B0F] px-4 py-2.5 text-[12.5px] font-semibold text-white transition-colors hover:bg-[#1a1b21]"
            >
              <Calendar aria-hidden className="h-3.5 w-3.5" strokeWidth={2} />
              Réserver
            </Link>
            <Link
              href="/sign-in"
              className="inline-flex items-center justify-center gap-1.5 rounded-full border border-[#EFEFF1] px-4 py-2.5 text-[12.5px] font-semibold text-[#0B0B0F] transition-colors hover:bg-[#F5F5F7]"
            >
              <MessageCircle aria-hidden className="h-3.5 w-3.5" strokeWidth={2} />
              Contacter
            </Link>
          </div>
        </section>

        <section className="mt-8">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#8A8D93]">
            À propos
          </h2>
          <p className="mt-2 text-[13.5px] leading-relaxed text-[#4A4D54]">
            {p.bio ?? "Ce prof n'a pas encore rédigé sa présentation."}
          </p>
        </section>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <ChipSection title="Matières" items={p.subjects.map((s) => s.name)} />
          <ChipSection title="Niveaux" items={p.levels.map((l) => l.name)} />
          <ChipSection title="Langues" items={p.languages.map((l) => l.name)} />
          <section>
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#8A8D93]">
              Disponibilités
            </h2>
            {days.length > 0 ? (
              <>
                <ul className="mt-2 space-y-1">
                  {days.map((d) => (
                    <li
                      key={d.day}
                      className="flex items-baseline gap-2 text-[13px] text-[#4A4D54]"
                    >
                      <span className="w-[34px] shrink-0 font-semibold text-[#0B0B0F]">
                        {d.shortLabel}
                      </span>
                      <span className="tabular-nums">{d.ranges.join(" · ")}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-2 inline-flex items-center gap-1 text-[11.5px] text-[#8A8D93]">
                  <Clock aria-hidden className="h-3 w-3" strokeWidth={2} />
                  Heures locales · {p.timezone}
                </p>
              </>
            ) : (
              <p className="mt-2 text-[13px] text-[#8A8D93]">
                Aucune disponibilité publiée pour le moment.
              </p>
            )}
            {p.city ? (
              <p className="mt-1 text-[11.5px] text-[#8A8D93]">Basé à {p.city}</p>
            ) : null}
          </section>
        </div>
      </div>
    </div>
  );
}

function ChipSection({ title, items }: { title: string; items: string[] }) {
  return (
    <section>
      <h2 className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#8A8D93]">
        {title}
      </h2>
      {items.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {items.map((item) => (
            <span
              key={item}
              className="rounded-full border border-[#EFEFF1] px-2.5 py-1 text-[11.5px] text-[#0B0B0F]"
            >
              {item}
            </span>
          ))}
        </div>
      ) : (
        <p className="mt-2 text-[13px] text-[#8A8D93]">Non renseigné.</p>
      )}
    </section>
  );
}
