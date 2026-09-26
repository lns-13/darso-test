/**
 * Mock message data for P3.e.vi — Teacher Messages.
 * Today anchor: 2026-09-02 (Wed). All ISO timestamps relative to this.
 * Mirrors the shape used by @/lib/mock/messages so ThreadList / MessageThread
 * work verbatim — only participants differ (STUDENTS here, plus optional
 * co-worker teachers gated by `agencyMembership`).
 */

import type { Message, Thread } from "@/lib/mock/messages";

/** Flag: hide the co-workers sub-tab unless the teacher belongs to an agency. */
export const agencyMembership = false;

/* --- helpers to keep timestamps readable --- */
const iso = (dayOffset: number, hh: number, mm: number) => {
  // dayOffset is negative for the past (mock today = 2026-09-02).
  const d = new Date(Date.UTC(2026, 8, 2 + dayOffset, hh - 1, mm, 0)); // +01:00 tz-ish
  return d.toISOString();
};

/* ================================================================
   STUDENTS — main inbox
   ================================================================ */

export const mockTeacherThreads: Thread[] = [
  {
    id: "ts-sara",
    participant: {
      id: "s-sara",
      name: "Sara Bencheikh",
      initials: "SB",
      role: "Terminale S · Lycée Descartes",
      lastSeen: "en ligne",
      online: true,
    },
    lastMessage: "Parfait, je serai là à 14h pile 🙏",
    lastMessageTime: iso(0, 13, 20),
    unread: 2,
    pinned: true,
    messages: [
      {
        id: "m1",
        from: "s-sara",
        content:
          "Bonjour Monsieur, j'ai fini l'exo sur les dérivées composées. J'ai un doute sur la 3.b, je vous envoie mon brouillon.",
        time: iso(-1, 18, 10),
        attachments: [
          { id: "a1", name: "brouillon-3b.pdf", size: "340 Ko", kind: "pdf" },
        ],
      },
      {
        id: "m2",
        from: "me",
        content:
          "Bien reçu Sara. Il y a effectivement une petite erreur au 3.b — tu as oublié de dériver l'argument. Sinon c'est très propre.",
        time: iso(-1, 18, 40),
        status: "read",
      },
      {
        id: "m3",
        from: "s-sara",
        content: "Ahhh oui je vois ! Merci. On peut décaler la séance à 14h demain ?",
        time: iso(-1, 19, 2),
      },
      {
        id: "m4",
        from: "me",
        content: "Oui pas de souci, 14h ça marche. Prépare la fiche §3.2.",
        time: iso(-1, 19, 5),
        status: "read",
      },
      {
        id: "m5",
        from: "s-sara",
        content: "Noté 👍",
        time: iso(0, 9, 10),
      },
      {
        id: "m6",
        from: "s-sara",
        content: "Parfait, je serai là à 14h pile 🙏",
        time: iso(0, 13, 20),
      },
    ],
  },
  {
    id: "ts-mehdi",
    participant: {
      id: "s-mehdi",
      name: "Mehdi Alaoui",
      initials: "MA",
      role: "Prépa MPSI · Lycée Louis-le-Grand",
      lastSeen: "il y a 20 min",
    },
    lastMessage: "Merci pour la correction, je regarde ce soir.",
    lastMessageTime: iso(0, 12, 5),
    unread: 0,
    messages: [
      {
        id: "m1",
        from: "s-mehdi",
        content:
          "Monsieur, je bloque sur l'exercice 4 du DM (endomorphismes nilpotents). J'ai essayé la récurrence mais je patine.",
        time: iso(-1, 21, 30),
      },
      {
        id: "m2",
        from: "me",
        content:
          "Regarde plutôt la suite (Ker u^k). Elle est croissante et stationne — c'est la clé.",
        time: iso(-1, 22, 0),
        status: "read",
      },
      {
        id: "m3",
        from: "s-mehdi",
        content: "Ahh oui je vois, avec le lemme du cours. Je réessaie et je vous dis.",
        time: iso(-1, 22, 15),
      },
      {
        id: "m4",
        from: "me",
        content: "Voilà la correction rédigée, à comparer avec la tienne.",
        time: iso(0, 11, 40),
        status: "read",
        attachments: [
          { id: "a1", name: "correction-dm4-nilpotents.pdf", size: "512 Ko", kind: "pdf" },
        ],
      },
      {
        id: "m5",
        from: "s-mehdi",
        content: "Merci pour la correction, je regarde ce soir.",
        time: iso(0, 12, 5),
      },
    ],
  },
  {
    id: "ts-imane",
    participant: {
      id: "s-imane",
      name: "Imane Tazi",
      initials: "IT",
      role: "Première S · Lycée Lyautey",
      lastSeen: "il y a 2 h",
    },
    lastMessage: "Ok super, à mardi 18h alors !",
    lastMessageTime: iso(0, 10, 30),
    unread: 0,
    messages: [
      {
        id: "m1",
        from: "s-imane",
        content:
          "Bonjour Monsieur, est-ce qu'on peut caler une séance sur les suites arithmético-géométriques ?",
        time: iso(-2, 19, 15),
      },
      {
        id: "m2",
        from: "me",
        content: "Bien sûr. Mardi 18h ça te va ?",
        time: iso(-2, 20, 0),
        status: "read",
      },
      {
        id: "m3",
        from: "s-imane",
        content: "Parfait !",
        time: iso(-1, 8, 45),
      },
      {
        id: "m4",
        from: "s-imane",
        content: "Ok super, à mardi 18h alors !",
        time: iso(0, 10, 30),
      },
    ],
  },
  {
    id: "ts-anas",
    participant: {
      id: "s-anas",
      name: "Anas Berrada",
      initials: "AB",
      role: "Terminale ES · Lycée Massignon",
      lastSeen: "il y a 5 h",
    },
    lastMessage: "D'accord, je révise les probas conditionnelles d'ici là.",
    lastMessageTime: iso(-1, 20, 10),
    unread: 0,
    messages: [
      {
        id: "m1",
        from: "me",
        content:
          "Anas, pour vendredi on attaque les probas conditionnelles. Révise le cours §2 et §3 stp.",
        time: iso(-2, 17, 0),
        status: "read",
      },
      {
        id: "m2",
        from: "s-anas",
        content: "Ok noté ! J'aurai le temps mercredi soir.",
        time: iso(-2, 19, 30),
      },
      {
        id: "m3",
        from: "me",
        content: "Nickel. Envoie-moi tes questions bloquantes avant la séance.",
        time: iso(-1, 9, 0),
        status: "read",
      },
      {
        id: "m4",
        from: "s-anas",
        content: "D'accord, je révise les probas conditionnelles d'ici là.",
        time: iso(-1, 20, 10),
      },
    ],
  },
  {
    id: "ts-lina",
    participant: {
      id: "s-lina",
      name: "Lina Benjelloun",
      initials: "LB",
      role: "Prépa PCSI · Lycée Al-Khawarizmi",
      lastSeen: "il y a 1 j",
    },
    lastMessage: "Merci Monsieur, je vais bosser ça sérieusement.",
    lastMessageTime: iso(-1, 14, 55),
    unread: 0,
    messages: [
      {
        id: "m1",
        from: "s-lina",
        content:
          "Bonjour Monsieur, j'ai eu 8/20 au DS de maths, je suis vraiment démotivée…",
        time: iso(-2, 20, 45),
      },
      {
        id: "m2",
        from: "me",
        content:
          "Ne le prends pas comme ça. Envoie-moi la copie, on regarde ensemble ce qui a lâché.",
        time: iso(-2, 21, 5),
        status: "read",
      },
      {
        id: "m3",
        from: "s-lina",
        content: "Voilà ma copie 🙏",
        time: iso(-1, 10, 30),
        attachments: [
          { id: "a1", name: "DS-analyse-lina.pdf", size: "1.2 Mo", kind: "pdf" },
        ],
      },
      {
        id: "m4",
        from: "me",
        content:
          "Bon, en fait tu maîtrises les techniques mais tu perds du temps sur les questions faciles. On refera 2 séances de gestion du temps.",
        time: iso(-1, 14, 20),
        status: "read",
      },
      {
        id: "m5",
        from: "s-lina",
        content: "Merci Monsieur, je vais bosser ça sérieusement.",
        time: iso(-1, 14, 55),
      },
    ],
  },
  {
    id: "ts-omar",
    participant: {
      id: "s-omar",
      name: "Omar Zeroual",
      initials: "OZ",
      role: "Seconde · Groupe scolaire La Résidence",
      lastSeen: "il y a 3 j",
    },
    lastMessage: "Ok, à samedi alors 👋",
    lastMessageTime: iso(-3, 16, 10),
    unread: 0,
    messages: [
      {
        id: "m1",
        from: "me",
        content: "Omar, tu confirmes la séance samedi 10h sur la géométrie dans l'espace ?",
        time: iso(-4, 18, 30),
        status: "read",
      },
      {
        id: "m2",
        from: "s-omar",
        content: "Oui c'est bon pour moi.",
        time: iso(-3, 9, 15),
      },
      {
        id: "m3",
        from: "me",
        content: "Parfait. Prépare tes questions et la fiche exos p.142.",
        time: iso(-3, 12, 0),
        status: "read",
      },
      {
        id: "m4",
        from: "s-omar",
        content: "Ok, à samedi alors 👋",
        time: iso(-3, 16, 10),
      },
    ],
  },
  {
    id: "ts-yasmine",
    participant: {
      id: "s-yasmine",
      name: "Yasmine El Idrissi",
      initials: "YE",
      role: "Terminale S · Lycée Chatelet",
      lastSeen: "il y a 5 j",
    },
    lastMessage: "Merci beaucoup pour vos conseils !",
    lastMessageTime: iso(-5, 19, 45),
    unread: 0,
    messages: [
      {
        id: "m1",
        from: "s-yasmine",
        content:
          "Bonjour Monsieur, je voulais vous remercier — j'ai eu 17 au bac blanc grâce à vos séances 🙏",
        time: iso(-5, 18, 0),
      },
      {
        id: "m2",
        from: "me",
        content: "Bravo Yasmine, c'est ton travail ! Continue comme ça pour le bac.",
        time: iso(-5, 19, 20),
        status: "read",
      },
      {
        id: "m3",
        from: "s-yasmine",
        content: "Merci beaucoup pour vos conseils !",
        time: iso(-5, 19, 45),
      },
    ],
  },
];

