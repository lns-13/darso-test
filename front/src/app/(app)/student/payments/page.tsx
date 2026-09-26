"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  ChevronRight,
  Clock3,
  CreditCard,
  Filter,
  Plus,
  ReceiptText,
  RotateCcw,
  Wallet,
  XCircle,
} from "lucide-react";
import { AppShell } from "@/components/app/app-shell";
import { PageHeader } from "@/components/app/page-header";
import { SectionHeader } from "@/components/app/section-header";
import { TabSwitcher } from "@/components/app/tab-switcher";
import { EmptyState } from "@/components/app/empty-state";
import { StatCard } from "@/components/app/stat-card";
import { DataTable, type DataTableColumn } from "@/components/app/data-table";
import {
  PaymentMethodRow,
  type PaymentBrand,
} from "@/components/app/payment-method-row";
import { AddCardModal, type NewCardPayload } from "@/components/app/add-card-modal";
import { InvoiceModal, type InvoiceData } from "@/components/app/invoice-modal";
import { PaymentTopUpModal } from "@/components/app/payment-topup-modal";
import { RefundRequestModal } from "@/components/app/refund-request-modal";
import { studentMobileTabs, studentNav } from "@/lib/nav";
import { cn } from "@/lib/utils";
import { downloadTextPdf } from "@/lib/download-pdf";

/* ---------------- MOCK: replace when API lands ---------------- */

const student = {
  firstName: "Sara",
  fullName: "Sara Bencheikh",
  level: "Terminale S · Lycée Descartes",
  initials: "SB",
};

type TxStatus = "payé" | "en attente" | "échoué" | "remboursé";
type Transaction = {
  id: string;
  date: string; // ISO
  dateLabel: string;
  title: string;
  teacher: string;
  method: "Visa •• 4242" | "CIH •• 7710" | "Solde portefeuille";
  status: TxStatus;
  amount: number; // MAD
};

const transactions: Transaction[] = [
  {
    id: "TX-4821",
    date: "2026-09-01",
    dateLabel: "1 sept.",
    title: "Analyse — dérivées & fonction composée",
    teacher: "Youssef Amrani",
    method: "Visa •• 4242",
    status: "payé",
    amount: 220,
  },
  {
    id: "TX-4818",
    date: "2026-08-30",
    dateLabel: "30 août",
    title: "DELF B2 — essai argumenté",
    teacher: "Marc Dupont",
    method: "Visa •• 4242",
    status: "payé",
    amount: 250,
  },
  {
    id: "TX-4809",
    date: "2026-08-27",
    dateLabel: "27 août",
    title: "Physique — mécanique du solide TD4",
    teacher: "Nadia Cherkaoui",
    method: "CIH •• 7710",
    status: "en attente",
    amount: 200,
  },
  {
    id: "TX-4801",
    date: "2026-08-24",
    dateLabel: "24 août",
    title: "Anglais IELTS — speaking part 2",
    teacher: "Emma Whitfield",
    method: "Solde portefeuille",
    status: "payé",
    amount: 180,
  },
  {
    id: "TX-4790",
    date: "2026-08-21",
    dateLabel: "21 août",
    title: "SVT — génétique",
    teacher: "Karim El Fassi",
    method: "Visa •• 4242",
    status: "échoué",
    amount: 190,
  },
  {
    id: "TX-4782",
    date: "2026-08-18",
    dateLabel: "18 août",
    title: "Français — commentaire Balzac",
    teacher: "Chloé Bernard",
    method: "Visa •• 4242",
    status: "payé",
    amount: 150,
  },
  {
    id: "TX-4770",
    date: "2026-08-14",
    dateLabel: "14 août",
    title: "Maths — grand oral, structuration",
    teacher: "Youssef Amrani",
    method: "CIH •• 7710",
    status: "remboursé",
    amount: 220,
  },
  {
    id: "TX-4761",
    date: "2026-08-11",
    dateLabel: "11 août",
    title: "Physique — thermodynamique ch. 2",
    teacher: "Rachid Benhaddou",
    method: "Visa •• 4242",
    status: "payé",
    amount: 320,
  },
  {
    id: "TX-4744",
    date: "2026-08-05",
    dateLabel: "5 août",
    title: "SVT — évolution",
    teacher: "Karim El Fassi",
    method: "Visa •• 4242",
    status: "payé",
    amount: 175,
  },
  {
    id: "TX-4720",
    date: "2026-07-30",
    dateLabel: "30 juil.",
    title: "Analyse — limites & continuité",
    teacher: "Youssef Amrani",
    method: "Solde portefeuille",
    status: "payé",
    amount: 220,
  },
  {
    id: "TX-4711",
    date: "2026-07-27",
    dateLabel: "27 juil.",
    title: "DELF B2 — compréhension orale",
    teacher: "Marc Dupont",
    method: "Visa •• 4242",
    status: "payé",
    amount: 250,
  },
  {
    id: "TX-4702",
    date: "2026-07-22",
    dateLabel: "22 juil.",
    title: "Physique — ondes mécaniques",
    teacher: "Nadia Cherkaoui",
    method: "CIH •• 7710",
    status: "payé",
    amount: 200,
  },
];

type InvoiceRow = {
  id: string;
  number: string;
  dateLabel: string;
  title: string;
  status: "payée" | "en attente" | "échouée";
  total: number;
  data: InvoiceData;
};

