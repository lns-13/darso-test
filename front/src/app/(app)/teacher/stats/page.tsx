"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AppShell } from "@/components/app/app-shell";
import { PageHeader } from "@/components/app/page-header";
import { SectionHeader } from "@/components/app/section-header";
import { KpiCard } from "@/components/app/kpi-card";
import { LineChart } from "@/components/app/line-chart";
import { BarChart } from "@/components/app/bar-chart";
import { Heatmap } from "@/components/app/heatmap";
import { teacherMobileTabs, teacherNav } from "@/lib/nav";
import { mockTeacher } from "@/lib/mock/teacher";
import {
  mockHeatmap,
  mockHoursBySubject,
  mockKpis,
  mockRevenueBySubject,
  mockRevenueSeries,
  type SeriesPoint,
} from "@/lib/mock/teacher-stats";
import { cn } from "@/lib/utils";

/* ================================================================
   Range keys
   ================================================================ */

type RangeKey = "7d" | "30d" | "90d" | "12m";
const RANGES: { key: RangeKey; label: string }[] = [
  { key: "7d", label: "7j" },
  { key: "30d", label: "30j" },
  { key: "90d", label: "90j" },
  { key: "12m", label: "12m" },
];

function parseRange(v: string | null): RangeKey {
  if (v === "7d" || v === "30d" || v === "90d" || v === "12m") return v;
  return "90d";
}

/**
 * Slice/aggregate the 90-day series to fit a requested window.
 * - 7d / 30d: last N days
 * - 90d: full series
 * - 12m: bucket into ~12 monthly-ish groups (we only have 90 days of mock data,
 *   so we synthesize by expanding to 12 buckets averaged from the series).
 */
function sliceSeries(all: SeriesPoint[], range: RangeKey): SeriesPoint[] {
  if (range === "7d") return all.slice(-7);
  if (range === "30d") return all.slice(-30);
  if (range === "90d") return all;
  // 12m — bucket into 12 fake months by averaging the series into 12 groups
  const buckets: SeriesPoint[] = [];
  const monthLabels = ["Oct", "Nov", "Déc", "Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep"];
  const size = Math.ceil(all.length / 12);
  for (let i = 0; i < 12; i++) {
    const chunk = all.slice(i * size, (i + 1) * size);
    if (chunk.length === 0) {
      buckets.push({ x: monthLabels[i], y: 0 });
    } else {
      const sum = chunk.reduce((a, p) => a + p.y, 0);
      // scale to monthly total-ish
      buckets.push({ x: monthLabels[i], y: Math.round(sum * (30 / chunk.length)) });
    }
  }
  return buckets;
}

/**
 * Compact French date label — "12/07" from "2026-07-12".
 * For 12m mode the series already carries a month string, so we pass through.
 */
function xLabelFor(point: SeriesPoint, range: RangeKey): string {
  if (range === "12m") return String(point.x);
  const s = String(point.x);
  const parts = s.split("-");
  if (parts.length !== 3) return s;
  return `${parts[2]}/${parts[1]}`;
}

function formatMAD(v: number): string {
  return v
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

/* ================================================================
   Page shell
   ================================================================ */

export default function TeacherStatsPage() {
  return (
    <Suspense fallback={null}>
      <Inner />
    </Suspense>
  );
}

function Inner() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [range, setRange] = useState<RangeKey>(parseRange(searchParams.get("range")));

  // URL sync
  useEffect(() => {
    const p = new URLSearchParams(Array.from(searchParams.entries()));
    p.set("range", range);
    const qs = p.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range]);

  const rangeSlice = useMemo(() => sliceSeries(mockRevenueSeries, range), [range]);
  const xLabels = useMemo(() => rangeSlice.map((p) => xLabelFor(p, range)), [rangeSlice, range]);

  const rangePicker = <RangePicker value={range} onChange={setRange} />;

  return (
    <AppShell
      nav={teacherNav}
      mobileTabs={teacherMobileTabs}
      user={{
        fullName: mockTeacher.fullName,
        level: mockTeacher.level,
        initials: mockTeacher.initials,
      }}
      desktopMain={
        <DesktopMain
          rangePicker={rangePicker}
          rangeSlice={rangeSlice}
          xLabels={xLabels}
        />
      }
      mobileHeader={{
        title: "Statistiques",
        subtitle: "Vue complète — revenus, heures, régularité.",
      }}
      mobileChildren={
        <MobileBody
          rangePicker={rangePicker}
          rangeSlice={rangeSlice}
          xLabels={xLabels}
        />
      }
    />
  );
}

/* ================================================================
   Shared bits
   ================================================================ */

