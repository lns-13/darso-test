import {
  Bell,
  Bookmark,
  Calendar,
  CalendarClock,
  CreditCard,
  GraduationCap,
  HelpCircle,
  Home,
  MessageCircle,
  Search,
  ShieldCheck,
  Star,
  User,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export type NavItemConfig = {
  icon: LucideIcon;
  label: string;
  href?: string;
  badge?: number;
  active?: boolean;
};

export type NavGroupConfig = {
  label: string;
  items: NavItemConfig[];
};

export type NavConfig = NavGroupConfig[];

export type TabConfig = {
  icon: LucideIcon;
  label: string;
  href?: string;
  badge?: number;
  active?: boolean;
};

export const studentNav: NavConfig = [
  {
    label: "Apprendre",
    items: [
      { icon: Home, label: "Accueil", href: "/student" },
      { icon: Search, label: "Découvrir", href: "/student/discover" },
      { icon: Bookmark, label: "Favoris", href: "/student/favorites" },
      { icon: Calendar, label: "Mes séances", href: "/student/sessions" },
      { icon: CreditCard, label: "Paiements", href: "/student/payments" },
      { icon: Star, label: "Avis", href: "/student/reviews" },
      { icon: MessageCircle, label: "Messages", href: "/student/messages", badge: 2 },
    ],
  },
  {
    label: "Compte",
    items: [
      { icon: Bell, label: "Notifications", href: "/student/notifications", badge: 4 },
      { icon: HelpCircle, label: "Aide", href: "/student/help" },
      { icon: User, label: "Profil", href: "/student/profile" },
    ],
  },
];

export const studentMobileTabs: TabConfig[] = [
  { icon: Home, label: "Accueil", href: "/student" },
  { icon: GraduationCap, label: "Découvrir", href: "/student/discover" },
  { icon: Calendar, label: "Séances", href: "/student/sessions" },
  { icon: MessageCircle, label: "Messages", href: "/student/messages", badge: 2 },
  { icon: User, label: "Profil", href: "/student/profile" },
];

export const teacherNav: NavConfig = [
  {
    label: "Enseigner",
    items: [
      { icon: Home, label: "Tableau de bord", href: "/teacher" },
      { icon: Search, label: "Découvrir", href: "/teacher/discover" },
      { icon: CalendarClock, label: "Séances", href: "/teacher/sessions" },
      { icon: Wallet, label: "Revenus", href: "/teacher/earnings" },
      { icon: Star, label: "Avis", href: "/teacher/reviews" },
      { icon: MessageCircle, label: "Messages", href: "/teacher/messages" },
    ],
  },
  {
    label: "Profil",
    items: [
      { icon: ShieldCheck, label: "Vérification", href: "/teacher/verification" },
      { icon: Bell, label: "Notifications", href: "/teacher/notifications" },
      { icon: HelpCircle, label: "Aide", href: "/teacher/help" },
      { icon: User, label: "Profil", href: "/teacher/profile" },
      { icon: Users, label: "Agence", href: "/teacher/agency" },
    ],
  },
];

export const teacherMobileTabs: TabConfig[] = [
  { icon: Home, label: "Accueil", href: "/teacher" },
  { icon: Search, label: "Découvrir", href: "/teacher/discover" },
  { icon: CalendarClock, label: "Séances", href: "/teacher/sessions" },
  { icon: MessageCircle, label: "Messages", href: "/teacher/messages" },
  { icon: User, label: "Profil", href: "/teacher/profile" },
];
