import type { NotificationCategory } from "@/components/app/notification-row";

/* ---------------- Types ---------------- */

export type TeacherNotifBucket = "today" | "yesterday" | "week";

export type TeacherNotification = {
  id: string;
  category: NotificationCategory;
  title: string;
  body?: string;
  time: string;
  bucket: TeacherNotifBucket;
  unread: boolean;
  avatar?: { name: string; initials: string };
  action?: { label: string; href?: string };
};

/* ---------------- Notifications ---------------- */
/**
 * Teacher-flavored notifications. Category mapping:
 *   - session  → "Demandes" (candidatures/réservations sur les séances)
 *   - payment  → "Paiements" (retraits, virements, versements)
 *   - message  → messages élèves
 *   - system   → "Séances" (rappels de créneaux, changements) + système
 * The UI derives the "Demandes / Paiements / Séances" tab labels from the
 * combination of category + intent — see teacher/notifications/page.tsx.
 */
export const mockTeacherNotifications: TeacherNotification[] = [
  {
    id: "tn-01",
    category: "session",
    title: "Nouvelle candidature — Lina Ouazzani sur ta séance de Maths",
    body: "Prépa MPSI · propose 260 MAD pour le cycle intensif d'algèbre linéaire.",
    time: "Il y a 6 min",
    bucket: "today",
    unread: true,
    avatar: { name: "Lina Ouazzani", initials: "LO" },
    action: { label: "Voir la demande", href: "/teacher/discover" },
  },
  {
    id: "tn-02",
    category: "system",
    title: "Rappel — Aujourd'hui à 14h avec Sara",
    body: "Analyse · dérivées & fonction composée. Prépare tes exos de la semaine.",
    time: "Il y a 25 min",
    bucket: "today",
    unread: true,
    action: { label: "Ouvrir la séance", href: "/teacher/sessions" },
  },
  {
    id: "tn-03",
    category: "payment",
    title: "Retrait de 4 800 MAD confirmé sur BMCE ***4820",
    body: "Ton virement arrive sous 24-48 h ouvrées.",
    time: "Il y a 1 h",
    bucket: "today",
    unread: true,
    action: { label: "Reçu", href: "/teacher/earnings" },
  },
  {
    id: "tn-04",
    category: "message",
    title: "Sara Bencheikh",
    body: "Merci pour la correction — j'ai enfin compris la démarche pour les IPP.",
    time: "Il y a 2 h",
    bucket: "today",
    unread: true,
    avatar: { name: "Sara Bencheikh", initials: "SB" },
    action: { label: "Répondre", href: "/teacher/discover" },
  },
  {
    id: "tn-05",
    category: "session",
    title: "Nouvelle candidature — Amine Khattabi sur ta séance ponctuelle",
    body: "1ère S · propose 180 MAD pour un cours sur les fonctions trigo.",
    time: "Il y a 3 h",
    bucket: "today",
    unread: false,
    avatar: { name: "Amine Khattabi", initials: "AK" },
    action: { label: "Répondre", href: "/teacher/discover" },
  },
  {
    id: "tn-06",
    category: "system",
    title: "Ta vérification finale est approuvée",
    body: "Badge Prof vérifié activé — tu apparais désormais en haut des recherches.",
    time: "Il y a 5 h",
    bucket: "today",
    unread: false,
    action: { label: "Voir mon profil", href: "/teacher/stats" },
  },
  {
    id: "tn-07",
    category: "payment",
    title: "Paiement reçu — 220 MAD",
    body: "Séance du 01/09 avec Sara Bencheikh, réglée par carte.",
    time: "Hier · 20:14",
    bucket: "yesterday",
    unread: false,
    action: { label: "Détails", href: "/teacher/earnings" },
  },
  {
    id: "tn-08",
    category: "session",
    title: "Réservation confirmée — Karim El Fassi",
    body: "Cycle intensif algèbre linéaire · démarrage samedi 10h.",
    time: "Hier · 17:42",
    bucket: "yesterday",
    unread: false,
    avatar: { name: "Karim El Fassi", initials: "KE" },
    action: { label: "Voir", href: "/teacher/sessions" },
  },
  {
    id: "tn-09",
    category: "message",
    title: "Mehdi Tazi",
    body: "Question sur l'exercice 3 du DS — j'ai un doute sur la limite en +∞.",
    time: "Hier · 15:08",
    bucket: "yesterday",
    unread: false,
    avatar: { name: "Mehdi Tazi", initials: "MT" },
    action: { label: "Répondre", href: "/teacher/discover" },
  },
  {
    id: "tn-10",
    category: "system",
    title: "Séance déplacée — Zineb Kabbaj",
    body: "L'élève a demandé à déplacer la séance de vendredi 20h à samedi 11h.",
    time: "Hier · 11:20",
    bucket: "yesterday",
    unread: false,
    action: { label: "Accepter", href: "/teacher/sessions" },
  },
  {
    id: "tn-11",
    category: "payment",
    title: "Versement mensuel de 8 640 MAD prêt à retirer",
    body: "Solde disponible sur ton portefeuille Darso.",
    time: "Hier · 08:00",
    bucket: "yesterday",
    unread: false,
    action: { label: "Retirer", href: "/teacher/earnings" },
  },
  {
    id: "tn-12",
    category: "session",
    title: "Nouvelle candidature — Yasmine Alaoui",
    body: "Terminale S · souhaite 3 séances autour des intégrales (IPP + changement de variable).",
    time: "Lun. · 21:05",
    bucket: "week",
    unread: false,
    avatar: { name: "Yasmine Alaoui", initials: "YA" },
    action: { label: "Voir", href: "/teacher/discover" },
  },
  {
    id: "tn-13",
    category: "message",
    title: "Nour Sabri",
    body: "Salut Youssef ! Toujours partant pour la colle hebdo de samedi ?",
    time: "Lun. · 18:22",
    bucket: "week",
    unread: false,
    avatar: { name: "Nour Sabri", initials: "NS" },
    action: { label: "Répondre", href: "/teacher/discover" },
  },
  {
    id: "tn-14",
    category: "payment",
    title: "IBAN mis à jour avec succès",
    body: "Tes prochains retraits arriveront sur BMCE ***4820.",
    time: "Dim. · 10:45",
    bucket: "week",
    unread: false,
  },
  {
    id: "tn-15",
    category: "system",
    title: "Séance annulée — Rania Benjelloun",
    body: "L'élève a annulé le créneau du 30/08 · aucun impact sur ton score.",
    time: "Dim. · 09:12",
    bucket: "week",
    unread: false,
  },
  {
    id: "tn-16",
    category: "session",
    title: "Nouvelle candidature — Othmane Berrada",
    body: "Terminale S · propose de suivre ton créneau hebdo du mercredi 18h.",
    time: "Sam. · 16:30",
    bucket: "week",
    unread: false,
    avatar: { name: "Othmane Berrada", initials: "OB" },
    action: { label: "Voir", href: "/teacher/discover" },
  },
  {
    id: "tn-17",
    category: "system",
    title: "Ton profil a été vu 42 fois cette semaine",
    body: "Ajoute une vidéo de présentation pour +30% de conversions.",
    time: "Sam. · 09:10",
    bucket: "week",
    unread: false,
    action: { label: "Compléter", href: "/teacher/stats" },
  },
  {
    id: "tn-18",
    category: "message",
    title: "Ilyas Berrada",
    body: "Peux-tu me confirmer les 4 créneaux pour la prépa Bac blanc ?",
    time: "Ven. · 19:58",
    bucket: "week",
    unread: false,
    avatar: { name: "Ilyas Berrada", initials: "IB" },
    action: { label: "Répondre", href: "/teacher/discover" },
  },
];

