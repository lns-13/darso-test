"use client";

import {
  AnimatePresence,
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  type MotionValue,
} from "motion/react";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";

export type DockItem = {
  title: string;
  icon: React.ReactNode;
  onClick?: () => void;
  href?: string;
  active?: boolean;
  badge?: number;
};

export interface FloatingDockProps {
  items: DockItem[];
  className?: string;
  /**
   * "auto" – dock on md+, fan-out burger on mobile (original behavior).
   * "dock" – always-visible dock (all sizes).
   * "burger" – always the fan-out burger.
   */
  variant?: "auto" | "dock" | "burger";
}

export function FloatingDock({ items, className, variant = "auto" }: FloatingDockProps) {
  if (variant === "dock") {
    return <DesktopDock items={items} className={cn("flex", className)} />;
  }
  if (variant === "burger") {
    return <BurgerDock items={items} className={cn("block", className)} />;
  }
  return (
    <>
      <DesktopDock items={items} className={cn("hidden md:flex", className)} />
      <BurgerDock items={items} className={cn("block md:hidden", className)} />
    </>
  );
}

/* ---------------- Desktop / always-visible dock ---------------- */

function DesktopDock({ items, className }: { items: DockItem[]; className?: string }) {
  const mouseX = useMotionValue(Infinity);
  return (
    <motion.div
      onMouseMove={(e) => mouseX.set(e.pageX)}
      onMouseLeave={() => mouseX.set(Infinity)}
      className={cn(
        "mx-auto h-14 items-end gap-2 rounded-full bg-[#0B0B0F] px-3 pb-2 pt-2 shadow-[0_10px_30px_-8px_rgba(10,11,20,0.35)]",
        className,
      )}
    >
      {items.map((item) => (
        <IconContainer mouseX={mouseX} key={item.title} {...item} />
      ))}
    </motion.div>
  );
}

function IconContainer({
  mouseX,
  title,
  icon,
  onClick,
  href,
  active,
  badge,
}: DockItem & { mouseX: MotionValue }) {
  const ref = useRef<HTMLButtonElement>(null);
  const router = useRouter();

  const distance = useTransform(mouseX, (val) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
    return val - bounds.x - bounds.width / 2;
  });

  const widthT = useTransform(distance, [-120, 0, 120], [40, 56, 40]);
  const heightT = useTransform(distance, [-120, 0, 120], [40, 56, 40]);
  const iconWT = useTransform(distance, [-120, 0, 120], [18, 24, 18]);
  const iconHT = useTransform(distance, [-120, 0, 120], [18, 24, 18]);

  const width = useSpring(widthT, { mass: 0.1, stiffness: 150, damping: 12 });
  const height = useSpring(heightT, { mass: 0.1, stiffness: 150, damping: 12 });
  const widthIcon = useSpring(iconWT, { mass: 0.1, stiffness: 150, damping: 12 });
  const heightIcon = useSpring(iconHT, { mass: 0.1, stiffness: 150, damping: 12 });

  const [hovered, setHovered] = useState(false);

  return (
    <motion.button
      ref={ref}
      style={{ width, height }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => {
        onClick?.();
        if (href) router.push(href);
      }}
      aria-label={title}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative flex aspect-square items-center justify-center rounded-full transition-colors",
        active ? "bg-[#DFFF3F] text-[#0B0B0F]" : "bg-white/5 text-white/70 hover:text-white",
      )}
    >
      <AnimatePresence>
        {hovered ? (
          <motion.div
            initial={{ opacity: 0, y: 8, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: 2, x: "-50%" }}
            className="pointer-events-none absolute -top-8 left-1/2 w-fit whitespace-pre rounded-md bg-[#0B0B0F] px-2 py-0.5 text-[10.5px] font-medium text-white ring-1 ring-white/10"
          >
            {title}
          </motion.div>
        ) : null}
      </AnimatePresence>
      <motion.div style={{ width: widthIcon, height: heightIcon }} className="flex items-center justify-center">
        {icon}
      </motion.div>
      {badge ? (
        <span
          className={cn(
            "absolute right-0.5 top-0.5 grid h-3.5 min-w-3.5 place-items-center rounded-full px-1 text-[9px] font-bold ring-2 ring-[#0B0B0F]",
            active ? "bg-[#0B0B0F] text-[#DFFF3F]" : "bg-[#DFFF3F] text-[#0B0B0F]",
          )}
        >
          {badge}
        </span>
      ) : null}
    </motion.button>
  );
}

/* ---------------- Fan-out burger (mobile-original) ---------------- */

function BurgerDock({ items, className }: { items: DockItem[]; className?: string }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  return (
    <div className={cn("relative", className)}>
      <AnimatePresence>
        {open ? (
          <motion.div className="absolute inset-x-0 bottom-full mb-2 flex flex-col items-center gap-2">
            {items.map((item, idx) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10, transition: { delay: idx * 0.04 } }}
                transition={{ delay: (items.length - 1 - idx) * 0.04 }}
              >
                <button
                  onClick={() => {
                    item.onClick?.();
                    if (item.href) router.push(item.href);
                    setOpen(false);
                  }}
                  aria-label={item.title}
                  className={cn(
                    "flex h-11 w-11 items-center justify-center rounded-full",
                    item.active
                      ? "bg-[#0B0B0F] text-white"
                      : "bg-white text-[#0B0B0F] shadow-[0_2px_8px_rgba(10,11,20,0.08)]",
                  )}
                >
                  <div className="h-4 w-4">{item.icon}</div>
                </button>
              </motion.div>
            ))}
          </motion.div>
        ) : null}
      </AnimatePresence>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Menu"
        className="flex h-12 w-12 items-center justify-center rounded-full bg-[#0B0B0F] text-white shadow-[0_4px_16px_rgba(10,11,20,0.14)]"
      >
        <LayoutGrid className="h-5 w-5" strokeWidth={1.75} />
      </button>
    </div>
  );
}
