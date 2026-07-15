"use client";

import { BarChart3 } from "lucide-react";
import { FilterClearButton } from "@/components/ui/filter-clear-button";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export type BlockingFilter = {
  label: string;
  value: string;
  onClear: () => void;
};

export type EmptyChartStateProps = {
  title?: string;
  subtitle?: string;
  blockingFilters?: BlockingFilter[];
  onClearAll?: () => void;
};

export function EmptyChartState({
  title,
  subtitle,
  blockingFilters,
  onClearAll,
}: EmptyChartStateProps) {
  const t = useTranslations();
  const resolvedTitle = title ?? t("charts.noData");
  const resolvedSubtitle = subtitle ?? t("charts.tryFilters");

  return (
    <div className="flex h-full min-h-[280px] flex-col items-center justify-center rounded-xl border border-dashed border-border text-muted-foreground p-6">
      <BarChart3 className="mb-3 h-12 w-12 opacity-20" />
      <p className="text-sm font-medium">{resolvedTitle}</p>
      <p className="mt-1 text-xs">{resolvedSubtitle}</p>

      {blockingFilters && blockingFilters.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2 max-w-full">
          {blockingFilters.map((filter) => (
            <Badge
              key={filter.label}
              variant="secondary"
              className="bg-primary/10 text-primary border border-primary/20 pr-1.5"
            >
              <span className="max-w-[120px] truncate text-xs">{filter.label}: {filter.value}</span>
              <FilterClearButton onClick={filter.onClear} filterName={filter.label} className="ml-1.5" />
            </Badge>
          ))}
        </div>
      )}

      {onClearAll && blockingFilters && blockingFilters.length > 0 && (
        <Button
          size="sm"
          variant="ghost"
          onClick={onClearAll}
          className="mt-3 min-h-11 text-xs text-primary"
        >
          {t("overview.clearAll")}
        </Button>
      )}
    </div>
  );
}
