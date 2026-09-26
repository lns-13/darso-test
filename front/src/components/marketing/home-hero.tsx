"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Compass } from "lucide-react";

import { HeroVideoPlayer } from "./hero-video-player";

export function HomeHero() {
  return (
    <section
      aria-labelledby="home-hero-heading"
      className="relative isolate bg-background pt-3 pb-3 md:pb-5"
    >
      <div className="container-wide">
        <HeroCard />
      </div>
    </section>
  );
}

const NOTCH_PAD = 10;
const BC_NOTCH_PAD_X = 14;
const BC_NOTCH_PAD_Y_TOP = 9;
const TRANSITION_R = 20;
const INNER_R = 34;
const CORNER_R = 20;
const FALLBACK = {
  tl: { w: 460, h: 220 },
  tr: { w: 60, h: 60 },
  bc: { w: 260, h: 40 },
};

const COMPACT_QUERY = "(max-width: 639.98px)";
const INTRO_MS = 800;
const REVEAL_START_MS = INTRO_MS - 100;
const REVEAL_MS = 520;
const REVEAL_EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
const INITIAL_CLIP = `inset(0 round ${CORNER_R}px)`;

type CTALine = {
  text: string;
  highlightRange: [number, number];
  staticContent: React.ReactNode;
};

const CTA_HIGHLIGHT_CLASS =
  "inline-block bg-foreground px-[0.12em] py-[0.04em] text-[#F2ECDD]";

const CTA_LINES: CTALine[] = [
  {
    text: "Réservez le prof\nqui vous fait\nprogresser.",
    highlightRange: [31, 42],
    staticContent: (
      <>
        {"Réservez le prof\nqui vous fait\n"}
        <span className={CTA_HIGHLIGHT_CLASS}>progresser.</span>
      </>
    ),
  },
  {
    text: "Rejoignez les élèves\nqui ont\nbesoin de vous.",
    highlightRange: [29, 44],
    staticContent: (
      <>
        {"Rejoignez les élèves\nqui ont\n"}
        <span className={CTA_HIGHLIGHT_CLASS}>besoin de vous.</span>
      </>
    ),
  },
];

const TW_TYPE_MS = 35;
const TW_DELETE_MS = 18;
const TW_DWELL_MS = 2000;
const TW_CURSOR_BLINK_MS = 500;
const TW_CURSOR_COLOR = "#EDE6D1";

function commonPrefixLength(a: string, b: string): number {
  const n = Math.min(a.length, b.length);
  let i = 0;
  while (i < n && a[i] === b[i]) i++;
  return i;
}

function TypewriterCursor({ visible }: { visible: boolean }) {
  return (
    <span
      aria-hidden
      style={{
        display: "inline-block",
        width: "0.55em",
        height: "0.6em",
        marginLeft: "0.05em",
        marginRight: "-0.02em",
        background: TW_CURSOR_COLOR,
        borderRadius: "0.1em",
        verticalAlign: "-0.06em",
        opacity: visible ? 1 : 0,
        transition: "opacity 80ms linear",
      }}
    />
  );
}

function renderTypewriterContent({
  line,
  visibleCount,
  cursorVisible,
  showCursor,
}: {
  line: CTALine;
  visibleCount: number;
  cursorVisible: boolean;
  showCursor: boolean;
}) {
  const [hStart, hEnd] = line.highlightRange;
  const clamped = Math.max(0, Math.min(visibleCount, line.text.length));
  const before = line.text.slice(0, Math.min(hStart, clamped));
  const inside = clamped > hStart ? line.text.slice(hStart, Math.min(hEnd, clamped)) : "";
  const cursor = showCursor ? <TypewriterCursor visible={cursorVisible} /> : null;
  if (!inside) {
    return (
      <>
        {before}
        {cursor}
      </>
    );
  }
  return (
    <>
      {before}
      <span className={CTA_HIGHLIGHT_CLASS}>
        {inside}
        {cursor}
      </span>
    </>
  );
}

