"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  BadgeCheck,
  CalendarClock,
  Check,
  FileText,
  Info,
  Plus,
  ShieldCheck,
  Sparkles,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { AppShell } from "@/components/app/app-shell";
import { PageHeader } from "@/components/app/page-header";
import {
  Stepper,
  StepperMobile,
  StepperStatusPill,
  type StepperStep,
} from "@/components/app/stepper";
import { SmoothInput } from "@/components/library/smooth-input";
import { StatefulButton } from "@/components/library/stateful-button";
import { teacherMobileTabs, teacherNav } from "@/lib/nav";
import { mockTeacher } from "@/lib/mock/teacher";
import {
  mockBio,
  mockDiplomas,
  mockIdentity,
  mockNationalities,
  mockSubjectPool,
  mockVerificationSteps,
  type BioData,
  type DiplomaEntry,
  type IdentityData,
  type VerificationStepId,
} from "@/lib/mock/teacher-verification";
import { cn } from "@/lib/utils";

/* ================================================================
   Page shell
   ================================================================ */

export default function TeacherVerificationPage() {
  return (
    <Suspense fallback={null}>
      <Inner />
    </Suspense>
  );
}

const STEP_IDS: VerificationStepId[] = ["identity", "diplomas", "bio", "final"];

function parseStep(v: string | null): VerificationStepId {
  return (STEP_IDS as string[]).includes(v ?? "")
    ? (v as VerificationStepId)
    : "identity";
}

function Inner() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [activeId, setActiveId] = useState<VerificationStepId>(
    parseStep(searchParams.get("step")),
  );

  // Step data (all mock-mutable in-page)
  const [steps] = useState<StepperStep[]>(mockVerificationSteps);
  const [identity, setIdentity] = useState<IdentityData>(mockIdentity);
  const [diplomas, setDiplomas] = useState<DiplomaEntry[]>(mockDiplomas);
  const [bio, setBio] = useState<BioData>(mockBio);
  const [previewPublic, setPreviewPublic] = useState<boolean>(false);

  // URL sync
  useEffect(() => {
    const p = new URLSearchParams(Array.from(searchParams.entries()));
    p.set("step", activeId);
    const qs = p.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId]);

  const handleSelect = useCallback((id: string) => {
    if (!id) return;
    if ((STEP_IDS as string[]).includes(id)) {
      setActiveId(id as VerificationStepId);
    }
  }, []);

  const activeStep = useMemo(
    () => steps.find((s) => s.id === activeId) ?? steps[0],
    [steps, activeId],
  );

  const renderBody = (step: StepperStep) => {
    switch (step.id as VerificationStepId) {
      case "identity":
        return (
          <IdentityForm value={identity} onChange={setIdentity} />
        );
      case "diplomas":
        return (
          <DiplomasForm value={diplomas} onChange={setDiplomas} />
        );
      case "bio":
        return (
          <BioForm
            value={bio}
            onChange={setBio}
            previewPublic={previewPublic}
            onTogglePreview={setPreviewPublic}
          />
        );
      case "final":
        return <FinalChecklist steps={steps} />;
      default:
        return null;
    }
  };

  return (
    <AppShell
      nav={teacherNav}
      mobileTabs={teacherMobileTabs}
      user={{
        fullName: mockTeacher.fullName,
        level: mockTeacher.level,
        initials: mockTeacher.initials,
      }}
      desktopMain={
        <div className="p-6">
          <PageHeader
            eyebrow={
              <>
                <ShieldCheck className="h-3.5 w-3.5" strokeWidth={1.75} />
                <span>Profil enseignant</span>
                <span className="h-1 w-1 rounded-full bg-[#D5D7DB]" />
                <span className="font-medium text-[#0B0B0F]">
                  1 étape validée sur 4
                </span>
              </>
            }
            title="Vérification & confiance"
            subline="Renforce ton profil pour être mis en avant."
            actions={
              <span className="flex h-9 items-center gap-1.5 rounded-full bg-[#DFFF3F] px-3 text-[11.5px] font-semibold text-[#0B0B0F]">
                <Sparkles className="h-3.5 w-3.5" strokeWidth={2} />
                +30% de visibilité une fois complet
              </span>
            }
          />

          <div className="mt-6 grid grid-cols-[280px_1fr] gap-2.5">
            <Stepper
              steps={steps}
              activeId={activeId}
              onSelect={handleSelect}
            />
            <StepPanel step={activeStep}>{renderBody(activeStep)}</StepPanel>
          </div>
        </div>
      }
      rail={null}
      mobileHeader={{
        title: "Vérification",
        subtitle: "Renforce ton profil pour être mis en avant.",
      }}
      mobileChildren={
        <div className="mt-3 space-y-3 px-4">
          <div className="rounded-[18px] bg-white p-4 shadow-[0_1px_2px_rgba(10,11,20,0.04)]">
            <p className="text-[10px] font-semibold uppercase tracking-[0.09em] text-[#8A8D93]">
              Ton profil
            </p>
            <p className="mt-1 font-[family-name:var(--font-cabinet)] text-[18px] font-bold leading-tight tracking-tight text-[#0B0B0F]">
              1 étape sur 4 validée
            </p>
            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-[#F0F0F2]">
              <div
                className="h-full rounded-full bg-[#DFFF3F]"
                style={{ width: "25%" }}
              />
            </div>
          </div>
          <StepperMobile
            steps={steps}
            activeId={activeId}
            onSelect={handleSelect}
            renderBody={renderBody}
          />
        </div>
      }
    />
  );
}

