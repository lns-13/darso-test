"use client";

import {
  Suspense,
  useActionState,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import {
  AlertCircle,
  AlertTriangle,
  ArrowUpRight,
  Banknote,
  Bell,
  BookOpen,
  Check,
  ChevronRight,
  Clock,
  ExternalLink,
  Eye,
  KeyRound,
  Landmark,
  Languages,
  Loader2,
  LogOut,
  Mail,
  Monitor,
  Phone,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Star,
  User,
} from "lucide-react";
import { AppShell } from "@/components/app/app-shell";
import { ComingSoonButton } from "@/components/app/coming-soon-button";
import { PageHeader } from "@/components/app/page-header";
import { Pill } from "@/components/app/pill";
import { AuthField } from "@/components/auth/auth-field";
import { NavMenu, type NavMenuItem } from "@/components/library/nav-menu";
import { ImgRippleEffect } from "@/components/library/img-ripple-effect";
import { groupByDay, summariseWeek } from "@/lib/availability";
import type { OwnTeacherProfile } from "@/lib/data/teacher-profile";
import type { ReferenceItem, ReferenceVocabularies } from "@/lib/data/reference";
import { formatMinorAmount } from "@/lib/money";
import { teacherMobileTabs, teacherNav } from "@/lib/nav";
import { springSoft } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { mockPayoutSettings, mockTeacherSessions } from "@/lib/mock/teacher-profile";

import {
  saveAccountSection,
  saveProfileSection,
  saveTeachingSection,
} from "./actions";
import { idleSaveState, OFFERED_TIMEZONES, type SaveState } from "./form-state";

/* ---------------- Section ids & url sync ---------------- */

type SectionId =
  | "profile"
  | "teaching"
  | "account"
  | "security"
  | "payout"
  | "notifications"
  | "preview"
  | "danger";

const SECTIONS: {
  id: SectionId;
  label: string;
  icon: NavMenuItem["icon"];
}[] = [
  { id: "profile", label: "Profil", icon: User },
  { id: "teaching", label: "Enseignement", icon: BookOpen },
  { id: "account", label: "Compte", icon: Mail },
  { id: "security", label: "Sécurité", icon: ShieldCheck },
  { id: "payout", label: "Retraits", icon: Banknote },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "preview", label: "Profil public", icon: Eye },
  { id: "danger", label: "Zone sensible", icon: AlertTriangle },
];

function isSectionId(v: string | null): v is SectionId {
  return (
    v === "profile" ||
    v === "teaching" ||
    v === "account" ||
    v === "security" ||
    v === "payout" ||
    v === "notifications" ||
    v === "preview" ||
    v === "danger"
  );
}

type SectionProps = {
  profile: OwnTeacherProfile;
  references: ReferenceVocabularies;
};

/* ================================================================
   Page
   ================================================================ */

export function TeacherProfileClient(props: SectionProps) {
  return (
    <Suspense fallback={null}>
      <ProfileInner {...props} />
    </Suspense>
  );
}