const invoices: InvoiceRow[] = [
  {
    id: "IN-2026-0912",
    number: "F-2026-0912",
    dateLabel: "1 sept. 2026",
    title: "Séance · Analyse & suites",
    status: "payée",
    total: 220,
    data: {
      number: "F-2026-0912",
      issuedAt: "1 sept. 2026",
      status: "payé",
      billTo: {
        name: "Sara Bencheikh",
        address: "12 rue des Écoles\n20250 Casablanca",
        email: "sara.b@example.ma",
      },
      items: [
        {
          id: "l1",
          label: "Séance particulière · Mathématiques",
          detail: "Youssef Amrani · 60 min",
          qty: 1,
          unit: 183.33,
        },
      ],
    },
  },
  {
    id: "IN-2026-0904",
    number: "F-2026-0904",
    dateLabel: "30 août 2026",
    title: "Séance · DELF B2 essai",
    status: "payée",
    total: 250,
    data: {
      number: "F-2026-0904",
      issuedAt: "30 août 2026",
      status: "payé",
      billTo: {
        name: "Sara Bencheikh",
        address: "12 rue des Écoles\n20250 Casablanca",
        email: "sara.b@example.ma",
      },
      items: [
        {
          id: "l1",
          label: "Séance particulière · Français",
          detail: "Marc Dupont · 45 min",
          qty: 1,
          unit: 208.33,
        },
      ],
    },
  },
  {
    id: "IN-2026-0898",
    number: "F-2026-0898",
    dateLabel: "27 août 2026",
    title: "Séance · Physique TD4",
    status: "en attente",
    total: 200,
    data: {
      number: "F-2026-0898",
      issuedAt: "27 août 2026",
      dueAt: "10 sept. 2026",
      status: "en attente",
      billTo: {
        name: "Sara Bencheikh",
        address: "12 rue des Écoles\n20250 Casablanca",
      },
      items: [
        {
          id: "l1",
          label: "Séance particulière · Physique-Chimie",
          detail: "Nadia Cherkaoui · 90 min",
          qty: 1,
          unit: 166.67,
        },
      ],
    },
  },
  {
    id: "IN-2026-0876",
    number: "F-2026-0876",
    dateLabel: "18 août 2026",
    title: "Séance · Français commentaire",
    status: "payée",
    total: 150,
    data: {
      number: "F-2026-0876",
      issuedAt: "18 août 2026",
      status: "payé",
      billTo: {
        name: "Sara Bencheikh",
      },
      items: [
        {
          id: "l1",
          label: "Séance particulière · Français",
          detail: "Chloé Bernard · 60 min",
          qty: 1,
          unit: 125,
        },
      ],
    },
  },
  {
    id: "IN-2026-0851",
    number: "F-2026-0851",
    dateLabel: "11 août 2026",
    title: "Séance · Thermodynamique",
    status: "payée",
    total: 320,
    data: {
      number: "F-2026-0851",
      issuedAt: "11 août 2026",
      status: "payé",
      billTo: { name: "Sara Bencheikh" },
      items: [
        {
          id: "l1",
          label: "Séance particulière · Physique-Chimie",
          detail: "Rachid Benhaddou · 90 min",
          qty: 1,
          unit: 266.67,
        },
      ],
    },
  },
  {
    id: "IN-2026-0834",
    number: "F-2026-0834",
    dateLabel: "5 août 2026",
    title: "Séance · SVT évolution",
    status: "échouée",
    total: 175,
    data: {
      number: "F-2026-0834",
      issuedAt: "5 août 2026",
      status: "échoué",
      billTo: { name: "Sara Bencheikh" },
      items: [
        {
          id: "l1",
          label: "Séance particulière · SVT",
          detail: "Karim El Fassi · 60 min",
          qty: 1,
          unit: 145.83,
        },
      ],
    },
  },
];

type RefundStatus = "demandé" | "approuvé" | "refusé";
type Refund = {
  id: string;
  txId: string;
  dateLabel: string;
  title: string;
  status: RefundStatus;
  amount: number;
  reason: string;
};

const refunds: Refund[] = [
  {
    id: "RF-3021",
    txId: "TX-4770",
    dateLabel: "16 août 2026",
    title: "Maths — grand oral (annulée)",
    status: "approuvé",
    amount: 220,
    reason: "Séance annulée par le prof à J-1.",
  },
  {
    id: "RF-3018",
    txId: "TX-4790",
    dateLabel: "22 août 2026",
    title: "SVT — génétique (échouée)",
    status: "demandé",
    amount: 190,
    reason: "Paiement échoué mais séance facturée.",
  },
  {
    id: "RF-3011",
    txId: "TX-4702",
    dateLabel: "24 juil. 2026",
    title: "Physique — ondes (litige contenu)",
    status: "refusé",
    amount: 200,
    reason: "Séance délivrée · pas de motif recevable.",
  },
];

type PaymentMethod = {
  id: string;
  brand: PaymentBrand;
  last4: string;
  expiry: string;
  holder: string;
  isDefault?: boolean;
};

const paymentMethods: PaymentMethod[] = [
  {
    id: "pm-1",
    brand: "visa",
    last4: "4242",
    expiry: "08/28",
    holder: "S. BENCHEIKH",
    isDefault: true,
  },
  {
    id: "pm-2",
    brand: "cih",
    last4: "7710",
    expiry: "03/27",
    holder: "S. BENCHEIKH",
  },
];

