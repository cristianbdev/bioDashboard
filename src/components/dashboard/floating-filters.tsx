"use client";

import { useId } from "react";
import { Filter } from "lucide-react";
import { FilterClearButton } from "@/components/ui/filter-clear-button";
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
  const speciesId = useId();
  const systemId = useId();
  const locationId = useId();
  const activeCount = filters.filter((f) => f.allValue ? f.activeValue !== f.allValue : f.activeValue !== "" && f.activeValue !== "all").length;

  return (
    <>
      {/* Floating button - only visible on mobile */}
      <Button
        type="button"
        onClick={onOpen}
        className={cn(
          "fixed bottom-20 right-4 z-40 flex items-center gap-2 rounded-full px-4 py-3 shadow-lg transition-all lg:hidden",
          "btn-brand",
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
            <label htmlFor={speciesId} className="text-xs font-medium text-[var(--color-text-secondary)]">{speciesPlaceholder}</label>
            <Select value={speciesFilter} onValueChange={setSpeciesFilter}>
              <SelectTrigger id={speciesId} className="w-full border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]">
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
            <label htmlFor={systemId} className="text-xs font-medium text-[var(--color-text-secondary)]">{systemPlaceholder}</label>
            <Select value={systemFilter} onValueChange={setSystemFilter}>
              <SelectTrigger id={systemId} className="w-full border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]">
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
            <label htmlFor={locationId} className="text-xs font-medium text-[var(--color-text-secondary)]">{locationPlaceholder}</label>
            <Select value={locationFilter} onValueChange={setLocationFilter}>
              <SelectTrigger id={locationId} className="w-full border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]">
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
                        <FilterClearButton onClick={filter.onClear} filterName={filter.label} className="ml-1.5 -mr-1" />
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