function HeroCard() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const shapeRef = useRef<HTMLDivElement>(null);
  const tlRef = useRef<HTMLDivElement>(null);
  const trRef = useRef<HTMLAnchorElement>(null);
  const bcRef = useRef<HTMLDivElement>(null);
  const introDoneRef = useRef(false);

  const [compact, setCompact] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [revealSettled, setRevealSettled] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [twLineIdx, setTwLineIdx] = useState(0);
  const [twVisible, setTwVisible] = useState(CTA_LINES[0].text.length);
  const [twPhase, setTwPhase] = useState<"dwell" | "deleting" | "typing">("dwell");
  const [cursorOn, setCursorOn] = useState(true);

  useLayoutEffect(() => {
    const mq = window.matchMedia(COMPACT_QUERY);
    const sync = () => setCompact(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useLayoutEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReducedMotion(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useLayoutEffect(() => {
    const wrapper = wrapperRef.current;
    const shape = shapeRef.current;
    if (!wrapper || !shape) return;

    const readTargets = () => {
      const w = wrapper.offsetWidth;
      const h = wrapper.offsetHeight;
      if (w === 0 || h === 0) return null;

      const measure = (
        el: HTMLElement | null,
        fallback: { w: number; h: number },
        padX = NOTCH_PAD,
        padY = NOTCH_PAD,
      ) => {
        if (!el || el.offsetHeight === 0) return fallback;
        return {
          w: el.offsetWidth + 2 * padX,
          h: el.offsetHeight + 2 * padY,
        };
      };

      let tl = measure(tlRef.current, FALLBACK.tl, 11, 11);
      const tr = measure(trRef.current, FALLBACK.tr);
      let bc = measure(bcRef.current, FALLBACK.bc, BC_NOTCH_PAD_X, BC_NOTCH_PAD_Y_TOP);

      tl = {
        w: Math.min(tl.w, w * (compact ? 0.88 : 0.6)),
        h: Math.min(tl.h, h * (compact ? 0.58 : 0.45)),
      };

      const cornerR = Math.min(CORNER_R, w * 0.08);
      const transR = Math.min(TRANSITION_R, w * 0.04);
      const bcBuffer = Math.min(12, w * 0.015);

      const bcMaxW = Math.max(0, w - 2 * (cornerR + transR + bcBuffer));
      bc = {
        w: Math.min(bc.w, bcMaxW, w * (compact ? 0.86 : 0.55)),
        h: Math.min(bc.h, h * 0.28),
      };

      return { w, h, tl, tr, bc, cornerR, transR };
    };

    const scale = (n: NotchSize, p: number): NotchSize => ({
      w: Math.max(0, n.w * p),
      h: Math.max(0, n.h * p),
    });

    type Targets = NonNullable<ReturnType<typeof readTargets>>;

    const writePath = (t: Targets, p: number) => {
      const path = buildHeroPath({
        w: t.w,
        h: t.h,
        transitionR: t.transR,
        cornerR: t.cornerR,
        innerR: INNER_R,
        tl: scale(t.tl, p),
        tr: scale(t.tr, p),
        bc: scale(t.bc, p),
      });
      shape.style.clipPath = `path("${path}")`;
      (shape.style as CSSStyleDeclaration & { webkitClipPath?: string }).webkitClipPath =
        `path("${path}")`;
    };

    let rafId: number | null = null;
    let revealTimer: ReturnType<typeof setTimeout> | null = null;
    let cancelled = false;

    const targets = readTargets();
    if (!targets) return;

    const prefersReduced =
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (introDoneRef.current || prefersReduced) {
      writePath(targets, 1);
      if (!introDoneRef.current) {
        introDoneRef.current = true;
        setRevealed(true);
      }
    } else {
      writePath(targets, 0);
      const start = performance.now();
      const easeOut = (x: number) => 1 - Math.pow(1 - x, 3);
      const tick = (now: number) => {
        if (cancelled) return;
        const t = Math.min(1, (now - start) / INTRO_MS);
        writePath(targets, easeOut(t));
        if (t < 1) rafId = requestAnimationFrame(tick);
      };
      rafId = requestAnimationFrame(tick);
      revealTimer = setTimeout(() => {
        introDoneRef.current = true;
        setRevealed(true);
      }, REVEAL_START_MS);
    }

    const ro = new ResizeObserver(() => {
      if (!introDoneRef.current) return;
      const next = readTargets();
      if (next) writePath(next, 1);
    });
    ro.observe(wrapper);
    [tlRef, trRef, bcRef].forEach((r) => {
      if (r.current) ro.observe(r.current);
    });

    return () => {
      cancelled = true;
      if (rafId) cancelAnimationFrame(rafId);
      if (revealTimer) clearTimeout(revealTimer);
      ro.disconnect();
    };
  }, [compact]);

  useEffect(() => {
    if (!revealed || revealSettled) return;
    const t = setTimeout(() => setRevealSettled(true), 280 + REVEAL_MS + 60);
    return () => clearTimeout(t);
  }, [revealed, revealSettled]);

  useEffect(() => {
    if (!revealSettled || reducedMotion) return;
    const current = CTA_LINES[twLineIdx];
    const nextIdx = (twLineIdx + 1) % CTA_LINES.length;
    const next = CTA_LINES[nextIdx];

    let timer: ReturnType<typeof setTimeout> | null = null;

    if (twPhase === "dwell") {
      timer = setTimeout(() => setTwPhase("deleting"), TW_DWELL_MS);
    } else if (twPhase === "deleting") {
      const target = commonPrefixLength(current.text, next.text);
      if (twVisible > target) {
        timer = setTimeout(() => setTwVisible((v) => v - 1), TW_DELETE_MS);
      } else {
        setTwLineIdx(nextIdx);
        setTwPhase("typing");
      }
    } else if (twPhase === "typing") {
      if (twVisible < current.text.length) {
        timer = setTimeout(() => setTwVisible((v) => v + 1), TW_TYPE_MS);
      } else {
        setTwPhase("dwell");
      }
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [twPhase, twVisible, twLineIdx, revealSettled, reducedMotion]);

  useEffect(() => {
    if (!revealSettled || reducedMotion || twPhase !== "dwell") {
      setCursorOn(true);
      return;
    }
    setCursorOn(true);
    const interval = setInterval(
      () => setCursorOn((v) => !v),
      TW_CURSOR_BLINK_MS,
    );
    return () => clearInterval(interval);
  }, [twPhase, revealSettled, reducedMotion]);

  const revealStyle = ({
    delay,
    from,
  }: {
    delay: number;
    from: string;
  }) => {
    if (revealSettled) return undefined;
    return {
      opacity: revealed ? 1 : 0,
      transform: revealed ? "none" : from,
      transition: `opacity ${REVEAL_MS}ms ${REVEAL_EASE}, transform ${REVEAL_MS}ms ${REVEAL_EASE}`,
      transitionDelay: revealed ? `${delay}ms` : "0ms",
      pointerEvents: revealed ? undefined : ("none" as const),
      willChange: "opacity, transform" as const,
    };
  };

  return (
    <div
      ref={wrapperRef}
      className="relative w-full h-[calc(100dvh-80px)] max-h-[133vw] min-h-[380px] sm:min-h-[440px] sm:max-h-none md:h-[calc(100dvh-116px)]"
    >
        <div
          ref={shapeRef}
          className="absolute inset-0 overflow-hidden bg-[#F7F7F5] min-[520px]:[filter:drop-shadow(0_30px_60px_rgba(10,11,14,0.14))_drop-shadow(0_8px_16px_rgba(10,11,14,0.06))]"
          style={{
            borderRadius: CORNER_R,
            clipPath: INITIAL_CLIP,
            WebkitClipPath: INITIAL_CLIP,
          }}
        >
          <div className="absolute inset-0">
            <HeroVideoPlayer />
          </div>
        </div>

        <div
          ref={tlRef}
          className="absolute top-0 left-0 grid w-fit max-w-[85%] pr-0 pb-0 sm:max-w-[55%]"
          style={revealStyle({ delay: 0, from: "translate(-8px, -8px)" })}
        >
          {CTA_LINES.map((line, i) => (
            <div
              key={`cta-sizer-${i}`}
              aria-hidden
              className="pointer-events-none invisible [grid-area:1/1] translate-y-1.5 whitespace-pre-line text-start text-[15px] font-extrabold leading-[1.02] tracking-[-0.035em] text-foreground sm:text-[22px] md:text-[27px] lg:text-[32px] xl:text-[36px] text-balance"
              style={{ fontFamily: "var(--font-cabinet), system-ui, sans-serif" }}
            >
              {line.staticContent}
            </div>
          ))}
          <h1
            id="home-hero-heading"
            aria-live="off"
            style={{ fontFamily: "var(--font-cabinet), system-ui, sans-serif" }}
            className="[grid-area:1/1] translate-y-1.5 whitespace-pre-line text-start text-[15px] font-extrabold leading-[1.02] tracking-[-0.035em] text-foreground sm:text-[22px] md:text-[27px] lg:text-[32px] xl:text-[36px] text-balance"
          >
            {reducedMotion
              ? CTA_LINES[0].staticContent
              : renderTypewriterContent({
                  line: CTA_LINES[twLineIdx],
                  visibleCount: twVisible,
                  cursorVisible: cursorOn,
                  showCursor: revealSettled,
                })}
          </h1>
        </div>

        <Link
          ref={trRef}
          href="/student/help"
          aria-label="Ouvrir le guide"
          className="group absolute top-0 right-0 grid h-11 w-11 place-items-center rounded-full bg-white text-foreground ring-1 ring-border shadow-[0_8px_22px_-10px_rgba(10,11,14,0.20),0_3px_8px_-4px_rgba(10,11,14,0.10)] transition-all duration-200 hover:-translate-y-[1px] hover:ring-border-strong focus-visible:outline-none focus-visible:shadow-focus md:h-12 md:w-12"
          style={revealStyle({ delay: 120, from: "translate(8px, -8px) rotate(-15deg) scale(0.9)" })}
        >
          <Compass
            className="h-[18px] w-[18px] transition-transform duration-300 group-hover:rotate-45 md:h-5 md:w-5"
            strokeWidth={1.8}
          />
        </Link>

        <div
          ref={bcRef}
          className="absolute bottom-0 left-1/2 -translate-x-1/2 flex items-stretch gap-2 sm:gap-3"
          style={revealStyle({ delay: 250, from: "translate(0, 12px) scale(0.96)" })}
        >
          <Link
            href="/teacher"
            className="group relative flex w-[104px] items-center justify-center overflow-hidden rounded-full border-2 border-foreground bg-white py-2 text-center text-[12px] font-bold tracking-tight text-foreground shadow-[0_10px_24px_-14px_rgba(10,11,14,0.35)] focus-visible:outline-none focus-visible:shadow-focus min-[480px]:w-[128px] min-[480px]:py-2.5 min-[480px]:text-[13px] sm:w-[148px] sm:py-3 sm:text-[14px]"
          >
            <span className="relative z-20 inline-block translate-x-1 transition-all duration-300 group-hover:translate-x-12 group-hover:opacity-0">
              Enseigner
            </span>
            <span className="pointer-events-none absolute inset-0 z-20 flex translate-x-12 items-center justify-center gap-1.5 text-foreground opacity-0 transition-all duration-300 group-hover:-translate-x-1 group-hover:opacity-100">
              Enseigner
              <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.2} />
            </span>
            <span
              aria-hidden
              className="absolute left-[12%] top-[38%] z-10 h-2 w-2 rounded-[2px] bg-[#F0A014] transition-all duration-300 min-[520px]:left-[18%] min-[520px]:top-[42%] group-hover:left-0 group-hover:top-0 group-hover:h-full group-hover:w-full group-hover:scale-[1.15] group-hover:rounded-none"
            />
          </Link>

          <Link
            href="/student"
            className="group relative flex w-[104px] items-center justify-center overflow-hidden rounded-full border-2 border-foreground bg-white py-2 text-center text-[12px] font-bold tracking-tight text-foreground shadow-[0_10px_24px_-14px_rgba(10,11,14,0.35)] focus-visible:outline-none focus-visible:shadow-focus min-[480px]:w-[128px] min-[480px]:py-2.5 min-[480px]:text-[13px] sm:w-[148px] sm:py-3 sm:text-[14px]"
          >
            <span className="relative z-20 inline-block translate-x-1 transition-all duration-300 group-hover:translate-x-12 group-hover:opacity-0">
              Apprendre
            </span>
            <span className="pointer-events-none absolute inset-0 z-20 flex translate-x-12 items-center justify-center gap-1.5 text-primary-foreground opacity-0 transition-all duration-300 group-hover:-translate-x-1 group-hover:opacity-100">
              Apprendre
              <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.2} />
            </span>
            <span
              aria-hidden
              className="absolute left-[12%] top-[38%] z-10 h-2 w-2 rounded-[2px] bg-accent transition-all duration-300 min-[520px]:left-[18%] min-[520px]:top-[42%] group-hover:left-0 group-hover:top-0 group-hover:h-full group-hover:w-full group-hover:scale-[1.15] group-hover:rounded-none"
            />
          </Link>
        </div>
    </div>
  );
}

type NotchSize = { w: number; h: number };

function buildHeroPath({
  w,
  h,
  transitionR,
  cornerR,
  innerR,
  tl,
  tr,
  bc,
}: {
  w: number;
  h: number;
  transitionR: number;
  cornerR: number;
  innerR: number;
  tl: NotchSize;
  tr: NotchSize | null;
  bc: NotchSize | null;
}) {
  const TR = transitionR;
  const CR = cornerR;
  const cap = (r: number, n: NotchSize) =>
    Math.min(r, Math.max(0, n.w - TR) * 0.5, Math.max(0, n.h - TR) * 0.5);
  const tlIR = cap(innerR, tl);
  const trIR = tr ? cap(innerR, tr) : 0;
  const bcIR = bc ? cap(innerR, bc) : 0;

  const parts: string[] = [`M ${tl.w + TR} 0`];

  if (tr) {
    parts.push(`L ${w - tr.w - TR} 0`);
    parts.push(`A ${TR} ${TR} 0 0 1 ${w - tr.w} ${TR}`);
    parts.push(`L ${w - tr.w} ${tr.h - trIR}`);
    parts.push(`A ${trIR} ${trIR} 0 0 0 ${w - tr.w + trIR} ${tr.h}`);
    parts.push(`L ${w - TR} ${tr.h}`);
    parts.push(`A ${TR} ${TR} 0 0 1 ${w} ${tr.h + TR}`);
  } else {
    parts.push(`L ${w - CR} 0`);
    parts.push(`A ${CR} ${CR} 0 0 1 ${w} ${CR}`);
  }

  parts.push(`L ${w} ${h - CR}`);
  parts.push(`A ${CR} ${CR} 0 0 1 ${w - CR} ${h}`);

  if (bc && bc.w > 0 && bc.h > 0) {
    const cx = w / 2;
    const bcRightX = cx + bc.w / 2;
    const bcLeftX = cx - bc.w / 2;
    const bcTopY = h - bc.h;
    parts.push(`L ${bcRightX + TR} ${h}`);
    parts.push(`A ${TR} ${TR} 0 0 1 ${bcRightX} ${h - TR}`);
    parts.push(`L ${bcRightX} ${bcTopY + bcIR}`);
    parts.push(`A ${bcIR} ${bcIR} 0 0 0 ${bcRightX - bcIR} ${bcTopY}`);
    parts.push(`L ${bcLeftX + bcIR} ${bcTopY}`);
    parts.push(`A ${bcIR} ${bcIR} 0 0 0 ${bcLeftX} ${bcTopY + bcIR}`);
    parts.push(`L ${bcLeftX} ${h - TR}`);
    parts.push(`A ${TR} ${TR} 0 0 1 ${bcLeftX - TR} ${h}`);
  }
  parts.push(`L ${CR} ${h}`);
  parts.push(`A ${CR} ${CR} 0 0 1 0 ${h - CR}`);

  parts.push(`L 0 ${tl.h + TR}`);
  parts.push(`A ${TR} ${TR} 0 0 1 ${TR} ${tl.h}`);
  parts.push(`L ${tl.w - tlIR} ${tl.h}`);
  parts.push(`A ${tlIR} ${tlIR} 0 0 0 ${tl.w} ${tl.h - tlIR}`);
  parts.push(`L ${tl.w} ${TR}`);
  parts.push(`A ${TR} ${TR} 0 0 1 ${tl.w + TR} 0`);
  parts.push("Z");

  return parts.join(" ");
}
