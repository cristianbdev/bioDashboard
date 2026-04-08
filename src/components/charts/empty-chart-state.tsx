"use client";

import { BarChart3 } from "lucide-react";
import { useTranslations } from "next-intl";

type EmptyChartStateProps = {
  title?: string;
  subtitle?: string;
};

export function EmptyChartState({
  title,
  subtitle,
}: EmptyChartStateProps) {
  const t = useTranslations();
  const resolvedTitle = title ?? t("charts.noData");
  const resolvedSubtitle = subtitle ?? t("charts.tryFilters");

  return (
    <div className="flex h-full min-h-[280px] flex-col items-center justify-center rounded-xl border border-dashed border-[var(--color-border-subtle)] text-[var(--color-text-secondary)]">
      <BarChart3 className="mb-3 h-12 w-12 opacity-20" />
      <p className="text-sm font-medium">{resolvedTitle}</p>
      <p className="mt-1 text-xs">{resolvedSubtitle}</p>
    </div>
  );
}
