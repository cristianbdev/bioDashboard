"use client";

import { useEffect, useId, useRef, useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { FilterClearButton } from "@/components/ui/filter-clear-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

type FilterConfig = {
  label: string;
  activeValue: string;
  allValue?: string;
  onClear?: () => void;
};

type SelectControl = {
  id: string;
  value: string;
  options: string[];
  placeholder: string;
  onChange: (value: string) => void;
};

type DesktopFloatingFilterLabels = {
  title: string;
  openButton: string;
  openButtonAria: string;
  activeFilters: string;
  filterAll: string;
  close: string;
  clearAll: string;
};

type DesktopFloatingFilterProps = {
  isVisible: boolean;
  filters: FilterConfig[];
  selectControls: SelectControl[];
  onClearAll: () => void;
  activeCount: number;
  labels: DesktopFloatingFilterLabels;
};

export function DesktopFloatingFilter({
  isVisible,
  filters,
  selectControls,
  onClearAll,
  activeCount,
  labels,
}: DesktopFloatingFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const titleId = useId();
  const baseId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      setIsOpen(false);
    }
  };

  const visibleFilters = filters.filter((filter) =>
    filter.allValue ? filter.activeValue !== filter.allValue : filter.activeValue !== "" && filter.activeValue !== "all",
  );

  return (
    <>
      <div
        className={cn(
          "fixed bottom-6 right-6 z-40 hidden lg:block",
          "transition-all duration-300 ease-out",
          isVisible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-20 opacity-0",
        )}
      >
        <Button
          type="button"
          onClick={() => setIsOpen(true)}
          className={cn(
            "flex items-center gap-2 rounded-full px-5 py-6 shadow-xl",
            "bg-[var(--color-brand)] text-white hover:bg-[var(--color-brand)]/90",
            "transition-all duration-200 hover:scale-105 hover:shadow-2xl",
          )}
          aria-label={labels.openButtonAria}
        >
          <SlidersHorizontal className="h-5 w-5" />
          <span className="text-sm font-semibold">{labels.openButton}</span>
          {activeCount > 0 && (
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-raised)] text-xs font-bold text-[var(--color-brand)] shadow-sm">
              {activeCount}
            </span>
          )}
        </Button>
      </div>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 hidden items-center justify-center lg:flex"
          onClick={handleBackdropClick}
          aria-modal="true"
          role="dialog"
          aria-labelledby={titleId}
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" aria-hidden="true" />

          <div
            ref={panelRef}
            className={cn(
              "relative w-full max-w-md rounded-2xl bg-[var(--color-raised)] shadow-2xl",
              "max-h-[80vh] overflow-y-auto",
              "animate-in zoom-in-95 duration-200",
            )}
          >
            <div className="flex items-center justify-between border-b border-[var(--color-border-subtle)] px-5 py-4">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-5 w-5 text-[var(--color-brand)]" />
                <p id={titleId} className="font-semibold text-[var(--color-text-primary)]">
                  {labels.title}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="h-9 w-9 text-[var(--color-text-secondary)]"
                aria-label={labels.close}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="space-y-4 p-5">
              {selectControls.map((control) => {
                const triggerId = `${baseId}-${control.id}`;
                return (
                <div key={control.id} className="space-y-2">
                  <label htmlFor={triggerId} className="text-xs font-medium text-[var(--color-text-secondary)]">{control.placeholder}</label>
                  <Select value={control.value} onValueChange={control.onChange}>
                    <SelectTrigger id={triggerId} className="w-full border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{labels.filterAll}</SelectItem>
                      {control.options.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              );
              })}

              {visibleFilters.length > 0 && (
                <div className="border-t border-[var(--color-border-subtle)] pt-4">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">
                    {labels.activeFilters}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {visibleFilters.map((filter) => (
                      <Badge
                        key={filter.label}
                        variant="secondary"
                        className="border border-[var(--color-brand)]/20 bg-[var(--color-brand)]/10 pr-1.5 text-[var(--color-brand)]"
                      >
                        <span className="max-w-[150px] truncate">
                          {filter.label}: {filter.activeValue}
                        </span>
                        {filter.onClear && (
                          <FilterClearButton onClick={filter.onClear} filterName={filter.label} className="-mr-1 ml-1.5" />
                        )}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button variant="outline" onClick={() => setIsOpen(false)} className="flex-1">
                  {labels.close}
                </Button>
                {activeCount > 0 && (
                  <Button variant="ghost" onClick={onClearAll} className="text-[var(--color-brand)]">
                    {labels.clearAll}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}