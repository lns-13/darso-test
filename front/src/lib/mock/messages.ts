/**
 * Mock message data for P2.d — Student Messages.
 * Today anchor: 2026-09-02 (Wed). All ISO timestamps relative to this.
 */

export type MessageStatus = "sent" | "delivered" | "read";

export type MessageAttachment = {
  id: string;
  name: string;
  size?: string;
  kind: "pdf" | "image" | "link" | "audio";
  href?: string;
};

export type Message = {
  id: string;
  /** who sent it in the mock — "me" = the student, otherwise the participant id */
  from: "me" | string;
  content: string;
  time: string; // ISO
  status?: MessageStatus; // only meaningful for "me"
  attachments?: MessageAttachment[];
};

export type ThreadParticipant = {
  id: string;
  name: string;
  initials: string;
  role: string; // "Prof. Maths" / "DELF B2" ...
  lastSeen: string; // display string
  online?: boolean;
};

export type Thread = {
  id: string;
  participant: ThreadParticipant;
  lastMessage: string;
  lastMessageTime: string; // ISO
  unread: number;
  pinned?: boolean;
  messages: Message[];
};

/* --- helpers to keep timestamps readable --- */
const iso = (dayOffset: number, hh: number, mm: number) => {
  // dayOffset is negative for the past (mock today = 2026-09-02).
  const d = new Date(Date.UTC(2026, 8, 2 + dayOffset, hh - 1, mm, 0)); // +01:00 tz-ish
  return d.toISOString();
};

