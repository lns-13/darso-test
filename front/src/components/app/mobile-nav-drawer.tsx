"use client";

import { motion } from "motion/react";
import { X } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { springSoft } from "@/lib/motion";
import type { NavConfig } from "@/lib/nav";
import { Avatar } from "./avatar";
import { NavGroup, NavItem } from "./sidebar";

export function MobileNavDrawer({
  nav,
  user,
  onClose,
}: {
  nav: NavConfig;
  user: { fullName: string; level?: string; initials: string };
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-40 bg-[#0B0B0F]/40"
      onClick={onClose}
    >
      <motion.aside
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={springSoft}
        onClick={(e) => e.stopPropagation()}
        className="scrollbar-none absolute inset-y-0 right-0 flex w-[280px] max-w-[86vw] flex-col overflow-y-auto bg-white p-4 shadow-[-8px_0_40px_-12px_rgba(10,11,20,0.25)]"
      >
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-[#0B0B0F]">
              <Logo mark className="!text-[20px] !text-[#DFFF3F]" />
            </div>
            <Logo className="!text-[22px]" />
          </div>
          <button
            onClick={onClose}
            aria-label="Fermer"
            className="grid h-8 w-8 place-items-center rounded-md text-[#8A8D93] transition-colors hover:bg-[#F5F5F7] hover:text-[#0B0B0F]"
          >
            <X className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-0.5">
          {nav.map((group, i) => (
            <div key={group.label}>
              {i > 0 ? <div className="h-4" /> : null}
              <NavGroup label={group.label} collapsed={false}>
                {group.items.map((item) => (
                  <NavItem
                    key={item.label}
                    item={item}
                    collapsed={false}
                    onClick={onClose}
                  />
                ))}
              </NavGroup>
            </div>
          ))}
        </nav>

        <div className="mt-3 flex items-center gap-2.5 rounded-xl border border-[#EFEFF1] p-2">
          <Avatar initials={user.initials} tone="brand" size={34} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[12.5px] font-semibold text-[#0B0B0F]">
              {user.fullName}
            </p>
            {user.level ? (
              <p className="truncate text-[10.5px] text-[#8A8D93]">{user.level}</p>
            ) : null}
          </div>
        </div>
      </motion.aside>
    </motion.div>
  );
}
