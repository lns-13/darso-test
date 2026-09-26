export const springSoft = {
  type: "spring" as const,
  stiffness: 260,
  damping: 30,
  mass: 0.6,
};

export const springTight = {
  type: "spring" as const,
  stiffness: 340,
  damping: 32,
  mass: 0.55,
};

export const fadeQuick = { duration: 0.15 };