/* ================================================================
   Right-side step panel wrapper (desktop)
   ================================================================ */

function StepPanel({
  step,
  children,
}: {
  step: StepperStep;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[20px] bg-white p-6 shadow-[0_1px_2px_rgba(10,11,20,0.04)]">
      <div className="flex items-start justify-between gap-4 border-b border-[#EFEFF1] pb-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.09em] text-[#8A8D93]">
            Étape en cours
          </p>
          <h2 className="mt-1 font-[family-name:var(--font-cabinet)] text-[22px] font-bold leading-tight tracking-tight text-[#0B0B0F]">
            {step.label}
          </h2>
          {step.description ? (
            <p className="mt-1 text-[12.5px] text-[#6E7178]">{step.description}</p>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="text-[10.5px] font-semibold uppercase tracking-[0.07em] text-[#8A8D93]">
            Statut
          </span>
          <StepperStatusPill status={step.status} />
        </div>
      </div>
      <div className="pt-5">{children}</div>
    </section>
  );
}

/* ================================================================
   Shared bits
   ================================================================ */

function FieldLabel({
  children,
  htmlFor,
}: {
  children: React.ReactNode;
  htmlFor?: string;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.06em] text-[#6E7178]"
    >
      {children}
    </label>
  );
}

const fieldShell =
  "flex h-11 items-center rounded-[12px] border border-[#EFEFF1] bg-[#F5F5F7] px-3.5 text-[13px] text-[#0B0B0F] transition-colors focus-within:border-[#0B0B0F] focus-within:bg-white";

/* ================================================================
   Uploader (dashed → lime on hover) with mock preview
   ================================================================ */

function UploadArea({
  label,
  fileName,
  onFile,
  onClear,
}: {
  label: string;
  fileName?: string | null;
  onFile: (name: string) => void;
  onClear: () => void;
}) {
  const inputId = `up-${label.replace(/\s+/g, "-").toLowerCase()}`;
  const hasFile = Boolean(fileName);

  return (
    <div className="w-full">
      <FieldLabel htmlFor={inputId}>{label}</FieldLabel>
      <label
        htmlFor={inputId}
        className={cn(
          "group relative flex h-[132px] w-full cursor-pointer flex-col items-center justify-center gap-1.5 overflow-hidden rounded-[16px] border-2 border-dashed transition-colors",
          hasFile
            ? "border-[#0B0B0F] bg-white"
            : "border-[#D5D7DB] bg-[#FAFAFB] hover:border-[#0B0B0F] hover:bg-[#DFFF3F]",
        )}
      >
        {hasFile ? (
          <>
            <div className="grid h-10 w-10 place-items-center rounded-full bg-[#DFFF3F] text-[#0B0B0F]">
              <FileText className="h-4 w-4" strokeWidth={2} />
            </div>
            <p className="max-w-[80%] truncate text-[12px] font-semibold text-[#0B0B0F]">
              {fileName}
            </p>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                onClear();
              }}
              className="absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-full bg-white text-[#8A8D93] shadow-[0_1px_2px_rgba(10,11,20,0.08)] transition-colors hover:text-[#DC2626]"
              aria-label={`Retirer ${label}`}
            >
              <X className="h-3.5 w-3.5" strokeWidth={2} />
            </button>
          </>
        ) : (
          <>
            <div className="grid h-9 w-9 place-items-center rounded-full bg-white text-[#0B0B0F] shadow-[0_1px_2px_rgba(10,11,20,0.05)] transition-transform group-hover:scale-105">
              <Upload className="h-4 w-4" strokeWidth={2} />
            </div>
            <p className="text-[11.5px] font-semibold text-[#0B0B0F]">
              Cliquer pour uploader
            </p>
            <p className="text-[10.5px] text-[#6E7178]">JPG, PNG ou PDF · 5 Mo max</p>
          </>
        )}
        <input
          id={inputId}
          type="file"
          accept="image/*,application/pdf"
          className="sr-only"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onFile(f.name);
            e.target.value = "";
          }}
        />
      </label>
    </div>
  );
}

