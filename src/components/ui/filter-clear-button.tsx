"use client";

import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

type FilterClearButtonProps = {
  onClick: () => void;
  filterName: string;
  className?: string;
};

export function FilterClearButton({ onClick, filterName, className }: FilterClearButtonProps) {
  const t = useTranslations();

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={t("filters.removeFilter", { filter: filterName })}
      className={cn(
        "touch-target shrink-0 rounded-full text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-brand)]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand)] focus-visible:ring-offset-1",
        className,
      )}
    >
      <X className="h-3.5 w-3.5" />
    </button>
  );
}
