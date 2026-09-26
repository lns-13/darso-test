"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { ChevronsLeft, ChevronsRight } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { cn } from "@/lib/utils";
import { springSoft, fadeQuick } from "@/lib/motion";
import type { NavConfig, NavItemConfig } from "@/lib/nav";
import { Avatar } from "./avatar";

export function isNavActive(pathname: string | null, href?: string): boolean {
  if (!href || !pathname) return false;
  if (pathname === href) return true;
  // Single-segment hrefs like /student or /teacher are role roots — they should
  // only light up when the user is exactly there, otherwise every subroute
  // would also highlight the dashboard.
  const segments = href.split("/").filter(Boolean);
  if (segments.length <= 1) return false;
  return pathname.startsWith(href + "/");
}

export function Sidebar({
  collapsed,
  onToggle,
  nav,
  user,
}: {
  collapsed: boolean;
  onToggle: () => void;
  nav: NavConfig;
  user: { fullName: string; level?: string; initials: string };
}) {
  return (
    <motion.aside
      animate={{ width: collapsed ? 64 : 208 }}
      transition={springSoft}
      className="flex shrink-0 flex-col rounded-[20px] bg-white p-3 shadow-[0_1px_2px_rgba(10,11,20,0.04)]"
    >
      <div className="mb-5 flex items-center gap-2 px-1 pt-0.5">
        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#0B0B0F]">
          <Logo mark className="!text-[19px] !text-[#DFFF3F]" />
        </div>
        <AnimatePresence initial={false}>
          {!collapsed ? (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              transition={fadeQuick}
              className="flex flex-1 items-center justify-between overflow-hidden"
            >
              <Logo className="!text-[21px]" />
              <button
                onClick={onToggle}
                aria-label="Réduire le menu"
                className="ml-1 grid h-6 w-6 place-items-center rounded-md text-[#8A8D93] transition-colors hover:bg-[#F5F5F7] hover:text-[#0B0B0F]"
              >
                <ChevronsLeft className="h-3.5 w-3.5" strokeWidth={2} />
              </button>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      {collapsed ? (
        <button
          onClick={onToggle}
          aria-label="Déployer le menu"
          className="mb-2 grid h-8 place-items-center rounded-lg text-[#8A8D93] transition-colors hover:bg-[#F5F5F7] hover:text-[#0B0B0F]"
        >
          <ChevronsRight className="h-3.5 w-3.5" strokeWidth={2} />
        </button>
      ) : null}

      <nav className="flex flex-1 flex-col gap-0.5">
        {nav.map((group, i) => (
          <div key={group.label}>
            {i > 0 ? <div className="h-4" /> : null}
            <NavGroup label={group.label} collapsed={collapsed}>
              {group.items.map((item) => (
                <NavItem key={item.label} item={item} collapsed={collapsed} />
              ))}
            </NavGroup>
          </div>
        ))}
      </nav>

      <div
        className={cn(
          "mt-3 flex items-center gap-2.5 rounded-xl border border-[#EFEFF1] p-2",
          collapsed && "justify-center",
        )}
      >
        <Avatar initials={user.initials} tone="brand" size={collapsed ? 30 : 34} />
        <AnimatePresence initial={false}>
          {!collapsed ? (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              transition={fadeQuick}
              className="min-w-0 flex-1 overflow-hidden"
            >
              <p className="truncate text-[12.5px] font-semibold text-[#0B0B0F]">
                {user.fullName}
              </p>
              {user.level ? (
                <p className="truncate text-[10.5px] text-[#8A8D93]">{user.level}</p>
              ) : null}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </motion.aside>
  );
}

export function NavGroup({
  label,
  collapsed,
  children,
}: {
  label: string;
  collapsed: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <AnimatePresence initial={false}>
        {!collapsed ? (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={fadeQuick}
            className="mb-1 px-2.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-[#B0B3B8]"
          >
            {label}
          </motion.p>
        ) : (
          <div className="mx-auto mb-1 h-px w-6 bg-[#EFEFF1]" />
        )}
      </AnimatePresence>
      {children}
    </div>
  );
}

export function NavItem({
  item,
  collapsed,
  onClick,
}: {
  item: NavItemConfig;
  collapsed: boolean;
  onClick?: () => void;
}) {
  const { icon: Icon, label, href, badge } = item;
  const pathname = usePathname();
  const active = isNavActive(pathname, href);

  const className = cn(
    "group relative flex h-9 items-center gap-2.5 rounded-lg px-2.5 text-[12.5px] font-medium transition-colors",
    active
      ? "bg-[#0B0B0F] text-white"
      : "text-[#4A4D54] hover:bg-[#F5F5F7] hover:text-[#0B0B0F]",
    collapsed && "justify-center",
  );

  const inner = (
    <>
      <Icon className="h-[16px] w-[16px] shrink-0" strokeWidth={1.75} />
      <AnimatePresence initial={false}>
        {!collapsed ? (
          <motion.span
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: "auto" }}
            exit={{ opacity: 0, width: 0 }}
            transition={fadeQuick}
            className="flex-1 overflow-hidden whitespace-nowrap text-left"
          >
            {label}
          </motion.span>
        ) : null}
      </AnimatePresence>
      {badge ? (
        collapsed ? (
          <span className="absolute right-1 top-1 grid h-3.5 min-w-3.5 place-items-center rounded-full bg-[#DFFF3F] px-1 text-[9px] font-bold text-[#0B0B0F]">
            {badge}
          </span>
        ) : (
          <span
            className={cn(
              "grid h-[18px] min-w-[18px] place-items-center rounded-full px-1.5 text-[10px] font-semibold",
              active ? "bg-[#DFFF3F] text-[#0B0B0F]" : "bg-[#F0F0F2] text-[#0B0B0F]",
            )}
          >
            {badge}
          </span>
        )
      ) : null}
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        onClick={onClick}
        title={collapsed ? label : undefined}
        aria-current={active ? "page" : undefined}
        className={className}
      >
        {inner}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      title={collapsed ? label : undefined}
      className={className}
    >
      {inner}
    </button>
  );
}
