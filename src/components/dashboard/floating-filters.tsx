"use client";

import { Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BottomSheet } from "@/components/layout/bottom-sheet";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

type FilterConfig = {
  label: string;
  activeValue: string;
  allValue?: string;
  onClear?: () => void;
};

type FloatingFiltersProps = {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  filters: FilterConfig[];
  onClearAll: () => void;
  speciesFilter: string;
  systemFilter: string;
  locationFilter: string;
  speciesOptions: string[];
  systemOptions: string[];
  locationOptions: string[];
  speciesPlaceholder: string;
  systemPlaceholder: string;
  locationPlaceholder: string;
  setSpeciesFilter: (value: string) => void;
  setSystemFilter: (value: string) => void;
  setLocationFilter: (value: string) => void;
  t: (key: string) => string;
};

export function FloatingFilters({
  isOpen,
  onOpen,
  onClose,
  filters,
  onClearAll,
  speciesFilter,
  systemFilter,
  locationFilter,
  speciesOptions,
  systemOptions,
  locationOptions,
  speciesPlaceholder,
  systemPlaceholder,
  locationPlaceholder,
  setSpeciesFilter,
  setSystemFilter,
  setLocationFilter,
  t,
}: FloatingFiltersProps) {
  const activeCount = filters.filter((f) => f.allValue ? f.activeValue !== f.allValue : f.activeValue !== "" && f.activeValue !== "all").length;

  return (
    <>
      {/* Floating button - only visible on mobile */}
      <Button
        type="button"
        onClick={onOpen}
        className={cn(
          "fixed bottom-20 right-4 z-40 flex items-center gap-2 rounded-full px-4 py-3 shadow-lg transition-all lg:hidden",
          "bg-[var(--color-brand)] text-white hover:bg-[var(--color-brand)]/90",
          "animate-in slide-in-from-bottom-4 duration-300",
        )}
        aria-label={t("overview.openFilters")}
      >
        <Filter className="h-4 w-4" />
        <span className="text-sm font-medium">{t("overview.filters")}</span>
        {activeCount > 0 && (
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-raised)] text-xs font-bold text-[var(--color-brand)]">
            {activeCount}
          </span>
        )}
      </Button>

      {/* Mobile filters sheet */}
      <BottomSheet
        isOpen={isOpen}
        onClose={onClose}
        title={t("overview.filters")}
        closeLabel={t("navigation.closeMenu")}
      >
        <div className="space-y-4">
          {/* Species filter */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-[var(--color-text-secondary)]">{speciesPlaceholder}</p>
            <Select value={speciesFilter} onValueChange={setSpeciesFilter}>
              <SelectTrigger className="w-full border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("overview.filterAll")}</SelectItem>
                {speciesOptions.map((option) => (
                  <SelectItem key={option} value={option}>{option}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* System filter */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-[var(--color-text-secondary)]">{systemPlaceholder}</p>
            <Select value={systemFilter} onValueChange={setSystemFilter}>
              <SelectTrigger className="w-full border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("overview.filterAll")}</SelectItem>
                {systemOptions.map((option) => (
                  <SelectItem key={option} value={option}>{option}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Location filter */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-[var(--color-text-secondary)]">{locationPlaceholder}</p>
            <Select value={locationFilter} onValueChange={setLocationFilter}>
              <SelectTrigger className="w-full border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("overview.filterAll")}</SelectItem>
                {locationOptions.map((option) => (
                  <SelectItem key={option} value={option}>{option}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Active filters summary */}
          {activeCount > 0 && (
            <div className="border-t border-[var(--color-border-subtle)] pt-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">{t("overview.activeFilters")}</p>
              <div className="flex flex-wrap gap-2">
                {filters
                  .filter((f) => f.allValue ? f.activeValue !== f.allValue : f.activeValue !== "" && f.activeValue !== "all")
                  .map((filter) => (
                    <Badge
                      key={filter.label}
                      variant="secondary"
                      className="bg-[var(--color-brand)]/10 text-[var(--color-brand)] border border-[var(--color-brand)]/20 pr-1.5"
                    >
                      <span className="max-w-[150px] truncate">{filter.label}: {filter.activeValue}</span>
                      {filter.onClear && (
                        <button
                          type="button"
                          onClick={filter.onClear}
                          className="ml-1.5 -mr-1 rounded-full p-0.5 hover:bg-[var(--color-brand)]/20"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </Badge>
                  ))}
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  onClearAll();
                }}
                className="mt-3 text-xs text-[var(--color-brand)]"
              >
                {t("overview.clearAll")}
              </Button>
            </div>
          )}
        </div>
      </BottomSheet>
    </>
  );
}
