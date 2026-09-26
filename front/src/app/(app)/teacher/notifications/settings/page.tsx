"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import {
  Bell,
  ChevronLeft,
  Inbox,
  RotateCcw,
  Sparkles,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { AppShell } from "@/components/app/app-shell";
import { PageHeader } from "@/components/app/page-header";
import { Card } from "@/components/app/card";
import { Eyebrow } from "@/components/app/eyebrow";
import { teacherMobileTabs, teacherNav } from "@/lib/nav";
import { springTight } from "@/lib/motion";
import { cn } from "@/lib/utils";
import {
  mockTeacherNotificationSettings,
  type TeacherPrefCategory,
  type TeacherPrefChannel,
  type TeacherPrefRow,
} from "@/lib/mock/teacher-notifications";
import { mockTeacher } from "@/lib/mock/teacher";

/* ---------------- Category meta ---------------- */

const categoryMeta: Record<
  TeacherPrefCategory,
  { label: string; body: string; icon: LucideIcon; chipTone: string }
> = {
  session: {
    label: "Demandes",
    body: "Candidatures d'élèves & demandes qui matchent ta spécialité.",
    icon: Inbox,
    chipTone: "bg-[#DFFF3F] text-[#0B0B0F]",
  },
  payment: {
    label: "Paiements",
    body: "Paiements reçus, virements et alertes IBAN.",
    icon: Wallet,
    chipTone: "bg-[#F5F5F7] text-[#0B0B0F]",
  },
  reminder: {
    label: "Séances",
    body: "Rappels, changements et avis reçus.",
    icon: Bell,
    chipTone: "bg-[#E9EAF0] text-[#0B0B0F]",
  },
  marketing: {
    label: "Marketing",
    body: "Conseils, nouveautés et parrainage — désactivable.",
    icon: Sparkles,
    chipTone: "bg-[#0B0B0F] text-[#DFFF3F]",
  },
};

const categoryOrder: TeacherPrefCategory[] = [
  "session",
  "payment",
  "reminder",
  "marketing",
];
const channelOrder: TeacherPrefChannel[] = ["email", "push", "sms"];
const channelLabels: Record<TeacherPrefChannel, string> = {
  email: "Email",
  push: "Push",
  sms: "SMS",
};

/* ---------------- Page ---------------- */

