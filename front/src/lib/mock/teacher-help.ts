import type { LucideIcon } from "lucide-react";
import {
  BadgeCheck,
  CalendarCheck2,
  Megaphone,
  Wallet,
} from "lucide-react";
import type { AccordionItemData } from "@/components/library/accordion";

/* ---------------- Teacher FAQ categories ---------------- */

export type TeacherFaqCategory = {
  id: string;
  label: string;
  count: number;
  icon: LucideIcon;
  blurb: string;
};

export const teacherFaqCategories: TeacherFaqCategory[] = [
  {
    id: "sessions",
    label: "Séances & élèves",
    count: 5,
    icon: CalendarCheck2,
    blurb: "Publier, animer, gérer les élèves.",
  },
  {
    id: "payments",
    label: "Paiements & fiscalité",
    count: 4,
    icon: Wallet,
    blurb: "Payouts, factures, CNSS & impôts.",
  },
  {
    id: "verification",
    label: "Vérification & compte",
    count: 4,
    icon: BadgeCheck,
    blurb: "Diplômes, badge vérifié, sécurité.",
  },
  {
    id: "marketing",
    label: "Marketing & profil",
    count: 4,
    icon: Megaphone,
    blurb: "Fiche pro, avis, visibilité.",
  },
];

/* ---------------- Teacher FAQ items ---------------- */

