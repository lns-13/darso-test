"use client";

import {
  Suspense,
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
  AlertTriangle,
  Bell,
  ChevronRight,
  CreditCard,
  KeyRound,
  LogOut,
  Mail,
  Monitor,
  Phone,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  User,
  UserCheck,
} from "lucide-react";
import { AppShell } from "@/components/app/app-shell";
import { PageHeader } from "@/components/app/page-header";
import { Pill } from "@/components/app/pill";
import { AuthField } from "@/components/auth/auth-field";
import { NavMenu, type NavMenuItem } from "@/components/library/nav-menu";
import { ImgRippleEffect } from "@/components/library/img-ripple-effect";
import { StatefulButton } from "@/components/library/stateful-button";
import { studentMobileTabs, studentNav } from "@/lib/nav";
import { useSubjects } from "@/lib/data/use-reference";
import { springSoft } from "@/lib/motion";
import { cn } from "@/lib/utils";

/* ---------------- MOCK: replace when API lands ---------------- */

const profile = {
  firstName: "Sara",
  lastName: "Bencheikh",
  fullName: "Sara Bencheikh",
  initials: "SB",
  email: "sara.bencheikh@example.com",
  phone: "+212 6 12 34 56 78",
  dob: "2008-05-14",
  bio: "Terminale S · Lycée Descartes · Casablanca. Objectif prépa scientifique.",
  // Slugs from the `subjects` reference table, not display names. "Maths" was
  // an abbreviation the mocks used on this page alone; the canonical row is
  // `mathematiques` / "Mathématiques".
  subjectsOfInterest: ["mathematiques", "physique-chimie", "francais"],
  avatarUrl: null as string | null,
  level: "Terminale S · Lycée Descartes",
  age: computeAge("2008-05-14"),
};

const languagePrefs = {
  current: "fr" as "fr" | "ar" | "en",
  available: [
    { code: "fr" as const, label: "Français" },
    { code: "ar" as const, label: "العربية" },
    { code: "en" as const, label: "English" },
  ],
};

const guardian = {
  name: "Nadia Bencheikh",
  email: "nadia.b@example.com",
};

const MOCK_SESSIONS = [
  {
    id: "s1",
    device: "Chrome sur Windows",
    where: "Casablanca · MA",
    last: "Actif maintenant",
    current: true,
    icon: Monitor,
  },
  {
    id: "s2",
    device: "iPhone · Safari",
    where: "Rabat · MA",
    last: "Il y a 3 jours",
    current: false,
    icon: Smartphone,
  },
];

/* ---------------- Section ids & url sync ---------------- */

type SectionId =
  | "profile"
  | "account"
  | "security"
  | "payment"
  | "notifications"
  | "parental"
  | "danger";

const SECTIONS: {
  id: SectionId;
  label: string;
  icon: NavMenuItem["icon"];
  guarded?: boolean; // hidden when age >= 18
}[] = [
  { id: "profile", label: "Profil", icon: User },
  { id: "account", label: "Compte", icon: Mail },
  { id: "security", label: "Sécurité", icon: ShieldCheck },
  { id: "payment", label: "Paiement", icon: CreditCard },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "parental", label: "Parental", icon: UserCheck, guarded: true },
  { id: "danger", label: "Zone sensible", icon: AlertTriangle },
];

function isSectionId(v: string | null): v is SectionId {
  return (
    v === "profile" ||
    v === "account" ||
    v === "security" ||
    v === "payment" ||
    v === "notifications" ||
    v === "parental" ||
    v === "danger"
  );
}

/* ================================================================
   Page
   ================================================================ */

export default function StudentProfilePage() {
  return (
    <Suspense fallback={null}>
      <ProfileInner />
    </Suspense>
  );
}