function ProfileInner({ profile, references }: SectionProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const initialSection: SectionId = (() => {
    const s = searchParams.get("section");
    return isSectionId(s) ? s : "profile";
  })();
  const [section, setSection] = useState<SectionId>(initialSection);

  const items = useMemo<NavMenuItem[]>(
    () =>
      SECTIONS.map((s) => ({
        id: s.id,
        label: s.label,
        icon: s.icon,
      })),
    [],
  );

  const setSectionAndUrl = useCallback(
    (id: string) => {
      const next = isSectionId(id) ? id : "profile";
      setSection(next);
      const p = new URLSearchParams(searchParams.toString());
      p.set("section", next);
      router.replace(`${pathname}?${p.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const publicHref = `/teacher/preview/${profile.username}`;

  const desktop = (
    <div className="p-6">
      <PageHeader
        eyebrow={
          <>
            <span>Compte pro</span>
            <span className="h-1 w-1 rounded-full bg-[#D5D7DB]" />
            <span className="font-medium text-[#0B0B0F]">
              {profile.fullName}
            </span>
          </>
        }
        title="Profil & préférences"
        subline="Ta vitrine publique et tes paramètres pro."
        actions={
          <a
            href={publicHref}
            target="_blank"
            rel="noreferrer"
            className="flex h-9 items-center gap-1.5 rounded-full bg-[#0B0B0F] px-3.5 text-[12px] font-semibold text-white transition-colors hover:bg-[#1a1b21]"
          >
            <ExternalLink className="h-3.5 w-3.5" strokeWidth={2} />
            Voir mon profil public
          </a>
        }
      />

      <div className="mt-6 grid grid-cols-[240px_1fr] gap-6">
        <aside className="sticky top-6 self-start">
          <div className="rounded-[20px] bg-white p-2 shadow-[0_1px_2px_rgba(10,11,20,0.04)]">
            <NavMenu
              items={items}
              activeId={section}
              onChange={setSectionAndUrl}
              variant="vertical"
              layoutIdSuffix="teacher-profile-desktop"
            />
          </div>
          <p className="mt-3 px-3 text-[10.5px] leading-relaxed text-[#8A8D93]">
            Modifications sauvegardées section par section. Rien n&apos;est
            appliqué avant de cliquer sur « Enregistrer ».
          </p>
        </aside>

        <div className="min-w-0">
          <SectionSwitcher
            section={section}
            publicHref={publicHref}
            profile={profile}
            references={references}
          />
        </div>
      </div>
    </div>
  );

  const mobile = (
    <div className="pt-2">
      <div className="px-4">
        <NavMenu
          items={items}
          activeId={section}
          onChange={setSectionAndUrl}
          variant="horizontal"
          layoutIdSuffix="teacher-profile-mobile"
        />
      </div>
      <div className="mt-3 px-4">
        <SectionSwitcher
          section={section}
          publicHref={publicHref}
          profile={profile}
          references={references}
        />
      </div>
      <div className="h-6" />
    </div>
  );

  return (
    <AppShell
      nav={teacherNav}
      mobileTabs={teacherMobileTabs}
      user={{
        fullName: profile.fullName,
        level: profile.tagline || undefined,
        initials: profile.initials,
      }}
      desktopMain={desktop}
      mobileHeader={{
        title: "Profil",
        subtitle: profile.fullName,
      }}
      mobileChildren={mobile}
    />
  );
}

/* ================================================================
   Section switcher
   ================================================================ */

function SectionSwitcher({
  section,
  publicHref,
  profile,
  references,
}: SectionProps & {
  section: SectionId;
  publicHref: string;
}) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={section}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={springSoft}
      >
        {section === "profile" ? (
          <ProfileSection profile={profile} references={references} />
        ) : null}
        {section === "teaching" ? (
          <TeachingSection profile={profile} references={references} />
        ) : null}
        {section === "account" ? <AccountSection profile={profile} /> : null}
        {section === "security" ? <SecuritySection /> : null}
        {section === "payout" ? <PayoutSection /> : null}
        {section === "notifications" ? <NotificationsSection /> : null}
        {section === "preview" ? (
          <PublicPreviewSection
            publicHref={publicHref}
            profile={profile}
            references={references}
          />
        ) : null}
        {section === "danger" ? <DangerSection /> : null}
      </motion.div>
    </AnimatePresence>
  );
}

/* ================================================================
   Reusable section shell
   ================================================================ */

function SectionShell({
  title,
  subtitle,
  children,
  footer,
  danger,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  danger?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[20px] bg-white shadow-[0_1px_2px_rgba(10,11,20,0.04)]",
        danger && "ring-1 ring-inset ring-[#DC2626]/25",
      )}
    >
      <div className="p-5 sm:p-6">
        <div>
          <h2 className="font-[family-name:var(--font-cabinet)] text-[18px] font-bold tracking-tight text-[#0B0B0F]">
            {title}
          </h2>
          {subtitle ? (
            <p className="mt-1 text-[12px] text-[#8A8D93]">{subtitle}</p>
          ) : null}
        </div>
        <div className="mt-5 flex flex-col gap-4">{children}</div>
        {footer ? (
          <div className="mt-5 flex items-center justify-end gap-2 border-t border-[#EFEFF1] pt-4">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}

/**
 * Same lime pill as `StatefulButton`, but its spinner and checkmark are driven
 * by the real action state instead of a timer.
 *
 * `StatefulButton` runs `animateLoading` then awaits an optional `onClick`
 * then `animateSuccess`, so with no handler it shows a green check
 * unconditionally, even for a failed submit. Wiring a save that can fail makes
 * that actively deceptive. The shared component is left untouched because
 * Task 02 also has to fix it for the auth forms; this is the local, honest
 * version for the forms in this file.
 */
function SaveButton({
  label = "Enregistrer",
  pending,
  state,
}: {
  label?: string;
  pending: boolean;
  state: SaveState;
}) {
  // The checkmark is derived from the action result, not set from inside an
  // effect. `useActionState` returns a new state object per submit, so
  // comparing identity during render is what tells a fresh success from the
  // one already acknowledged. Only the timeout callback writes state, which
  // keeps the effect body free of synchronous setState and its cascading
  // re-render.
  const [acknowledged, setAcknowledged] = useState<SaveState | null>(null);
  if (state.status === "success" && acknowledged !== state) {
    setAcknowledged(state);
  }
  const flash = acknowledged !== null && acknowledged === state;

  useEffect(() => {
    if (!flash) return;
    const timer = window.setTimeout(() => setAcknowledged(null), 1600);
    return () => window.clearTimeout(timer);
  }, [flash]);

  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className="flex min-w-[96px] cursor-pointer items-center justify-center gap-1.5 rounded-full bg-[#DFFF3F] px-3 py-1.5 text-[11.5px] font-semibold text-[#0B0B0F] transition-[filter] hover:brightness-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B0B0F] focus-visible:ring-offset-2 disabled:cursor-progress disabled:brightness-[0.97]"
    >
      {pending ? (
        // motion-safe: the spin stops under prefers-reduced-motion, but the
        // icon and the label still change, so the pending state is never
        // carried by movement alone.
        <Loader2
          aria-hidden
          className="h-4 w-4 motion-safe:animate-spin"
          strokeWidth={2.5}
        />
      ) : null}
      {!pending && flash ? (
        <Check aria-hidden className="h-4 w-4" strokeWidth={3} />
      ) : null}
      <span>{pending ? "Enregistrement…" : label}</span>
    </button>
  );
}

/**
 * The action's own message, success or failure, under the form.
 *
 * Failures carry an icon as well as the red, because colour alone is not a
 * message, and they announce as an alert rather than politely: a save that was
 * refused is the one thing the teacher must not miss.
 */
function FormMessage({ state }: { state: SaveState }) {
  if (state.status === "idle") return null;
  const failed = state.status === "error";
  return (
    <p
      role={failed ? "alert" : undefined}
      aria-live={failed ? "assertive" : "polite"}
      className={cn(
        "mr-auto inline-flex items-center gap-1.5 text-[11.5px] font-medium",
        failed ? "text-[#C53434]" : "text-[#4A4D54]",
      )}
    >
      {failed ? (
        <AlertCircle aria-hidden className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
      ) : (
        <Check aria-hidden className="h-3.5 w-3.5 shrink-0" strokeWidth={2.5} />
      )}
      {state.message}
    </p>
  );
}

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative h-6 w-11 shrink-0 rounded-full transition-colors",
        checked ? "bg-[#0B0B0F]" : "bg-[#D5D7DB]",
      )}
    >
      <motion.span
        layout
        transition={springSoft}
        className={cn(
          "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-[0_1px_2px_rgba(10,11,20,0.15)]",
          checked ? "left-[calc(100%-1.375rem)]" : "left-0.5",
        )}
      />
    </button>
  );
}

/**
 * Chips now carry a reference slug and display the reference name. The three
 * rival hardcoded vocabularies are gone: `subjects`, `levels` and `languages`
 * are seeded tables, and a slug is what gets submitted.
 */
function ChipRow({
  items,
  selected,
  onToggle,
  name,
  tone = "dark",
}: {
  items: ReferenceItem[];
  selected: string[];
  onToggle: (slug: string) => void;
  name: string;
  tone?: "dark" | "lime";
}) {
  return (
    <>
      <div className="flex flex-wrap gap-1.5">
        {items.map((item) => {
          const active = selected.includes(item.slug);
          return (
            <button
              key={item.slug}
              type="button"
              aria-pressed={active}
              onClick={() => onToggle(item.slug)}
              className={cn(
                "rounded-full px-3 py-1.5 text-[11.5px] font-semibold transition-colors",
                active
                  ? tone === "lime"
                    ? "bg-[#DFFF3F] text-[#0B0B0F]"
                    : "bg-[#0B0B0F] text-white"
                  : "bg-[#F5F5F7] text-[#0B0B0F] hover:bg-[#EFEFF1]",
              )}
            >
              {item.name}
            </button>
          );
        })}
      </div>
      {/* AuthField and the chip rows are controlled React state with no `name`
          of their own, so the submitted set is mirrored into hidden inputs. */}
      {selected.map((slug) => (
        <input key={slug} type="hidden" name={name} value={slug} />
      ))}
    </>
  );
}

function toggleIn(values: string[], value: string): string[] {
  return values.includes(value)
    ? values.filter((v) => v !== value)
    : [...values, value];
}

function fieldError(state: SaveState, field: string): string | undefined {
  return state.status === "error" ? state.errors?.[field] : undefined;
}

/** Reference rows are stored by slug and displayed by name. */
function namesForSlugs(items: ReferenceItem[], slugs: string[]): string[] {
  const bySlug = new Map(items.map((i) => [i.slug, i.name]));
  return slugs.map((slug) => bySlug.get(slug) ?? slug);
}

/* ================================================================
   1) Profil
   ================================================================ */

function ProfileSection({ profile, references }: SectionProps) {
  const [state, formAction, pending] = useActionState(
    saveProfileSection,
    idleSaveState,
  );

  const [fullName, setFullName] = useState(profile.fullName);
  const [username, setUsername] = useState(profile.username);
  const [tagline, setTagline] = useState(profile.tagline);
  const [bio, setBio] = useState(profile.bio);
  const [city, setCity] = useState(profile.city);
  const [languages, setLanguages] = useState<string[]>(profile.languageSlugs);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  return (
    <form action={formAction}>
      <SectionShell
        title="Profil"
        subtitle="Ta vitrine publique visible par les élèves qui te découvrent."
        footer={
          <>
            <FormMessage state={state} />
            <SaveButton pending={pending} state={state} />
          </>
        }
      >
        <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
          <ImgRippleEffect
            src={profile.avatarUrl}
            initials={profile.initials}
            size={128}
            onFileChange={setAvatarFile}
          />
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold text-[#0B0B0F]">
              Photo de profil
            </p>
            <p className="mt-1 text-[11.5px] leading-relaxed text-[#6E7178]">
              PNG ou JPG, 1&nbsp;Mo max. Un portrait clair et professionnel
              multiplie tes chances d&apos;être choisi.
            </p>
            {avatarFile ? (
              <p className="mt-2 text-[11px] text-[#0B0B0F]">
                Sélectionnée :{" "}
                <span className="font-semibold">{avatarFile.name}</span> —
                l&apos;envoi de photo arrive avec la vérification du compte.
              </p>
            ) : null}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <AuthField
            label="Nom complet"
            value={fullName}
            onValueChange={setFullName}
            autoComplete="name"
            error={fieldError(state, "fullName")}
          />
          <AuthField
            label="Nom d'utilisateur"
            value={username}
            onValueChange={(v) => setUsername(v.toLowerCase())}
            autoComplete="username"
            error={fieldError(state, "username")}
          />
        </div>
        <p className="-mt-2 pl-1 text-[10.5px] text-[#8A8D93]">
          Ton adresse publique : /teacher/preview/{username || "…"}
        </p>

        <AuthField
          label="Accroche courte (tagline)"
          value={tagline}
          onValueChange={setTagline}
          error={fieldError(state, "tagline")}
        />

        <div>
          <label className="mb-1.5 block text-[10.5px] font-semibold uppercase tracking-[0.09em] text-[#8A8D93]">
            Bio
          </label>
          <textarea
            name="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value.slice(0, 300))}
            rows={4}
            className="w-full resize-none rounded-[14px] border border-[#EFEFF1] bg-white px-3.5 py-2.5 text-[13.5px] text-[#0B0B0F] outline-none transition placeholder:text-[#B0B3B8] hover:border-[#B0B3B8] focus:border-[#0B0B0F] focus:shadow-[0_0_0_3px_rgba(11,11,15,0.06)]"
            placeholder="Présente ton approche pédagogique en quelques lignes."
          />
          <p className="mt-1 pl-1 text-[10.5px] text-[#8A8D93]">
            {bio.length} / 300 caractères
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <AuthField
            label="Ville"
            value={city}
            onValueChange={setCity}
            autoComplete="address-level2"
            error={fieldError(state, "city")}
          />
          <div>
            <label className="mb-2 block text-[10.5px] font-semibold uppercase tracking-[0.09em] text-[#8A8D93]">
              <span className="inline-flex items-center gap-1.5">
                <Languages className="h-3 w-3" strokeWidth={2} />
                Langues parlées
              </span>
            </label>
            <ChipRow
              items={references.languages}
              selected={languages}
              onToggle={(slug) => setLanguages((prev) => toggleIn(prev, slug))}
              name="languages"
            />
          </div>
        </div>

        <input type="hidden" name="fullName" value={fullName} />
        <input type="hidden" name="username" value={username} />
        <input type="hidden" name="tagline" value={tagline} />
        <input type="hidden" name="city" value={city} />
      </SectionShell>
    </form>
  );
}

/* ================================================================
   2) Enseignement
   ================================================================ */

function TeachingSection({ profile, references }: SectionProps) {
  const [state, formAction, pending] = useActionState(
    saveTeachingSection,
    idleSaveState,
  );

  const [subjects, setSubjects] = useState<string[]>(profile.subjectSlugs);
  const [levels, setLevels] = useState<string[]>(profile.levelSlugs);
  const [experience, setExperience] = useState(
    profile.yearsExperience === null ? "" : String(profile.yearsExperience),
  );
  const [hourlyRate, setHourlyRate] = useState(
    profile.hourlyRateMinor === null
      ? ""
      : String(profile.hourlyRateMinor / 100),
  );
  const [timezone, setTimezone] = useState(profile.timezone);

  const weekSummary = summariseWeek(profile.availability);
  const days = groupByDay(profile.availability);

  // The stored zone may sit outside the offered list; keep it selectable.
  const timezoneOptions = OFFERED_TIMEZONES.some((t) => t.value === timezone)
    ? OFFERED_TIMEZONES
    : [{ value: timezone, label: timezone }, ...OFFERED_TIMEZONES];

  return (
    <form action={formAction}>
      <SectionShell
        title="Enseignement"
        subtitle="Matières, niveaux, tarif et disponibilités affichés sur ton profil."
        footer={
          <>
            <FormMessage state={state} />
            <SaveButton pending={pending} state={state} />
          </>
        }
      >
        <div>
          <label className="mb-2 block text-[10.5px] font-semibold uppercase tracking-[0.09em] text-[#8A8D93]">
            Matières enseignées
          </label>
          <ChipRow
            items={references.subjects}
            selected={subjects}
            onToggle={(slug) => setSubjects((prev) => toggleIn(prev, slug))}
            name="subjects"
          />
        </div>

        <div>
          <label className="mb-2 block text-[10.5px] font-semibold uppercase tracking-[0.09em] text-[#8A8D93]">
            Niveaux couverts
          </label>
          <ChipRow
            items={references.levels}
            selected={levels}
            onToggle={(slug) => setLevels((prev) => toggleIn(prev, slug))}
            name="levels"
            tone="lime"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <AuthField
            label="Années d'expérience"
            value={experience}
            onValueChange={setExperience}
            inputMode="numeric"
            error={fieldError(state, "experience")}
          />
          <AuthField
            label={`Tarif horaire (${profile.currency})`}
            value={hourlyRate}
            onValueChange={setHourlyRate}
            inputMode="numeric"
            error={fieldError(state, "hourlyRate")}
          />
          <div>
            <label
              htmlFor="timezone"
              className="mb-1.5 block text-[10.5px] font-semibold uppercase tracking-[0.09em] text-[#8A8D93]"
            >
              Fuseau horaire
            </label>
            <select
              id="timezone"
              name="timezone"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="h-[42px] w-full rounded-[14px] border border-[#EFEFF1] bg-white px-3 text-[13.5px] text-[#0B0B0F] outline-none transition hover:border-[#B0B3B8] focus:border-[#0B0B0F] focus:shadow-[0_0_0_3px_rgba(11,11,15,0.06)]"
            >
              {timezoneOptions.map((tz) => (
                <option key={tz.value} value={tz.value}>
                  {tz.label}
                </option>
              ))}
            </select>
            {fieldError(state, "timezone") ? (
              <p className="mt-1 pl-1 text-[11px] font-medium text-[#C53434]">
                {fieldError(state, "timezone")}
              </p>
            ) : null}
          </div>
        </div>

        {/* Availability used to be a free-text field ("Lun-Ven 14-20h") that
            nothing could be booked against. It is now real rows, edited in the
            week grid that already exists on the sessions page. */}
        <div className="rounded-[16px] border border-[#EFEFF1] bg-[#FAFAFB] p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#0B0B0F]">
                <Clock className="h-3.5 w-3.5" strokeWidth={2} />
                Disponibilités hebdomadaires
              </p>
              {weekSummary ? (
                <>
                  <p className="mt-1 text-[11.5px] text-[#6E7178]">
                    {weekSummary}
                  </p>
                  <ul className="mt-2 space-y-0.5">
                    {days.map((d) => (
                      <li
                        key={d.day}
                        className="flex items-baseline gap-2 text-[11.5px] text-[#4A4D54]"
                      >
                        <span className="w-[30px] shrink-0 font-semibold text-[#0B0B0F]">
                          {d.shortLabel}
                        </span>
                        <span className="tabular-nums">
                          {d.ranges.join(" · ")}
                        </span>
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <p className="mt-1 text-[11.5px] text-[#6E7178]">
                  Aucun créneau publié. Les élèves ne peuvent pas encore te
                  réserver.
                </p>
              )}
            </div>
            <Link
              href="/teacher/sessions?tab=availability"
              className="inline-flex shrink-0 items-center gap-1 rounded-full border border-[#EFEFF1] bg-white px-3 py-1.5 text-[11.5px] font-semibold text-[#0B0B0F] transition-colors hover:bg-[#F5F5F7]"
            >
              Modifier
              <ChevronRight className="h-3.5 w-3.5" strokeWidth={1.75} />
            </Link>
          </div>
        </div>

        <div className="rounded-[16px] border border-[#EFEFF1] bg-[#FAFAFB] p-4 text-[11.5px] leading-relaxed text-[#6E7178]">
          <p className="font-semibold text-[#0B0B0F]">
            Astuce — profils qui convertissent
          </p>
          <p className="mt-1">
            Précise ton tarif dès le départ et ta plage horaire habituelle : les
            élèves prennent contact 3× plus vite quand ces infos sont claires.
          </p>
        </div>

        <input type="hidden" name="experience" value={experience} />
        <input type="hidden" name="hourlyRate" value={hourlyRate} />
      </SectionShell>
    </form>
  );
}

/* ================================================================
   3) Compte
   ================================================================ */

function AccountSection({ profile }: { profile: OwnTeacherProfile }) {
  const [state, formAction, pending] = useActionState(
    saveAccountSection,
    idleSaveState,
  );

  const [phone, setPhone] = useState(profile.phone);
  const [lang, setLang] = useState(profile.uiLocale);

  const langs = [
    { code: "fr", label: "Français" },
    { code: "ar", label: "العربية" },
    { code: "en", label: "English" },
  ];

  return (
    <form action={formAction}>
      <SectionShell
        title="Compte"
        subtitle="Coordonnées, date de naissance et langue de l'interface."
        footer={
          <>
            <FormMessage state={state} />
            <SaveButton pending={pending} state={state} />
          </>
        }
      >
        <div>
          <label className="mb-1.5 block text-[10.5px] font-semibold uppercase tracking-[0.09em] text-[#8A8D93]">
            Email
          </label>
          <div className="flex items-center gap-2 rounded-[14px] border border-[#EFEFF1] bg-[#FAFAFB] px-3.5 py-2.5">
            <Mail className="h-4 w-4 text-[#8A8D93]" strokeWidth={1.75} />
            <span className="min-w-0 flex-1 truncate text-[13.5px] text-[#0B0B0F]">
              {profile.email ?? "—"}
            </span>
            <Pill tone="neutral">Vérifié</Pill>
            {/* Email lives on auth.users and changes through
                supabase.auth.updateUser, which is Task 02's territory. */}
            <ComingSoonButton
              message="Bientôt"
              className="rounded-full border border-[#EFEFF1] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#0B0B0F] transition-colors hover:bg-[#F5F5F7]"
            >
              Changer
            </ComingSoonButton>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <AuthField
            label="Téléphone"
            value={phone}
            onValueChange={setPhone}
            inputMode="tel"
            autoComplete="tel"
            error={fieldError(state, "phone")}
            trailing={
              <Phone
                className="mr-1 h-3.5 w-3.5 text-[#8A8D93]"
                strokeWidth={1.75}
              />
            }
          />
          <div>
            <label className="mb-1.5 block text-[10.5px] font-semibold uppercase tracking-[0.09em] text-[#8A8D93]">
              Date de naissance
            </label>
            <div className="flex h-[42px] items-center gap-2 rounded-[14px] border border-[#EFEFF1] bg-[#FAFAFB] px-3.5">
              <span className="min-w-0 flex-1 truncate text-[13.5px] text-[#0B0B0F] tabular-nums">
                {formatDob(profile.birthDate)}
              </span>
              <Pill tone="neutral">Non modifiable</Pill>
            </div>
          </div>
        </div>

        <div>
          <label className="mb-2 block text-[10.5px] font-semibold uppercase tracking-[0.09em] text-[#8A8D93]">
            Langue de l&apos;interface
          </label>
          <div className="flex flex-wrap gap-1.5">
            {langs.map((l) => {
              const active = l.code === lang;
              return (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => setLang(l.code)}
                  className={cn(
                    "rounded-full px-3.5 py-1.5 text-[11.5px] font-semibold transition-colors",
                    active
                      ? "bg-[#DFFF3F] text-[#0B0B0F]"
                      : "bg-[#F5F5F7] text-[#0B0B0F] hover:bg-[#EFEFF1]",
                  )}
                >
                  {l.label}
                  <span className="ml-1.5 text-[10px] font-medium text-[#6E7178]">
                    {l.code.toUpperCase()}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <input type="hidden" name="phone" value={phone} />
        <input type="hidden" name="uiLocale" value={lang} />
      </SectionShell>
    </form>
  );
}

/* ================================================================
   4) Sécurité
   ================================================================ */

function SecuritySection() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [twoFA, setTwoFA] = useState(true);
  const [sessions, setSessions] = useState(mockTeacherSessions);

  const disconnect = (id: string) =>
    setSessions((prev) => prev.filter((s) => s.id !== id));
  const disconnectOthers = () =>
    setSessions((prev) => prev.filter((s) => s.current));

  return (
    <div className="flex flex-col gap-4">
      {/* Password, two-factor and the device list are auth and session
          concerns: Task 02 ships updatePassword, Task 03 backs this list with
          user_devices. Left unwired on purpose, but no longer faking a save. */}
      <SectionShell
        title="Changer le mot de passe"
        subtitle="Choisis un mot de passe robuste que tu n'utilises pas ailleurs."
        footer={
          <ComingSoonButton
            message="Bientôt disponible"
            className="flex min-w-[96px] items-center justify-center gap-1.5 rounded-full bg-[#DFFF3F] px-3 py-1.5 text-[11.5px] font-semibold text-[#0B0B0F] transition-[filter] hover:brightness-[0.97]"
          >
            Mettre à jour
          </ComingSoonButton>
        }
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <AuthField
            label="Actuel"
            type="password"
            value={current}
            onValueChange={setCurrent}
            autoComplete="current-password"
          />
          <AuthField
            label="Nouveau"
            type="password"
            value={next}
            onValueChange={setNext}
            autoComplete="new-password"
          />
          <AuthField
            label="Confirmer"
            type="password"
            value={confirm}
            onValueChange={setConfirm}
            autoComplete="new-password"
            error={
              confirm.length > 0 && confirm !== next
                ? "Ne correspond pas"
                : undefined
            }
          />
        </div>
      </SectionShell>

      <SectionShell
        title="Double authentification"
        subtitle="Recommandé pour un compte pro qui reçoit des paiements."
      >
        <div className="flex items-center justify-between rounded-[16px] border border-[#EFEFF1] bg-[#FAFAFB] p-4">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-full bg-white text-[#0B0B0F]">
              <KeyRound className="h-4 w-4" strokeWidth={1.75} />
            </div>
            <div>
              <p className="text-[13px] font-semibold text-[#0B0B0F]">
                Application d&apos;authentification
              </p>
              <p className="text-[11.5px] text-[#6E7178]">
                {twoFA ? "Activée" : "Désactivée"} · code à 6 chiffres
              </p>
            </div>
          </div>
          <Toggle checked={twoFA} onChange={setTwoFA} />
        </div>
      </SectionShell>

      <SectionShell
        title="Sessions actives"
        subtitle="Les appareils connectés en ce moment à ton compte."
        footer={
          sessions.some((s) => !s.current) ? (
            <button
              type="button"
              onClick={disconnectOthers}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#EFEFF1] bg-white px-3 py-1.5 text-[11.5px] font-semibold text-[#0B0B0F] transition-colors hover:bg-[#F5F5F7]"
            >
              <LogOut className="h-3.5 w-3.5" strokeWidth={1.75} />
              Déconnecter toutes les autres sessions
            </button>
          ) : null
        }
      >
        <div className="flex flex-col divide-y divide-[#EFEFF1] rounded-[16px] border border-[#EFEFF1]">
          {sessions.map((s) => {
            const Icon = s.kind === "mobile" ? Smartphone : Monitor;
            return (
              <div
                key={s.id}
                className="flex items-center gap-3 p-3.5 first:rounded-t-[16px] last:rounded-b-[16px]"
              >
                <div className="grid h-9 w-9 place-items-center rounded-full bg-[#F5F5F7] text-[#0B0B0F]">
                  <Icon className="h-4 w-4" strokeWidth={1.75} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="truncate text-[13px] font-semibold text-[#0B0B0F]">
                      {s.device}
                    </p>
                    {s.current ? <Pill tone="lime">Cet appareil</Pill> : null}
                  </div>
                  <p className="text-[11px] text-[#6E7178]">
                    {s.where} · {s.last}
                  </p>
                </div>
                {!s.current ? (
                  <button
                    type="button"
                    onClick={() => disconnect(s.id)}
                    className="text-[11px] font-semibold text-[#DC2626] transition-colors hover:underline"
                  >
                    Déconnecter
                  </button>
                ) : null}
              </div>
            );
          })}
        </div>
      </SectionShell>
    </div>
  );
}

/* ================================================================
   5) Retraits (payout settings)
   ================================================================ */

/**
 * Still on mocks, deliberately. `mockPayoutSettings.defaultMethodId` is
 * "iban-1" while the only method ids that exist are "pmt-1" and "pmt-2", and
 * the bank rails depend on the unresolved currency question in 00-CONTEXT.
 * Nothing here is wired; the save control says so rather than faking success.
 */
function PayoutSection() {
  const [threshold, setThreshold] = useState(mockPayoutSettings.monthlyThreshold);
  const [autoEnabled, setAutoEnabled] = useState(
    mockPayoutSettings.autoPayoutEnabled,
  );

  return (
    <div className="flex flex-col gap-4">
      <SectionShell
        title="Moyen de retrait par défaut"
        subtitle="Modifie tes IBAN et méthodes bancaires depuis la page Revenus."
      >
        <div className="flex items-center justify-between gap-3 rounded-[16px] border border-[#EFEFF1] bg-[#FAFAFB] p-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-[12px] bg-[#0B0B0F] text-white">
              <Landmark className="h-4.5 w-4.5" strokeWidth={1.75} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="truncate text-[13px] font-semibold text-[#0B0B0F]">
                  {mockPayoutSettings.defaultMethodBank}
                </p>
                <Pill tone="lime">Par défaut</Pill>
              </div>
              <p className="truncate font-mono text-[11.5px] text-[#6E7178]">
                {mockPayoutSettings.defaultMethodMaskedIban}
              </p>
            </div>
          </div>
          <Link
            href="/teacher/earnings"
            className="inline-flex shrink-0 items-center gap-1 rounded-full border border-[#EFEFF1] bg-white px-3 py-1.5 text-[11.5px] font-semibold text-[#0B0B0F] transition-colors hover:bg-[#F5F5F7]"
          >
            Gérer les moyens de retrait
            <ChevronRight className="h-3.5 w-3.5" strokeWidth={1.75} />
          </Link>
        </div>
      </SectionShell>

      <SectionShell
        title="Auto-payout mensuel"
        subtitle="Déclenche un virement automatique dès que ton solde dépasse le seuil défini."
        footer={
          <ComingSoonButton
            message="Bientôt disponible"
            className="flex min-w-[96px] items-center justify-center gap-1.5 rounded-full bg-[#DFFF3F] px-3 py-1.5 text-[11.5px] font-semibold text-[#0B0B0F] transition-[filter] hover:brightness-[0.97]"
          >
            Enregistrer
          </ComingSoonButton>
        }
      >
        <div className="flex items-center justify-between rounded-[16px] border border-[#EFEFF1] bg-[#FAFAFB] p-4">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-full bg-white text-[#0B0B0F]">
              <Banknote className="h-4 w-4" strokeWidth={1.75} />
            </div>
            <div>
              <p className="text-[13px] font-semibold text-[#0B0B0F]">
                Virement automatique
              </p>
              <p className="text-[11.5px] text-[#6E7178]">
                {autoEnabled
                  ? "Activé — virements mensuels vers l'IBAN par défaut."
                  : "Désactivé — retrait manuel depuis /teacher/earnings."}
              </p>
            </div>
          </div>
          <Toggle checked={autoEnabled} onChange={setAutoEnabled} />
        </div>

        <div
          className={cn(
            "rounded-[16px] border p-4 transition-opacity",
            autoEnabled
              ? "border-[#EFEFF1] bg-white opacity-100"
              : "border-[#EFEFF1] bg-[#FAFAFB] opacity-60",
          )}
        >
          <div className="flex items-baseline justify-between">
            <label
              htmlFor="threshold"
              className="text-[10.5px] font-semibold uppercase tracking-[0.09em] text-[#8A8D93]"
            >
              Seuil de déclenchement
            </label>
            <span className="font-[family-name:var(--font-cabinet)] text-[20px] font-bold tabular-nums text-[#0B0B0F]">
              {threshold.toLocaleString("fr-FR")}
              <span className="ml-1 text-[12px] font-semibold text-[#8A8D93]">
                MAD
              </span>
            </span>
          </div>
          <input
            id="threshold"
            type="range"
            min={200}
            max={5000}
            step={50}
            value={threshold}
            disabled={!autoEnabled}
            onChange={(e) => setThreshold(Number(e.target.value))}
            className="mt-3 w-full accent-[#0B0B0F]"
          />
          <div className="mt-1 flex justify-between text-[10px] font-medium text-[#8A8D93]">
            <span>200 MAD</span>
            <span>5 000 MAD</span>
          </div>
        </div>
      </SectionShell>
    </div>
  );
}

/* ================================================================
   6) Notifications (link out)
   ================================================================ */

function NotificationsSection() {
  return (
    <SectionShell
      title="Notifications"
      subtitle="Canaux et fréquence gérés depuis une page dédiée."
    >
      <div className="flex items-center justify-between gap-3 rounded-[16px] border border-[#EFEFF1] bg-[#FAFAFB] p-4">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-[12px] bg-white text-[#0B0B0F]">
            <Bell className="h-4.5 w-4.5" strokeWidth={1.75} />
          </div>
          <div>
            <p className="text-[13px] font-semibold text-[#0B0B0F]">
              Préférences de notifications
            </p>
            <p className="text-[11.5px] text-[#6E7178]">
              Email · Push · SMS · Digest hebdomadaire
            </p>
          </div>
        </div>
        <Link
          href="/teacher/notifications/settings"
          className="inline-flex items-center gap-1 rounded-full border border-[#EFEFF1] bg-white px-3 py-1.5 text-[11.5px] font-semibold text-[#0B0B0F] transition-colors hover:bg-[#F5F5F7]"
        >
          Modifier
          <ChevronRight className="h-3.5 w-3.5" strokeWidth={1.75} />
        </Link>
      </div>
    </SectionShell>
  );
}

/* ================================================================
   7) Public preview
   ================================================================ */

function PublicPreviewSection({
  publicHref,
  profile,
  references,
}: SectionProps & {
  publicHref: string;
}) {
  const rate = formatMinorAmount(profile.hourlyRateMinor, profile.currency);
  // Chips display the reference name; the profile stores the slug.
  const subjectNames = namesForSlugs(references.subjects, profile.subjectSlugs);
  const levelNames = namesForSlugs(references.levels, profile.levelSlugs);

  return (
    <SectionShell
      title="Profil public"
      subtitle="Aperçu de ce que voient les élèves qui te découvrent."
    >
      <div className="relative overflow-hidden rounded-[20px] border border-[#EFEFF1] bg-white">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-full bg-[#0B0B0F] font-[family-name:var(--font-cabinet)] text-[24px] font-bold text-[#DFFF3F]">
              {profile.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.avatarUrl}
                  alt={profile.fullName}
                  className="h-full w-full object-cover"
                />
              ) : (
                profile.initials
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <h3 className="font-[family-name:var(--font-cabinet)] text-[22px] font-bold leading-[1.1] tracking-tight text-[#0B0B0F]">
                  {profile.fullName}
                </h3>
                <Pill tone="neutral">Vérifié</Pill>
              </div>
              {profile.tagline ? (
                <p className="mt-1.5 font-[family-name:var(--font-caveat)] text-[19px] font-semibold leading-tight text-[#0B0B0F]/80">
                  {profile.tagline}
                </p>
              ) : null}
              <div className="mt-2 flex items-center gap-1.5 text-[12px] text-[#6E7178]">
                <Star
                  className="h-3.5 w-3.5 fill-[#0B0B0F] text-[#0B0B0F]"
                  strokeWidth={0}
                />
                {/* Aggregates, not stored values. No reviews exist yet. */}
                <span className="font-semibold text-[#0B0B0F]">Nouveau</span>
                <span>·</span>
                <span className="tabular-nums">0 avis</span>
                {profile.city ? (
                  <>
                    <span>·</span>
                    <span>{profile.city}</span>
                  </>
                ) : null}
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-1.5">
            {subjectNames.map((s) => (
              <span
                key={s}
                className="rounded-full bg-[#0B0B0F] px-3 py-1.5 text-[11.5px] font-semibold text-white"
              >
                {s}
              </span>
            ))}
            {levelNames.map((l) => (
              <span
                key={l}
                className="rounded-full bg-[#F5F5F7] px-3 py-1.5 text-[11.5px] font-semibold text-[#0B0B0F]"
              >
                {l}
              </span>
            ))}
          </div>

          <p className="mt-4 line-clamp-3 text-[13px] leading-relaxed text-[#4A4D54]">
            {profile.bio || "Aucune présentation rédigée pour le moment."}
          </p>

          <div className="mt-5 flex items-center justify-between border-t border-[#EFEFF1] pt-4">
            <div>
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.09em] text-[#8A8D93]">
                À partir de
              </p>
              <p className="mt-0.5 font-[family-name:var(--font-cabinet)] text-[22px] font-bold leading-none tabular-nums text-[#0B0B0F]">
                {rate ? rate.amount : "—"}
                <span className="ml-1 text-[13px] font-semibold text-[#8A8D93]">
                  {rate ? `${rate.currency}/h` : "tarif à définir"}
                </span>
              </p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-[#DFFF3F] px-3 py-1.5 text-[11px] font-semibold text-[#0B0B0F]">
              <Sparkles className="h-3 w-3" strokeWidth={2.25} />
              Réponse &lt; 2h
            </span>
          </div>
        </div>
      </div>

      <a
        href={publicHref}
        target="_blank"
        rel="noreferrer"
        className="group flex items-center justify-between rounded-[16px] bg-[#0B0B0F] px-5 py-4 text-left text-white transition-transform hover:-translate-y-0.5"
      >
        <div>
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.09em] text-white/50">
            Vue élève
          </p>
          <p className="mt-0.5 font-[family-name:var(--font-cabinet)] text-[16px] font-bold leading-tight tracking-tight">
            Ouvrir mon profil public dans un nouvel onglet
          </p>
          <p className="mt-0.5 text-[11px] text-white/60">{publicHref}</p>
        </div>
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#DFFF3F] text-[#0B0B0F] transition-transform group-hover:rotate-45">
          <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
        </span>
      </a>
    </SectionShell>
  );
}

/* ================================================================
   8) Danger zone
   ================================================================ */

/**
 * Left exactly as it was, on purpose. Deactivation and deletion need a decided
 * answer for a teacher's past sessions, invoices and reviews, and none of
 * those are modelled yet. A delete button that half works is worse than one
 * that does nothing.
 */
function DangerSection() {
  return (
    <SectionShell
      title="Zone sensible"
      subtitle="Actions irréversibles ou à effet immédiat sur ton compte."
      danger
    >
      <div className="flex flex-col gap-2 rounded-[16px] border border-[#EFEFF1] bg-[#FAFAFB] p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[13px] font-semibold text-[#0B0B0F]">
              Désactiver mon compte
            </p>
            <p className="mt-0.5 text-[11.5px] text-[#6E7178]">
              Ton profil est masqué des recherches. Tes séances en cours
              continuent. Tu peux réactiver à tout moment.
            </p>
          </div>
          <button
            type="button"
            className="shrink-0 rounded-full border border-[#EFEFF1] bg-white px-3 py-1.5 text-[11.5px] font-semibold text-[#0B0B0F] transition-colors hover:bg-[#F5F5F7]"
          >
            Désactiver
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-2 rounded-[16px] border border-[#DC2626]/25 bg-[#FEF2F2] p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <ShieldAlert
              className="mt-0.5 h-4 w-4 shrink-0 text-[#DC2626]"
              strokeWidth={1.75}
            />
            <div>
              <p className="text-[13px] font-semibold text-[#0B0B0F]">
                Supprimer mon compte
              </p>
              <p className="mt-0.5 text-[11.5px] text-[#6E7178]">
                Tes annonces, avis, historique de paiement et messages seront
                supprimés définitivement sous 30 jours.
              </p>
            </div>
          </div>
          <button
            type="button"
            className="shrink-0 rounded-full border border-[#DC2626]/30 bg-white px-3 py-1.5 text-[11.5px] font-semibold text-[#DC2626] transition-colors hover:bg-[#FEE2E2]"
          >
            Supprimer
          </button>
        </div>
      </div>
    </SectionShell>
  );
}

/* ================================================================
   Utils
   ================================================================ */

function formatDob(iso: string | null): string {
  if (!iso) return "Non renseignée";
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return "Non renseignée";
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}
