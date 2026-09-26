/* ---------- Teacher profile & settings mocks (P3.e.v) ---------- */

export type TeacherProfileMock = {
  fullName: string;
  firstName: string;
  lastName: string;
  username: string;
  initials: string;
  email: string;
  phone: string;
  dob: string; // ISO
  city: string;
  tagline: string;
  bio: string;
  subjectsTaught: string[];
  levelsTaught: string[];
  languagesSpoken: string[];
  hourlyRate: number; // MAD / hour
  availabilityHours: string;
  experience: number; // years
  diplomaHighlights: string[];
  avatarUrl: string | null;
  rating: number;
  reviewsCount: number;
};

export const mockTeacherProfile: TeacherProfileMock = {
  fullName: "Youssef Amrani",
  firstName: "Youssef",
  lastName: "Amrani",
  username: "youssef-amrani",
  initials: "YA",
  email: "youssef.amrani@example.com",
  phone: "+212 6 61 42 88 03",
  dob: "1992-04-14",
  city: "Casablanca",
  tagline: "Prof de Maths agrégé · Bac & Prépa",
  bio: "Ancien élève des Mines, agrégé de mathématiques, j'accompagne depuis 10 ans les élèves de Terminale et de prépa vers le concours. Approche méthodique : diagnostic, exercices ciblés, réflexes de rédaction.",
  subjectsTaught: ["Mathématiques", "Physique-Chimie"],
  levelsTaught: ["Lycée", "Prépa"],
  languagesSpoken: ["Français", "Arabe", "Anglais"],
  hourlyRate: 220,
  availabilityHours: "Lun-Ven 14-20h",
  experience: 10,
  diplomaHighlights: [],
  avatarUrl: null,
  rating: 4.8,
  reviewsCount: 128,
};

export type PayoutSettingsMock = {
  defaultMethodId: string;
  defaultMethodLabel: string;
  defaultMethodBank: string;
  defaultMethodMaskedIban: string;
  monthlyThreshold: number; // MAD
  autoPayoutEnabled: boolean;
};

export const mockPayoutSettings: PayoutSettingsMock = {
  defaultMethodId: "iban-1",
  defaultMethodLabel: "IBAN principal",
  defaultMethodBank: "BMCE Bank of Africa",
  defaultMethodMaskedIban: "MA64 •••• •••• •••• •••• 4421",
  monthlyThreshold: 500,
  autoPayoutEnabled: true,
};

/* ---------- Sessions (security section) ---------- */

export type TeacherSessionEntry = {
  id: string;
  device: string;
  where: string;
  last: string;
  current: boolean;
  kind: "desktop" | "mobile";
};

export const mockTeacherSessions: TeacherSessionEntry[] = [
  {
    id: "s1",
    device: "Chrome sur macOS",
    where: "Casablanca · MA",
    last: "Actif maintenant",
    current: true,
    kind: "desktop",
  },
  {
    id: "s2",
    device: "iPhone · Safari",
    where: "Rabat · MA",
    last: "Il y a 2 jours",
    current: false,
    kind: "mobile",
  },
];

/* ---------- Available options (chip pickers) ---------- */

export const AVAILABLE_SUBJECTS_TAUGHT = [
  "Mathématiques",
  "Physique-Chimie",
  "SVT",
  "Français",
  "Anglais",
  "Arabe",
  "Histoire-Géo",
  "Philosophie",
  "Économie",
  "Informatique",
];

export const AVAILABLE_LEVELS = ["Collège", "Lycée", "Prépa", "Sup"];

export const AVAILABLE_LANGUAGES = [
  "Français",
  "Arabe",
  "Anglais",
  "Espagnol",
  "Amazigh",
];