export const mockThreads: Thread[] = [
  {
    id: "t-youssef",
    participant: {
      id: "p-youssef",
      name: "Youssef Amrani",
      initials: "YA",
      role: "Prof. de Mathématiques",
      lastSeen: "en ligne",
      online: true,
    },
    lastMessage: "Parfait, on garde le créneau de 14h. À tout',",
    lastMessageTime: iso(0, 13, 12),
    unread: 2,
    pinned: true,
    messages: [
      {
        id: "m1",
        from: "p-youssef",
        content:
          "Salam Sara ! J'ai relu ton exercice sur les dérivées composées — il y a une petite erreur au 3.b, sinon c'est très propre.",
        time: iso(-1, 18, 4),
      },
      {
        id: "m2",
        from: "me",
        content: "Merci beaucoup ! Je regarde ça ce soir 🙏",
        time: iso(-1, 18, 22),
        status: "read",
      },
      {
        id: "m3",
        from: "me",
        content: "Est-ce qu'on peut décaler la séance de demain à 14h au lieu de 15h30 ?",
        time: iso(-1, 18, 22),
        status: "read",
      },
      {
        id: "m4",
        from: "p-youssef",
        content: "Oui pas de souci, 14h ça marche pour moi.",
        time: iso(-1, 19, 1),
      },
      {
        id: "m5",
        from: "p-youssef",
        content: "Prépare bien la fiche §3.2 et tes 3 questions bloquantes.",
        time: iso(-1, 19, 2),
      },
      {
        id: "m6",
        from: "me",
        content: "Noté 👍",
        time: iso(0, 9, 5),
        status: "read",
      },
      {
        id: "m7",
        from: "p-youssef",
        content: "Petit rappel : j'ai ajouté un TD corrigé dans le drive du cours.",
        time: iso(0, 13, 10),
        attachments: [
          { id: "a1", name: "TD-derivees-composees-correction.pdf", size: "820 Ko", kind: "pdf" },
        ],
      },
      {
        id: "m8",
        from: "p-youssef",
        content: "Parfait, on garde le créneau de 14h. À tout',",
        time: iso(0, 13, 12),
      },
    ],
  },
  {
    id: "t-marc",
    participant: {
      id: "p-marc",
      name: "Marc Dupont",
      initials: "MD",
      role: "Prof. de Français · DELF B2",
      lastSeen: "il y a 2 h",
    },
    lastMessage: "Ta correction est prête, on la voit à la prochaine séance.",
    lastMessageTime: iso(0, 11, 45),
    unread: 1,
    messages: [
      {
        id: "m1",
        from: "me",
        content:
          "Bonjour Monsieur, voici mon essai argumenté sur le télétravail. J'ai essayé d'utiliser les connecteurs qu'on a vus.",
        time: iso(-2, 20, 15),
        status: "read",
        attachments: [
          { id: "a1", name: "essai-teletravail-sara.pdf", size: "210 Ko", kind: "pdf" },
        ],
      },
      {
        id: "m2",
        from: "p-marc",
        content: "Bien reçu Sara, je regarde ça dans la semaine.",
        time: iso(-2, 21, 30),
      },
      {
        id: "m3",
        from: "p-marc",
        content: "Ta correction est prête, on la voit à la prochaine séance.",
        time: iso(0, 11, 45),
      },
    ],
  },
  {
    id: "t-nadia",
    participant: {
      id: "p-nadia",
      name: "Nadia Cherkaoui",
      initials: "NC",
      role: "Prof. de Physique-Chimie",
      lastSeen: "en ligne",
      online: true,
    },
    lastMessage: "Tu peux jeter un œil à ce schéma avant demain ?",
    lastMessageTime: iso(-1, 16, 40),
    unread: 0,
    messages: [
      {
        id: "m1",
        from: "p-nadia",
        content: "Salut Sara, prête pour le TD de mécanique du solide demain ?",
        time: iso(-1, 10, 12),
      },
      {
        id: "m2",
        from: "me",
        content: "Oui presque ! Je bloque encore sur le théorème du moment cinétique.",
        time: iso(-1, 10, 45),
        status: "read",
      },
      {
        id: "m3",
        from: "p-nadia",
        content:
          "On refera un exemple guidé au début. Regarde surtout la démo du pendule pesant, c'est le plus abordable.",
        time: iso(-1, 11, 2),
      },
      {
        id: "m4",
        from: "me",
        content: "Ok ça marche, merci !",
        time: iso(-1, 11, 4),
        status: "read",
      },
      {
        id: "m5",
        from: "p-nadia",
        content: "Tu peux jeter un œil à ce schéma avant demain ?",
        time: iso(-1, 16, 40),
        attachments: [
          { id: "a1", name: "pendule-pesant-schema.png", size: "180 Ko", kind: "image" },
        ],
      },
    ],
  },
  {
    id: "t-karim",
    participant: {
      id: "p-karim",
      name: "Karim El Fassi",
      initials: "KE",
      role: "Prof. de SVT",
      lastSeen: "il y a 1 j",
    },
    lastMessage: "Ok super, à jeudi alors 👋",
    lastMessageTime: iso(-2, 14, 10),
    unread: 0,
    messages: [
      {
        id: "m1",
        from: "me",
        content: "Bonjour, est-ce qu'on peut caler une séance sur la génétique jeudi soir ?",
        time: iso(-3, 19, 30),
        status: "read",
      },
      {
        id: "m2",
        from: "p-karim",
        content: "Bien sûr, 19h ça te va ?",
        time: iso(-3, 20, 15),
      },
      {
        id: "m3",
        from: "me",
        content: "Parfait 🙌",
        time: iso(-2, 8, 0),
        status: "read",
      },
      {
        id: "m4",
        from: "p-karim",
        content: "Ok super, à jeudi alors 👋",
        time: iso(-2, 14, 10),
      },
    ],
  },
  {
    id: "t-emma",
    participant: {
      id: "p-emma",
      name: "Emma Whitfield",
      initials: "EW",
      role: "Prof. Anglais · IELTS",
      lastSeen: "il y a 3 h",
    },
    lastMessage: "Great — I'll send the speaking prompts tonight.",
    lastMessageTime: iso(-1, 22, 5),
    unread: 0,
    messages: [
      {
        id: "m1",
        from: "p-emma",
        content: "Hi Sara! How did the mock speaking go last week?",
        time: iso(-4, 17, 0),
      },
      {
        id: "m2",
        from: "me",
        content: "Not bad, but I ran out of ideas on part 2 (describing a place).",
        time: iso(-4, 17, 12),
        status: "read",
      },
      {
        id: "m3",
        from: "p-emma",
        content:
          "That's really common. Let's do 3 timed part 2s next session — you'll get faster at brainstorming.",
        time: iso(-3, 9, 15),
      },
      {
        id: "m4",
        from: "me",
        content: "Sounds good! Can you send a few prompts I can practice with?",
        time: iso(-1, 20, 50),
        status: "read",
      },
      {
        id: "m5",
        from: "p-emma",
        content: "Great — I'll send the speaking prompts tonight.",
        time: iso(-1, 22, 5),
      },
    ],
  },
  {
    id: "t-chloe",
    participant: {
      id: "p-chloe",
      name: "Chloé Bernard",
      initials: "CB",
      role: "Prof. de Français",
      lastSeen: "il y a 5 j",
    },
    lastMessage: "Je te renvoie la fiche méthode dès que possible.",
    lastMessageTime: iso(-5, 12, 20),
    unread: 0,
    messages: [
      {
        id: "m1",
        from: "me",
        content:
          "Bonjour Madame, est-ce que vous avez encore la fiche méthode sur le commentaire composé ?",
        time: iso(-6, 18, 0),
        status: "read",
      },
      {
        id: "m2",
        from: "p-chloe",
        content: "Oui bien sûr, je te la retrouve.",
        time: iso(-6, 21, 15),
      },
      {
        id: "m3",
        from: "p-chloe",
        content: "Je te renvoie la fiche méthode dès que possible.",
        time: iso(-5, 12, 20),
      },
    ],
  },
  {
    id: "t-rachid",
    participant: {
      id: "p-rachid",
      name: "Rachid Benhaddou",
      initials: "RB",
      role: "Prof. de Physique-Chimie",
      lastSeen: "il y a 6 j",
    },
    lastMessage: "Pas de souci, on revoit ça la semaine pro.",
    lastMessageTime: iso(-6, 15, 30),
    unread: 0,
    messages: [
      {
        id: "m1",
        from: "p-rachid",
        content: "Tu as pu avancer sur le chapitre thermo ?",
        time: iso(-6, 12, 0),
      },
      {
        id: "m2",
        from: "me",
        content: "Un peu bloquée en fait 😅 on peut revoir ensemble ?",
        time: iso(-6, 13, 20),
        status: "read",
      },
      {
        id: "m3",
        from: "p-rachid",
        content: "Pas de souci, on revoit ça la semaine pro.",
        time: iso(-6, 15, 30),
      },
    ],
  },
];

export const currentStudentId = "me";
