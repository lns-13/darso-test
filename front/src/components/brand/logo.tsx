export function Logo({ className, mark = false }: { className?: string; mark?: boolean }) {
  const sizes = mark
    ? "text-[28px] sm:text-[30px] md:text-[32px]"
    : "text-[32px] sm:text-[36px] md:text-[40px] lg:text-[44px]";
  return (
    <span
      dir="ltr"
      className={`inline-block select-none font-bold leading-none tracking-[-0.005em] text-foreground ${sizes}${className ? ` ${className}` : ""}`}
      style={{
        fontFamily: "var(--font-caveat), cursive",
        transform: "rotate(-4deg)",
        transformOrigin: "50% 60%",
      }}
      aria-label="darso"
    >
      {mark ? "d" : "darso"}
    </span>
  );
}
