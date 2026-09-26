"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowUpRight,
  Building2,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Landmark,
  Plus,
  ReceiptText,
  ShieldCheck,
  Wallet,
  XCircle,
} from "lucide-react";
import { AppShell } from "@/components/app/app-shell";
import { PageHeader } from "@/components/app/page-header";
import { SectionHeader } from "@/components/app/section-header";
import { TabSwitcher } from "@/components/app/tab-switcher";
import { StatCard } from "@/components/app/stat-card";
import { DataTable, type DataTableColumn } from "@/components/app/data-table";
import { InvoiceModal, type InvoiceData } from "@/components/app/invoice-modal";
import { DonutChart } from "@/components/app/donut-chart";
import { WithdrawModal } from "@/components/app/withdraw-modal";
import { teacherMobileTabs, teacherNav } from "@/lib/nav";
import { mockTeacher } from "@/lib/mock/teacher";
import {
  mockEarnings,
  mockPayoutMethods,
  mockPayoutRequests,
  mockRevenueBySubject,
  mockTeacherInvoices,
  mockTeacherTransactions,
  type PayoutRequest,
  type TeacherInvoice,
  type TeacherTransaction,
} from "@/lib/mock/teacher-earnings";
import { cn } from "@/lib/utils";

/* ---------------- Tabs ---------------- */

type TabKey = "transactions" | "invoices" | "payouts";

const TAB_META: { key: TabKey; label: string }[] = [
  { key: "transactions", label: "Transactions" },
  { key: "invoices", label: "Factures" },
  { key: "payouts", label: "Retraits" },
];

function parseTabParam(v: string | null): TabKey {
  if (v === "invoices" || v === "payouts" || v === "transactions") return v;
  return "transactions";
}

/* ---------------- Page ---------------- */

export default function TeacherEarningsPage() {
  return (
    <Suspense fallback={null}>
      <EarningsInner />
    </Suspense>
  );
}