function RangePicker({
  value,
  onChange,
}: {
  value: RangeKey;
  onChange: (v: RangeKey) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="Plage de temps"
      className="inline-flex h-9 items-center gap-0.5 rounded-full bg-[#F0F0F2] p-1"
    >
      {RANGES.map((r) => {
        const active = r.key === value;
        return (
          <button
            key={r.key}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(r.key)}
            className={cn(
              "flex h-7 items-center rounded-full px-3 text-[12px] font-semibold transition-colors",
              active
                ? "bg-[#0B0B0F] text-white"
                : "text-[#4A4D54] hover:text-[#0B0B0F]",
            )}
          >
            {r.label}
          </button>
        );
      })}
    </div>
  );
}

/* ================================================================
   DESKTOP
   ================================================================ */

function DesktopMain({
  rangePicker,
  rangeSlice,
  xLabels,
}: {
  rangePicker: React.ReactNode;
  rangeSlice: SeriesPoint[];
  xLabels: string[];
}) {
  return (
    <div className="p-6">
      <PageHeader
        eyebrow={
          <>
            <span>Mercredi 2 septembre</span>
            <span className="h-1 w-1 rounded-full bg-[#D5D7DB]" />
            <span className="font-medium text-[#0B0B0F]">Bilan complet</span>
          </>
        }
        title="Statistiques"
        subline={
          <>
            Vue complète de ton activité — revenus, heures, régularité.
          </>
        }
        actions={rangePicker}
      />

      {/* KPI row */}
      <div className="mt-6 grid grid-cols-4 gap-2.5">
        {mockKpis.map((k, i) => (
          <KpiCard
            key={k.key}
            label={k.label}
            value={k.value}
            unit={k.unit}
            hint={k.hint}
            trend={k.trend}
            sparkline={k.sparkline}
            tone={i === 0 ? "dark" : "default"}
          />
        ))}
      </div>

      {/* Middle: line + bar */}
      <div className="mt-6 grid grid-cols-[2fr_1fr] gap-2.5">
        <div className="rounded-[20px] border border-[#EFEFF1] bg-white p-4 shadow-[0_1px_2px_rgba(10,11,20,0.04)]">
          <SectionHeader
            title="Revenus dans le temps"
            subtitle="MAD par jour · série complète"
          />
          <div className="mt-4">
            <LineChart
              series={[
                {
                  label: "Toi",
                  color: "#0B0B0F",
                  points: rangeSlice.map((p, i) => ({ x: xLabels[i], y: p.y })),
                  area: true,
                },
              ]}
              xLabels={xLabels}
              height={240}
              formatY={(v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : Math.round(v).toString())}
            />
          </div>
        </div>

        <div className="rounded-[20px] border border-[#EFEFF1] bg-white p-4 shadow-[0_1px_2px_rgba(10,11,20,0.04)]">
          <SectionHeader
            title="Heures par matière"
            subtitle="Dernier trimestre"
          />
          <div className="mt-4">
            <BarChart
              bars={mockHoursBySubject}
              height={240}
              sort="desc"
              valueFormatter={(v) => `${v}h`}
            />
          </div>
        </div>
      </div>

      {/* Bottom: heatmap + donut */}
      <div className="mt-6 grid grid-cols-[1.4fr_1fr] gap-2.5 pb-2">
        <div className="rounded-[20px] bg-[#0B0B0F] p-5 text-white shadow-[0_1px_2px_rgba(10,11,20,0.04)]">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="font-[family-name:var(--font-cabinet)] text-[18px] font-bold tracking-tight">
                Créneaux les plus demandés
              </h2>
              <p className="mt-0.5 text-[11.5px] text-white/55">
                Distribution des heures enseignées · jour × heure
              </p>
            </div>
            <span className="rounded-full bg-[#DFFF3F] px-2 py-0.5 text-[10px] font-semibold text-[#0B0B0F]">
              Pic 18–20h
            </span>
          </div>
          <div className="mt-4">
            <Heatmap data={mockHeatmap} />
          </div>
        </div>

        <div className="rounded-[20px] border border-[#EFEFF1] bg-white p-4 shadow-[0_1px_2px_rgba(10,11,20,0.04)]">
          <SectionHeader
            title="Répartition par matière"
            subtitle="Sur les 90 derniers jours"
          />
          <div className="mt-4">
            <DonutRevenue />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================================================================
   Inline mini-donut (not imported from donut-chart.tsx — sibling
   agent owns that file).
   ================================================================ */

function DonutRevenue() {
  const total = mockRevenueBySubject.reduce((a, b) => a + b.value, 0);
  const size = 180;
  const stroke = 22;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  let acc = 0;

  return (
    <div className="flex items-center gap-5">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="shrink-0"
        role="img"
        aria-label="Répartition par matière"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#F0F0F2"
          strokeWidth={stroke}
        />
        {mockRevenueBySubject.map((s) => {
          const frac = s.value / total;
          const dash = frac * c;
          const gap = c - dash;
          const dashArray = `${dash} ${gap}`;
          const offset = -acc * c;
          acc += frac;
          return (
            <circle
              key={s.label}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={s.color}
              strokeWidth={stroke}
              strokeDasharray={dashArray}
              strokeDashoffset={offset}
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
              strokeLinecap="butt"
            />
          );
        })}
        <text
          x={size / 2}
          y={size / 2 - 4}
          textAnchor="middle"
          className="fill-[#8A8D93]"
          style={{ fontSize: 9, letterSpacing: "0.08em", fontWeight: 600 }}
        >
          TOTAL
        </text>
        <text
          x={size / 2}
          y={size / 2 + 14}
          textAnchor="middle"
          className="fill-[#0B0B0F]"
          style={{
            fontFamily: "var(--font-cabinet)",
            fontSize: 18,
            fontWeight: 700,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {formatMAD(total)}
        </text>
      </svg>

      <ul className="flex min-w-0 flex-1 flex-col gap-1.5">
        {mockRevenueBySubject.map((s) => {
          const pct = Math.round((s.value / total) * 100);
          return (
            <li key={s.label} className="flex items-center gap-2 text-[11.5px]">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-sm"
                style={{ backgroundColor: s.color }}
              />
              <span className="min-w-0 flex-1 truncate text-[#0B0B0F]">{s.label}</span>
              <span className="tabular-nums text-[#8A8D93]">{pct}%</span>
              <span className="w-14 text-right font-semibold tabular-nums text-[#0B0B0F]">
                {formatMAD(s.value)}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* ================================================================
   MOBILE
   ================================================================ */

function MobileBody({
  rangePicker,
  rangeSlice,
  xLabels,
}: {
  rangePicker: React.ReactNode;
  rangeSlice: SeriesPoint[];
  xLabels: string[];
}) {
  return (
    <div className="mt-2">
      <div className="px-4">{rangePicker}</div>

      {/* KPI strip — horizontal snap scroll */}
      <div
        className="scrollbar-none mt-3 flex snap-x snap-mandatory gap-2.5 overflow-x-auto px-4 pb-2"
        style={{ scrollPaddingInline: "1rem" }}
      >
        {mockKpis.map((k, i) => (
          <div key={k.key} className="w-[70%] shrink-0 snap-start">
            <KpiCard
              label={k.label}
              value={k.value}
              unit={k.unit}
              hint={k.hint}
              trend={k.trend}
              sparkline={k.sparkline}
              tone={i === 0 ? "dark" : "default"}
            />
          </div>
        ))}
      </div>

      {/* Section blocks with vertical snap */}
      <div className="mt-2 flex flex-col gap-3 px-4 pb-4 snap-y snap-mandatory">
        <section className="snap-start scroll-mt-4 rounded-[20px] border border-[#EFEFF1] bg-white p-4 shadow-[0_1px_2px_rgba(10,11,20,0.04)]">
          <SectionHeader
            title="Revenus dans le temps"
            subtitle="MAD par jour"
          />
          <div className="mt-3">
            <LineChart
              series={[
                {
                  label: "Toi",
                  color: "#0B0B0F",
                  points: rangeSlice.map((p, i) => ({ x: xLabels[i], y: p.y })),
                  area: true,
                },
              ]}
              xLabels={xLabels}
              height={200}
              formatY={(v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : Math.round(v).toString())}
            />
          </div>
        </section>

        <section className="snap-start scroll-mt-4 rounded-[20px] border border-[#EFEFF1] bg-white p-4 shadow-[0_1px_2px_rgba(10,11,20,0.04)]">
          <SectionHeader
            title="Heures par matière"
            subtitle="Dernier trimestre"
          />
          <div className="mt-3">
            <BarChart
              bars={mockHoursBySubject}
              height={200}
              sort="desc"
              valueFormatter={(v) => `${v}h`}
            />
          </div>
        </section>

        <section className="snap-start scroll-mt-4 rounded-[20px] bg-[#0B0B0F] p-4 text-white shadow-[0_1px_2px_rgba(10,11,20,0.04)]">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="font-[family-name:var(--font-cabinet)] text-[16px] font-bold tracking-tight">
                Créneaux demandés
              </h2>
              <p className="mt-0.5 text-[11px] text-white/55">
                Jour × heure — pic 18–20h
              </p>
            </div>
          </div>
          <div className="mt-3">
            <Heatmap data={mockHeatmap} labelStride={4} />
          </div>
        </section>

        <section className="snap-start scroll-mt-4 rounded-[20px] border border-[#EFEFF1] bg-white p-4 shadow-[0_1px_2px_rgba(10,11,20,0.04)]">
          <SectionHeader
            title="Répartition par matière"
            subtitle="Sur les 90 derniers jours"
          />
          <div className="mt-3">
            <DonutRevenue />
          </div>
        </section>
      </div>
    </div>
  );
}
