import type { SessionRowProps } from "@/components/app/session-row";

/* ---------- Teacher profile ---------- */

export const mockTeacher = {
  firstName: "Youssef",
  fullName: "Youssef Amrani",
  subjectSpecialty: "Mathématiques · Bac & Prépa",
  level: "Prof vérifié · Casablanca",
  bio: "Ancien élève des Mines, 8 ans d'enseignement. Spécialiste analyse & algèbre linéaire.",
  initials: "YA",
  avgRating: 4.9,
  referencePrice: 220, // MAD/h
};

/* ---------- Pending applications (students who applied to teacher's sessions/requests) ---------- */

export type PendingApplication = {
  id: string;
  student: { name: string; initials: string; level: string };
  targetTitle: string;
  targetKind: "course" | "request";
  offeredPrice: number;
  referencePrice: number;
  message: string;
  postedAgo: string;
};

export const mockPendingApplications: PendingApplication[] = [
  {
    id: "app-01",
    student: { name: "Sara Bencheikh", initials: "SB", level: "Terminale S" },
    targetTitle: "Bac 2026 · Analyse & suites numériques",
    targetKind: "course",
    offeredPrice: 220,
    referencePrice: 220,
    message: "J'aimerais préparer le contrôle continu du 12 sept — dérivées composées.",
    postedAgo: "il y a 4 min",
  },
  {
    id: "app-02",
    student: { name: "Amine Khattabi", initials: "AK", level: "1ère S" },
    targetTitle: "Séance ponctuelle · fonctions trigo",
    targetKind: "request",
    offeredPrice: 180,
    referencePrice: 220,
    message: "Séance de 45 min ce jeudi si possible. Cours du CNED à revoir.",
    postedAgo: "il y a 22 min",
  },
  {
    id: "app-03",
    student: { name: "Lina Ouazzani", initials: "LO", level: "Prépa MPSI" },
    targetTitle: "Cycle intensif · algèbre linéaire",
    targetKind: "course",
    offeredPrice: 260,
    referencePrice: 220,
    message: "Prête à payer plus pour un créneau ce week-end (samedi matin).",
    postedAgo: "il y a 1 h",
  },
  {
    id: "app-04",
    student: { name: "Mehdi Tazi", initials: "MT", level: "Terminale S" },
    targetTitle: "Bac 2026 · Analyse & suites numériques",
    targetKind: "course",
    offeredPrice: 200,
    referencePrice: 220,
    message: "Je bloque sur les récurrences. Peux-tu m'aider avant le DS ?",
    postedAgo: "il y a 2 h",
  },
  {
    id: "app-05",
    student: { name: "Yasmine Alaoui", initials: "YAl", level: "Terminale S" },
    targetTitle: "Séance ponctuelle · intégrales",
    targetKind: "request",
    offeredPrice: 220,
    referencePrice: 220,
    message: "Objectif : maîtriser IPP et changements de variable en 3 séances.",
    postedAgo: "il y a 3 h",
  },
  {
    id: "app-06",
    student: { name: "Karim El Fassi", initials: "KE", level: "Prépa PCSI" },
    targetTitle: "Cycle intensif · algèbre linéaire",
    targetKind: "course",
    offeredPrice: 240,
    referencePrice: 220,
    message: "Colle de maths dans 10 jours, je vise un 18/20.",
    postedAgo: "il y a 5 h",
  },
  {
    id: "app-07",
    student: { name: "Rania Benjelloun", initials: "RB", level: "1ère S" },
    targetTitle: "Séance ponctuelle · dérivées",
    targetKind: "request",
    offeredPrice: 160,
    referencePrice: 220,
    message: "Petit budget, séance de 30 min svp — juste des rappels.",
    postedAgo: "hier",
  },
  {
    id: "app-08",
    student: { name: "Othmane Berrada", initials: "OB", level: "Terminale S" },
    targetTitle: "Bac 2026 · Analyse & suites numériques",
    targetKind: "course",
    offeredPrice: 220,
    referencePrice: 220,
    message: "Je peux suivre ton créneau du mercredi 18h chaque semaine.",
    postedAgo: "hier",
  },
];

/* ---------- Matching requests (student posts matching teacher's domain) ---------- */

export type MatchingRequest = {
  id: string;
  author: { name: string; initials: string; level: string };
  subject: string;
  title: string;
  snippet: string;
  budget: number;
  deadlineLabel: string;
  proposalsCount: number;
};

