import type { InvoiceData } from "@/components/app/invoice-modal";

/* ---------- Earnings summary ---------- */

export const mockEarnings = {
  available: 4_820, // MAD ready to withdraw
  month: 8_640, // this month (Sept 2026)
  ytd: 62_150, // year-to-date
  pendingPayouts: 1_200, // sum of payout requests still in flight
};

/* ---------- Transactions (credits) ---------- */

export type TeacherTxStatus =
  | "encaissé"
  | "en attente"
  | "annulé"
  | "remboursé";

export type TeacherTransaction = {
  id: string;
  date: string; // ISO
  dateLabel: string;
  sessionTitle: string;
  student: string;
  studentInitials: string;
  subject: string;
  status: TeacherTxStatus;
  gross: number; // MAD before platform fee
  fee: number; // platform fee (mock 15%)
  net: number; // gross - fee
};

const mkTx = (
  id: string,
  date: string,
  dateLabel: string,
  sessionTitle: string,
  student: string,
  studentInitials: string,
  subject: string,
  gross: number,
  status: TeacherTxStatus = "encaissé",
): TeacherTransaction => {
  const fee = Math.round(gross * 0.15);
  return {
    id,
    date,
    dateLabel,
    sessionTitle,
    student,
    studentInitials,
    subject,
    status,
    gross,
    fee,
    net: gross - fee,
  };
};

export const mockTeacherTransactions: TeacherTransaction[] = [
  mkTx("TC-9182", "2026-09-01", "1 sept.", "Analyse — dérivées composées", "Sara Bencheikh", "SB", "Mathématiques", 220),
  mkTx("TC-9178", "2026-08-31", "31 août", "Prépa MPSI — algèbre linéaire", "Lina Ouazzani", "LO", "Mathématiques", 260),
  mkTx("TC-9174", "2026-08-29", "29 août", "Bac blanc — probabilités conditionnelles", "Mehdi Tazi", "MT", "Mathématiques", 200),
  mkTx("TC-9171", "2026-08-28", "28 août", "Trigo — cercle & formules d'addition", "Amine Khattabi", "AK", "Mathématiques", 180),
  mkTx("TC-9166", "2026-08-26", "26 août", "Physique — thermodynamique ch. 2", "Rachid Benhaddou", "RB", "Physique-Chimie", 320, "en attente"),
  mkTx("TC-9160", "2026-08-24", "24 août", "Français — commentaire Balzac", "Chloé Bernard", "CB", "Français", 150),
  mkTx("TC-9153", "2026-08-22", "22 août", "Anglais IELTS — speaking part 2", "Emma Whitfield", "EW", "Anglais", 210),
  mkTx("TC-9147", "2026-08-20", "20 août", "SVT — génétique & lois de Mendel", "Karim El Fassi", "KE", "SVT", 190),
  mkTx("TC-9141", "2026-08-18", "18 août", "Histoire — Guerre froide, jalons clés", "Nour Sabri", "NS", "Histoire-Géo", 170),
  mkTx("TC-9134", "2026-08-16", "16 août", "Analyse — intégration par parties", "Yasmine Alaoui", "YA", "Mathématiques", 220),
  mkTx("TC-9127", "2026-08-13", "13 août", "Suites récurrentes — méthodes", "Zineb Kabbaj", "ZK", "Mathématiques", 280),
  mkTx("TC-9120", "2026-08-11", "11 août", "Physique — mécanique du solide TD4", "Nadia Cherkaoui", "NC", "Physique-Chimie", 200),
  mkTx("TC-9114", "2026-08-08", "8 août", "Anglais — préparation TOEFL essay", "Salma Idrissi", "SI", "Anglais", 220),
  mkTx("TC-9108", "2026-08-05", "5 août", "Français — dissertation Camus", "Adam Chraibi", "AC", "Français", 160),
  mkTx("TC-9101", "2026-08-02", "2 août", "SVT — écosystèmes & biodiversité", "Malak Cherkaoui", "MC", "SVT", 175, "annulé"),
];

/* ---------- Invoices (teacher-issued) ---------- */

export type TeacherInvoiceStatus = "payée" | "en attente" | "annulée";

export type TeacherInvoice = {
  id: string;
  number: string;
  dateLabel: string;
  title: string;
  student: string;
  status: TeacherInvoiceStatus;
  total: number; // net teacher earned (after fee)
  data: InvoiceData;
};

const teacherBillTo = {
  name: "darso SAS · Espace Prof",
  address: "Casablanca Finance City\n20250 Casablanca",
  email: "compta@darso.ma",
};

