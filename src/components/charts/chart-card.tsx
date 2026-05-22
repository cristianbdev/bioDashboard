"use client";

import type { ReactNode } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { InfoTitle } from "@/components/dashboard/info-title";
import { cn } from "@/lib/utils";

export type ChartCardHeight = "sm" | "md" | "lg" | "xl";

const HEIGHT_CLASSES: Record<ChartCardHeight, string> = {
  sm: "min-h-[180px] h-[180px] sm:h-[200px] md:h-[220px]",
  md: "min-h-[200px] h-[200px] sm:h-[230px] md:h-[260px]",
  lg: "min-h-[220px] h-[220px] sm:h-[260px] md:h-[300px]",
  xl: "min-h-[260px] h-[280px] sm:h-[320px] md:h-[380px] xl:h-[420px]",
};

export function truncateChartLabel(value: string, max = 25) {
  if (value.length <= max) return value;
  return `${value.slice(0, max - 1)}…`;
}

export function getAdaptiveChartHeight(itemCount: number): ChartCardHeight {
  if (itemCount <= 4) return "sm";
  if (itemCount <= 8) return "md";
  if (itemCount <= 12) return "lg";
  return "xl";
}

export function getAdaptiveVerticalBarLayout(itemCount: number, longestLabelLength: number) {
  const safeCount = Math.max(1, itemCount);
  const truncatedLength = Math.min(longestLabelLength, 24);
  const yAxisWidth = Math.min(120, Math.max(40, Math.floor(truncatedLength * 5.5)));
  const barSize = Math.max(18, Math.min(32, Math.floor(180 / safeCount)));
  const showValues = safeCount <= 10;
  const leftMargin = 0;

  return {
    yAxisWidth,
    barSize,
    showValues,
    rightMargin: showValues ? 32 : 16,
    leftMargin,
  };
}

type ChartCardProps = {
  title: string;
  info?: string;
  icon?: ReactNode;
  children: ReactNode;
  height?: ChartCardHeight;
  className?: string;
  contentClassName?: string;
  ariaLabel?: string;
};

export function ChartCard({
  title,
  info,
  icon,
  children,
  height = "md",
  className,
  contentClassName,
  ariaLabel,
}: ChartCardProps) {
  return (
    <Card className={cn("card-flat min-w-0", className)}>
      <CardHeader className="border-b border-[var(--color-border-subtle)] pb-3">
        <div className="flex items-center justify-between gap-3">
          <InfoTitle title={title} info={info} />
          {icon ? <div className="text-[var(--color-text-secondary)]">{icon}</div> : null}
        </div>
      </CardHeader>
      <CardContent className={cn("min-w-0 p-3 sm:p-4 lg:p-5", contentClassName)}>
        <div className={cn("chart-container", HEIGHT_CLASSES[height])} role={ariaLabel ? "img" : undefined} aria-label={ariaLabel}>
          {children}
        </div>
      </CardContent>
    </Card>
  );
}
