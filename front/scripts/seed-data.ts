/**
 * The people the seed creates, and nothing else.
 *
 * Separated from the seed mechanics so the roster reads as data. Every entry
 * here traces back to a name that appears in `src/lib/mock/`; nothing is
 * invented except the fields the mocks never carried (birth dates, which the
 * mocks give for exactly two people, and emails, which they give for two).
 *
 * WHAT IS DELIBERATELY ABSENT
 * ---------------------------
 * No ratings, no review counts, no session counts, no "342 séances données",
 * no initials, no formatted French dates, no fee or net figures, no balances.
 * Every one of those is derived, and several of them disagree with themselves
 * across the mock files — the average rating for Youssef Amrani reads 4.9,
 * 4.8, 4.8 and 4.9 in four different files. Storing a derived value is how
 * that happens. See docs/decisions/06-data-reconciliation.md.
 *
 * COUNTRY
 * -------
 * The mocks are Moroccan throughout: MAD, Casablanca, Rabat, +212 numbers, CIH
 * and BMCE. `docs/agent-tasks/00-CONTEXT.md` records that the intended payment
 * gateway is Chargily, which is Algeria-only, and instructs "assume Algeria and
 * DZD unless told otherwise". Cities and phone prefixes below are therefore
 * Algerian. This is the single place that choice is expressed: flip the values
 * here and the seed is Moroccan again.
 */

/** Every seeded account shares this password. Development only. */
export const SEED_PASSWORD = "darso-dev-2026";

/** Emails use a reserved-looking domain so seed rows are unmistakable. */
export const SEED_EMAIL_DOMAIN = "darso.test";

/**
 * The clock the seed derives every timestamp from.
 *
 * 2026-09-02T14:00:00+01:00 is the anchor the message mocks already use
 * (`src/lib/mock/messages-helpers.ts` calls it MOCK_NOW) and the student
 * sessions page seeds its clock from the same instant. Reusing it keeps every
 * "il y a 2 h" in the codebase meaning the same thing.
 */
export const SEED_ANCHOR = "2026-09-02T14:00:00+01:00";

export type SeedTeacher = {
  slug: string;
  fullName: string;
  city: string;
  /** ISO date. Teachers are adults; none needs a guardian. */
  birthDate: string;
  phone: string | null;
  tagline: string | null;
  bio: string | null;
  /** Major units as the mocks wrote them; the seed converts to centimes. */
  hourlyRateMajor: number | null;
  yearsExperience: number | null;
  subjects: string[];
  levels: string[];
  languages: string[];
};

export type SeedStudent = {
  slug: string;
  fullName: string;
  city: string;
  birthDate: string;
  phone: string | null;
  /** "Terminale S" — the fine-grained label. `level` is the school tier. */
  classLabel: string | null;
  level: string | null;
  school: string | null;
  bio: string | null;
  subjects: string[];
  guardianName: string | null;
  guardianEmail: string | null;
};

/* ---------------------------------------------------------------------------
   Teachers
--------------------------------------------------------------------------- */

