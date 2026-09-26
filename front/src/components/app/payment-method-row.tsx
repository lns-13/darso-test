"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, MoreHorizontal, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export type PaymentBrand = "visa" | "mastercard" | "cih";

export type PaymentMethodRowProps =
  | {
      variant?: "row";
      brand: PaymentBrand;
      last4: string;
      expiry: string;
      holder?: string;
      isDefault?: boolean;
      onMenu?: () => void;
      onClick?: () => void;
      className?: string;
    }
  | {
      variant: "add";
      onClick?: () => void;
      className?: string;
      label?: string;
    };

export function PaymentMethodRow(props: PaymentMethodRowProps) {
  if (props.variant === "add") {
    return <AddVariant {...props} />;
  }

  const { brand, last4, expiry, holder, isDefault, onMenu, onClick, className } =
    props;
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: MouseEvent) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  return (
    <div
      className={cn(
        "relative flex items-center gap-3 rounded-[14px] border border-[#EFEFF1] bg-white px-3 py-2.5 transition-colors hover:border-[#D5D7DB]",
        onClick && "cursor-pointer",
        className,
      )}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
    >
      <BrandGlyph brand={brand} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="text-[12.5px] font-semibold tabular-nums text-[#0B0B0F]">
            •••• {last4}
          </p>
          {isDefault ? (
            <span className="inline-flex h-4 items-center rounded-full bg-[#DFFF3F] px-1.5 text-[9.5px] font-semibold text-[#0B0B0F]">
              Défaut
            </span>
          ) : null}
        </div>
        <p className="mt-0.5 truncate text-[10.5px] text-[#8A8D93] tabular-nums">
          {holder ? `${holder} · ` : ""}Exp. {expiry}
        </p>
      </div>
      <div className="relative">
        <button
          type="button"
          aria-label="Options du moyen de paiement"
          onClick={(e) => {
            e.stopPropagation();
            if (onMenu) onMenu();
            else setMenuOpen((v) => !v);
          }}
          className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-[#8A8D93] transition-colors hover:bg-[#F5F5F7] hover:text-[#0B0B0F]"
        >
          <MoreHorizontal className="h-3.5 w-3.5" strokeWidth={1.75} />
        </button>
        <AnimatePresence>
          {menuOpen ? (
            <motion.div
              ref={menuRef}
              initial={{ opacity: 0, y: -4, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.96 }}
              transition={{ duration: 0.12 }}
              className="absolute right-0 top-8 z-40 w-40 overflow-hidden rounded-[12px] bg-white p-1 shadow-[0_10px_30px_rgba(11,11,15,0.14)] ring-1 ring-[#EFEFF1]"
            >
              {!isDefault ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen(false);
                  }}
                  className="block w-full rounded-[8px] px-2.5 py-1.5 text-left text-[12px] font-medium text-[#0B0B0F] transition-colors hover:bg-[#F5F5F7]"
                >
                  Rendre par défaut
                </button>
              ) : null}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(false);
                }}
                className="block w-full rounded-[8px] px-2.5 py-1.5 text-left text-[12px] font-medium text-[#8A8D93] transition-colors hover:bg-[#F5F5F7] hover:text-[#0B0B0F]"
              >
                Supprimer
              </button>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}

function AddVariant({
  onClick,
  className,
  label,
}: {
  onClick?: () => void;
  className?: string;
  label?: string;
}) {
  const [pinged, setPinged] = useState(false);

  return (
    <button
      type="button"
      onClick={() => {
        if (onClick) {
          onClick();
          return;
        }
        setPinged(true);
        window.setTimeout(() => setPinged(false), 1600);
      }}
      className={cn(
        "flex w-full items-center justify-center gap-2 rounded-[14px] border border-dashed border-[#D5D7DB] bg-white px-3.5 py-3 text-[12px] font-semibold text-[#0B0B0F] transition-colors hover:border-[#0B0B0F] hover:bg-[#F5F5F7]",
        pinged && "border-[#0B0B0F] bg-[#F5F5F7]",
        className,
      )}
    >
      {pinged ? (
        <>
          <Check className="h-3.5 w-3.5" strokeWidth={2.25} />
          Bientôt disponible
        </>
      ) : (
        <>
          <Plus className="h-3.5 w-3.5" strokeWidth={2} />
          {label ?? "Ajouter une carte"}
        </>
      )}
    </button>
  );
}

function BrandGlyph({ brand }: { brand: PaymentBrand }) {
  const shared =
    "grid h-9 w-12 shrink-0 place-items-center rounded-[8px] border border-[#EFEFF1] text-[10px] font-bold tracking-tight";
  if (brand === "visa") {
    return (
      <div className={cn(shared, "bg-white text-[#1A1F71]")}>
        <span className="italic">VISA</span>
      </div>
    );
  }
  if (brand === "mastercard") {
    return (
      <div className={cn(shared, "bg-white")}>
        <span className="relative flex items-center">
          <span className="h-4 w-4 rounded-full bg-[#EB001B]" />
          <span className="-ml-1.5 h-4 w-4 rounded-full bg-[#F79E1B] mix-blend-multiply" />
        </span>
      </div>
    );
  }
  // CIH
  return (
    <div className={cn(shared, "bg-[#0B0B0F] text-[#DFFF3F]")}>
      <span>CIH</span>
    </div>
  );
}
