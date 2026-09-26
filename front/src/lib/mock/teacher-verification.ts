/* ================================================================
   Mock data for P3.e.ii — Teacher Verification & trust
   ================================================================ */

export type VerificationStatus =
  | "pending"
  | "in-progress"
  | "approved"
  | "rejected";

export type VerificationStepId = "identity" | "diplomas" | "bio" | "final";

export type VerificationStep = {
  id: VerificationStepId;
  label: string;
  description?: string;
  status: VerificationStatus;
};

export const mockVerificationSteps: VerificationStep[] = [
  {
    id: "identity",
    label: "Identité",
    description: "CIN, date de naissance, nationalité.",
    status: "approved",
  },
  {
    id: "diplomas",
    label: "Diplômes",
    description: "Ajoute tes diplômes & certifications.",
    status: "in-progress",
  },
  {
    id: "bio",
    label: "Bio",
    description: "Rédige ta bio publique & matières.",
    status: "pending",
  },
  {
    id: "final",
    label: "Vérification finale",
    description: "Validation par l'équipe Darso.",
    status: "pending",
  },
];

/* ---------- Identity ---------- */

export type IdentityFile = {
  fileName: string;
  previewUrl?: string;
};

export type IdentityData = {
  fullName: string;
  dob: string; // ISO yyyy-mm-dd
  nationality: string;
  cinNumber: string;
  cinFront?: IdentityFile | null;
  cinBack?: IdentityFile | null;
};

export const mockIdentity: IdentityData = {
  fullName: "Youssef Amrani",
  dob: "1992-04-14",
  nationality: "Marocaine",
  cinNumber: "BE 847 231",
  cinFront: { fileName: "cin-recto.jpg" },
  cinBack: { fileName: "cin-verso.jpg" },
};

export const mockNationalities: string[] = [
  "Marocaine",
  "Française",
  "Algérienne",
  "Tunisienne",
  "Sénégalaise",
  "Espagnole",
  "Autre",
];

/* ---------- Diplomas ---------- */

export type DiplomaEntry = {
  id: string;
  title: string;
  institution: string;
  year: number;
  fileName?: string;
  status: VerificationStatus;
};

export const mockDiplomas: DiplomaEntry[] = [
  {
    id: "dip-01",
    title: "Ingénieur civil des Mines",
    institution: "École des Mines de Paris",
    year: 2016,
    fileName: "diplome-mines.pdf",
    status: "approved",
  },
  {
    id: "dip-02",
    title: "Master 2 · Mathématiques appliquées",
    institution: "Université Paris-Saclay",
    year: 2015,
    fileName: "master-maths.pdf",
    status: "in-progress",
  },
];

/* ---------- Bio ---------- */

export type BioData = {
  text: string;
  subjectsTaught: string[];
  approvedByAdmin: boolean;
};

export const mockBio: BioData = {
  text: "Ancien élève des Mines de Paris, 8 ans d'expérience en préparation au Bac et en classes préparatoires. Approche personnalisée, axée sur la méthodologie et la rigueur du raisonnement.",
  subjectsTaught: ["Mathématiques", "Physique-Chimie"],
  approvedByAdmin: false,
};

export const mockSubjectPool: string[] = [
  "Mathématiques",
  "Physique-Chimie",
  "SVT",
  "Français",
  "Anglais",
  "Arabe",
  "Espagnol",
  "Philosophie",
  "Histoire-Géo",
  "SES",
  "Informatique",
];