export const TEACHERS: SeedTeacher[] = [
  {
    slug: "youssef-amrani",
    fullName: "Youssef Amrani",
    city: "Alger",
    birthDate: "1992-04-14",
    phone: "+213 6 61 42 88 03",
    tagline: "Prof de Maths agrégé · Bac & Prépa",
    bio:
      "Ancien élève des Mines, agrégé de mathématiques, j'accompagne depuis 10 ans les élèves de Terminale et de prépa vers le concours. Approche méthodique : diagnostic, exercices ciblés, réflexes de rédaction.",
    hourlyRateMajor: 220,
    yearsExperience: 10,
    subjects: ["mathematiques", "physique-chimie"],
    levels: ["lycee", "prepa"],
    languages: ["francais", "arabe", "anglais"],
  },
  {
    slug: "nadia-cherkaoui",
    fullName: "Nadia Cherkaoui",
    city: "Alger",
    birthDate: "1987-11-03",
    phone: "+213 6 70 21 44 19",
    tagline: "Prof de Physique-Chimie · Bac & Prépa",
    bio:
      "Mécanique du solide, thermodynamique et ondes. Je travaille par TD guidés : on démonte l'énoncé ensemble avant d'écrire la première ligne.",
    hourlyRateMajor: 200,
    yearsExperience: 12,
    subjects: ["physique-chimie"],
    levels: ["lycee", "prepa"],
    languages: ["francais", "arabe"],
  },
  {
    slug: "marc-dupont",
    fullName: "Marc Dupont",
    city: "Oran",
    birthDate: "1979-06-22",
    phone: "+213 5 51 08 76 32",
    tagline: "Prof de Français · DELF B2 & EAF",
    bio:
      "Préparation à l'essai argumenté et au commentaire composé. Plans, connecteurs, gestion du temps : la méthode avant l'inspiration.",
    hourlyRateMajor: 250,
    yearsExperience: 18,
    subjects: ["francais"],
    levels: ["lycee"],
    languages: ["francais", "anglais"],
  },
  {
    slug: "karim-el-fassi",
    fullName: "Karim El Fassi",
    city: "Constantine",
    birthDate: "1990-02-08",
    phone: "+213 6 62 33 90 41",
    tagline: "Prof de SVT · Bac",
    bio:
      "Génétique, évolution et écosystèmes. Beaucoup de schémas, peu de par-cœur : on reconstruit le raisonnement à chaque fois.",
    hourlyRateMajor: 140,
    yearsExperience: 9,
    subjects: ["svt"],
    levels: ["college", "lycee"],
    languages: ["francais", "arabe"],
  },
  {
    slug: "emma-whitfield",
    fullName: "Emma Whitfield",
    city: "Alger",
    birthDate: "1985-09-30",
    phone: null,
    tagline: "English teacher · IELTS 7.0+",
    bio:
      "Speaking and writing intensive, with timed practice every session. I mark to the IELTS band descriptors so you always know where you stand.",
    hourlyRateMajor: 260,
    yearsExperience: 14,
    subjects: ["anglais"],
    levels: ["lycee", "prepa", "sup"],
    languages: ["anglais", "francais"],
  },
  {
    slug: "chloe-bernard",
    fullName: "Chloé Bernard",
    city: "Oran",
    birthDate: "1993-03-17",
    phone: "+213 5 50 44 12 87",
    tagline: "Prof de Français · commentaire & dissertation",
    bio:
      "EAF et méthodologie de l'écrit. On part de tes copies : ce qui coûte des points est presque toujours la structure, pas les idées.",
    hourlyRateMajor: 140,
    yearsExperience: 7,
    subjects: ["francais", "philosophie"],
    levels: ["lycee"],
    languages: ["francais"],
  },
  {
    slug: "rachid-benhaddou",
    fullName: "Rachid Benhaddou",
    city: "Alger",
    birthDate: "1981-12-05",
    phone: "+213 6 55 77 20 64",
    tagline: "Prof de Physique-Chimie · MPSI/PCSI",
    bio:
      "Thermodynamique et cinétique chimique en prépa. Rythme soutenu, exercices de concours dès la deuxième séance.",
    hourlyRateMajor: 320,
    yearsExperience: 20,
    subjects: ["physique-chimie", "mathematiques"],
    levels: ["prepa", "sup"],
    languages: ["francais", "arabe"],
  },
  {
    slug: "sofia-el-idrissi",
    fullName: "Sofia El Idrissi",
    city: "Blida",
    birthDate: "1995-07-11",
    phone: "+213 6 78 55 31 20",
    tagline: "Prof de Maths · Seconde & Première",
    bio:
      "Dérivées, étude de fonctions et second degré. Je reprends les bases sans le dire, en les glissant dans les exercices du chapitre en cours.",
    hourlyRateMajor: 160,
    yearsExperience: 5,
    subjects: ["mathematiques"],
    levels: ["college", "lycee"],
    languages: ["francais", "arabe"],
  },
  {
    slug: "leila-bennani",
    fullName: "Leila Bennani",
    city: "Alger",
    birthDate: "1994-01-26",
    phone: null,
    tagline: "Prof de SVT · Terminale",
    bio: "Spécialiste génétique et immunologie. Fiches de synthèse fournies après chaque séance.",
    hourlyRateMajor: 120,
    yearsExperience: 4,
    subjects: ["svt"],
    levels: ["lycee"],
    languages: ["francais", "arabe"],
  },
  {
    slug: "omar-zerouali",
    fullName: "Omar Zerouali",
    city: "Annaba",
    birthDate: "1976-05-19",
    phone: "+213 6 90 14 55 08",
    tagline: "Prof de SVT · 9 ans d'expérience",
    bio: "Préparation Bac SVT, plans de révision sur mesure et corrigés commentés.",
    hourlyRateMajor: 200,
    yearsExperience: 9,
    subjects: ["svt"],
    levels: ["lycee"],
    languages: ["francais", "arabe", "amazigh"],
  },
];