/* ================================================================
   CO-WORKERS — fellow teachers (only surfaced if agencyMembership)
   ================================================================ */

export const mockCoWorkerThreads: Thread[] = [
  {
    id: "tc-nadia",
    participant: {
      id: "c-nadia",
      name: "Nadia Cherkaoui",
      initials: "NC",
      role: "Prof. Physique · Agence Al-Massar",
      lastSeen: "en ligne",
      online: true,
    },
    lastMessage: "On synchronise nos plannings pour la rentrée ?",
    lastMessageTime: iso(0, 11, 5),
    unread: 1,
    messages: [
      {
        id: "m1",
        from: "c-nadia",
        content:
          "Salam Youssef, j'ai plusieurs élèves de Terminale S qui galèrent en maths, tu prends encore ?",
        time: iso(-1, 15, 30),
      },
      {
        id: "m2",
        from: "me",
        content: "Salam Nadia, oui j'ai encore 2 créneaux le samedi. Envoie-moi les profils.",
        time: iso(-1, 16, 0),
        status: "read",
      },
      {
        id: "m3",
        from: "c-nadia",
        content: "Top, je te transfère ça. On synchronise nos plannings pour la rentrée ?",
        time: iso(0, 11, 5),
      },
    ],
  },
  {
    id: "tc-karim",
    participant: {
      id: "c-karim",
      name: "Karim El Fassi",
      initials: "KE",
      role: "Prof. SVT · Agence Al-Massar",
      lastSeen: "il y a 4 h",
    },
    lastMessage: "Merci, on partage ça au meeting de vendredi.",
    lastMessageTime: iso(-1, 18, 20),
    unread: 0,
    messages: [
      {
        id: "m1",
        from: "c-karim",
        content:
          "Salut Youssef, tu utilises quelle plateforme pour les visios de groupe ? La mienne rame.",
        time: iso(-1, 17, 0),
      },
      {
        id: "m2",
        from: "me",
        content: "Je suis passé sur Whereby, aucun souci depuis 3 mois.",
        time: iso(-1, 17, 45),
        status: "read",
      },
      {
        id: "m3",
        from: "c-karim",
        content: "Merci, on partage ça au meeting de vendredi.",
        time: iso(-1, 18, 20),
      },
    ],
  },
  {
    id: "tc-emma",
    participant: {
      id: "c-emma",
      name: "Emma Whitfield",
      initials: "EW",
      role: "Prof. Anglais · Agence Al-Massar",
      lastSeen: "il y a 1 j",
    },
    lastMessage: "Great, I'll email the parent tomorrow.",
    lastMessageTime: iso(-1, 20, 0),
    unread: 0,
    messages: [
      {
        id: "m1",
        from: "c-emma",
        content:
          "Hey Youssef, I have a parent asking for a maths + english combo package. Would you co-teach?",
        time: iso(-1, 19, 15),
      },
      {
        id: "m2",
        from: "me",
        content: "Sure, let's talk numbers Friday.",
        time: iso(-1, 19, 40),
        status: "read",
      },
      {
        id: "m3",
        from: "c-emma",
        content: "Great, I'll email the parent tomorrow.",
        time: iso(-1, 20, 0),
      },
    ],
  },
];