export const mockTeacherInvoices: TeacherInvoice[] = [
  {
    id: "FT-2026-0912",
    number: "FT-2026-0912",
    dateLabel: "1 sept. 2026",
    title: "Séance · Analyse & suites",
    student: "Sara Bencheikh",
    status: "payée",
    total: 187,
    data: {
      number: "FT-2026-0912",
      issuedAt: "1 sept. 2026",
      status: "payé",
      billTo: teacherBillTo,
      items: [
        {
          id: "l1",
          label: "Séance particulière · Mathématiques",
          detail: "Élève : Sara Bencheikh · 60 min",
          qty: 1,
          unit: 155.83,
        },
      ],
      footer:
        "Facture émise par le prof à darso SAS · Rémunération nette après commission plateforme (15%).",
    },
  },
  {
    id: "FT-2026-0906",
    number: "FT-2026-0906",
    dateLabel: "31 août 2026",
    title: "Séance · Prépa MPSI",
    student: "Lina Ouazzani",
    status: "payée",
    total: 221,
    data: {
      number: "FT-2026-0906",
      issuedAt: "31 août 2026",
      status: "payé",
      billTo: teacherBillTo,
      items: [
        {
          id: "l1",
          label: "Séance particulière · Mathématiques",
          detail: "Élève : Lina Ouazzani · 90 min",
          qty: 1,
          unit: 184.17,
        },
      ],
    },
  },
  {
    id: "FT-2026-0898",
    number: "FT-2026-0898",
    dateLabel: "26 août 2026",
    title: "Séance · Thermodynamique",
    student: "Rachid Benhaddou",
    status: "en attente",
    total: 272,
    data: {
      number: "FT-2026-0898",
      issuedAt: "26 août 2026",
      dueAt: "10 sept. 2026",
      status: "en attente",
      billTo: teacherBillTo,
      items: [
        {
          id: "l1",
          label: "Séance particulière · Physique-Chimie",
          detail: "Élève : Rachid Benhaddou · 90 min",
          qty: 1,
          unit: 226.67,
        },
      ],
    },
  },
  {
    id: "FT-2026-0876",
    number: "FT-2026-0876",
    dateLabel: "18 août 2026",
    title: "Séance · Intégration par parties",
    student: "Yasmine Alaoui",
    status: "payée",
    total: 187,
    data: {
      number: "FT-2026-0876",
      issuedAt: "18 août 2026",
      status: "payé",
      billTo: teacherBillTo,
      items: [
        {
          id: "l1",
          label: "Séance particulière · Mathématiques",
          detail: "Élève : Yasmine Alaoui · 60 min",
          qty: 1,
          unit: 155.83,
        },
      ],
    },
  },
  {
    id: "FT-2026-0851",
    number: "FT-2026-0851",
    dateLabel: "11 août 2026",
    title: "Séance · Mécanique du solide",
    student: "Nadia Cherkaoui",
    status: "payée",
    total: 170,
    data: {
      number: "FT-2026-0851",
      issuedAt: "11 août 2026",
      status: "payé",
      billTo: teacherBillTo,
      items: [
        {
          id: "l1",
          label: "Séance particulière · Physique-Chimie",
          detail: "Élève : Nadia Cherkaoui · 60 min",
          qty: 1,
          unit: 141.67,
        },
      ],
    },
  },
];

/* ---------- Payout requests ---------- */

export type PayoutStatus = "en cours" | "versé" | "refusé";

export type PayoutRequest = {
  id: string;
  requestedAt: string; // label
  processedAt?: string;
  method: string; // e.g. "IBAN BMCE •• 4421"
  amount: number;
  fee: number;
  net: number;
  status: PayoutStatus;
};

export const mockPayoutRequests: PayoutRequest[] = [
  {
    id: "PO-2026-0089",
    requestedAt: "30 août 2026",
    processedAt: "1 sept. 2026",
    method: "IBAN BMCE •• 4421",
    amount: 3_500,
    fee: 20,
    net: 3_480,
    status: "versé",
  },
  {
    id: "PO-2026-0092",
    requestedAt: "1 sept. 2026",
    method: "IBAN BMCE •• 4421",
    amount: 1_200,
    fee: 20,
    net: 1_180,
    status: "en cours",
  },
  {
    id: "PO-2026-0084",
    requestedAt: "22 août 2026",
    processedAt: "24 août 2026",
    method: "CIH •• 7710",
    amount: 800,
    fee: 16,
    net: 784,
    status: "versé",
  },
  {
    id: "PO-2026-0080",
    requestedAt: "12 août 2026",
    processedAt: "13 août 2026",
    method: "CIH •• 7710",
    amount: 450,
    fee: 9,
    net: 441,
    status: "refusé",
  },
];

/* ---------- Payout methods ---------- */

export type PayoutMethodKind = "iban" | "cih";

export type PayoutMethod = {
  id: string;
  kind: PayoutMethodKind;
  bankName: string;
  label: string; // display label (e.g. IBAN masked)
  last4: string;
  holder: string;
  isDefault?: boolean;
};

export const mockPayoutMethods: PayoutMethod[] = [
  {
    id: "pmt-1",
    kind: "iban",
    bankName: "BMCE Bank of Africa",
    label: "MA64 011 810 000000 XX XX 4421",
    last4: "4421",
    holder: "Youssef Amrani",
    isDefault: true,
  },
  {
    id: "pmt-2",
    kind: "cih",
    bankName: "CIH Bank",
    label: "Compte courant •• 7710",
    last4: "7710",
    holder: "Youssef Amrani",
  },
];

/* ---------- Revenue by subject (donut) ---------- */

export type RevenueSlice = {
  label: string;
  value: number; // MAD this year
  color: string;
};

export const mockRevenueBySubject: RevenueSlice[] = [
  { label: "Mathématiques", value: 32_400, color: "#DFFF3F" },
  { label: "Physique-Chimie", value: 10_800, color: "#B5D3FF" },
  { label: "Français", value: 6_950, color: "#FFD7C2" },
  { label: "Anglais", value: 5_620, color: "#D5F2E3" },
  { label: "SVT", value: 3_980, color: "#FFE7A8" },
  { label: "Histoire-Géo", value: 2_400, color: "#E9D8FF" },
];
