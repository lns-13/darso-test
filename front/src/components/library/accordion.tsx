// Ported from ../components/accordion.tsx
// Original was a wrapper around an internal ui/accordion package. Rebuilt from
// scratch using motion/react so it plugs into darso without extra deps and
// exposes a search-friendly `<Accordion items={[...]} />` API.
"use client";

import {
  createContext,
  useCallback,
  useContext,
  useId,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const contentSpring = {
  type: "spring" as const,
  stiffness: 320,
  damping: 34,
  mass: 0.7,
};

/* ---------------- context (for composable API) ---------------- */

type AccordionCtx = {
  openIds: Set<string>;
  toggle: (id: string) => void;
  allowMultiple: boolean;
};

const AccordionContext = createContext<AccordionCtx | null>(null);

function useAccordionCtx() {
  const ctx = useContext(AccordionContext);
  if (!ctx) throw new Error("AccordionItem must be used inside <AccordionRoot>");
  return ctx;
}

/* ---------------- composable primitives ---------------- */

export function AccordionRoot({
  children,
  allowMultiple = false,
  defaultOpen = [],
  className,
}: {
  children: ReactNode;
  allowMultiple?: boolean;
  defaultOpen?: string[];
  className?: string;
}) {
  const [openIds, setOpenIds] = useState<Set<string>>(() => new Set(defaultOpen));

  const toggle = useCallback(
    (id: string) => {
      setOpenIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) {
          next.delete(id);
          return next;
        }
        if (!allowMultiple) next.clear();
        next.add(id);
        return next;
      });
    },
    [allowMultiple],
  );

  const value = useMemo<AccordionCtx>(
    () => ({ openIds, toggle, allowMultiple }),
    [openIds, toggle, allowMultiple],
  );

  return (
    <AccordionContext.Provider value={value}>
      <div className={cn("divide-y divide-[#EFEFF1] overflow-hidden rounded-[20px] border border-[#EFEFF1] bg-white", className)}>
        {children}
      </div>
    </AccordionContext.Provider>
  );
}

export function AccordionItem({
  id: idProp,
  question,
  answer,
  className,
}: {
  id?: string;
  question: ReactNode;
  answer: ReactNode;
  className?: string;
}) {
  const reactId = useId();
  const id = idProp ?? reactId;
  const { openIds, toggle } = useAccordionCtx();
  const isOpen = openIds.has(id);
  const panelId = `acc-panel-${id.replace(/:/g, "")}`;
  const buttonId = `acc-btn-${id.replace(/:/g, "")}`;

  return (
    <div className={cn("group", className)}>
      <button
        id={buttonId}
        type="button"
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={() => toggle(id)}
        className="flex w-full items-center justify-between gap-4 px-4 py-3.5 text-left transition-colors hover:bg-[#FAFAFB]"
      >
        <span className="text-[13px] font-semibold leading-snug text-[#0B0B0F]">
          {question}
        </span>
        <motion.span
          aria-hidden
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ type: "spring", stiffness: 360, damping: 30 }}
          className={cn(
            "grid h-6 w-6 shrink-0 place-items-center rounded-full border border-[#EFEFF1] text-[#0B0B0F] transition-colors",
            isOpen ? "bg-[#0B0B0F] text-[#DFFF3F] border-transparent" : "bg-white",
          )}
        >
          <ChevronDown className="h-3.5 w-3.5" strokeWidth={2} />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {isOpen ? (
          <motion.div
            key="content"
            id={panelId}
            role="region"
            aria-labelledby={buttonId}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={contentSpring}
            style={{ overflow: "hidden" }}
          >
            <div className="px-4 pb-4 text-[12.5px] leading-relaxed text-[#6E7178]">
              {answer}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

/* ---------------- convenience data-driven API ---------------- */

export type AccordionItemData = {
  id: string;
  question: string;
  answer: string;
};

export function Accordion({
  items,
  query,
  defaultOpen,
  allowMultiple = false,
  emptyLabel = "Aucun résultat.",
  className,
}: {
  items: AccordionItemData[];
  /** live-search filter: only items whose question or answer contains `query` are shown */
  query?: string;
  defaultOpen?: string[];
  allowMultiple?: boolean;
  emptyLabel?: string;
  className?: string;
}) {
  const q = (query ?? "").trim().toLowerCase();
  const filtered = useMemo(() => {
    if (!q) return items;
    return items.filter(
      (it) =>
        it.question.toLowerCase().includes(q) ||
        it.answer.toLowerCase().includes(q),
    );
  }, [items, q]);

  // when searching, auto-open matches so the user sees why they matched
  const openIds = q ? filtered.map((f) => f.id) : (defaultOpen ?? []);
  // key forces remount when search state flips so default-open recomputes
  const rootKey = q ? `q:${q}` : "no-q";

  if (filtered.length === 0) {
    return (
      <div className={cn("rounded-[20px] border border-dashed border-[#EFEFF1] bg-white/50 px-4 py-6 text-center text-[12px] text-[#8A8D93]", className)}>
        {emptyLabel}
      </div>
    );
  }

  return (
    <AccordionRoot
      key={rootKey}
      allowMultiple={allowMultiple || Boolean(q)}
      defaultOpen={openIds}
      className={className}
    >
      {filtered.map((it) => (
        <AccordionItem
          key={it.id}
          id={it.id}
          question={it.question}
          answer={it.answer}
        />
      ))}
    </AccordionRoot>
  );
}