export const teacherFaqItems: (AccordionItemData & { categoryId: string })[] = [
  // Séances & élèves
  {
    id: "s1",
    categoryId: "sessions",
    question: "Comment publier une séance ou un pack ?",
    answer:
      "Depuis le tableau de bord, clique sur « Créer une séance ». Choisis la matière, le niveau, la durée et le tarif horaire. Ta séance apparaît dans le fil des élèves qui matchent ta spécialité sous 5 minutes.",
  },
  {
    id: "s2",
    categoryId: "sessions",
    question: "Que faire si un élève ne se connecte pas à la séance ?",
    answer:
      "Attends 10 minutes après l'heure prévue puis clique sur « Signaler une absence » dans la séance. Le tarif t'est intégralement versé au titre de l'indemnisation et l'incident est enregistré sur le profil de l'élève.",
  },
  {
    id: "s3",
    categoryId: "sessions",
    question: "Puis-je annuler ou reporter une séance sans pénalité ?",
    answer:
      "Une annulation gratuite est possible jusqu'à 24 h avant la séance depuis « Mes séances ». Au-delà, un malus de fiabilité est appliqué. Les reports sont toujours gratuits si l'élève accepte le nouveau créneau.",
  },
  {
    id: "s4",
    categoryId: "sessions",
    question: "Comment activer l'enregistrement de mes séances en visio ?",
    answer:
      "Va dans Profil → « Paramètres pédagogiques » et active « Enregistrement automatique ». L'élève doit consentir avant chaque séance. Les replays sont hébergés 30 jours puis supprimés automatiquement.",
  },
  {
    id: "s5",
    categoryId: "sessions",
    question: "Comment gérer les élèves récurrents ou en abonnement ?",
    answer:
      "Depuis la fiche d'un élève, clique sur « Proposer un pack ». Tu peux définir 5, 10 ou 20 séances avec une remise. Les paiements sont prélevés à la validation et libérés après chaque séance effectuée.",
  },

  // Paiements & fiscalité
  {
    id: "p1",
    categoryId: "payments",
    question: "Comment fixer mon tarif horaire ?",
    answer:
      "Dans Profil → « Tarification », renseigne ton tarif de référence en MAD/h. darso te suggère une fourchette en fonction de ta matière, ton niveau et la moyenne du marché. Tu peux appliquer des tarifs différents par niveau.",
  },
  {
    id: "p2",
    categoryId: "payments",
    question: "Quand suis-je payé après une séance ?",
    answer:
      "Les fonds sont sécurisés dès la réservation et libérés sur ton portefeuille darso 24 h après la fin de la séance. Les virements bancaires vers ton compte se font tous les mardis (délai bancaire : 1 à 2 jours).",
  },
  {
    id: "p3",
    categoryId: "payments",
    question: "Comment déclarer mes revenus à la CNSS ?",
    answer:
      "darso met à disposition un récapitulatif annuel téléchargeable depuis Revenus → « Documents fiscaux ». Ce document liste chaque séance et le total encaissé. Il est accepté par la CNSS et la DGI pour l'auto-entrepreneur.",
  },
  {
    id: "p4",
    categoryId: "payments",
    question: "Quelle commission darso prend sur chaque séance ?",
    answer:
      "La commission est de 15% sur les 3 premiers mois, puis dégressive : 12% après 20 séances, 10% après 50 séances. Aucun frais fixe, aucun abonnement — tu ne paies que sur les séances réellement effectuées.",
  },

  // Vérification & compte
  {
    id: "v1",
    categoryId: "verification",
    question: "Comment obtenir le badge « Prof vérifié » ?",
    answer:
      "Va dans Profil → « Vérification » et téléverse ton diplôme, ta pièce d'identité et un justificatif de domicile. Notre équipe vérifie sous 48 h ouvrées. Le badge augmente ton taux d'acceptation de 60% en moyenne.",
  },
  {
    id: "v2",
    categoryId: "verification",
    question: "Mes documents ont été refusés, que faire ?",
    answer:
      "Tu reçois un email détaillant le motif du refus (document illisible, expiré, non correspondant). Tu peux téléverser un nouveau document immédiatement — pas besoin de recommencer toute la procédure.",
  },
  {
    id: "v3",
    categoryId: "verification",
    question: "Comment activer la double authentification ?",
    answer:
      "Va dans Profil → « Sécurité » → « Authentification à deux facteurs ». Nous recommandons fortement l'application (Google Authenticator, Authy) plutôt que le SMS, notamment si tu gères plusieurs élèves et des revenus réguliers.",
  },
  {
    id: "v4",
    categoryId: "verification",
    question: "Puis-je exercer sous plusieurs matières ?",
    answer:
      "Oui, tu peux ajouter jusqu'à 3 matières principales dans Profil → « Spécialités ». Chaque matière peut demander une vérification distincte (diplôme ou attestation) selon le niveau enseigné.",
  },

  // Marketing & profil
  {
    id: "m1",
    categoryId: "marketing",
    question: "Comment optimiser ma fiche pour attirer plus d'élèves ?",
    answer:
      "Une photo pro, une bio de 3 lignes avec ta méthode pédagogique, et une vidéo de 60 s multiplient tes réservations par 3. Ajoute aussi tes diplômes et un exemple de séance type dans la section « Approche ».",
  },
  {
    id: "m2",
    categoryId: "marketing",
    question: "Comment obtenir plus d'avis d'élèves ?",
    answer:
      "Après chaque séance, l'élève reçoit une invitation à laisser un avis. Tu peux aussi lui envoyer un rappel gentil depuis la messagerie 3 jours après. Ne demande jamais un avis positif — cela peut entraîner une suspension.",
  },
  {
    id: "m3",
    categoryId: "marketing",
    question: "Comment répondre à un avis négatif ?",
    answer:
      "Depuis Profil → « Avis reçus », clique sur « Répondre publiquement ». Reste factuel, propose une solution et évite toute donnée personnelle sur l'élève. Une réponse professionnelle augmente ta crédibilité auprès des futurs élèves.",
  },
  {
    id: "m4",
    categoryId: "marketing",
    question: "Comment apparaître en tête des recommandations ?",
    answer:
      "Le classement combine ton taux de réponse (< 4 h), la note moyenne (> 4.5), le nombre de séances effectuées et le taux de reconduction. Un profil complet à 100% et une vidéo pro donnent aussi un boost immédiat.",
  },
];
