"use client";

import { AnimatePresence, motion, type Transition, type Variants } from "motion/react";
import { useId, useMemo } from "react";
import { cn } from "@/lib/utils";

export interface TextMorphProps {
  children: string;
  as?: React.ElementType;
  className?: string;
  style?: React.CSSProperties;
  variants?: Variants;
  transition?: Transition;
}

const defaultVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

const defaultTransition: Transition = {
  type: "spring",
  bounce: 0,
  duration: 0.3,
};

export function TextMorph({
  children,
  as: Component = "span",
  className,
  style,
  variants,
  transition,
}: TextMorphProps) {
  const id = useId();

  const characters = useMemo(() => {
    const counts: Record<string, number> = {};
    return children.split("").map((char) => {
      const lower = char.toLowerCase();
      counts[lower] = (counts[lower] || 0) + 1;
      return { id: `${lower}${counts[lower]}`, label: char === " " ? " " : char };
    });
  }, [children]);

  const MotionComponent = motion.create(Component as keyof HTMLElementTagNameMap);

  return (
    <MotionComponent
      className={cn("relative inline-block whitespace-pre-wrap", className)}
      aria-label={children}
      style={style}
      layout
      transition={transition ?? defaultTransition}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        {characters.map((c) => (
          <motion.span
            key={`${id}-${c.id}`}
            layoutId={`${id}-${c.id}`}
            className="inline-block"
            aria-hidden="true"
            variants={variants ?? defaultVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={transition ?? defaultTransition}
          >
            {c.label}
          </motion.span>
        ))}
      </AnimatePresence>
    </MotionComponent>
  );
}