/* ---------------------------------------------------------------------------
   Students
   ---------------------------------------------------------------------------
   Birth dates are chosen to match the stated class in the 2026-27 school year,
   because the product gates a whole section of the profile page on age < 18.
   Seeding every student as an adult would make that section unreachable and
   the gate untestable.
--------------------------------------------------------------------------- */

export const STUDENTS: SeedStudent[] = [
  {
    slug: "sara-bencheikh",
    fullName: "Sara Bencheikh",
    city: "Alger",
    // The mock's own date. She turned 18 on 2026-05-14, so the parental
    // section no longer applies to her — see decision 11.
    birthDate: "2008-05-14",
    phone: "+213 6 12 34 56 78",
    classLabel: "Terminale S",
    level: "lycee",
    school: "Lycée Descartes",
    bio: "Terminale S · Lycée Descartes · Alger. Objectif prépa scientifique.",
    subjects: ["mathematiques", "physique-chimie", "francais"],
    guardianName: "Nadia Bencheikh",
    guardianEmail: "nadia.bencheikh@darso.test",
  },
  {
    slug: "omar-zeroual",
    fullName: "Omar Zeroual",
    city: "Alger",
    // Seconde, 15 today: the seeded minor, so the parental gate is exercisable.
    birthDate: "2011-03-08",
    phone: null,
    classLabel: "Seconde",
    level: "lycee",
    school: "Groupe scolaire La Résidence",
    bio: "Seconde. Je veux prendre de l'avance en géométrie dans l'espace.",
    subjects: ["mathematiques"],
    guardianName: "Farid Zeroual",
    guardianEmail: "farid.zeroual@darso.test",
  },
  {
    slug: "amine-khattabi",
    fullName: "Amine Khattabi",
    city: "Alger",
    birthDate: "2010-01-22",
    phone: null,
    classLabel: "1ère S",
    level: "lycee",
    school: "Lycée Lyautey",
    bio: "Première S. Fonctions trigonométriques et dérivées, surtout.",
    subjects: ["mathematiques"],
    guardianName: "Samira Khattabi",
    guardianEmail: "samira.khattabi@darso.test",
  },
  {
    slug: "lina-ouazzani",
    fullName: "Lina Ouazzani",
    city: "Alger",
    birthDate: "2007-09-14",
    phone: null,
    classLabel: "Prépa MPSI",
    level: "prepa",
    school: "Lycée Louis-le-Grand",
    bio: "MPSI. Algèbre linéaire et colles hebdomadaires.",
    subjects: ["mathematiques", "physique-chimie"],
    guardianName: null,
    guardianEmail: null,
  },
  {
    slug: "mehdi-tazi",
    fullName: "Mehdi Tazi",
    city: "Oran",
    birthDate: "2008-11-02",
    phone: null,
    classLabel: "Terminale S",
    level: "lycee",
    school: "Lycée Pasteur",
    bio: "Terminale S. Je bloque sur les récurrences.",
    subjects: ["mathematiques"],
    // Born November 2008, so still 17 during the autumn term: a Terminale class
    // legitimately contains both minors and adults, and the guardian rule
    // applies to him and not to his classmates. Kept deliberately, because it
    // is the case a seed of uniformly-adult students would never surface.
    guardianName: "Souad Tazi",
    guardianEmail: "souad.tazi@darso.test",
  },
  {
    slug: "yasmine-alaoui",
    fullName: "Yasmine Alaoui",
    city: "Alger",
    birthDate: "2008-06-30",
    phone: null,
    classLabel: "Terminale S",
    level: "lycee",
    school: "Lycée Descartes",
    bio: "Objectif : maîtriser IPP et changements de variable.",
    subjects: ["mathematiques"],
    guardianName: null,
    guardianEmail: null,
  },
  {
    slug: "rania-benjelloun",
    fullName: "Rania Benjelloun",
    city: "Blida",
    birthDate: "2010-04-17",
    phone: null,
    classLabel: "1ère S",
    level: "lycee",
    school: "Lycée Ibn Khaldoun",
    bio: "Première S. Petit budget, séances courtes et ciblées.",
    subjects: ["mathematiques"],
    guardianName: "Hakim Benjelloun",
    guardianEmail: "hakim.benjelloun@darso.test",
  },
  {
    slug: "ilyas-berrada",
    fullName: "Ilyas Berrada",
    city: "Alger",
    birthDate: "2008-02-11",
    phone: null,
    classLabel: "Terminale S",
    level: "lycee",
    school: "Lycée Descartes",
    bio: "Bac blanc : probabilités conditionnelles à consolider.",
    subjects: ["mathematiques"],
    guardianName: null,
    guardianEmail: null,
  },
  {
    slug: "nour-sabri",
    fullName: "Nour Sabri",
    city: "Alger",
    birthDate: "2007-05-28",
    phone: null,
    classLabel: "Prépa MPSI",
    level: "prepa",
    school: "Prépa intégrée",
    bio: "MPSI. Je cherche un colleur sérieux, 1h par semaine.",
    subjects: ["mathematiques"],
    guardianName: null,
    guardianEmail: null,
  },
  {
    slug: "zineb-kabbaj",
    fullName: "Zineb Kabbaj",
    city: "Constantine",
    birthDate: "2007-12-19",
    phone: null,
    classLabel: "Prépa PCSI",
    level: "prepa",
    school: "Lycée Al-Khawarizmi",
    bio: "PCSI. Suites récurrentes et convergence, en méthode rapide.",
    subjects: ["mathematiques", "physique-chimie"],
    guardianName: null,
    guardianEmail: null,
  },
  {
    slug: "anas-berrada",
    fullName: "Anas Berrada",
    city: "Oran",
    birthDate: "2008-08-05",
    phone: null,
    classLabel: "Terminale ES",
    level: "lycee",
    school: "Lycée Massignon",
    bio: "Terminale ES. Probabilités conditionnelles et statistiques.",
    subjects: ["mathematiques", "economie"],
    guardianName: null,
    guardianEmail: null,
  },
  {
    slug: "imane-tazi",
    fullName: "Imane Tazi",
    city: "Alger",
    birthDate: "2009-10-09",
    phone: null,
    classLabel: "Première S",
    level: "lycee",
    school: "Lycée Lyautey",
    bio: "Première S. Suites arithmético-géométriques.",
    subjects: ["mathematiques"],
    guardianName: "Rachida Tazi",
    guardianEmail: "rachida.tazi@darso.test",
  },
  {
    slug: "malak-cherkaoui",
    fullName: "Malak Cherkaoui",
    city: "Blida",
    birthDate: "2010-07-21",
    phone: null,
    classLabel: "1ère S",
    level: "lycee",
    school: "Lycée Ibn Khaldoun",
    bio: "Passer de 12 à 16 en maths ce trimestre. Je perds des points en rédaction.",
    subjects: ["mathematiques"],
    guardianName: "Younes Cherkaoui",
    guardianEmail: "younes.cherkaoui@darso.test",
  },
  {
    slug: "adam-chraibi",
    fullName: "Adam Chraibi",
    city: "Annaba",
    birthDate: "2010-02-14",
    phone: null,
    classLabel: "1ère S",
    level: "lycee",
    school: "Lycée Saint-Augustin",
    bio: "Rattrapage fonctions et dérivées, DS samedi.",
    subjects: ["mathematiques", "francais"],
    guardianName: "Nabil Chraibi",
    guardianEmail: "nabil.chraibi@darso.test",
  },
];

