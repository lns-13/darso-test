import { AnimatedCounter } from "@/components/library/animated-counter";
import { cn } from "@/lib/utils";

type Stat = {
  value: number;
  fractionDigits?: number;
  suffix?: string;
  label: string;
  accent?: boolean;
};

const STATS: Stat[] = [
  { value: 12480, suffix: "+", label: "élèves accompagnés" },
  { value: 4.8, fractionDigits: 1, suffix: " / 5", label: "note moyenne", accent: true },
  { value: 860, label: "séances cette semaine" },
];

export function TrustStrip() {
  return (
    <section
      aria-labelledby="trust-strip-heading"
      className="bg-[#0B0B0F] text-white"
    >
      <div className="container-wide py-10 md:py-14">
        <h2 id="trust-strip-heading" className="sr-only">
          darso en chiffres
        </h2>

        {/* mobile: snap-scroll strip */}
        <ul
          className="-mx-3 flex snap-x snap-mandatory gap-3 overflow-x-auto px-3 pb-1 md:hidden [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
          role="list"
        >
          {STATS.map((stat, i) => (
            <li key={i} className="min-w-[75%] shrink-0 snap-center">
              <StatCard stat={stat} />
            </li>
          ))}
        </ul>

        {/* desktop: row of 3 */}
        <ul className="hidden gap-4 md:grid md:grid-cols-3" role="list">
          {STATS.map((stat, i) => (
            <li key={i}>
              <StatCard stat={stat} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function StatCard({ stat }: { stat: Stat }) {
  return (
    <div
      className={cn(
        "flex h-full flex-col justify-between rounded-[16px] border p-5 md:p-6",
        stat.accent
          ? "border-transparent bg-[#DFFF3F] text-[#0B0B0F]"
          : "border-[#EFEFF1] bg-white text-[#0B0B0F]",
      )}
    >
      <div
        className="font-extrabold leading-[0.95] tracking-[-0.035em] text-[44px] md:text-[56px] lg:text-[64px] tabular-nums"
        style={{ fontFamily: "var(--font-cabinet), system-ui, sans-serif" }}
      >
        <AnimatedCounter
          value={stat.value}
          fractionDigits={stat.fractionDigits ?? 0}
          suffix={stat.suffix}
        />
      </div>
      <div
        className={cn(
          "mt-4 text-[13px] font-medium leading-snug md:text-[13.5px]",
          stat.accent ? "text-[#0B0B0F]/70" : "text-[#6E7178]",
        )}
      >
        {stat.label}
      </div>
    </div>
  );
}
