/* ============================================================
   Mock data for the Teacher Full Stats page (P3.f)
   ============================================================ */

export type SeriesPoint = { x: string; y: number };

/* ---- helpers (module scope, no runtime randomness) ---- */

function ymd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/* ---- 90-day revenue series ending 2026-09-02 ---- */

function buildRevenueSeries(): SeriesPoint[] {
  const points: SeriesPoint[] = [];
  const end = new Date("2026-09-02T00:00:00Z");
  const N = 90;
  for (let i = N - 1; i >= 0; i--) {
    const d = new Date(end);
    d.setUTCDate(end.getUTCDate() - i);
    const dow = d.getUTCDay(); // 0 = Sun
    // baseline curve — mild uptrend
    const t = (N - 1 - i) / (N - 1); // 0..1
    const trend = 320 + t * 260; // 320 -> 580 MAD/day
    // weekday factor (heavier Mon–Thu; light Fri/Sat)
    const weekWeights = [0.4, 1.15, 1.25, 1.35, 1.1, 0.55, 0.3]; // Sun..Sat
    const w = weekWeights[dow];
    // deterministic wobble
    const wobble =
      Math.sin(i * 0.9) * 40 + Math.cos(i * 0.31 + 1.7) * 60 + (i % 11) * 6;
    const y = Math.max(0, Math.round(trend * w + wobble));
    points.push({ x: ymd(d), y });
  }
  return points;
}

export const mockRevenueSeries: SeriesPoint[] = buildRevenueSeries();

/* ---- Hours by subject ---- */

export type HoursBySubject = { label: string; value: number; color?: string };

export const mockHoursBySubject: HoursBySubject[] = [
  { label: "Analyse", value: 42, color: "#DFFF3F" },
  { label: "Algèbre", value: 34, color: "#DFFF3F" },
  { label: "Prépa", value: 28, color: "#B5D3FF" },
  { label: "Physique", value: 18, color: "#B5D3FF" },
  { label: "Géométrie", value: 12, color: "#FFD7C2" },
  { label: "Stats", value: 9, color: "#FFD7C2" },
];

/* ---- Heatmap 7×24 (rows = day-of-week, Mon..Sun; cols = hour 0..23) ---- */

function buildHeatmap(): number[][] {
  const rows: number[][] = [];
  // Mon(0)..Sun(6). Heavy Mon–Thu evenings 17–21.
  const dayWeights = [1.0, 1.1, 1.15, 1.05, 0.75, 0.55, 0.4];
  for (let d = 0; d < 7; d++) {
    const row: number[] = [];
    for (let h = 0; h < 24; h++) {
      let base = 0;
      if (h >= 17 && h <= 21) base = 8 + (21 - Math.abs(h - 19)) * 1.2;
      else if (h >= 14 && h <= 16) base = 4;
      else if (h >= 9 && h <= 12) base = 2.5;
      else if (h >= 7 && h <= 8) base = 1.2;
      else base = 0;
      // weekend afternoons tick up a bit
      if ((d === 5 || d === 6) && h >= 10 && h <= 15) base = Math.max(base, 3);
      const dow = dayWeights[d];
      // deterministic jitter
      const jitter = ((d * 7 + h * 3) % 5) * 0.3;
      const v = Math.max(0, Math.round((base * dow + jitter) * 10) / 10);
      row.push(v);
    }
    rows.push(row);
  }
  return rows;
}

export const mockHeatmap: number[][] = buildHeatmap();

/* ---- Revenue by subject (for donut) ---- */

export type RevenueBySubject = { label: string; value: number; color: string };

export const mockRevenueBySubject: RevenueBySubject[] = [
  { label: "Analyse", value: 9240, color: "#DFFF3F" },
  { label: "Algèbre", value: 7480, color: "#0B0B0F" },
  { label: "Prépa", value: 6160, color: "#B5D3FF" },
  { label: "Physique", value: 3960, color: "#FFD7C2" },
  { label: "Géométrie", value: 2640, color: "#C9C9CE" },
  { label: "Stats", value: 1980, color: "#8A8D93" },
];

/* ---- KPI cards ---- */

export type KpiDatum = {
  key: string;
  label: string;
  value: string;
  unit?: string;
  hint?: string;
  trend?: { direction: "up" | "down"; value: string };
  sparkline: number[];
  tone?: "default" | "dark";
};

export const mockKpis: KpiDatum[] = [
  {
    key: "revenue",
    label: "Revenus (90j)",
    value: "31 460",
    unit: "MAD",
    hint: "vs. 26 700 sur les 90 j précédents",
    trend: { direction: "up", value: "+18%" },
    sparkline: [12, 14, 13, 17, 16, 19, 18, 22, 21, 24, 26, 28],
    tone: "dark",
  },
  {
    key: "hours",
    label: "Heures enseignées",
    value: "143",
    unit: "h",
    hint: "moyenne 1,6 h / jour",
    trend: { direction: "up", value: "+9%" },
    sparkline: [8, 10, 9, 12, 11, 13, 12, 14, 13, 15, 14, 16],
  },
  {
    key: "students",
    label: "Élèves uniques",
    value: "38",
    hint: "12 nouveaux ce trimestre",
    trend: { direction: "up", value: "+4" },
    sparkline: [22, 24, 25, 27, 28, 29, 30, 32, 33, 35, 36, 38],
  },
  {
    key: "rating",
    label: "Note moyenne",
    value: "4,9",
    unit: "/ 5",
    hint: "sur 34 avis publiés",
    trend: { direction: "up", value: "+0,1" },
    sparkline: [46, 47, 47, 48, 48, 48, 49, 49, 48, 49, 49, 49],
  },
];
