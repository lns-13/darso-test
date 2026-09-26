"use client";

import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

export type DataTableColumn = {
  key: string;
  header: ReactNode;
  align?: "left" | "right" | "center";
  className?: string;
  numeric?: boolean;
  headerClassName?: string;
};

export type DataTableRow = { id: string; [key: string]: unknown };

export type DataTableProps<R extends DataTableRow> = {
  columns: DataTableColumn[];
  rows: R[];
  onRowClick?: (row: R) => void;
  stickyHeader?: boolean;
  className?: string;
  rowClassName?: (row: R) => string | undefined;
  emptyLabel?: string;
};

export function DataTable<R extends DataTableRow>({
  columns,
  rows,
  onRowClick,
  stickyHeader,
  className,
  rowClassName,
  emptyLabel = "Aucune ligne à afficher.",
}: DataTableProps<R>) {
  if (rows.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-[16px] border border-dashed border-[#EFEFF1] bg-white/50 px-6 py-10 text-[12px] text-[#8A8D93]">
        {emptyLabel}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "overflow-hidden rounded-[16px] border border-[#EFEFF1] bg-white",
        className,
      )}
    >
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead
            className={cn(
              "bg-white text-[10px] font-semibold uppercase tracking-[0.08em] text-[#8A8D93]",
              stickyHeader ? "sticky top-0 z-10" : undefined,
            )}
          >
            <tr className="border-b border-[#EFEFF1]">
              {columns.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  className={cn(
                    "px-4 py-3 font-semibold",
                    col.align === "right" && "text-right",
                    col.align === "center" && "text-center",
                    (col.numeric || col.align === "right") && "tabular-nums",
                    col.headerClassName,
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EFEFF1] text-[13px] text-[#0B0B0F]">
            {rows.map((row) => {
              const clickable = Boolean(onRowClick);
              return (
                <tr
                  key={row.id}
                  onClick={clickable ? () => onRowClick?.(row) : undefined}
                  onKeyDown={
                    clickable
                      ? (e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            onRowClick?.(row);
                          }
                        }
                      : undefined
                  }
                  tabIndex={clickable ? 0 : undefined}
                  role={clickable ? "button" : undefined}
                  className={cn(
                    "even:bg-[#FAFAFB] transition-colors",
                    clickable &&
                      "cursor-pointer hover:bg-[#F5F5F7] focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#0B0B0F]",
                    rowClassName?.(row),
                  )}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn(
                        "px-4 py-3 align-middle",
                        col.align === "right" && "text-right",
                        col.align === "center" && "text-center",
                        (col.numeric || col.align === "right") && "tabular-nums",
                        col.className,
                      )}
                    >
                      {row[col.key] as ReactNode}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