function ProfileInner() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const initialSection: SectionId = (() => {
    const s = searchParams.get("section");
    return isSectionId(s) ? s : "profile";
  })();
  const [section, setSection] = useState<SectionId>(initialSection);

  const showParental = profile.age < 18;
  const items = useMemo<NavMenuItem[]>(
    () =>
      SECTIONS.filter((s) => !s.guarded || showParental).map((s) => ({
        id: s.id,
        label: s.label,
        icon: s.icon,
      })),
    [showParental],
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

  // Guard: if URL has ?section=parental but user is 18+, snap back.
  useEffect(() => {
    if (section === "parental" && !showParental) {
      setSectionAndUrl("profile");
    }
  }, [section, showParental, setSectionAndUrl]);

  const desktop = (
    <div className="p-6">
      <PageHeader
        eyebrow={
          <>
            <span>Compte</span>
            <span className="h-1 w-1 rounded-full bg-[#D5D7DB]" />
            <span className="font-medium text-[#0B0B0F]">{profile.fullName}</span>
          </>
        }
        title="Profil & préférences"
        subline="Gère tes infos personnelles, ta sécurité, tes paiements et tes préférences."
      />

      <div className="mt-6 grid grid-cols-[240px_1fr] gap-6">
        <aside className="sticky top-6 self-start">
          <div className="rounded-[20px] bg-white p-2 shadow-[0_1px_2px_rgba(10,11,20,0.04)]">
            <NavMenu
              items={items}
              activeId={section}
              onChange={setSectionAndUrl}
              variant="vertical"
              layoutIdSuffix="profile-desktop"
            />
          </div>
          <p className="mt-3 px-3 text-[10.5px] leading-relaxed text-[#8A8D93]">
            Modifications sauvegardées section par section. Aucune action
            n&apos;est appliquée avant de cliquer sur « Enregistrer ».
          </p>
        </aside>

        <div className="min-w-0">
          <SectionSwitcher section={section} />
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
          layoutIdSuffix="profile-mobile"
        />
      </div>
      <div className="mt-3 px-4">
        <SectionSwitcher section={section} />
      </div>
      <div className="h-6" />
    </div>
  );

  return (
    <AppShell
      nav={studentNav}
      mobileTabs={studentMobileTabs}
      user={{
        fullName: profile.fullName,
        level: profile.level,
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
   Section switcher with animated transitions
   ================================================================ */

function SectionSwitcher({ section }: { section: SectionId }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={section}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={springSoft}
      >
        {section === "profile" ? <ProfileSection /> : null}
        {section === "account" ? <AccountSection /> : null}
        {section === "security" ? <SecuritySection /> : null}
        {section === "payment" ? <PaymentSection /> : null}
        {section === "notifications" ? <NotificationsSection /> : null}
        {section === "parental" ? <ParentalSection /> : null}
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

function SaveButton({ label = "Enregistrer" }: { label?: string }) {
  return (
    <StatefulButton
      onClick={async () => {
        await new Promise((r) => setTimeout(r, 650));
      }}
    >
      {label}
    </StatefulButton>
  );
}

/* ================================================================
   1) Profil
   ================================================================ */

function ProfileSection() {
  const [fullName, setFullName] = useState(profile.fullName);
  const [bio, setBio] = useState(profile.bio);
  const [subjects, setSubjects] = useState<string[]>(profile.subjectsOfInterest);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  // The eleven rows of the `subjects` table, read from the database. Readable
  // signed out, so this renders for an anonymous visitor too.
  const availableSubjects = useSubjects();

  const toggleSubject = (s: string) =>
    setSubjects((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s],
    );

  return (
    <SectionShell
      title="Profil"
      subtitle="Visible par les profs quand tu candidates ou publies une annonce."
      footer={<SaveButton />}
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
            PNG ou JPG, 1&nbsp;Mo max. Un vrai portrait rassure les profs et
            augmente tes chances d&apos;être choisi.
          </p>
          {avatarFile ? (
            <p className="mt-2 text-[11px] text-[#0B0B0F]">
              Prêt à uploader :{" "}
              <span className="font-semibold">{avatarFile.name}</span>
            </p>
          ) : null}
        </div>
      </div>

      {/*
        The "Nom d'utilisateur" field that sat beside this one has been removed.
        It edited a value with no backing column: `username` exists only on
        `teacher_profiles`, where it is the /teacher/preview/[username] route
        parameter. Students have no public profile page and therefore no handle.

        The alternative was to move `username` onto `profiles` so both roles
        share it. That is a real option, but not now: Task 04 is concurrently
        building the public teacher profile on `teacher_profiles.username`, and
        `teacher_public_profiles` selects it, so relocating the column mid-flight
        would break both. If students ever get public pages, the migration is
        additive and can happen then.

        The grid keeps two columns so "Nom complet" holds its existing width.
      */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <AuthField
          label="Nom complet"
          value={fullName}
          onValueChange={setFullName}
          autoComplete="name"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-[10.5px] font-semibold uppercase tracking-[0.09em] text-[#8A8D93]">
          Bio
        </label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={4}
          className="w-full resize-none rounded-[14px] border border-[#EFEFF1] bg-white px-3.5 py-2.5 text-[13.5px] text-[#0B0B0F] outline-none transition placeholder:text-[#B0B3B8] hover:border-[#B0B3B8] focus:border-[#0B0B0F] focus:shadow-[0_0_0_3px_rgba(11,11,15,0.06)]"
          placeholder="Décris-toi en quelques lignes."
        />
        <p className="mt-1 pl-1 text-[10.5px] text-[#8A8D93]">
          {bio.length} / 240 caractères
        </p>
      </div>

      <div>
        <label className="mb-2 block text-[10.5px] font-semibold uppercase tracking-[0.09em] text-[#8A8D93]">
          Matières qui m&apos;intéressent
        </label>
        <div className="flex flex-wrap gap-1.5">
          {availableSubjects.entries.map((s) => {
            const active = subjects.includes(s.slug);
            return (
              <button
                key={s.slug}
                type="button"
                onClick={() => toggleSubject(s.slug)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-[11.5px] font-semibold transition-colors",
                  active
                    ? "bg-[#0B0B0F] text-white"
                    : "bg-[#F5F5F7] text-[#0B0B0F] hover:bg-[#EFEFF1]",
                )}
              >
                {s.name}
              </button>
            );
          })}
        </div>
        {availableSubjects.loading ? (
          <p className="mt-2 pl-1 text-[10.5px] text-[#8A8D93]">
            Chargement des matières…
          </p>
        ) : null}
        {availableSubjects.error ? (
          <p className="mt-2 pl-1 text-[10.5px] text-[#DC2626]">
            Impossible de charger la liste des matières.
          </p>
        ) : null}
      </div>
    </SectionShell>
  );
}

/* ================================================================
   2) Compte
   ================================================================ */

function AccountSection() {
  const [phone, setPhone] = useState(profile.phone);
  const [dob, setDob] = useState(profile.dob);
  const [lang, setLang] = useState<typeof languagePrefs.current>(
    languagePrefs.current,
  );

  return (
    <SectionShell
      title="Compte"
      subtitle="Coordonnées, date de naissance et langue de l'interface."
      footer={<SaveButton />}
    >
      <div>
        <label className="mb-1.5 block text-[10.5px] font-semibold uppercase tracking-[0.09em] text-[#8A8D93]">
          Email
        </label>
        <div className="flex items-center gap-2 rounded-[14px] border border-[#EFEFF1] bg-[#FAFAFB] px-3.5 py-2.5">
          <Mail className="h-4 w-4 text-[#8A8D93]" strokeWidth={1.75} />
          <span className="min-w-0 flex-1 truncate text-[13.5px] text-[#0B0B0F]">
            {profile.email}
          </span>
          <Pill tone="neutral">Vérifié</Pill>
          <button
            type="button"
            className="rounded-full border border-[#EFEFF1] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#0B0B0F] transition-colors hover:bg-[#F5F5F7]"
          >
            Changer
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <AuthField
          label="Téléphone"
          value={phone}
          onValueChange={setPhone}
          inputMode="tel"
          autoComplete="tel"
          trailing={<Phone className="mr-1 h-3.5 w-3.5 text-[#8A8D93]" strokeWidth={1.75} />}
        />
        <div>
          <label className="mb-1.5 block text-[10.5px] font-semibold uppercase tracking-[0.09em] text-[#8A8D93]">
            Date de naissance
          </label>
          <input
            type="date"
            value={dob}
            onChange={(e) => setDob(e.target.value)}
            className="h-[42px] w-full rounded-[14px] border border-[#EFEFF1] bg-white px-3.5 text-[13.5px] text-[#0B0B0F] outline-none transition hover:border-[#B0B3B8] focus:border-[#0B0B0F] focus:shadow-[0_0_0_3px_rgba(11,11,15,0.06)]"
          />
        </div>
      </div>

      <div>
        <label className="mb-2 block text-[10.5px] font-semibold uppercase tracking-[0.09em] text-[#8A8D93]">
          Langue de l&apos;interface
        </label>
        <div className="flex flex-wrap gap-1.5">
          {languagePrefs.available.map((l) => {
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
    </SectionShell>
  );
}

/* ================================================================
   3) Sécurité
   ================================================================ */

function SecuritySection() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [twoFA, setTwoFA] = useState(false);
  const [sessions, setSessions] = useState(MOCK_SESSIONS);

  const disconnect = (id: string) =>
    setSessions((prev) => prev.filter((s) => s.id !== id));
  const disconnectOthers = () =>
    setSessions((prev) => prev.filter((s) => s.current));

  return (
    <div className="flex flex-col gap-4">
      <SectionShell
        title="Changer le mot de passe"
        subtitle="Choisis un mot de passe robuste que tu n'utilises pas ailleurs."
        footer={<SaveButton label="Mettre à jour" />}
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
        subtitle="Ajoute une couche de sécurité via une application d'authentification."
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
            const Icon = s.icon;
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

/* ================================================================
   4) Paiement
   ================================================================ */

function PaymentSection() {
  const [invoiceEmail, setInvoiceEmail] = useState(profile.email);
  const [currency, setCurrency] = useState<"MAD" | "EUR" | "USD">("MAD");

  return (
    <SectionShell
      title="Paiement"
      subtitle="Moyen de paiement par défaut, facturation et devise."
      footer={<SaveButton />}
    >
      <div className="flex items-center justify-between gap-3 rounded-[16px] border border-[#EFEFF1] bg-[#FAFAFB] p-4">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-[12px] bg-[#0B0B0F] text-white">
            <CreditCard className="h-4.5 w-4.5" strokeWidth={1.75} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-[13px] font-semibold text-[#0B0B0F]">
                Visa se terminant par 4242
              </p>
              <Pill tone="lime">Par défaut</Pill>
            </div>
            <p className="text-[11.5px] text-[#6E7178]">Expire 08/2029</p>
          </div>
        </div>
        <Link
          href="/student/payments"
          className="flex items-center gap-1 rounded-full border border-[#EFEFF1] bg-white px-3 py-1.5 text-[11.5px] font-semibold text-[#0B0B0F] transition-colors hover:bg-[#F5F5F7]"
        >
          Gérer
          <ChevronRight className="h-3.5 w-3.5" strokeWidth={1.75} />
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <AuthField
          label="Email de facturation"
          value={invoiceEmail}
          onValueChange={setInvoiceEmail}
          inputMode="email"
          autoComplete="email"
        />
        <div>
          <label className="mb-1.5 block text-[10.5px] font-semibold uppercase tracking-[0.09em] text-[#8A8D93]">
            Devise
          </label>
          <div className="flex gap-1.5">
            {(["MAD", "EUR", "USD"] as const).map((c) => {
              const active = c === currency;
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCurrency(c)}
                  className={cn(
                    "flex-1 rounded-[14px] px-3 py-2.5 text-[12px] font-semibold transition-colors",
                    active
                      ? "bg-[#0B0B0F] text-white"
                      : "bg-[#F5F5F7] text-[#0B0B0F] hover:bg-[#EFEFF1]",
                  )}
                >
                  {c}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </SectionShell>
  );
}

/* ================================================================
   5) Notifications (link out)
   ================================================================ */

function NotificationsSection() {
  return (
    <SectionShell
      title="Notifications"
      subtitle="Fréquence et canaux gérés depuis une page dédiée."
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
              Email · Push · SMS · Résumé quotidien
            </p>
          </div>
        </div>
        <Link
          href="/student/notifications/settings"
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
   6) Parental (only if age < 18)
   ================================================================ */

function ParentalSection() {
  const [gName, setGName] = useState(guardian.name);
  const [gEmail, setGEmail] = useState(guardian.email);

  return (
    <SectionShell
      title="Lien parental"
      subtitle="Ton parent ou tuteur reçoit un résumé mensuel de tes séances."
      footer={
        <>
          <button
            type="button"
            className="rounded-full border border-[#EFEFF1] bg-white px-3 py-1.5 text-[11.5px] font-semibold text-[#0B0B0F] transition-colors hover:bg-[#F5F5F7]"
          >
            Envoyer un rappel
          </button>
          <SaveButton />
        </>
      }
    >
      <div className="rounded-[16px] border border-[#EFEFF1] bg-[#FAFAFB] p-4 text-[11.5px] leading-relaxed text-[#6E7178]">
        <p className="font-semibold text-[#0B0B0F]">
          Tu as {profile.age} ans — un accord parental est requis pour valider
          les paiements &gt; 500 MAD.
        </p>
        <p className="mt-1">
          On envoie un email de confirmation à ton tuteur à chaque nouvelle
          réservation.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <AuthField label="Nom du tuteur" value={gName} onValueChange={setGName} />
        <AuthField
          label="Email du tuteur"
          value={gEmail}
          onValueChange={setGEmail}
          inputMode="email"
          autoComplete="email"
        />
      </div>
    </SectionShell>
  );
}

/* ================================================================
   7) Danger zone
   ================================================================ */

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
              Ton profil est masqué. Tu peux te reconnecter à tout moment pour
              le réactiver.
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
   utils
   ================================================================ */

function computeAge(iso: string): number {
  const d = new Date(iso);
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age -= 1;
  return age;
}

