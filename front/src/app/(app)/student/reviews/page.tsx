"use client";

import Link from "next/link";
import { ArrowLeft, Star } from "lucide-react";
import { AppShell } from "@/components/app/app-shell";
import { EmptyState } from "@/components/app/empty-state";
import { PageHeader } from "@/components/app/page-header";
import { studentMobileTabs, studentNav } from "@/lib/nav";

const student = {
  fullName: "Sara Bencheikh",
  level: "Terminale S · Lycée Descartes",
  initials: "SB",
};

const reviews = [
  {
    id: "r1",
    teacher: "Youssef Amrani",
    subject: "Mathématiques",
    date: "12 juil. 2026",
    rating: 5,
    body: "Cours excellent, très structuré. J'ai enfin compris les suites numériques.",
  },
  {
    id: "r2",
    teacher: "Nadia Cherkaoui",
    subject: "Physique-Chimie",
    date: "28 juin 2026",
    rating: 4,
    body: "Bonne pédagogie, quelques longueurs sur les exercices d'application.",
  },
];

function Body() {
  return (
    <div className="p-6 max-[899px]:px-4 max-[899px]:pt-3">
      <PageHeader
        eyebrow={<span>Historique</span>}
        title="Tes avis publiés"
        subline={
          <>
            {reviews.length} avis publiés sur tes séances passées. Ils apparaissent sur la fiche
            publique de chaque prof.
          </>
        }
      />

      {reviews.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title="Aucun avis publié"
            body="Termine une séance pour laisser ton premier avis."
          />
        </div>
      ) : (
        <div className="mt-6 space-y-2.5">
          {reviews.map((r) => (
            <article
              key={r.id}
              className="rounded-2xl border border-[#EFEFF1] bg-white p-4 shadow-[0_1px_2px_rgba(10,11,20,0.04)]"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-semibold text-[#0B0B0F]">
                    {r.teacher}
                  </p>
                  <p className="mt-0.5 truncate text-[11px] text-[#8A8D93]">
                    {r.subject} · {r.date}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className="h-3.5 w-3.5"
                      strokeWidth={1.75}
                      fill={i < r.rating ? "#DFFF3F" : "transparent"}
                      color={i < r.rating ? "#0B0B0F" : "#D5D7DB"}
                    />
                  ))}
                </div>
              </div>
              <p className="mt-3 text-[12.5px] leading-relaxed text-[#4A4D54]">{r.body}</p>
            </article>
          ))}
        </div>
      )}

      <Link
        href="/student"
        className="mt-6 inline-flex items-center gap-1.5 text-[11.5px] font-medium text-[#8A8D93] transition-colors hover:text-[#0B0B0F]"
      >
        <ArrowLeft className="h-3 w-3" strokeWidth={2} />
        Retour au tableau de bord
      </Link>
    </div>
  );
}

export default function StudentReviewsPage() {
  return (
    <AppShell
      nav={studentNav}
      mobileTabs={studentMobileTabs}
      user={student}
      desktopMain={<Body />}
      mobileHeader={{ title: "Tes avis", subtitle: `${reviews.length} avis publiés` }}
      mobileChildren={<Body />}
    />
  );
}