export const mockMatchingRequests: MatchingRequest[] = [
  {
    id: "req-01",
    author: { name: "Ilyas Berrada", initials: "IB", level: "Terminale S" },
    subject: "Maths",
    title: "Bac blanc · préparer les probabilités conditionnelles",
    snippet: "Besoin de 4 séances d'ici fin septembre. Créneaux le soir 19h-20h.",
    budget: 200,
    deadlineLabel: "30 sept.",
    proposalsCount: 3,
  },
  {
    id: "req-02",
    author: { name: "Nour Sabri", initials: "NS", level: "Prépa MPSI" },
    subject: "Maths sup",
    title: "Colle hebdo · révision algèbre & espaces vectoriels",
    snippet: "Prépa intégrée à Casa, je cherche un colleur sérieux 1h/sem.",
    budget: 260,
    deadlineLabel: "récurrent",
    proposalsCount: 5,
  },
  {
    id: "req-03",
    author: { name: "Adam Chraibi", initials: "AC", level: "1ère S" },
    subject: "Maths",
    title: "Rattrapage · fonctions & dérivées, DS samedi",
    snippet: "Urgent — 2 séances cette semaine, en ligne c'est ok.",
    budget: 180,
    deadlineLabel: "6 sept.",
    proposalsCount: 2,
  },
  {
    id: "req-04",
    author: { name: "Salma Idrissi", initials: "SI", level: "Terminale S" },
    subject: "Maths",
    title: "Préparation concours · exercices type Bac + Sciences Po",
    snippet: "Objectif mention TB. J'ai déjà les annales, besoin de correction.",
    budget: 250,
    deadlineLabel: "juin 2026",
    proposalsCount: 7,
  },
  {
    id: "req-05",
    author: { name: "Hamza Ouali", initials: "HO", level: "Terminale S" },
    subject: "Maths",
    title: "Comprendre les intégrales une bonne fois pour toutes",
    snippet: "4 séances d'1h, méthodologie + exos guidés. Rabat ou en ligne.",
    budget: 210,
    deadlineLabel: "20 sept.",
    proposalsCount: 4,
  },
  {
    id: "req-06",
    author: { name: "Zineb Kabbaj", initials: "ZK", level: "Prépa PCSI" },
    subject: "Maths sup",
    title: "Suites récurrentes & convergence — méthodes rapides",
    snippet: "Colle vendredi, je veux les réflexes types en 2h.",
    budget: 280,
    deadlineLabel: "9 sept.",
    proposalsCount: 1,
  },
  {
    id: "req-07",
    author: { name: "Yassine Hamdouch", initials: "YH", level: "Terminale S" },
    subject: "Maths",
    title: "Logique et raisonnement par récurrence — je bloque",
    snippet: "Cours particulier hebdo, plutôt le mercredi après-midi.",
    budget: 190,
    deadlineLabel: "récurrent",
    proposalsCount: 6,
  },
  {
    id: "req-08",
    author: { name: "Malak Cherkaoui", initials: "MC", level: "1ère S" },
    subject: "Maths",
    title: "Passer de 12 à 16 en maths ce trimestre",
    snippet: "Bonne base mais je perds des points en rédaction. 3 séances test.",
    budget: 220,
    deadlineLabel: "fin trim.",
    proposalsCount: 3,
  },
];

/* ---------- Upcoming sessions (teacher's calendar) ---------- */

export const mockUpcomingSessions: SessionRowProps[] = [
  {
    when: "Aujourd'hui · 17:00",
    title: "Analyse — dérivées & fonction composée",
    teacher: "Sara Bencheikh",
    duration: "60 min",
    dot: "#C4CFFF",
    joinable: true,
  },
  {
    when: "Aujourd'hui · 19:30",
    title: "Prépa MPSI — algèbre linéaire",
    teacher: "Lina Ouazzani",
    duration: "90 min",
    dot: "#DFFF3F",
    joinable: false,
  },
  {
    when: "Demain · 16:00",
    title: "Bac blanc — probabilités conditionnelles",
    teacher: "Mehdi Tazi",
    duration: "60 min",
    dot: "#F0EDE4",
    joinable: false,
  },
  {
    when: "Demain · 18:30",
    title: "Suites récurrentes — méthodes rapides",
    teacher: "Zineb Kabbaj",
    duration: "45 min",
    dot: "#C4CFFF",
    joinable: false,
  },
  {
    when: "Jeu. · 17:00",
    title: "Analyse — intégration par parties",
    teacher: "Yasmine Alaoui",
    duration: "60 min",
    dot: "#DFFF3F",
    joinable: false,
  },
  {
    when: "Ven. · 20:00",
    title: "Trigo — cercle & formules d'addition",
    teacher: "Amine Khattabi",
    duration: "45 min",
    dot: "#F0EDE4",
    joinable: false,
  },
];

/* ---------- Unread messages ---------- */

export type TeacherMessagePreview = {
  name: string;
  initials: string;
  preview: string;
  time: string;
  unread: boolean;
};

export const mockUnreadTeacherMessages: TeacherMessagePreview[] = [
  {
    name: "Sara Bencheikh",
    initials: "SB",
    preview: "Merci pour la fiche ! Je révise ce soir et te dis 🙏",
    time: "8 min",
    unread: true,
  },
  {
    name: "Lina Ouazzani",
    initials: "LO",
    preview: "On peut avancer la séance de samedi à 10h ?",
    time: "42 min",
    unread: true,
  },
  {
    name: "Mehdi Tazi",
    initials: "MT",
    preview: "Question sur l'exercice 3 du DS — j'ai un doute sur la limite.",
    time: "2 h",
    unread: true,
  },
  {
    name: "Yasmine Alaoui",
    initials: "YAl",
    preview: "Parfait pour jeudi 17h. À très vite !",
    time: "5 h",
    unread: false,
  },
];

/* ---------- Unread notifications ---------- */

export type TeacherNotifPreview = {
  id: string;
  category: "session" | "payment" | "message" | "system";
  title: string;
  body?: string;
  time: string;
  unread: boolean;
};

export const mockUnreadTeacherNotifs: TeacherNotifPreview[] = [
  {
    id: "n-01",
    category: "payment",
    title: "Paiement reçu — 220 MAD",
    body: "Séance du 30 août avec Sara B. réglée via carte.",
    time: "1 h",
    unread: true,
  },
  {
    id: "n-02",
    category: "session",
    title: "Nouvelle réservation confirmée",
    body: "Karim E. a réservé le cycle intensif · algèbre linéaire.",
    time: "3 h",
    unread: true,
  },
  {
    id: "n-03",
    category: "system",
    title: "Ton profil a été vu 42 fois cette semaine",
    body: "Ajoute une vidéo de présentation pour +30% de conversions.",
    time: "hier",
    unread: false,
  },
];

/* ---------- Monthly stats ---------- */

export const mockMonthlyEarnings = 8_640; // MAD
export const mockSessionsThisMonth = 34;
export const mockAvgRating = 4.9;
