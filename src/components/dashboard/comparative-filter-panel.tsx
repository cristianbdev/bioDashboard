"use client";

import { useId } from "react";
import { Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FilterClearButton } from "@/components/ui/filter-clear-button";
import { cn } from "@/lib/utils";

export type FilterConfig = {
  id: string;
  label: string;
  value: string;
  options: string[];
  placeholder: string;
  onChange: (value: string) => void;
};

export type FilterBadge = {
  label: string;
  value: string;
  onClear: () => void;
};

type ComparativeFilterPanelProps = {
  /** Visible title above the filters */
  title?: string;
  /** Whether this is the bottom-sheet variant (lighter SelectTrigger styling) */
  variant?: "inline-mobile" | "inline-desktop" | "sheet";
  /** List of filter definitions */
  filters: FilterConfig[];
  /** Computed active badges to display */
  activeBadges: FilterBadge[];
  /** Called to clear all filters */
  onClearAll: () => void;
  /** Translation function */
  t: (key: string) => string;
};

export function ComparativeFilterPanel({
  title,
  variant = "inline-desktop",
  filters,
  activeBadges,
  onClearAll,
  t,
}: ComparativeFilterPanelProps) {
  const baseId = useId();
  const isSheet = variant === "sheet";
  const isMobile = variant === "inline-mobile";
  const isDesktop = variant === "inline-desktop";

  const triggerClass = isSheet
    ? "w-full border-border bg-card"
    : "h-10 w-full border-border bg-card text-foreground hover:border-primary/40 focus:border-primary focus:ring-1 focus:ring-[var(--color-brand)]";

  const labelClass = isSheet ? "text-xs font-medium text-muted-foreground" : "text-xs font-medium text-muted-foreground";
  const spaceClass = isSheet ? "space-y-2" : "space-y-1.5";

  // Grid columns based on variant
  const gridClass = cn(
    "grid gap-3",
    isMobile && "sm:grid-cols-2",
    isDesktop && "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5",
  );

  // Determine which filter should span full width on mobile
  const lastIdx = filters.length - 1;

  return (
    <Card className="card-flat">
      <CardContent className="p-4">
        {title && (
          <div className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-primary">
            <Filter className="h-4 w-4" />
            <span>{title}</span>
          </div>
        )}

        <div className={gridClass}>
          {filters.map((filter, index) => {
            const triggerId = `${baseId}-${filter.id}`;
            return (
              <div
                key={filter.id}
                className={cn(spaceClass, isMobile && index === lastIdx && "sm:col-span-2")}
              >
                <label htmlFor={triggerId} className={labelClass}>
                  {filter.placeholder}
                </label>
                <Select value={filter.value} onValueChange={filter.onChange}>
                  <SelectTrigger id={triggerId} className={triggerClass}>
                    <SelectValue placeholder={filter.placeholder} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("overview.filterAll")}</SelectItem>
                    {filter.options.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            );
          })}
        </div>

        {/* Active Filters Summary */}
        {activeBadges.length > 0 && (
          <div
            className={cn(
              "mt-3 flex flex-wrap items-center gap-2",
              !isSheet && "border-t border-border pt-3",
            )}
          >
            {isSheet && (
              <p className="mb-2 w-full text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t("overview.activeFilters")}
              </p>
            )}
            {activeBadges.map((badge) => (
              <Badge
                key={badge.label + badge.value}
                variant="secondary"
                className={cn(
                  "flex items-center gap-1 pr-1",
                  isSheet
                    ? "bg-primary/10 text-primary border border-primary/20 pr-1.5"
                    : "bg-background text-muted-foreground",
                )}
              >
                {badge.label}: {badge.value}
                <FilterClearButton
                  onClick={badge.onClear}
                  filterName={badge.label}
                  className={isSheet ? "ml-1.5" : "ml-1"}
                />
              </Badge>
            ))}
            <Button
              size="sm"
              variant="ghost"
              className="min-h-11 text-xs text-primary"
              onClick={onClearAll}
            >
              {t("overview.clearAll")}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