/* ---------------- Settings ---------------- */

export type TeacherPrefChannel = "email" | "push" | "sms";
export type TeacherPrefCategory = "session" | "payment" | "reminder" | "marketing";

export type TeacherPrefRow = {
  id: string;
  category: TeacherPrefCategory;
  title: string;
  body: string;
  channels: Record<TeacherPrefChannel, boolean>;
};

export const mockTeacherNotificationSettings: TeacherPrefRow[] = [
  // Demandes
  {
    id: "d-new-applications",
    category: "session",
    title: "Nouvelles candidatures",
    body: "Quand un élève postule à une séance ou à une demande matchée.",
    channels: { email: true, push: true, sms: true },
  },
  {
    id: "d-matching-requests",
    category: "session",
    title: "Demandes qui matchent",
    body: "Nouveaux posts d'élèves dans ta spécialité.",
    channels: { email: true, push: true, sms: false },
  },
  {
    id: "d-application-updates",
    category: "session",
    title: "Réponses & confirmations",
    body: "Quand un élève confirme, décline ou modifie sa candidature.",
    channels: { email: true, push: true, sms: false },
  },

  // Paiements
  {
    id: "p-received",
    category: "payment",
    title: "Paiements reçus",
    body: "Confirmation après chaque séance réglée.",
    channels: { email: true, push: true, sms: false },
  },
  {
    id: "p-payouts",
    category: "payment",
    title: "Virements & retraits",
    body: "Suivi de tes versements vers ton IBAN.",
    channels: { email: true, push: true, sms: true },
  },
  {
    id: "p-invoicing",
    category: "payment",
    title: "Factures & fiscalité",
    body: "Récap mensuel et rappels administratifs.",
    channels: { email: true, push: false, sms: false },
  },

  // Séances
  {
    id: "s-reminders",
    category: "reminder",
    title: "Rappels de séances",
    body: "24 h et 1 h avant chaque cours planifié.",
    channels: { email: true, push: true, sms: true },
  },
  {
    id: "s-changes",
    category: "reminder",
    title: "Changements & annulations",
    body: "Quand un élève déplace ou annule un créneau.",
    channels: { email: true, push: true, sms: false },
  },
  {
    id: "s-reviews",
    category: "reminder",
    title: "Avis & notes reçues",
    body: "Notification quand un élève laisse un avis.",
    channels: { email: true, push: true, sms: false },
  },

  // Marketing
  {
    id: "mk-tips",
    category: "marketing",
    title: "Conseils pédagogiques",
    body: "Bonnes pratiques et retours d'expérience de la communauté.",
    channels: { email: true, push: false, sms: false },
  },
  {
    id: "mk-news",
    category: "marketing",
    title: "Nouveautés produit",
    body: "Fonctionnalités et améliorations Darso pour les profs.",
    channels: { email: true, push: false, sms: false },
  },
  {
    id: "mk-referral",
    category: "marketing",
    title: "Parrainage & bonus",
    body: "Programmes de parrainage et primes ponctuelles.",
    channels: { email: false, push: false, sms: false },
  },
];
