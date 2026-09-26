/**
 * Mock data for the teacher "Avis & notes" page (P3.e.i).
 *
 * Kept intentionally deterministic — no Date.now(), no random seeding — so
 * server/client renders stay in sync and Playwright snapshots don't flake.
 */

export type RatingBucket = 1 | 2 | 3 | 4 | 5;

export type RatingSummary = {
  avg: number;
  count: number;
  breakdown: Record<RatingBucket, number>;
};

export const mockRatingSummary: RatingSummary = {
  avg: 4.8,
  count: 128,
  breakdown: {
    5: 92,
    4: 24,
    3: 8,
    2: 3,
    1: 1,
  },
};

export type TeacherReview = {
  id: string;
  student: {
    name: string;
    initials: string;
    level: string;
  };
  subject: string;
  rating: RatingBucket;
  /** ISO date — rendered locally in fr-MA. */
  dateISO: string;
  title?: string;
  body: string;
  /** If present, the teacher already answered — the composer stays hidden. */
  teacherResponse?: string;
  /** Highlights the item with a subtle marker. */
  isNew?: boolean;
};

export const mockReviews: TeacherReview[] = [
  {
    id: "rv-01",
    student: {
      name: "Sara Bencheikh",
      initials: "SB",
      level: "Terminale S",
    },
    subject: "Analyse & suites numériques",
    rating: 5,
    dateISO: "2026-08-28",
    title: "Explications d'une clarté rare",
    body:
      "Youssef reprend les démonstrations pas à pas, sans jamais brûler d'étape. J'ai enfin compris la convergence des suites. Je le recommande à 200%.",
    isNew: true,
  },
  {
    id: "rv-02",
    student: {
      name: "Amine Khattabi",
      initials: "AK",
      level: "1ère S",
    },
    subject: "Fonctions trigonométriques",
    rating: 5,
    dateISO: "2026-08-25",
    title: "Prof structuré et patient",
    body:
      "Séance très bien préparée, avec un plan clair envoyé la veille. On a couvert tout le chapitre en 90 minutes. Résultats immédiats au contrôle.",
    teacherResponse:
      "Merci Amine ! Continue sur cette lancée pour les exercices type bac blanc, on refera un point avant décembre.",
  },
  {
    id: "rv-03",
    student: {
      name: "Yasmine El Idrissi",
      initials: "YE",
      level: "Prépa MPSI",
    },
    subject: "Algèbre linéaire",
    rating: 5,
    dateISO: "2026-08-22",
    body:
      "Approche très rigoureuse, adaptée au niveau prépa. Youssef propose systématiquement des exos d'entrainement en fin de séance. Un vrai plus.",
    isNew: true,
  },
  {
    id: "rv-04",
    student: {
      name: "Reda Belkacem",
      initials: "RB",
      level: "Terminale S",
    },
    subject: "Probabilités conditionnelles",
    rating: 4,
    dateISO: "2026-08-19",
    title: "Très bon, mais séance un peu dense",
    body:
      "Contenu excellent, mais on aurait pu répartir sur deux séances. J'ai eu du mal à tout digérer en une fois. Je referai une session ciblée bientôt.",
    teacherResponse:
      "Bien noté Reda — pour la prochaine on découpe en deux blocs de 60 min avec un quiz au milieu. Merci pour ton retour honnête.",
  },
  {
    id: "rv-05",
    student: {
      name: "Nour Chraibi",
      initials: "NC",
      level: "Terminale ES",
    },
    subject: "Statistiques descriptives",
    rating: 5,
    dateISO: "2026-08-15",
    title: "Pédagogue exceptionnel",
    body:
      "Youssef sait rendre les maths concrètes. On a travaillé sur des exemples liés à l'économie, ça m'a beaucoup aidée à visualiser. Merci !",
  },
  {
    id: "rv-06",
    student: {
      name: "Ilyas Berrada",
      initials: "IB",
      level: "2nde",
    },
    subject: "Équations & inéquations",
    rating: 4,
    dateISO: "2026-08-12",
    body:
      "Bonne séance, prof à l'écoute. Il aurait pu me donner un peu plus d'exercices à la maison pour ancrer les acquis.",
  },
  {
    id: "rv-07",
    student: {
      name: "Hajar Ouazzani",
      initials: "HO",
      level: "Terminale S",
    },
    subject: "Intégrales & primitives",
    rating: 5,
    dateISO: "2026-08-08",
    title: "Je passe de 11 à 16",
    body:
      "Trois mois de suivi et mes notes ont décollé. Youssef identifie très vite les points faibles et adapte le rythme. Prof à recommander.",
    teacherResponse:
      "Bravo Hajar, c'est le fruit de ton travail. On garde le cap pour le bac blanc de janvier !",
  },
  {
    id: "rv-08",
    student: {
      name: "Othmane Fassi",
      initials: "OF",
      level: "Prépa PCSI",
    },
    subject: "Espaces vectoriels",
    rating: 3,
    dateISO: "2026-08-04",
    title: "Correct mais rythme inégal",
    body:
      "Le fond est solide, mais j'ai trouvé le rythme parfois lent sur des notions que je maîtrisais déjà. Un mini-diagnostic en début de séance aiderait.",
  },
  {
    id: "rv-09",
    student: {
      name: "Salma Tazi",
      initials: "ST",
      level: "1ère S",
    },
    subject: "Dérivation",
    rating: 5,
    dateISO: "2026-07-30",
    body:
      "Séance en visio impeccable, tableau blanc partagé très clair. Youssef est disponible même hors séance pour clarifier un doute. Top.",
  },
  {
    id: "rv-10",
    student: {
      name: "Karim Alaoui",
      initials: "KA",
      level: "Terminale S",
    },
    subject: "Nombres complexes",
    rating: 4,
    dateISO: "2026-07-26",
    body:
      "Explications précises, bon usage de représentations géométriques. J'aurais aimé plus d'exercices type concours en fin de séance.",
    teacherResponse:
      "Merci Karim, on prévoit un pack d'exos concours pour la prochaine. Envoie-moi les annales que tu vises.",
  },
  {
    id: "rv-11",
    student: {
      name: "Mehdi Sabri",
      initials: "MS",
      level: "Prépa MPSI",
    },
    subject: "Suites récurrentes",
    rating: 5,
    dateISO: "2026-07-22",
    title: "Le meilleur prof que j'ai eu",
    body:
      "Rigueur mathématique impeccable, très bonne culture des concours. Youssef donne aussi de vrais conseils méthode pour organiser ses révisions.",
    isNew: true,
  },
  {
    id: "rv-12",
    student: {
      name: "Lina Bennani",
      initials: "LB",
      level: "Terminale ES",
    },
    subject: "Fonctions exponentielles",
    rating: 2,
    dateISO: "2026-07-18",
    title: "Séance décevante",
    body:
      "Le prof est arrivé avec un léger retard et on a eu des soucis techniques au début. Le contenu était bon mais la séance a été écourtée sans avoir revu la fin du chapitre.",
  },
  {
    id: "rv-13",
    student: {
      name: "Adam Rachidi",
      initials: "AR",
      level: "2nde",
    },
    subject: "Géométrie vectorielle",
    rating: 4,
    dateISO: "2026-07-14",
    body:
      "Bonne pédagogie, prof à l'écoute. On a fait beaucoup de dessins, ça m'a bien aidé à visualiser. Je reviendrai pour d'autres chapitres.",
  },
  {
    id: "rv-14",
    student: {
      name: "Zineb Chakir",
      initials: "ZC",
      level: "Terminale S",
    },
    subject: "Limites & continuité",
    rating: 5,
    dateISO: "2026-07-10",
    title: "Merci pour la mention TB",
    body:
      "Six mois de préparation avec Youssef et j'ai décroché mention Très Bien au bac. Sa méthode fonctionne, il faut juste s'accrocher aux devoirs qu'il donne.",
    teacherResponse:
      "Immense bravo Zineb ! Ton sérieux a fait toute la différence. Bonne continuation en prépa.",
  },
  {
    id: "rv-15",
    student: {
      name: "Anas Bouazza",
      initials: "AB",
      level: "1ère S",
    },
    subject: "Polynômes du second degré",
    rating: 4,
    dateISO: "2026-07-05",
    body:
      "Séance efficace, bonne progression. Un support PDF récapitulatif serait un plus pour réviser après coup.",
  },
];
