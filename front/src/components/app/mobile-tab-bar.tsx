"use client";

import { usePathname } from "next/navigation";
import { FloatingDock, type DockItem } from "@/components/library/floating-dock";
import type { TabConfig } from "@/lib/nav";
import { isNavActive } from "./sidebar";

export function MobileTabBar({ tabs }: { tabs: TabConfig[] }) {
  const pathname = usePathname();
  const dockItems: DockItem[] = tabs.map((t) => ({
    title: t.label,
    icon: <t.icon className="h-full w-full" strokeWidth={1.75} />,
    href: t.href,
    active: isNavActive(pathname, t.href),
    badge: t.badge,
  }));

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 flex justify-center px-4 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-2">
      <FloatingDock items={dockItems} variant="dock" />
    </div>
  );
}