/* ---------------------------------------------------------------------------
   Devices — the "Sessions actives" list
   ---------------------------------------------------------------------------
   `last_seen_at` is an offset in minutes back from the anchor, so the rendered
   label ("Actif maintenant", "Il y a 2 jours") is computed rather than stored.
   `auth_session_id` stays null: no real browser session corresponds to a seeded
   row, and `current` is derived by comparing that column to the caller's JWT
   claim. A seeded device is therefore correctly never "Cet appareil".
--------------------------------------------------------------------------- */

export type SeedDevice = {
  ownerSlug: string;
  kind: "desktop" | "mobile";
  deviceLabel: string;
  city: string;
  countryCode: string;
  minutesAgo: number;
};

export const DEVICES: SeedDevice[] = [
  {
    ownerSlug: "youssef-amrani",
    kind: "desktop",
    deviceLabel: "Chrome sur macOS",
    city: "Alger",
    countryCode: "DZ",
    minutesAgo: 0,
  },
  {
    ownerSlug: "youssef-amrani",
    kind: "mobile",
    deviceLabel: "iPhone · Safari",
    city: "Oran",
    countryCode: "DZ",
    minutesAgo: 2 * 24 * 60,
  },
  {
    ownerSlug: "sara-bencheikh",
    kind: "desktop",
    deviceLabel: "Chrome sur Windows",
    city: "Alger",
    countryCode: "DZ",
    minutesAgo: 0,
  },
  {
    ownerSlug: "sara-bencheikh",
    kind: "mobile",
    deviceLabel: "iPhone · Safari",
    city: "Oran",
    countryCode: "DZ",
    minutesAgo: 3 * 24 * 60,
  },
];

/**
 * Names the mocks use on BOTH sides of the marketplace.
 *
 * `profiles.role` is one value per person and the composite foreign key makes
 * it immutable, so one human cannot be both. Each of these is seeded with the
 * role in which the mocks give them the most substance; the other appearance is
 * treated as a different person the mock authors happened to name the same.
 * Recorded here rather than silently resolved.
 */
export const ROLE_CONFLICTS = [
  "Karim El Fassi — SVT teacher in the student mocks, Prépa PCSI student applicant in the teacher mocks. Seeded as a teacher.",
  "Nadia Cherkaoui — Physique-Chimie teacher throughout, but the payee of teacher transaction TC-9120 as a student. Seeded as a teacher.",
  "Chloé Bernard — Français teacher in the student mocks, student in teacher transaction TC-9160. Seeded as a teacher.",
  "Emma Whitfield — English teacher, but a student in teacher transaction TC-9153. Seeded as a teacher.",
  "Rachid Benhaddou — Physique-Chimie teacher, but a student in teacher transactions TC-9166 and the FT-2026-0898 invoice. Seeded as a teacher.",
  "Karim El Fassi / Omar Zerouali vs Omar Zeroual — near-identical names for different people. Seeded as distinct rows.",
];
