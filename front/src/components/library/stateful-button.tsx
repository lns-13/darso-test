"use client";

import React from "react";
import { motion, useAnimate } from "motion/react";
import { cn } from "@/lib/utils";

/** "loading" spins, "success" flashes the checkmark, "idle" shows neither. */
export type StatefulButtonStatus = "idle" | "loading" | "success";

interface StatefulButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  className?: string;
  children: React.ReactNode;
  /**
   * Drive the loader and the checkmark from outside.
   *
   * Left undefined, the button keeps its original behaviour: the click
   * handler runs the loading animation, awaits an optional `onClick`, then
   * runs the success animation. On a bare submit button with no `onClick`
   * that awaits nothing at all, so the green checkmark fires whatever
   * happened — including when the submission failed.
   *
   * Pass a status wherever the outcome can fail (every auth form does) so the
   * animation follows the action's real pending and error state.
   */
  status?: StatefulButtonStatus;
}

export const StatefulButton = ({
  className,
  children,
  status,
  ...props
}: StatefulButtonProps) => {
  const [scope, animate] = useAnimate();

  const animateLoading = async () => {
    await animate(".loader", { width: "16px", scale: 1, display: "block" }, { duration: 0.2 });
  };

  const animateSuccess = async () => {
    await animate(".loader", { width: "0px", scale: 0, display: "none" }, { duration: 0.2 });
    await animate(".check", { width: "16px", scale: 1, display: "block" }, { duration: 0.2 });
    await animate(".check", { width: "0px", scale: 0, display: "none" }, { delay: 1.6, duration: 0.2 });
  };

  const animateIdle = async () => {
    await animate(".loader", { width: "0px", scale: 0, display: "none" }, { duration: 0.2 });
    await animate(".check", { width: "0px", scale: 0, display: "none" }, { duration: 0.2 });
  };

  const controlled = status !== undefined;
  const previousStatus = React.useRef<StatefulButtonStatus>("idle");

  React.useEffect(() => {
    if (status === undefined) return;
    if (previousStatus.current === status) return;
    previousStatus.current = status;

    if (status === "loading") void animateLoading();
    else if (status === "success") void animateSuccess();
    else void animateIdle();
    // `animate` from useAnimate is stable for the life of the scope.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const handleClick = async (event: React.MouseEvent<HTMLButtonElement>) => {
    if (controlled) {
      await props.onClick?.(event);
      return;
    }
    await animateLoading();
    await props.onClick?.(event);
    await animateSuccess();
  };

  const {
    onClick,
    onDrag,
    onDragStart,
    onDragEnd,
    onAnimationStart,
    onAnimationEnd,
    ...buttonProps
  } = props;

  return (
    <motion.button
      layout
      ref={scope}
      className={cn(
        "flex min-w-[96px] cursor-pointer items-center justify-center gap-1.5 rounded-full bg-[#DFFF3F] px-3 py-1.5 text-[11.5px] font-semibold text-[#0B0B0F] transition-[filter] hover:brightness-[0.97]",
        className,
      )}
      {...buttonProps}
      onClick={handleClick}
    >
      <motion.div layout className="flex items-center gap-1.5">
        <Loader />
        <CheckMark />
        <motion.span layout>{children}</motion.span>
      </motion.div>
    </motion.button>
  );
};

const Loader = () => (
  <motion.svg
    animate={{ rotate: [0, 360] }}
    initial={{ scale: 0, width: 0, display: "none" }}
    style={{ scale: 0.5, display: "none" }}
    transition={{ duration: 0.4, repeat: Infinity, ease: "linear" }}
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="loader text-[#0B0B0F]"
  >
    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
    <path d="M12 3a9 9 0 1 0 9 9" />
  </motion.svg>
);

const CheckMark = () => (
  <motion.svg
    initial={{ scale: 0, width: 0, display: "none" }}
    style={{ scale: 0.5, display: "none" }}
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="3"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="check text-[#0B0B0F]"
  >
    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
    <path d="M5 12l5 5l10 -10" />
  </motion.svg>
);