export default function TeacherNotificationsSettingsPage() {
  const [settings, setSettings] = useState<TeacherPrefRow[]>(
    mockTeacherNotificationSettings,
  );

  const grouped = useMemo(() => {
    const out: Record<TeacherPrefCategory, TeacherPrefRow[]> = {
      session: [],
      payment: [],
      reminder: [],
      marketing: [],
    };
    for (const s of settings) out[s.category].push(s);
    return out;
  }, [settings]);

  const toggle = useCallback((id: string, channel: TeacherPrefChannel) => {
    setSettings((prev) =>
      prev.map((row) =>
        row.id === id
          ? { ...row, channels: { ...row.channels, [channel]: !row.channels[channel] } }
          : row,
      ),
    );
  }, []);

  const resetDefaults = useCallback(() => {
    setSettings(
      mockTeacherNotificationSettings.map((r) => ({
        ...r,
        channels: { ...r.channels },
      })),
    );
  }, []);

  const body = (
    <div className="space-y-5">
      {categoryOrder.map((key) => {
        const meta = categoryMeta[key];
        const rows = grouped[key];
        const Icon = meta.icon;
        return (
          <Card key={key} padding="p-0" className="overflow-hidden ring-1 ring-[#EFEFF1]">
            <div className="flex items-start gap-3 px-4 pb-3 pt-4">
              <div
                className={cn(
                  "grid h-9 w-9 shrink-0 place-items-center rounded-full",
                  meta.chipTone,
                )}
              >
                <Icon className="h-4 w-4" strokeWidth={1.75} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-[family-name:var(--font-cabinet)] text-[15px] font-bold tracking-tight text-[#0B0B0F]">
                  {meta.label}
                </p>
                <p className="mt-0.5 text-[11.5px] text-[#8A8D93]">{meta.body}</p>
              </div>
              <div className="hidden shrink-0 items-center gap-1.5 pl-2 sm:flex">
                {channelOrder.map((c) => (
                  <span
                    key={c}
                    className="w-14 text-center text-[9.5px] font-semibold uppercase tracking-[0.09em] text-[#8A8D93]"
                  >
                    {channelLabels[c]}
                  </span>
                ))}
              </div>
            </div>
            <div>
              {rows.map((row, idx) => (
                <PrefRowItem
                  key={row.id}
                  row={row}
                  onToggle={toggle}
                  isLast={idx === rows.length - 1}
                />
              ))}
            </div>
          </Card>
        );
      })}

      <div className="pt-1">
        <button
          type="button"
          onClick={resetDefaults}
          className="inline-flex items-center gap-1.5 rounded-full border border-[#EFEFF1] bg-white px-3.5 py-2 text-[12px] font-semibold text-[#0B0B0F] transition-colors hover:bg-[#F5F5F7]"
        >
          <RotateCcw className="h-3.5 w-3.5" strokeWidth={1.75} />
          Notifications par défaut
        </button>
      </div>
    </div>
  );

  /* ---------- DESKTOP ---------- */
  const desktop = (
    <div className="mx-auto w-full max-w-[760px] px-6 py-6">
      <div className="mb-1">
        <Link
          href="/teacher/notifications"
          className="inline-flex h-8 items-center gap-1 rounded-full pl-1 pr-2.5 text-[12px] font-medium text-[#6E7178] transition-colors hover:bg-[#F5F5F7] hover:text-[#0B0B0F]"
        >
          <ChevronLeft className="h-3.5 w-3.5" strokeWidth={2} />
          Notifications
        </Link>
      </div>
      <PageHeader
        eyebrow={
          <>
            <span>Compte</span>
            <span className="h-1 w-1 rounded-full bg-[#D5D7DB]" />
            <span className="font-medium text-[#0B0B0F]">Préférences</span>
          </>
        }
        title="Préférences de notifications"
        subline="Choisis comment et quand Darso te contacte — par catégorie et par canal."
      />
      <div className="mt-6">{body}</div>
    </div>
  );

  /* ---------- MOBILE ---------- */
  const mobile = (
    <div className="px-4 pb-6 pt-3">
      <div className="mb-2">
        <Link
          href="/teacher/notifications"
          className="inline-flex h-8 items-center gap-1 rounded-full bg-white pl-1 pr-2.5 text-[12px] font-medium text-[#0B0B0F] shadow-[0_1px_2px_rgba(10,11,20,0.04)]"
        >
          <ChevronLeft className="h-3.5 w-3.5" strokeWidth={2} />
          Retour
        </Link>
      </div>
      <div className="mt-1 mb-4">
        <Eyebrow>Compte · Préférences</Eyebrow>
        <h1 className="mt-1 font-[family-name:var(--font-cabinet)] text-[26px] font-bold leading-[1.05] tracking-[-0.02em] text-[#0B0B0F]">
          Préférences de notifications
        </h1>
        <p className="mt-1 text-[12.5px] text-[#6E7178]">
          Choisis comment et quand Darso te contacte.
        </p>
      </div>
      {body}
    </div>
  );

  return (
    <AppShell
      nav={teacherNav}
      mobileTabs={teacherMobileTabs}
      user={{
        fullName: mockTeacher.fullName,
        level: mockTeacher.level,
        initials: mockTeacher.initials,
      }}
      desktopMain={desktop}
      mobileHeader={{
        title: "Préférences",
        subtitle: "Notifications par canal",
      }}
      mobileChildren={mobile}
    />
  );
}

/* ---------------- Row + toggle ---------------- */

function PrefRowItem({
  row,
  onToggle,
  isLast,
}: {
  row: TeacherPrefRow;
  onToggle: (id: string, c: TeacherPrefChannel) => void;
  isLast: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:gap-4",
        !isLast && "border-b border-[#EFEFF1]",
      )}
    >
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-semibold text-[#0B0B0F]">{row.title}</p>
        <p className="mt-0.5 text-[11.5px] leading-snug text-[#8A8D93]">{row.body}</p>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        {channelOrder.map((c) => (
          <ChannelToggle
            key={c}
            label={channelLabels[c]}
            on={row.channels[c]}
            onClick={() => onToggle(row.id, c)}
          />
        ))}
      </div>
    </div>
  );
}

function ChannelToggle({
  label,
  on,
  onClick,
}: {
  label: string;
  on: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.94 }}
      transition={springTight}
      aria-pressed={on}
      className={cn(
        "relative inline-flex h-8 min-w-14 items-center justify-center rounded-full px-3 text-[10.5px] font-semibold uppercase tracking-[0.06em] transition-colors",
        on
          ? "bg-[#DFFF3F] text-[#0B0B0F] ring-1 ring-[#C9E82F]"
          : "bg-[#EFEFF1] text-[#8A8D93] ring-1 ring-transparent hover:bg-[#E4E5E8]",
      )}
    >
      <motion.span
        key={on ? "on" : "off"}
        initial={{ opacity: 0.6, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={springTight}
        className="relative z-10"
      >
        {label}
      </motion.span>
    </motion.button>
  );
}
