"use client";

import { motion, useSpring, useTransform, type SpringOptions } from "motion/react";
import { useEffect } from "react";
import { cn } from "@/lib/utils";

const DEFAULT_SPRING: SpringOptions = { bounce: 0, duration: 900 };

function Digit({
  place,
  value,
  spring,
}: {
  place: number;
  value: number;
  spring: SpringOptions;
}) {
  const valueRoundedToPlace = Math.floor(value / place);
  const animatedValue = useSpring(valueRoundedToPlace, spring);

  useEffect(() => {
    animatedValue.set(valueRoundedToPlace);
  }, [animatedValue, valueRoundedToPlace]);

  return (
    <span className="relative inline-block w-[1ch] overflow-x-visible overflow-y-clip leading-none tabular-nums">
      <span className="invisible inline-block">0</span>
      {Array.from({ length: 10 }).map((_, i) => (
        <Number key={i} mv={animatedValue} number={i} />
      ))}
    </span>
  );
}

function Number({
  mv,
  number,
}: {
  mv: ReturnType<typeof useSpring>;
  number: number;
}) {
  const y = useTransform(mv, (latest) => {
    const height = 1; // in "em"
    const placeValue = latest % 10;
    const offset = (10 + number - placeValue) % 10;
    let memo = offset * height;
    if (offset > 5) memo -= 10 * height;
    return `${memo}em`;
  });

  return (
    <motion.span
      style={{ y }}
      className="absolute inset-0 flex items-center justify-center"
    >
      {number}
    </motion.span>
  );
}

export function SlidingNumber({
  value,
  spring = DEFAULT_SPRING,
  className,
}: {
  value: number;
  spring?: SpringOptions;
  className?: string;
}) {
  const absValue = Math.abs(value);
  const numDigits = absValue === 0 ? 1 : Math.floor(Math.log10(absValue)) + 1;
  const places = Array.from({ length: numDigits }, (_, i) => Math.pow(10, numDigits - 1 - i));

  return (
    <span className={cn("inline-flex items-baseline", className)}>
      {value < 0 && <span>-</span>}
      {places.map((place) => (
        <Digit key={place} place={place} value={absValue} spring={spring} />
      ))}
    </span>
  );
}