/* ================================================================
   Step 1 · Identité
   ================================================================ */

function IdentityForm({
  value,
  onChange,
}: {
  value: IdentityData;
  onChange: (v: IdentityData) => void;
}) {
  const patch = (p: Partial<IdentityData>) => onChange({ ...value, ...p });

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <FieldLabel htmlFor="fullName">Nom complet</FieldLabel>
          <div className={fieldShell}>
            <SmoothInput
              id="fullName"
              value={value.fullName}
              onChange={(e) => patch({ fullName: e.target.value })}
              placeholder="Ton nom tel qu'il apparaît sur ton CIN"
              className="text-[13px] placeholder:text-[#9CA0A6]"
            />
          </div>
        </div>
        <div>
          <FieldLabel htmlFor="cin">N° CIN</FieldLabel>
          <div className={fieldShell}>
            <SmoothInput
              id="cin"
              value={value.cinNumber}
              onChange={(e) => patch({ cinNumber: e.target.value })}
              placeholder="Ex: BE 123 456"
              className="text-[13px] tracking-wide placeholder:text-[#9CA0A6]"
            />
          </div>
        </div>
        <div>
          <FieldLabel htmlFor="dob">Date de naissance</FieldLabel>
          <input
            id="dob"
            type="date"
            value={value.dob}
            onChange={(e) => patch({ dob: e.target.value })}
            className="h-11 w-full rounded-[12px] border border-[#EFEFF1] bg-[#F5F5F7] px-3.5 text-[13px] text-[#0B0B0F] outline-none transition-colors focus:border-[#0B0B0F] focus:bg-white"
          />
        </div>
        <div>
          <FieldLabel htmlFor="nat">Nationalité</FieldLabel>
          <select
            id="nat"
            value={value.nationality}
            onChange={(e) => patch({ nationality: e.target.value })}
            className="h-11 w-full appearance-none rounded-[12px] border border-[#EFEFF1] bg-[#F5F5F7] px-3.5 text-[13px] text-[#0B0B0F] outline-none transition-colors focus:border-[#0B0B0F] focus:bg-white"
          >
            {mockNationalities.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.09em] text-[#8A8D93]">
          Pièce d&apos;identité
        </p>
        <p className="mt-0.5 text-[11.5px] text-[#6E7178]">
          Recto + verso lisibles, coins visibles. Uniquement toi et l&apos;équipe
          Darso ont accès à ces documents.
        </p>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <UploadArea
            label="CIN — recto"
            fileName={value.cinFront?.fileName}
            onFile={(name) => patch({ cinFront: { fileName: name } })}
            onClear={() => patch({ cinFront: null })}
          />
          <UploadArea
            label="CIN — verso"
            fileName={value.cinBack?.fileName}
            onFile={(name) => patch({ cinBack: { fileName: name } })}
            onClear={() => patch({ cinBack: null })}
          />
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-[#EFEFF1] pt-4">
        <p className="text-[11.5px] text-[#6E7178]">
          Vérification manuelle sous 24 à 48h ouvrées.
        </p>
        <StatefulButton
          onClick={async () => {
            await new Promise((r) => setTimeout(r, 700));
          }}
          className="min-w-[220px] px-4 py-2.5 text-[12px]"
        >
          Envoyer pour vérification
        </StatefulButton>
      </div>
    </div>
  );
}

/* ================================================================
   Step 2 · Diplômes
   ================================================================ */

function DiplomasForm({
  value,
  onChange,
}: {
  value: DiplomaEntry[];
  onChange: (v: DiplomaEntry[]) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState<Omit<DiplomaEntry, "id" | "status">>({
    title: "",
    institution: "",
    year: new Date().getFullYear(),
    fileName: undefined,
  });

  const remove = (id: string) => onChange(value.filter((d) => d.id !== id));

  const submitDraft = () => {
    if (!draft.title.trim() || !draft.institution.trim()) return;
    const id = `dip-${Date.now()}`;
    onChange([
      ...value,
      { id, status: "in-progress", ...draft },
    ]);
    setDraft({
      title: "",
      institution: "",
      year: new Date().getFullYear(),
      fileName: undefined,
    });
    setAdding(false);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2.5">
        {value.length === 0 ? (
          <div className="rounded-[16px] border border-dashed border-[#EFEFF1] bg-[#FAFAFB] px-4 py-8 text-center">
            <p className="text-[12.5px] font-semibold text-[#0B0B0F]">
              Aucun diplôme ajouté.
            </p>
            <p className="mt-0.5 text-[11px] text-[#8A8D93]">
              Ajoute au moins un diplôme pour être vérifié.
            </p>
          </div>
        ) : (
          value.map((d) => (
            <div
              key={d.id}
              className="flex items-start justify-between gap-4 rounded-[16px] border border-[#EFEFF1] bg-white p-4"
            >
              <div className="flex min-w-0 items-start gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#F5F5F7] text-[#0B0B0F]">
                  <BadgeCheck className="h-4 w-4" strokeWidth={2} />
                </div>
                <div className="min-w-0">
                  <p className="truncate font-[family-name:var(--font-cabinet)] text-[14px] font-bold tracking-tight text-[#0B0B0F]">
                    {d.title}
                  </p>
                  <p className="mt-0.5 truncate text-[12px] text-[#6E7178]">
                    {d.institution} · {d.year}
                  </p>
                  {d.fileName ? (
                    <p className="mt-1 inline-flex items-center gap-1 text-[10.5px] text-[#8A8D93]">
                      <FileText className="h-3 w-3" strokeWidth={1.75} />
                      {d.fileName}
                    </p>
                  ) : null}
                </div>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-2">
                <StepperStatusPill status={d.status} />
                <button
                  type="button"
                  onClick={() => remove(d.id)}
                  className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10.5px] font-semibold text-[#8A8D93] transition-colors hover:bg-[#F5F5F7] hover:text-[#DC2626]"
                >
                  <Trash2 className="h-3 w-3" strokeWidth={2} />
                  Retirer
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {adding ? (
        <div className="rounded-[16px] border border-[#EFEFF1] bg-[#FAFAFB] p-4">
          <p className="font-[family-name:var(--font-cabinet)] text-[14px] font-bold tracking-tight text-[#0B0B0F]">
            Nouveau diplôme
          </p>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <FieldLabel htmlFor="d-title">Intitulé</FieldLabel>
              <div className={fieldShell}>
                <SmoothInput
                  id="d-title"
                  value={draft.title}
                  onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                  placeholder="Ex: Licence en mathématiques"
                  className="text-[13px] placeholder:text-[#9CA0A6]"
                />
              </div>
            </div>
            <div>
              <FieldLabel htmlFor="d-inst">Établissement</FieldLabel>
              <div className={fieldShell}>
                <SmoothInput
                  id="d-inst"
                  value={draft.institution}
                  onChange={(e) =>
                    setDraft({ ...draft, institution: e.target.value })
                  }
                  placeholder="Ex: Université Mohammed V"
                  className="text-[13px] placeholder:text-[#9CA0A6]"
                />
              </div>
            </div>
            <div>
              <FieldLabel htmlFor="d-year">Année</FieldLabel>
              <input
                id="d-year"
                type="number"
                min={1950}
                max={new Date().getFullYear()}
                value={draft.year}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    year: Number(e.target.value) || new Date().getFullYear(),
                  })
                }
                className="h-11 w-full rounded-[12px] border border-[#EFEFF1] bg-white px-3.5 text-[13px] text-[#0B0B0F] outline-none focus:border-[#0B0B0F]"
              />
            </div>
            <div className="sm:col-span-2">
              <UploadArea
                label="Scan du diplôme"
                fileName={draft.fileName}
                onFile={(name) => setDraft({ ...draft, fileName: name })}
                onClear={() => setDraft({ ...draft, fileName: undefined })}
              />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setAdding(false)}
              className="rounded-full px-3 py-1.5 text-[11.5px] font-semibold text-[#6E7178] transition-colors hover:bg-white hover:text-[#0B0B0F]"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={submitDraft}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#0B0B0F] px-4 py-1.5 text-[11.5px] font-semibold text-white transition-colors hover:bg-[#1a1b21]"
            >
              <Check className="h-3.5 w-3.5" strokeWidth={2.25} />
              Enregistrer
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="flex w-full items-center justify-center gap-1.5 rounded-[16px] border-2 border-dashed border-[#D5D7DB] bg-white py-3 text-[12px] font-semibold text-[#0B0B0F] transition-colors hover:border-[#0B0B0F] hover:bg-[#DFFF3F]"
        >
          <Plus className="h-4 w-4" strokeWidth={2.25} />
          Ajouter un diplôme
        </button>
      )}
    </div>
  );
}

/* ================================================================
   Step 3 · Bio
   ================================================================ */

function BioForm({
  value,
  onChange,
  previewPublic,
  onTogglePreview,
}: {
  value: BioData;
  onChange: (v: BioData) => void;
  previewPublic: boolean;
  onTogglePreview: (v: boolean) => void;
}) {
  const toggleSubject = (s: string) => {
    const has = value.subjectsTaught.includes(s);
    onChange({
      ...value,
      subjectsTaught: has
        ? value.subjectsTaught.filter((x) => x !== s)
        : [...value.subjectsTaught, s],
    });
  };

  const chars = value.text.length;
  const charLimit = 800;

  return (
    <div className="space-y-5">
      <div>
        <FieldLabel htmlFor="bio-text">Bio publique</FieldLabel>
        <textarea
          id="bio-text"
          rows={6}
          value={value.text}
          onChange={(e) => onChange({ ...value, text: e.target.value })}
          maxLength={charLimit}
          placeholder="Présente ton parcours, ta méthode, ce qui te rend unique…"
          className="w-full rounded-[16px] border border-[#EFEFF1] bg-[#F5F5F7] p-3.5 font-[family-name:var(--font-cabinet)] text-[14px] leading-relaxed text-[#0B0B0F] outline-none transition-colors focus:border-[#0B0B0F] focus:bg-white"
        />
        <div className="mt-1.5 flex items-center justify-between text-[10.5px] text-[#8A8D93]">
          <span>Écris à la 1ʳᵉ personne. Évite les infos de contact.</span>
          <span className="tabular-nums">
            {chars} / {charLimit}
          </span>
        </div>
      </div>

      <div>
        <FieldLabel>Matières enseignées</FieldLabel>
        <div className="flex flex-wrap gap-1.5">
          {mockSubjectPool.map((s) => {
            const on = value.subjectsTaught.includes(s);
            return (
              <button
                key={s}
                type="button"
                onClick={() => toggleSubject(s)}
                className={cn(
                  "inline-flex h-8 items-center gap-1 rounded-full px-3 text-[11.5px] font-semibold transition-colors",
                  on
                    ? "bg-[#0B0B0F] text-white"
                    : "border border-[#EFEFF1] bg-white text-[#0B0B0F] hover:bg-[#F5F5F7]",
                )}
              >
                {on ? <Check className="h-3 w-3" strokeWidth={2.5} /> : null}
                {s}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between rounded-[16px] border border-[#EFEFF1] bg-[#FAFAFB] p-3.5">
        <div className="min-w-0">
          <p className="text-[12.5px] font-semibold text-[#0B0B0F]">
            Aperçu public
          </p>
          <p className="mt-0.5 text-[11px] text-[#6E7178]">
            Vois ta bio telle qu&apos;elle sera affichée aux élèves.
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={previewPublic}
          onClick={() => onTogglePreview(!previewPublic)}
          className={cn(
            "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors",
            previewPublic ? "bg-[#0B0B0F]" : "bg-[#D5D7DB]",
          )}
        >
          <span
            className={cn(
              "inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform",
              previewPublic ? "translate-x-5" : "translate-x-0.5",
            )}
          />
        </button>
      </div>

      {previewPublic ? (
        <div className="rounded-[16px] border border-[#EFEFF1] bg-white p-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.09em] text-[#8A8D93]">
            Aperçu
          </p>
          <p className="mt-2 font-[family-name:var(--font-cabinet)] text-[15px] leading-relaxed text-[#0B0B0F]">
            {value.text || "Ta bio apparaîtra ici."}
          </p>
          {value.subjectsTaught.length ? (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {value.subjectsTaught.map((s) => (
                <span
                  key={s}
                  className="inline-flex h-6 items-center rounded-full bg-[#DFFF3F] px-2 text-[10.5px] font-semibold text-[#0B0B0F]"
                >
                  {s}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="flex items-center justify-between border-t border-[#EFEFF1] pt-4">
        <p className="text-[11.5px] text-[#6E7178]">
          Approbation en moyenne sous 24h.
        </p>
        <StatefulButton
          onClick={async () => {
            await new Promise((r) => setTimeout(r, 700));
          }}
          className="min-w-[220px] px-4 py-2.5 text-[12px]"
        >
          Soumettre pour approbation
        </StatefulButton>
      </div>
    </div>
  );
}

/* ================================================================
   Step 4 · Vérification finale
   ================================================================ */

function FinalChecklist({ steps }: { steps: StepperStep[] }) {
  const prior = steps.filter((s) => s.id !== "final");

  return (
    <div className="space-y-4">
      <div className="divide-y divide-[#EFEFF1] overflow-hidden rounded-[16px] border border-[#EFEFF1] bg-white">
        {prior.map((s) => {
          const done = s.status === "approved";
          return (
            <div
              key={s.id}
              className="flex items-center justify-between gap-3 px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "grid h-8 w-8 place-items-center rounded-full",
                    done
                      ? "bg-[#0B0B0F] text-[#DFFF3F]"
                      : s.status === "rejected"
                      ? "border border-[#DC2626] bg-white text-[#DC2626]"
                      : "border border-[#EFEFF1] bg-[#F5F5F7] text-[#8A8D93]",
                  )}
                >
                  {done ? (
                    <Check className="h-4 w-4" strokeWidth={2.5} />
                  ) : s.status === "rejected" ? (
                    <X className="h-4 w-4" strokeWidth={2.5} />
                  ) : (
                    <span className="h-1.5 w-1.5 rounded-full bg-[#D5D7DB]" />
                  )}
                </div>
                <div>
                  <p className="font-[family-name:var(--font-cabinet)] text-[13.5px] font-bold tracking-tight text-[#0B0B0F]">
                    {s.label}
                  </p>
                  {s.description ? (
                    <p className="mt-0.5 text-[11px] text-[#8A8D93]">
                      {s.description}
                    </p>
                  ) : null}
                </div>
              </div>
              <StepperStatusPill status={s.status} />
            </div>
          );
        })}
      </div>

      <div className="flex items-start gap-3 rounded-[16px] bg-[#0B0B0F] p-4 text-white">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#DFFF3F] text-[#0B0B0F]">
          <CalendarClock className="h-4 w-4" strokeWidth={2} />
        </div>
        <div className="min-w-0">
          <p className="font-[family-name:var(--font-cabinet)] text-[15px] font-bold tracking-tight">
            Nous te contactons sous 48h
          </p>
          <p className="mt-0.5 text-[11.5px] text-white/70">
            Un membre de l&apos;équipe Darso valide manuellement ta demande, puis
            active le badge « Prof vérifié » sur ton profil public.
          </p>
        </div>
      </div>

      <div className="flex items-start gap-2 rounded-[16px] border border-[#EFEFF1] bg-[#FAFAFB] p-3.5 text-[11.5px] text-[#6E7178]">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#8A8D93]" strokeWidth={2} />
        <p>
          Tu peux continuer à créer des séances pendant la vérification finale,
          mais elles seront marquées « en attente de badge ».
        </p>
      </div>
    </div>
  );
}