/* ---------------- Page ---------------- */

type TabKey = "transactions" | "invoices" | "refunds";

const TAB_META: { key: TabKey; label: string }[] = [
  { key: "transactions", label: "Transactions" },
  { key: "invoices", label: "Factures" },
  { key: "refunds", label: "Remboursements" },
];

function parseTabParam(v: string | null): TabKey {
  if (v === "invoices" || v === "refunds" || v === "transactions") return v;
  return "transactions";
}

export default function StudentPaymentsPage() {
  return (
    <Suspense fallback={null}>
      <PaymentsInner />
    </Suspense>
  );
}

function PaymentsInner() {
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
  const [refundOpen, setRefundOpen] = useState(false);
  const [topUpOpen, setTopUpOpen] = useState(false);
  const [addCardOpen, setAddCardOpen] = useState(false);
  const [cards, setCards] = useState<PaymentMethod[]>(paymentMethods);
  const [balance, setBalance] = useState(340);
  const [statusFilter, setStatusFilter] = useState<TxStatus | "tous">("tous");
  const [filterOpen, setFilterOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const flash = (msg: string) => {
    setNotice(msg);
    window.setTimeout(() => setNotice(null), 2200);
  };

  // URL sync
  useEffect(() => {
    const p = new URLSearchParams(Array.from(searchParams.entries()));
    p.set("tab", tab);
    const qs = p.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const walletBalance = balance;
  const filteredTransactions = useMemo(
    () =>
      statusFilter === "tous"
        ? transactions
        : transactions.filter((t) => t.status === statusFilter),
    [statusFilter],
  );
  const monthSpend = useMemo(
    () =>
      transactions
        .filter(
          (t) => t.date.startsWith("2026-09") && t.status === "payé",
        )
        .reduce((s, t) => s + t.amount, 0) +
      // include recent August paid to make card feel populated
      transactions
        .filter(
          (t) =>
            t.date.startsWith("2026-08") &&
            t.status === "payé",
        )
        .reduce((s, t) => s + t.amount, 0),
    [],
  );
  const refundsPending = useMemo(
    () => refunds.filter((r) => r.status === "demandé").length,
    [],
  );

  const stats = (
    <>
      <StatCard
        label="Solde du portefeuille"
        value={walletBalance.toLocaleString("fr-FR")}
        unit="MAD"
        hint="Rechargeable à tout moment"
        tone="lime"
      />
      <StatCard
        label="Dépenses ce mois"
        value={monthSpend.toLocaleString("fr-FR")}
        unit="MAD"
        hint="Sept. 2026 · vs. 1 240 en août"
        trend={{ direction: "down", value: "-8%" }}
      />
      <StatCard
        label="Remboursements en attente"
        value={refundsPending}
        hint={
          refundsPending === 0
            ? "Rien à suivre"
            : `Réponse sous 48h ouvrées`
        }
        tone="muted"
      />
    </>
  );

  const openTransactionInvoice = (tx: Transaction) => {
    setInvoiceData({
      number: `F-${tx.id.replace("TX-", "")}`,
      issuedAt: tx.dateLabel + " 2026",
      status: mapTxStatus(tx.status),
      billTo: {
        name: student.fullName,
        address: "12 rue des Écoles\n20250 Casablanca",
        email: "sara.b@example.ma",
      },
      items: [
        {
          id: "l1",
          label: tx.title,
          detail: `${tx.teacher} · Séance particulière`,
          qty: 1,
          unit: tx.amount / 1.2,
        },
      ],
    });
    setInvoiceMode({});
    setInvoiceOpen(true);
  };

  const openInvoice = (row: InvoiceRow) => {
    setInvoiceData(row.data);
    setInvoiceMode({});
    setInvoiceOpen(true);
  };

  const openRefundDetail = (r: Refund) => {
    setInvoiceData({
      number: r.id,
      issuedAt: r.dateLabel,
      status: r.status === "approuvé" ? "remboursé" : r.status === "refusé" ? "échoué" : "en attente",
      billTo: {
        name: student.fullName,
        email: "sara.b@example.ma",
      },
      items: [
        {
          id: "l1",
          label: r.title,
          detail: `Transaction associée · ${r.txId}\nRaison : ${r.reason}`,
          qty: 1,
          unit: r.amount / 1.2,
        },
      ],
      footer:
        r.status === "refusé"
          ? "Le remboursement a été refusé. Contacte le support pour contester."
          : r.status === "approuvé"
            ? "Le remboursement a été crédité sur ton moyen de paiement d'origine."
            : "Ta demande est en cours d'examen. Réponse sous 48h ouvrées.",
    });
    setInvoiceMode({
      eyebrow: "Remboursement",
      title: `Demande ${r.id}`,
      readOnly: true,
    });
    setInvoiceOpen(true);
  };

  const desktop = (
    <DesktopMain
      tab={tab}
      onTabChange={setTab}
      stats={stats}
      transactions={filteredTransactions}
      cards={cards}
      onOpenTx={openTransactionInvoice}
      onOpenInvoice={openInvoice}
      onOpenRefund={openRefundDetail}
      onOpenRefundForm={() => setRefundOpen(true)}
      onOpenTopUp={() => setTopUpOpen(true)}
      onOpenAddCard={() => setAddCardOpen(true)}
      statusFilter={statusFilter}
      onStatusFilter={setStatusFilter}
      filterOpen={filterOpen}
      onToggleFilter={() => setFilterOpen((v) => !v)}
      onCloseFilter={() => setFilterOpen(false)}
    />
  );

  const mobile = (
    <MobileBody
      tab={tab}
      onTabChange={setTab}
      stats={stats}
      transactions={filteredTransactions}
      cards={cards}
      onOpenTx={openTransactionInvoice}
      onOpenInvoice={openInvoice}
      onOpenRefund={openRefundDetail}
      onOpenRefundForm={() => setRefundOpen(true)}
      onOpenTopUp={() => setTopUpOpen(true)}
      onOpenAddCard={() => setAddCardOpen(true)}
    />
  );

  return (
    <>
      <AppShell
        nav={studentNav}
        mobileTabs={studentMobileTabs}
        user={student}
        desktopMain={desktop}
        mobileHeader={{
          title: "Paiements",
          subtitle: `${walletBalance} MAD · ${refundsPending} en attente`,
        }}
        mobileChildren={mobile}
      />
      <InvoiceModal
        open={invoiceOpen}
        onClose={() => setInvoiceOpen(false)}
        invoice={invoiceData}
        eyebrow={invoiceMode.eyebrow}
        title={invoiceMode.title}
        readOnly={invoiceMode.readOnly}
        onDownload={() => {
          if (!invoiceData) return;
          const total = invoiceData.items.reduce(
            (s, it) => s + it.qty * it.unit,
            0,
          );
          const tva = total * 0.2;
          downloadTextPdf(`Darso — ${invoiceData.number}`, [
            `DARSO — Facture ${invoiceData.number}`,
            `Émise le : ${invoiceData.issuedAt}`,
            `Statut : ${invoiceData.status}`,
            "",
            "Facturé à :",
            invoiceData.billTo.name,
            ...(invoiceData.billTo.address?.split("\n") ?? []),
            invoiceData.billTo.email ?? "",
            "",
            "Détail :",
            ...invoiceData.items.map(
              (it) =>
                `- ${it.label} x${it.qty}  ${(it.qty * it.unit).toFixed(2)} MAD`,
            ),
            "",
            `Sous-total HT : ${total.toFixed(2)} MAD`,
            `TVA 20% : ${tva.toFixed(2)} MAD`,
            `Total TTC : ${(total + tva).toFixed(2)} MAD`,
            "",
            invoiceData.footer ?? "Merci pour votre confiance.",
          ]);
          flash("PDF téléchargé");
        }}
      />
      <RefundRequestModal
        open={refundOpen}
        onClose={() => setRefundOpen(false)}
        transactions={transactions
          .filter((t) => t.status === "payé")
          .map((t) => ({
            id: t.id,
            label: `${t.id} · ${t.title} — ${t.amount.toLocaleString("fr-FR")} MAD`,
          }))}
      />
      <PaymentTopUpModal
        open={topUpOpen}
        onClose={() => setTopUpOpen(false)}
        currentBalance={balance}
        methods={cards.map((c) => ({
          id: c.id,
          label: `${c.brand.toUpperCase()} •• ${c.last4} — ${c.holder}`,
        }))}
        onConfirm={(amount) => {
          setBalance((b) => b + amount);
          flash(`${amount} MAD ajoutés au portefeuille`);
        }}
      />
      <AddCardModal
        open={addCardOpen}
        onClose={() => setAddCardOpen(false)}
        onAdd={(c: NewCardPayload) => {
          setCards((prev) => [
            ...prev,
            {
              id: `pm-${prev.length + 1}`,
              brand: (c.brand === "amex" ? "visa" : c.brand) as PaymentBrand,
              last4: c.last4,
              expiry: c.expiry,
              holder: c.holder.toUpperCase(),
            },
          ]);
          flash("Carte ajoutée");
        }}
      />

      {notice ? (
        <div
          role="status"
          aria-live="polite"
          className="pointer-events-none fixed bottom-24 left-1/2 z-[70] -translate-x-1/2 rounded-full bg-[#0B0B0F] px-4 py-2 text-[12px] font-semibold text-white shadow-[0_8px_24px_rgba(10,11,20,0.28)]"
        >
          {notice}
        </div>
      ) : null}
    </>
  );
}

function mapTxStatus(s: TxStatus): InvoiceData["status"] {
  if (s === "payé") return "payé";
  if (s === "en attente") return "en attente";
  if (s === "échoué") return "échoué";
  return "remboursé";
}

/* ================================================================
   DESKTOP
   ================================================================ */

function DesktopMain({
  tab,
  onTabChange,
  stats,
  transactions: txRows,
  cards,
  onOpenTx,
  onOpenInvoice,
  onOpenRefund,
  onOpenRefundForm,
  onOpenTopUp,
  onOpenAddCard,
  statusFilter,
  onStatusFilter,
  filterOpen,
  onToggleFilter,
  onCloseFilter,
}: {
  tab: TabKey;
  onTabChange: (t: TabKey) => void;
  stats: React.ReactNode;
  transactions: Transaction[];
  cards: PaymentMethod[];
  onOpenTx: (tx: Transaction) => void;
  onOpenInvoice: (r: InvoiceRow) => void;
  onOpenRefund: (r: Refund) => void;
  onOpenRefundForm: () => void;
  onOpenTopUp: () => void;
  onOpenAddCard: () => void;
  statusFilter: TxStatus | "tous";
  onStatusFilter: (s: TxStatus | "tous") => void;
  filterOpen: boolean;
  onToggleFilter: () => void;
  onCloseFilter: () => void;
}) {
  return (
    <div className="p-6">
      <PageHeader
        eyebrow={
          <>
            <span>Paiements</span>
            <span className="h-1 w-1 rounded-full bg-[#D5D7DB]" />
            <span className="font-medium text-[#0B0B0F]">
              {transactions.length} transactions · {invoices.length} factures
            </span>
          </>
        }
        title="Portefeuille & factures"
        subline="Gère tes moyens de paiement, retrouve tes reçus et demande un remboursement en 2 clics."
        actions={
          <>
            <button
              type="button"
              onClick={onOpenTopUp}
              className="flex h-9 items-center gap-1.5 rounded-full border border-[#EFEFF1] px-3.5 text-[12px] font-semibold text-[#0B0B0F] transition-colors hover:bg-[#F5F5F7]"
            >
              <Wallet className="h-3.5 w-3.5" strokeWidth={1.75} />
              Recharger
            </button>
            <button
              type="button"
              onClick={onOpenAddCard}
              className="flex h-9 items-center gap-1.5 rounded-full bg-[#0B0B0F] px-3.5 text-[12px] font-semibold text-white transition-colors hover:bg-[#1a1b21]"
            >
              <Plus className="h-3.5 w-3.5" strokeWidth={2} />
              Ajouter une carte
            </button>
          </>
        }
      />

      <div className="mt-6 grid grid-cols-1 gap-3 min-[1080px]:grid-cols-3">
        {stats}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-5 min-[1360px]:grid-cols-[minmax(0,1fr)_minmax(300px,340px)]">
        <div>
          <div className="flex items-center justify-between gap-3">
            <TabSwitcher<TabKey>
              tabs={TAB_META.map((t) => ({ key: t.key, label: t.label }))}
              value={tab}
              onChange={onTabChange}
            />
            {tab === "refunds" ? (
              <button
                onClick={onOpenRefundForm}
                className="flex h-8 items-center gap-1.5 rounded-full bg-[#0B0B0F] px-3 text-[11.5px] font-semibold text-white transition-colors hover:bg-[#1a1b21]"
              >
                <RotateCcw className="h-3 w-3" strokeWidth={2} />
                Demander un remboursement
              </button>
            ) : (
              <StatusFilterButton
                open={filterOpen}
                value={statusFilter}
                onToggle={onToggleFilter}
                onSelect={(v) => {
                  onStatusFilter(v);
                  onCloseFilter();
                }}
              />
            )}
          </div>

          <div className="mt-4">
            {tab === "transactions" ? (
              <TransactionsTable rows={txRows} onRowClick={onOpenTx} />
            ) : tab === "invoices" ? (
              <InvoicesTable rows={invoices} onRowClick={onOpenInvoice} />
            ) : (
              <RefundsTable rows={refunds} onRowClick={onOpenRefund} />
            )}
          </div>
        </div>

        <aside className="space-y-3">
          <SectionHeader
            title="Moyens de paiement"
            subtitle={`${cards.length} carte${cards.length > 1 ? "s" : ""} enregistrée${cards.length > 1 ? "s" : ""}`}
          />
          <div className="space-y-2">
            {cards.map((pm) => (
              <PaymentMethodRow
                key={pm.id}
                brand={pm.brand}
                last4={pm.last4}
                expiry={pm.expiry}
                holder={pm.holder}
                isDefault={pm.isDefault}
              />
            ))}
            <PaymentMethodRow variant="add" onClick={onOpenAddCard} />
          </div>

          <div className="mt-4 rounded-[14px] border border-[#EFEFF1] bg-[#FAFAFB] p-3.5">
            <div className="flex items-start gap-2.5">
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-[10px] bg-white text-[#0B0B0F]">
                <CreditCard className="h-3.5 w-3.5" strokeWidth={1.75} />
              </div>
              <div className="min-w-0">
                <p className="text-[12px] font-semibold text-[#0B0B0F]">
                  Paiement sécurisé
                </p>
                <p className="mt-0.5 text-[11px] leading-snug text-[#6E7178]">
                  Tes cartes sont tokenisées via notre PSP. On ne stocke jamais le PAN
                  complet sur nos serveurs.
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

function StatusPill({ status }: { status: TxStatus | "payée" | "en attente" | "échouée" | RefundStatus }) {
  const s = String(status);
  const tone =
    s === "payé" || s === "payée" || s === "approuvé"
      ? "bg-[#DFFF3F] text-[#0B0B0F]"
      : s === "en attente" || s === "demandé"
        ? "bg-[#F5F5F7] text-[#0B0B0F]"
        : s === "remboursé"
          ? "bg-white border border-[#EFEFF1] text-[#0B0B0F]"
          : "border border-[#0B0B0F] text-[#DC2626]";
  return (
    <span
      className={cn(
        "inline-flex h-5 items-center rounded-full px-1.5 text-[10px] font-semibold capitalize",
        tone,
      )}
    >
      {s}
    </span>
  );
}

function TransactionsTable({
  rows,
  onRowClick,
}: {
  rows: Transaction[];
  onRowClick: (r: Transaction) => void;
}) {
  const columns: DataTableColumn[] = [
    { key: "date", header: "Date", className: "whitespace-nowrap text-[#6E7178]", headerClassName: "w-[74px]" },
    { key: "title", header: "Cours" },
    { key: "method", header: "Moyen", className: "whitespace-nowrap text-[#6E7178]" },
    { key: "status", header: "Statut", className: "whitespace-nowrap", headerClassName: "w-[92px]" },
    { key: "amount", header: "Montant", align: "right", numeric: true, className: "whitespace-nowrap", headerClassName: "w-[104px]" },
  ];
  const tableRows = rows.map((t) => ({
    id: t.id,
    _raw: t,
    date: <span className="tabular-nums">{t.dateLabel}</span>,
    title: (
      <div className="min-w-0">
        <p className="truncate font-semibold text-[#0B0B0F]">{t.title}</p>
        <p className="mt-0.5 truncate text-[10.5px] text-[#8A8D93]">
          {t.teacher} · {t.id}
        </p>
      </div>
    ),
    method: <span className="tabular-nums">{t.method}</span>,
    status: <StatusPill status={t.status} />,
    amount: (
      <span
        className={cn(
          "font-bold tabular-nums",
          t.status === "remboursé" ? "text-[#0B0B0F]" : "text-[#0B0B0F]",
        )}
      >
        {t.status === "remboursé" ? "-" : ""}
        {t.amount.toLocaleString("fr-FR")} MAD
      </span>
    ),
  }));
  return (
    <DataTable
      columns={columns}
      rows={tableRows}
      onRowClick={(r) => onRowClick((r as { _raw: Transaction })._raw)}
    />
  );
}

function InvoicesTable({
  rows,
  onRowClick,
}: {
  rows: InvoiceRow[];
  onRowClick: (r: InvoiceRow) => void;
}) {
  const columns: DataTableColumn[] = [
    { key: "number", header: "N°", className: "whitespace-nowrap w-[110px] text-[#6E7178]" },
    { key: "title", header: "Objet" },
    { key: "date", header: "Date", className: "whitespace-nowrap text-[#6E7178]", numeric: true },
    { key: "status", header: "Statut", className: "whitespace-nowrap" },
    { key: "total", header: "Total", align: "right", numeric: true, className: "whitespace-nowrap" },
  ];
  const tableRows = rows.map((r) => ({
    id: r.id,
    _raw: r,
    number: <span className="tabular-nums font-semibold text-[#0B0B0F]">{r.number}</span>,
    title: <span className="truncate">{r.title}</span>,
    date: <span className="tabular-nums">{r.dateLabel}</span>,
    status: <StatusPill status={r.status} />,
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
      onRowClick={(r) => onRowClick((r as { _raw: InvoiceRow })._raw)}
    />
  );
}

function RefundsTable({
  rows,
  onRowClick,
}: {
  rows: Refund[];
  onRowClick: (r: Refund) => void;
}) {
  if (rows.length === 0) {
    return (
      <EmptyState
        icon={RotateCcw}
        title="Aucun remboursement"
        body="Tes demandes de remboursement apparaîtront ici avec leur statut."
      />
    );
  }
  const columns: DataTableColumn[] = [
    { key: "ref", header: "Réf.", className: "whitespace-nowrap w-[110px] text-[#6E7178]" },
    { key: "title", header: "Objet" },
    { key: "date", header: "Demandé le", className: "whitespace-nowrap text-[#6E7178]", numeric: true },
    { key: "status", header: "Statut", className: "whitespace-nowrap" },
    { key: "amount", header: "Montant", align: "right", numeric: true, className: "whitespace-nowrap" },
  ];
  const tableRows = rows.map((r) => ({
    id: r.id,
    _raw: r,
    ref: <span className="tabular-nums font-semibold text-[#0B0B0F]">{r.id}</span>,
    title: (
      <div className="min-w-0">
        <p className="truncate font-semibold text-[#0B0B0F]">{r.title}</p>
        <p className="mt-0.5 truncate text-[10.5px] text-[#8A8D93]">
          Transaction {r.txId}
        </p>
      </div>
    ),
    date: <span className="tabular-nums">{r.dateLabel}</span>,
    status: <StatusPill status={r.status} />,
    amount: (
      <span className="font-bold tabular-nums text-[#0B0B0F]">
        {r.amount.toLocaleString("fr-FR")} MAD
      </span>
    ),
  }));
  return (
    <DataTable
      columns={columns}
      rows={tableRows}
      onRowClick={(r) => onRowClick((r as { _raw: Refund })._raw)}
    />
  );
}

/* ================================================================
   MOBILE
   ================================================================ */

function MobileBody({
  tab,
  onTabChange,
  stats,
  transactions: txRows,
  cards,
  onOpenTx,
  onOpenInvoice,
  onOpenRefund,
  onOpenRefundForm,
  onOpenTopUp,
  onOpenAddCard,
}: {
  tab: TabKey;
  onTabChange: (t: TabKey) => void;
  stats: React.ReactNode;
  transactions: Transaction[];
  cards: PaymentMethod[];
  onOpenTx: (tx: Transaction) => void;
  onOpenInvoice: (r: InvoiceRow) => void;
  onOpenRefund: (r: Refund) => void;
  onOpenRefundForm: () => void;
  onOpenTopUp: () => void;
  onOpenAddCard: () => void;
}) {
  const [methodsOpen, setMethodsOpen] = useState(false);
  const [period, setPeriod] = useState<"tous" | "7j" | "30j">("tous");
  const [typeFilter, setTypeFilter] = useState<"tous" | "payé" | "en attente" | "échoué">("tous");
  const visibleTxRows = useMemo(() => {
    let list = txRows;
    if (typeFilter !== "tous") list = list.filter((t) => t.status === typeFilter);
    if (period !== "tous") {
      const cutoff = Date.now() - (period === "7j" ? 7 : 30) * 86400_000;
      list = list.filter((t) => new Date(t.date).getTime() >= cutoff);
    }
    return list;
  }, [txRows, typeFilter, period]);

  return (
    <div className="mt-2">
      {/* Stat strip */}
      <div className="scrollbar-none flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1">
        {stats && Array.isArray((stats as { props?: { children?: unknown } }).props?.children)
          ? (stats as { props: { children: React.ReactNode[] } }).props.children.map(
              (child, i) => (
                <div
                  key={i}
                  className="min-w-[220px] snap-start [&>*]:h-full"
                  style={{ scrollSnapAlign: "start" }}
                >
                  {child}
                </div>
              ),
            )
          : null}
      </div>

      <div className="mt-4 px-4">
        <TabSwitcher<TabKey>
          tabs={TAB_META.map((t) => ({ key: t.key, label: t.label }))}
          value={tab}
          onChange={onTabChange}
          className="w-full"
        />
      </div>

      {/* Filter chips */}
      <div className="scrollbar-none mt-3 flex gap-1.5 overflow-x-auto px-4 pb-1">
        {tab === "refunds" ? (
          <button
            onClick={onOpenRefundForm}
            className="flex h-8 shrink-0 items-center gap-1.5 rounded-full bg-[#0B0B0F] px-3 text-[11.5px] font-semibold text-white"
          >
            <RotateCcw className="h-3 w-3" strokeWidth={2} />
            Nouvelle demande
          </button>
        ) : null}
        {(["tous", "7j", "30j"] as const).map((p) => (
          <Chip key={p} active={period === p} onClick={() => setPeriod(p)}>
            {p === "tous" ? "Toute période" : p === "7j" ? "7 derniers jours" : "30 derniers jours"}
          </Chip>
        ))}
        {tab === "transactions"
          ? (["tous", "payé", "en attente", "échoué"] as const).map((t) => (
              <Chip key={t} active={typeFilter === t} onClick={() => setTypeFilter(t)}>
                {t === "tous"
                  ? "Tous statuts"
                  : t === "payé"
                    ? "Payés"
                    : t === "en attente"
                      ? "En attente"
                      : "Échoués"}
              </Chip>
            ))
          : null}
      </div>

      {/* Stacked list */}
      <div className="mt-3 space-y-2 px-4">
        {tab === "transactions"
          ? visibleTxRows.length === 0
            ? (
              <EmptyState
                icon={CheckCircle2}
                title="Aucune transaction"
                body="Ajuste les filtres pour voir plus de résultats."
              />
            )
            : visibleTxRows.map((t) => (
              <MobileTxRow key={t.id} tx={t} onClick={() => onOpenTx(t)} />
            ))
          : tab === "invoices"
            ? invoices.map((r) => (
                <MobileInvoiceRow key={r.id} row={r} onClick={() => onOpenInvoice(r)} />
              ))
            : refunds.length === 0
              ? (
                <EmptyState
                  icon={RotateCcw}
                  title="Aucun remboursement"
                  body="Tes demandes de remboursement apparaîtront ici."
                />
              )
              : refunds.map((r) => (
                  <MobileRefundRow key={r.id} refund={r} onClick={() => onOpenRefund(r)} />
                ))}
      </div>

      {/* Payment methods (collapsible) */}
      <div className="mt-6 px-4">
        <button
          onClick={() => setMethodsOpen((v) => !v)}
          className="flex w-full items-center justify-between rounded-[14px] border border-[#EFEFF1] bg-white px-3.5 py-3 text-left"
        >
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#8A8D93]">
              Moyens de paiement
            </p>
            <p className="mt-0.5 text-[12.5px] font-semibold text-[#0B0B0F]">
              {cards.length} carte{cards.length > 1 ? "s" : ""} enregistrée{cards.length > 1 ? "s" : ""}
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
            {cards.map((pm) => (
              <PaymentMethodRow
                key={pm.id}
                brand={pm.brand}
                last4={pm.last4}
                expiry={pm.expiry}
                holder={pm.holder}
                isDefault={pm.isDefault}
              />
            ))}
            <PaymentMethodRow variant="add" onClick={onOpenAddCard} />
          </div>
        ) : null}
      </div>

      {/* Mobile top-level actions */}
      <div className="mt-4 flex gap-2 px-4">
        <button
          type="button"
          onClick={onOpenTopUp}
          className="flex flex-1 h-10 items-center justify-center gap-1.5 rounded-full border border-[#EFEFF1] bg-white text-[12px] font-semibold text-[#0B0B0F] transition-colors hover:bg-[#F5F5F7]"
        >
          <Wallet className="h-3.5 w-3.5" strokeWidth={1.75} />
          Recharger
        </button>
        <button
          type="button"
          onClick={onOpenAddCard}
          className="flex flex-1 h-10 items-center justify-center gap-1.5 rounded-full bg-[#0B0B0F] text-[12px] font-semibold text-white transition-colors hover:bg-[#1a1b21]"
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={2} />
          Ajouter une carte
        </button>
      </div>
      <div className="h-6" />
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex h-8 shrink-0 items-center rounded-full border px-3 text-[11.5px] font-semibold transition-colors",
        active
          ? "border-[#0B0B0F] bg-[#0B0B0F] text-white"
          : "border-[#EFEFF1] bg-white text-[#0B0B0F] hover:bg-[#F5F5F7]",
      )}
    >
      {children}
    </button>
  );
}

function MobileTxRow({ tx, onClick }: { tx: Transaction; onClick: () => void }) {
  const Icon = tx.status === "payé"
    ? CheckCircle2
    : tx.status === "en attente"
      ? Clock3
      : tx.status === "échoué"
        ? XCircle
        : RotateCcw;
  const iconClass =
    tx.status === "payé"
      ? "bg-[#DFFF3F] text-[#0B0B0F]"
      : tx.status === "échoué"
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
      <div className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-[12px]", iconClass)}>
        <Icon className="h-4 w-4" strokeWidth={1.75} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-semibold text-[#0B0B0F]">{tx.title}</p>
        <p className="mt-0.5 truncate text-[11px] text-[#8A8D93] tabular-nums">
          {tx.dateLabel} · {tx.method}
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <p className="text-[13px] font-bold tabular-nums text-[#0B0B0F]">
          {tx.status === "remboursé" ? "-" : ""}
          {tx.amount.toLocaleString("fr-FR")} MAD
        </p>
        <StatusPill status={tx.status} />
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-[#8A8D93]" strokeWidth={1.75} />
    </div>
  );
}

function MobileInvoiceRow({
  row,
  onClick,
}: {
  row: InvoiceRow;
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
        <p className="truncate text-[13px] font-semibold text-[#0B0B0F]">{row.title}</p>
        <p className="mt-0.5 truncate text-[11px] text-[#8A8D93] tabular-nums">
          {row.number} · {row.dateLabel}
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <p className="text-[13px] font-bold tabular-nums text-[#0B0B0F]">
          {row.total.toLocaleString("fr-FR")} MAD
        </p>
        <StatusPill status={row.status} />
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-[#8A8D93]" strokeWidth={1.75} />
    </div>
  );
}

function MobileRefundRow({
  refund,
  onClick,
}: {
  refund: Refund;
  onClick: () => void;
}) {
  const Icon =
    refund.status === "approuvé"
      ? CheckCircle2
      : refund.status === "refusé"
        ? AlertTriangle
        : Clock3;
  const iconClass =
    refund.status === "approuvé"
      ? "bg-[#DFFF3F] text-[#0B0B0F]"
      : refund.status === "refusé"
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
      <div className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-[12px]", iconClass)}>
        <Icon className="h-4 w-4" strokeWidth={1.75} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-semibold text-[#0B0B0F]">{refund.title}</p>
        <p className="mt-0.5 truncate text-[11px] text-[#8A8D93] tabular-nums">
          {refund.id} · {refund.dateLabel}
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <p className="text-[13px] font-bold tabular-nums text-[#0B0B0F]">
          {refund.amount.toLocaleString("fr-FR")} MAD
        </p>
        <StatusPill status={refund.status} />
      </div>
      <ArrowUpRight className="h-4 w-4 shrink-0 text-[#8A8D93]" strokeWidth={1.75} />
    </div>
  );
}

function StatusFilterButton({
  open,
  value,
  onToggle,
  onSelect,
}: {
  open: boolean;
  value: TxStatus | "tous";
  onToggle: () => void;
  onSelect: (v: TxStatus | "tous") => void;
}) {
  const options: { key: TxStatus | "tous"; label: string }[] = [
    { key: "tous", label: "Tous" },
    { key: "payé", label: "Payés" },
    { key: "en attente", label: "En attente" },
    { key: "échoué", label: "Échoués" },
    { key: "remboursé", label: "Remboursés" },
  ];
  const label =
    value === "tous"
      ? "Filtrer"
      : `Filtrer · ${options.find((o) => o.key === value)?.label}`;
  return (
    <div className="relative">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className={cn(
          "flex h-8 items-center gap-1.5 rounded-full border px-3 text-[11.5px] font-semibold transition-colors",
          value !== "tous"
            ? "border-[#0B0B0F] bg-[#0B0B0F] text-white"
            : "border-[#EFEFF1] bg-white text-[#0B0B0F] hover:bg-[#F5F5F7]",
        )}
      >
        <Filter className="h-3 w-3" strokeWidth={1.75} />
        {label}
      </button>
      {open ? (
        <>
          <div
            aria-hidden
            onClick={onToggle}
            className="fixed inset-0 z-30"
          />
          <div className="absolute right-0 top-9 z-40 min-w-[200px] rounded-[14px] border border-[#EFEFF1] bg-white p-1.5 shadow-[0_8px_24px_rgba(10,11,20,0.12)]">
            {options.map((o) => (
              <button
                key={o.key}
                type="button"
                onClick={() => onSelect(o.key)}
                className={cn(
                  "flex w-full items-center justify-between rounded-[10px] px-2.5 py-1.5 text-left text-[12px] transition-colors hover:bg-[#F5F5F7]",
                  value === o.key
                    ? "font-semibold text-[#0B0B0F]"
                    : "text-[#4A4D54]",
                )}
              >
                {o.label}
                {value === o.key ? (
                  <span className="h-1.5 w-1.5 rounded-full bg-[#0B0B0F]" />
                ) : null}
              </button>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