function EarningsInner() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const initialTab = parseTabParam(searchParams.get("tab"));
  const [tab, setTab] = useState<TabKey>(initialTab);

  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null);
  const [invoiceMode, setInvoiceMode] = useState<{
    eyebrow?: string;
    title?: string;
    readOnly?: boolean;
  }>({});
  const [withdrawOpen, setWithdrawOpen] = useState(false);

  useEffect(() => {
    const p = new URLSearchParams(Array.from(searchParams.entries()));
    p.set("tab", tab);
    const qs = p.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const openTransactionInvoice = (tx: TeacherTransaction) => {
    setInvoiceData({
      number: `FT-${tx.id.replace("TC-", "")}`,
      issuedAt: `${tx.dateLabel} 2026`,
      status: mapTxStatus(tx.status),
      billTo: {
        name: "darso SAS · Espace Prof",
        address: "Casablanca Finance City\n20250 Casablanca",
        email: "compta@darso.ma",
      },
      items: [
        {
          id: "l1",
          label: tx.sessionTitle,
          detail: `Élève : ${tx.student} · ${tx.subject}\nBrut : ${tx.gross} MAD · Commission plateforme : ${tx.fee} MAD`,
          qty: 1,
          unit: tx.net / 1.2,
        },
      ],
      footer:
        "Rémunération nette après commission plateforme (15%). Encaissée sur ton solde disponible.",
    });
    setInvoiceMode({});
    setInvoiceOpen(true);
  };

  const openInvoice = (row: TeacherInvoice) => {
    setInvoiceData(row.data);
    setInvoiceMode({});
    setInvoiceOpen(true);
  };

  const openPayoutDetail = (r: PayoutRequest) => {
    setInvoiceData({
      number: r.id,
      issuedAt: r.requestedAt,
      status:
        r.status === "versé"
          ? "payé"
          : r.status === "refusé"
            ? "échoué"
            : "en attente",
      billTo: {
        name: mockTeacher.fullName,
        email: "youssef.a@example.ma",
      },
      items: [
        {
          id: "l1",
          label: `Retrait vers ${r.method}`,
          detail: `Brut : ${r.amount} MAD · Frais : ${r.fee} MAD${r.processedAt ? `\nTraité le ${r.processedAt}` : ""}`,
          qty: 1,
          unit: r.net / 1.2,
        },
      ],
      footer:
        r.status === "refusé"
          ? "Retrait refusé — vérifie tes coordonnées bancaires ou contacte le support."
          : r.status === "versé"
            ? "Retrait versé sur ton compte bancaire. Le libellé peut mettre 24h à apparaître."
            : "Retrait en cours de traitement. Réception sous 48h ouvrées.",
    });
    setInvoiceMode({
      eyebrow: "Retrait",
      title: `Demande ${r.id}`,
      readOnly: true,
    });
    setInvoiceOpen(true);
  };

  const stats = (
    <>
      <StatCard
        label="Solde disponible"
        value={mockEarnings.available.toLocaleString("fr-FR")}
        unit="MAD"
        hint="Retrait possible à tout moment"
        tone="lime"
      />
      <StatCard
        label="Ce mois-ci"
        value={mockEarnings.month.toLocaleString("fr-FR")}
        unit="MAD"
        hint="Sept. 2026 · vs. 7 320 en août"
        trend={{ direction: "up", value: "+18%" }}
      />
      <StatCard
        label="Depuis janvier"
        value={mockEarnings.ytd.toLocaleString("fr-FR")}
        unit="MAD"
        hint="Année en cours · 218 séances"
      />
      <StatCard
        label="Retraits en attente"
        value={mockEarnings.pendingPayouts.toLocaleString("fr-FR")}
        unit="MAD"
        hint={`${mockPayoutRequests.filter((p) => p.status === "en cours").length} demande(s) en cours`}
        tone="muted"
      />
    </>
  );

  const withdrawCTA = (
    <button
      onClick={() => setWithdrawOpen(true)}
      className="flex h-9 items-center gap-1.5 rounded-full bg-[#0B0B0F] px-3.5 text-[12px] font-semibold text-white transition-colors hover:bg-[#1a1b21]"
    >
      <Wallet className="h-3.5 w-3.5" strokeWidth={2} />
      Demander un retrait
    </button>
  );

  return (
    <>
      <AppShell
        nav={teacherNav}
        mobileTabs={teacherMobileTabs}
        user={{
          fullName: mockTeacher.fullName,
          level: mockTeacher.level,
          initials: mockTeacher.initials,
        }}
        desktopMain={
          <DesktopMain
            tab={tab}
            onTabChange={setTab}
            stats={stats}
            onOpenTx={openTransactionInvoice}
            onOpenInvoice={openInvoice}
            onOpenPayout={openPayoutDetail}
            onOpenWithdraw={() => setWithdrawOpen(true)}
            withdrawCTA={withdrawCTA}
          />
        }
        mobileHeader={{
          title: "Revenus",
          subtitle: `${mockEarnings.available.toLocaleString("fr-FR")} MAD disponibles`,
          right: (
            <button
              onClick={() => setWithdrawOpen(true)}
              aria-label="Demander un retrait"
              className="grid h-9 w-9 place-items-center rounded-full bg-[#0B0B0F] text-white"
            >
              <Wallet className="h-4 w-4" strokeWidth={1.75} />
            </button>
          ),
        }}
        mobileChildren={
          <MobileBody
            tab={tab}
            onTabChange={setTab}
            stats={stats}
            onOpenTx={openTransactionInvoice}
            onOpenInvoice={openInvoice}
            onOpenPayout={openPayoutDetail}
            onOpenWithdraw={() => setWithdrawOpen(true)}
          />
        }
      />
      <InvoiceModal
        open={invoiceOpen}
        onClose={() => setInvoiceOpen(false)}
        invoice={invoiceData}
        eyebrow={invoiceMode.eyebrow}
        title={invoiceMode.title}
        readOnly={invoiceMode.readOnly}
        onDownload={() => {
          // eslint-disable-next-line no-console
          console.log("[InvoiceModal] download", invoiceData?.number);
        }}
      />
      <WithdrawModal
        open={withdrawOpen}
        onClose={() => setWithdrawOpen(false)}
        availableBalance={mockEarnings.available}
        methods={mockPayoutMethods.map((m) => ({
          id: m.id,
          label: m.label,
          bankName: m.bankName,
        }))}
        defaultMethodId={
          mockPayoutMethods.find((m) => m.isDefault)?.id ??
          mockPayoutMethods[0]?.id
        }
        onConfirm={(payload) => {
          // eslint-disable-next-line no-console
          console.log("[WithdrawModal] confirm", payload);
        }}
      />
    </>
  );
}

function mapTxStatus(s: TeacherTransaction["status"]): InvoiceData["status"] {
  if (s === "encaissé") return "payé";
  if (s === "en attente") return "en attente";
  if (s === "annulé") return "échoué";
  return "remboursé";
}

/* ================================================================
   DESKTOP
   ================================================================ */

function DesktopMain({
  tab,
  onTabChange,
  stats,
  onOpenTx,
  onOpenInvoice,
  onOpenPayout,
  onOpenWithdraw,
  withdrawCTA,
}: {
  tab: TabKey;
  onTabChange: (t: TabKey) => void;
  stats: React.ReactNode;
  onOpenTx: (tx: TeacherTransaction) => void;
  onOpenInvoice: (r: TeacherInvoice) => void;
  onOpenPayout: (r: PayoutRequest) => void;
  onOpenWithdraw: () => void;
  withdrawCTA: React.ReactNode;
}) {
  const totalRevenueYtd = useMemo(
    () => mockRevenueBySubject.reduce((s, x) => s + x.value, 0),
    [],
  );

  return (
    <div className="p-6">
      <PageHeader
        eyebrow={
          <>
            <span>Revenus</span>
            <span className="h-1 w-1 rounded-full bg-[#D5D7DB]" />
            <span className="font-medium text-[#0B0B0F]">
              {mockTeacherTransactions.length} transactions ·{" "}
              {mockPayoutRequests.length} retraits
            </span>
          </>
        }
        title="Revenus"
        subline="Suis tes gains, factures et demandes de retrait."
        actions={withdrawCTA}
      />

      <div className="mt-6 grid grid-cols-1 gap-3 min-[1080px]:grid-cols-4">
        {stats}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-5 min-[1180px]:grid-cols-[minmax(0,1fr)_320px]">
        <div>
          <div className="flex items-center justify-between gap-3">
            <TabSwitcher<TabKey>
              tabs={TAB_META.map((t) => ({ key: t.key, label: t.label }))}
              value={tab}
              onChange={onTabChange}
            />
            <p className="text-[11px] text-[#8A8D93]">
              {tab === "transactions"
                ? `${mockTeacherTransactions.length} entrées`
                : tab === "invoices"
                  ? `${mockTeacherInvoices.length} factures`
                  : `${mockPayoutRequests.length} demandes`}
            </p>
          </div>

          <div className="mt-4">
            {tab === "transactions" ? (
              <TransactionsTable
                rows={mockTeacherTransactions}
                onRowClick={onOpenTx}
              />
            ) : tab === "invoices" ? (
              <InvoicesTable
                rows={mockTeacherInvoices}
                onRowClick={onOpenInvoice}
              />
            ) : (
              <PayoutsTable
                rows={mockPayoutRequests}
                onRowClick={onOpenPayout}
              />
            )}
          </div>
        </div>

        <aside className="space-y-3">
          <div className="rounded-[20px] border border-[#EFEFF1] bg-white p-4 shadow-[0_1px_2px_rgba(10,11,20,0.04)]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#8A8D93]">
                  Revenus par matière
                </p>
                <p className="mt-0.5 text-[12.5px] font-semibold text-[#0B0B0F]">
                  Année en cours
                </p>
              </div>
              <span className="rounded-full bg-[#F5F5F7] px-1.5 py-0.5 text-[10px] font-semibold text-[#4A4D54]">
                YTD
              </span>
            </div>
            <div className="mt-3">
              <DonutChart
                data={mockRevenueBySubject}
                total={totalRevenueYtd}
                size={200}
                thickness={22}
              />
            </div>
          </div>
        </aside>
      </div>

      {/* Payout methods + next auto payout */}
      <div className="mt-6 grid grid-cols-1 gap-5 min-[1180px]:grid-cols-[minmax(0,1fr)_320px]">
        <section>
          <SectionHeader
            title="Moyens de retrait"
            subtitle={`${mockPayoutMethods.length} compte(s) enregistré(s)`}
          />
          <div className="mt-3 space-y-2">
            {mockPayoutMethods.map((m) => (
              <PayoutMethodCard key={m.id} method={m} />
            ))}
            <AddPayoutMethodButton />

          </div>
        </section>

        <aside className="space-y-3">
          <div className="rounded-[20px] border border-[#EFEFF1] bg-[#FAFAFB] p-4">
            <div className="flex items-start gap-2.5">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px] bg-white text-[#0B0B0F]">
                <CalendarClock className="h-4 w-4" strokeWidth={1.75} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#8A8D93]">
                  Prochain versement auto
                </p>
                <p className="mt-0.5 text-[13px] font-semibold text-[#0B0B0F]">
                  Vendredi 5 septembre
                </p>
                <p className="mt-1 text-[11px] leading-snug text-[#6E7178]">
                  Solde ≥ 500 MAD → virement automatique vers ton IBAN par défaut,
                  chaque vendredi matin.
                </p>
              </div>
            </div>
            <button
              onClick={onOpenWithdraw}
              className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-full bg-[#0B0B0F] py-2 text-[11.5px] font-semibold text-white"
            >
              Retirer maintenant
              <ArrowUpRight className="h-3 w-3" strokeWidth={2} />
            </button>
          </div>

          <div className="rounded-[20px] border border-[#EFEFF1] bg-white p-4">
            <div className="flex items-start gap-2.5">
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-[10px] bg-[#F5F5F7] text-[#0B0B0F]">
                <ShieldCheck className="h-4 w-4" strokeWidth={1.75} />
              </div>
              <div className="min-w-0">
                <p className="text-[12px] font-semibold text-[#0B0B0F]">
                  Versements sécurisés
                </p>
                <p className="mt-0.5 text-[11px] leading-snug text-[#6E7178]">
                  Traités par notre PSP agréé Bank Al-Maghrib. Zéro frais cachés,
                  frais fixes 2% plafonnés à 20 MAD.
                </p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

/* ================================================================
   TABLES
   ================================================================ */

function TxStatusPill({ status }: { status: TeacherTransaction["status"] }) {
  const tone =
    status === "encaissé"
      ? "bg-[#DFFF3F] text-[#0B0B0F]"
      : status === "en attente"
        ? "bg-[#F5F5F7] text-[#0B0B0F]"
        : status === "remboursé"
          ? "bg-white border border-[#EFEFF1] text-[#0B0B0F]"
          : "border border-[#0B0B0F] text-[#DC2626]";
  return (
    <span
      className={cn(
        "inline-flex h-5 items-center rounded-full px-1.5 text-[10px] font-semibold capitalize",
        tone,
      )}
    >
      {status}
    </span>
  );
}

function InvoiceStatusPill({ status }: { status: TeacherInvoice["status"] }) {
  const tone =
    status === "payée"
      ? "bg-[#DFFF3F] text-[#0B0B0F]"
      : status === "en attente"
        ? "bg-[#F5F5F7] text-[#0B0B0F]"
        : "border border-[#0B0B0F] text-[#DC2626]";
  return (
    <span
      className={cn(
        "inline-flex h-5 items-center rounded-full px-1.5 text-[10px] font-semibold capitalize",
        tone,
      )}
    >
      {status}
    </span>
  );
}

function PayoutStatusPill({ status }: { status: PayoutRequest["status"] }) {
  const tone =
    status === "versé"
      ? "bg-[#DFFF3F] text-[#0B0B0F]"
      : status === "en cours"
        ? "bg-[#F5F5F7] text-[#0B0B0F]"
        : "border border-[#0B0B0F] text-[#DC2626]";
  return (
    <span
      className={cn(
        "inline-flex h-5 items-center rounded-full px-1.5 text-[10px] font-semibold capitalize",
        tone,
      )}
    >
      {status}
    </span>
  );
}

function TransactionsTable({
  rows,
  onRowClick,
}: {
  rows: TeacherTransaction[];
  onRowClick: (r: TeacherTransaction) => void;
}) {
  const columns: DataTableColumn[] = [
    { key: "date", header: "Date", className: "w-[92px] text-[#6E7178]" },
    { key: "title", header: "Séance" },
    { key: "student", header: "Élève", className: "text-[#6E7178]" },
    { key: "status", header: "Statut" },
    { key: "net", header: "Net", align: "right", numeric: true },
  ];
  const tableRows = rows.map((t) => ({
    id: t.id,
    _raw: t,
    date: <span className="tabular-nums">{t.dateLabel}</span>,
    title: (
      <div className="min-w-0">
        <p className="truncate font-semibold text-[#0B0B0F]">{t.sessionTitle}</p>
        <p className="mt-0.5 truncate text-[10.5px] text-[#8A8D93]">
          {t.subject} · {t.id}
        </p>
      </div>
    ),
    student: <span className="truncate">{t.student}</span>,
    status: <TxStatusPill status={t.status} />,
    net: (
      <div className="text-right">
        <p className="font-bold tabular-nums text-[#0B0B0F]">
          {t.net.toLocaleString("fr-FR")} MAD
        </p>
        <p className="mt-0.5 text-[10px] text-[#8A8D93] tabular-nums">
          brut {t.gross.toLocaleString("fr-FR")} · frais {t.fee}
        </p>
      </div>
    ),
  }));
  return (
    <DataTable
      columns={columns}
      rows={tableRows}
      onRowClick={(r) =>
        onRowClick((r as { _raw: TeacherTransaction })._raw)
      }
    />
  );
}

function InvoicesTable({
  rows,
  onRowClick,
}: {
  rows: TeacherInvoice[];
  onRowClick: (r: TeacherInvoice) => void;
}) {
  const columns: DataTableColumn[] = [
    { key: "number", header: "N°", className: "w-[130px] text-[#6E7178]" },
    { key: "title", header: "Objet" },
    {
      key: "date",
      header: "Date",
      className: "text-[#6E7178]",
      numeric: true,
    },
    { key: "status", header: "Statut" },
    { key: "total", header: "Net", align: "right", numeric: true },
  ];
  const tableRows = rows.map((r) => ({
    id: r.id,
    _raw: r,
    number: (
      <span className="tabular-nums font-semibold text-[#0B0B0F]">
        {r.number}
      </span>
    ),
    title: (
      <div className="min-w-0">
        <p className="truncate font-semibold text-[#0B0B0F]">{r.title}</p>
        <p className="mt-0.5 truncate text-[10.5px] text-[#8A8D93]">
          Élève : {r.student}
        </p>
      </div>
    ),
    date: <span className="tabular-nums">{r.dateLabel}</span>,
    status: <InvoiceStatusPill status={r.status} />,
    total: (
      <span className="font-bold tabular-nums text-[#0B0B0F]">
        {r.total.toLocaleString("fr-FR")} MAD
      </span>
    ),
  }));
  return (
    <DataTable
      columns={columns}
      rows={tableRows}
      onRowClick={(r) => onRowClick((r as { _raw: TeacherInvoice })._raw)}
    />
  );
}

function PayoutsTable({
  rows,
  onRowClick,
}: {
  rows: PayoutRequest[];
  onRowClick: (r: PayoutRequest) => void;
}) {
  const columns: DataTableColumn[] = [
    { key: "ref", header: "Réf.", className: "w-[130px] text-[#6E7178]" },
    { key: "method", header: "Méthode" },
    {
      key: "date",
      header: "Demandé",
      className: "text-[#6E7178]",
      numeric: true,
    },
    { key: "status", header: "Statut" },
    { key: "amount", header: "Net", align: "right", numeric: true },
  ];
  const tableRows = rows.map((r) => ({
    id: r.id,
    _raw: r,
    ref: (
      <span className="tabular-nums font-semibold text-[#0B0B0F]">{r.id}</span>
    ),
    method: (
      <div className="min-w-0">
        <p className="truncate font-semibold text-[#0B0B0F]">{r.method}</p>
        <p className="mt-0.5 truncate text-[10.5px] text-[#8A8D93]">
          {r.processedAt
            ? `Traité le ${r.processedAt}`
            : "Traitement sous 48h ouvrées"}
        </p>
      </div>
    ),
    date: <span className="tabular-nums">{r.requestedAt}</span>,
    status: <PayoutStatusPill status={r.status} />,
    amount: (
      <div className="text-right">
        <p className="font-bold tabular-nums text-[#0B0B0F]">
          {r.net.toLocaleString("fr-FR")} MAD
        </p>
        <p className="mt-0.5 text-[10px] text-[#8A8D93] tabular-nums">
          brut {r.amount.toLocaleString("fr-FR")} · frais {r.fee}
        </p>
      </div>
    ),
  }));
  return (
    <DataTable
      columns={columns}
      rows={tableRows}
      onRowClick={(r) => onRowClick((r as { _raw: PayoutRequest })._raw)}
    />
  );
}

/* ================================================================
   Payout method (IBAN / CIH card)
   ================================================================ */

function PayoutMethodCard({
  method,
}: {
  method: (typeof mockPayoutMethods)[number];
}) {
  const Icon = method.kind === "iban" ? Landmark : Building2;
  return (
    <div className="flex items-center gap-3 rounded-[14px] border border-[#EFEFF1] bg-white px-3 py-2.5 transition-colors hover:border-[#D5D7DB]">
      <div
        className={cn(
          "grid h-10 w-14 shrink-0 place-items-center rounded-[10px] text-[10px] font-bold tracking-tight",
          method.kind === "iban"
            ? "border border-[#EFEFF1] bg-white text-[#0B0B0F]"
            : "bg-[#0B0B0F] text-[#DFFF3F]",
        )}
      >
        {method.kind === "iban" ? (
          <Icon className="h-4 w-4" strokeWidth={1.75} />
        ) : (
          <span>CIH</span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="text-[12.5px] font-semibold tabular-nums text-[#0B0B0F]">
            {method.kind === "iban" ? `IBAN •• ${method.last4}` : `•• ${method.last4}`}
          </p>
          {method.isDefault ? (
            <span className="inline-flex h-4 items-center rounded-full bg-[#DFFF3F] px-1.5 text-[9.5px] font-semibold text-[#0B0B0F]">
              Défaut
            </span>
          ) : null}
        </div>
        <p className="mt-0.5 truncate text-[10.5px] text-[#8A8D93]">
          {method.bankName} · {method.holder}
        </p>
      </div>
      <ManagePayoutMethodButton isDefault={!!method.isDefault} />
    </div>
  );
}

function ManagePayoutMethodButton({ isDefault }: { isDefault: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="rounded-full border border-[#EFEFF1] px-2.5 py-1 text-[10.5px] font-semibold text-[#0B0B0F] transition-colors hover:bg-[#F5F5F7]"
      >
        Gérer
      </button>
      {open ? (
        <div
          ref={ref}
          className="absolute right-0 top-8 z-40 w-40 overflow-hidden rounded-[12px] bg-white p-1 shadow-[0_10px_30px_rgba(11,11,15,0.14)] ring-1 ring-[#EFEFF1]"
        >
          {!isDefault ? (
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="block w-full rounded-[8px] px-2.5 py-1.5 text-left text-[12px] font-medium text-[#0B0B0F] transition-colors hover:bg-[#F5F5F7]"
            >
              Rendre par défaut
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="block w-full rounded-[8px] px-2.5 py-1.5 text-left text-[12px] font-medium text-[#0B0B0F] transition-colors hover:bg-[#F5F5F7]"
          >
            Modifier
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="block w-full rounded-[8px] px-2.5 py-1.5 text-left text-[12px] font-medium text-[#8A8D93] transition-colors hover:bg-[#F5F5F7] hover:text-[#0B0B0F]"
          >
            Supprimer
          </button>
        </div>
      ) : null}
    </div>
  );
}

function AddPayoutMethodButton() {
  const [pinged, setPinged] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        setPinged(true);
        window.setTimeout(() => setPinged(false), 1600);
      }}
      className={cn(
        "flex w-full items-center justify-center gap-2 rounded-[14px] border border-dashed border-[#D5D7DB] bg-white px-3.5 py-3 text-[12px] font-semibold text-[#0B0B0F] transition-colors hover:border-[#0B0B0F] hover:bg-[#F5F5F7]",
        pinged && "border-[#0B0B0F] bg-[#F5F5F7]",
      )}
    >
      {pinged ? (
        <>
          <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2} />
          Bientôt disponible
        </>
      ) : (
        <>
          <Plus className="h-3.5 w-3.5" strokeWidth={2} />
          Ajouter un IBAN
        </>
      )}
    </button>
  );
}

/* ================================================================
   MOBILE
   ================================================================ */

function MobileBody({
  tab,
  onTabChange,
  stats,
  onOpenTx,
  onOpenInvoice,
  onOpenPayout,
  onOpenWithdraw,
}: {
  tab: TabKey;
  onTabChange: (t: TabKey) => void;
  stats: React.ReactNode;
  onOpenTx: (tx: TeacherTransaction) => void;
  onOpenInvoice: (r: TeacherInvoice) => void;
  onOpenPayout: (r: PayoutRequest) => void;
  onOpenWithdraw: () => void;
}) {
  const [methodsOpen, setMethodsOpen] = useState(false);
  const totalRevenueYtd = useMemo(
    () => mockRevenueBySubject.reduce((s, x) => s + x.value, 0),
    [],
  );

  return (
    <div className="mt-2">
      {/* Stat strip */}
      <div className="scrollbar-none flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1">
        {stats &&
        Array.isArray(
          (stats as { props?: { children?: unknown } }).props?.children,
        )
          ? (
              stats as { props: { children: React.ReactNode[] } }
            ).props.children.map((child, i) => (
              <div
                key={i}
                className="min-w-[220px] snap-start [&>*]:h-full"
                style={{ scrollSnapAlign: "start" }}
              >
                {child}
              </div>
            ))
          : null}
      </div>

      {/* Donut card */}
      <div className="mt-4 px-4">
        <div className="rounded-[20px] border border-[#EFEFF1] bg-white p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#8A8D93]">
                Revenus par matière
              </p>
              <p className="mt-0.5 text-[12.5px] font-semibold text-[#0B0B0F]">
                Année en cours
              </p>
            </div>
            <button
              onClick={onOpenWithdraw}
              className="flex h-8 items-center gap-1.5 rounded-full bg-[#0B0B0F] px-3 text-[11px] font-semibold text-white"
            >
              <Wallet className="h-3 w-3" strokeWidth={2} />
              Retirer
            </button>
          </div>
          <div className="mt-3">
            <DonutChart
              data={mockRevenueBySubject}
              total={totalRevenueYtd}
              size={160}
              thickness={18}
            />
          </div>
        </div>
      </div>

      <div className="mt-4 px-4">
        <TabSwitcher<TabKey>
          tabs={TAB_META.map((t) => ({ key: t.key, label: t.label }))}
          value={tab}
          onChange={onTabChange}
          className="w-full"
        />
      </div>

      {/* Stacked list */}
      <div className="mt-3 space-y-2 px-4">
        {tab === "transactions"
          ? mockTeacherTransactions.map((t) => (
              <MobileTxRow
                key={t.id}
                tx={t}
                onClick={() => onOpenTx(t)}
              />
            ))
          : tab === "invoices"
            ? mockTeacherInvoices.map((r) => (
                <MobileInvoiceRow
                  key={r.id}
                  row={r}
                  onClick={() => onOpenInvoice(r)}
                />
              ))
            : mockPayoutRequests.map((r) => (
                <MobilePayoutRow
                  key={r.id}
                  payout={r}
                  onClick={() => onOpenPayout(r)}
                />
              ))}
      </div>

      {/* Payout methods collapsed */}
      <div className="mt-6 px-4">
        <button
          onClick={() => setMethodsOpen((v) => !v)}
          className="flex w-full items-center justify-between rounded-[14px] border border-[#EFEFF1] bg-white px-3.5 py-3 text-left"
        >
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#8A8D93]">
              Moyens de retrait
            </p>
            <p className="mt-0.5 text-[12.5px] font-semibold text-[#0B0B0F]">
              {mockPayoutMethods.length} compte
              {mockPayoutMethods.length > 1 ? "s" : ""} enregistré
              {mockPayoutMethods.length > 1 ? "s" : ""}
            </p>
          </div>
          <ChevronRight
            className={cn(
              "h-4 w-4 text-[#8A8D93] transition-transform",
              methodsOpen && "rotate-90",
            )}
            strokeWidth={1.75}
          />
        </button>
        {methodsOpen ? (
          <div className="mt-2 space-y-2">
            {mockPayoutMethods.map((m) => (
              <PayoutMethodCard key={m.id} method={m} />
            ))}
            <AddPayoutMethodButton />

          </div>
        ) : null}
      </div>

      <div className="h-6" />
    </div>
  );
}

function MobileTxRow({
  tx,
  onClick,
}: {
  tx: TeacherTransaction;
  onClick: () => void;
}) {
  const Icon =
    tx.status === "encaissé"
      ? CheckCircle2
      : tx.status === "en attente"
        ? Clock3
        : tx.status === "annulé"
          ? XCircle
          : ReceiptText;
  const iconClass =
    tx.status === "encaissé"
      ? "bg-[#DFFF3F] text-[#0B0B0F]"
      : tx.status === "annulé"
        ? "bg-white border border-[#EFEFF1] text-[#DC2626]"
        : "bg-[#F5F5F7] text-[#0B0B0F]";
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      className="flex cursor-pointer items-center gap-3 rounded-[16px] border border-[#EFEFF1] bg-white p-3 transition-colors hover:border-[#D5D7DB]"
    >
      <div
        className={cn(
          "grid h-10 w-10 shrink-0 place-items-center rounded-[12px]",
          iconClass,
        )}
      >
        <Icon className="h-4 w-4" strokeWidth={1.75} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-semibold text-[#0B0B0F]">
          {tx.sessionTitle}
        </p>
        <p className="mt-0.5 truncate text-[11px] text-[#8A8D93] tabular-nums">
          {tx.dateLabel} · {tx.student}
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <p className="text-[13px] font-bold tabular-nums text-[#0B0B0F]">
          +{tx.net.toLocaleString("fr-FR")} MAD
        </p>
        <TxStatusPill status={tx.status} />
      </div>
      <ChevronRight
        className="h-4 w-4 shrink-0 text-[#8A8D93]"
        strokeWidth={1.75}
      />
    </div>
  );
}

function MobileInvoiceRow({
  row,
  onClick,
}: {
  row: TeacherInvoice;
  onClick: () => void;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      className="flex cursor-pointer items-center gap-3 rounded-[16px] border border-[#EFEFF1] bg-white p-3 transition-colors hover:border-[#D5D7DB]"
    >
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-[12px] bg-[#F5F5F7] text-[#0B0B0F]">
        <ReceiptText className="h-4 w-4" strokeWidth={1.75} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-semibold text-[#0B0B0F]">
          {row.title}
        </p>
        <p className="mt-0.5 truncate text-[11px] text-[#8A8D93] tabular-nums">
          {row.number} · {row.dateLabel}
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <p className="text-[13px] font-bold tabular-nums text-[#0B0B0F]">
          {row.total.toLocaleString("fr-FR")} MAD
        </p>
        <InvoiceStatusPill status={row.status} />
      </div>
      <ChevronRight
        className="h-4 w-4 shrink-0 text-[#8A8D93]"
        strokeWidth={1.75}
      />
    </div>
  );
}

function MobilePayoutRow({
  payout,
  onClick,
}: {
  payout: PayoutRequest;
  onClick: () => void;
}) {
  const Icon =
    payout.status === "versé"
      ? CheckCircle2
      : payout.status === "refusé"
        ? XCircle
        : Clock3;
  const iconClass =
    payout.status === "versé"
      ? "bg-[#DFFF3F] text-[#0B0B0F]"
      : payout.status === "refusé"
        ? "bg-white border border-[#EFEFF1] text-[#DC2626]"
        : "bg-[#F5F5F7] text-[#0B0B0F]";
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      className="flex cursor-pointer items-center gap-3 rounded-[16px] border border-[#EFEFF1] bg-white p-3 transition-colors hover:border-[#D5D7DB]"
    >
      <div
        className={cn(
          "grid h-10 w-10 shrink-0 place-items-center rounded-[12px]",
          iconClass,
        )}
      >
        <Icon className="h-4 w-4" strokeWidth={1.75} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-semibold text-[#0B0B0F]">
          {payout.method}
        </p>
        <p className="mt-0.5 truncate text-[11px] text-[#8A8D93] tabular-nums">
          {payout.id} · {payout.requestedAt}
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <p className="text-[13px] font-bold tabular-nums text-[#0B0B0F]">
          {payout.net.toLocaleString("fr-FR")} MAD
        </p>
        <PayoutStatusPill status={payout.status} />
      </div>
      <ArrowUpRight
        className="h-4 w-4 shrink-0 text-[#8A8D93]"
        strokeWidth={1.75}
      />
    </div>
  );
}
