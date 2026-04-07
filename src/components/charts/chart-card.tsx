import type { CSSProperties, ReactNode } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { InfoTitle } from "@/components/dashboard/info-title";
import { cn } from "@/lib/utils";

export type ChartCardHeight = "sm" | "md" | "lg" | "xl";

const HEIGHT_CLASSES: Record<ChartCardHeight, string> = {
  sm: "min-h-[200px] h-[200px] sm:h-[220px] md:h-[240px]",
  md: "min-h-[220px] h-[220px] sm:h-[250px] md:h-[280px]",
  lg: "min-h-[240px] h-[240px] sm:h-[280px] md:h-[330px]",
  xl: "min-h-[280px] h-[300px] sm:h-[340px] md:h-[400px] xl:h-[450px]",
};

export const CHART_TOOLTIP_STYLE: CSSProperties = {
  borderRadius: "12px",
  border: "1px solid var(--color-border-subtle)",
  backgroundColor: "white",
  boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
  fontSize: "12px",
};

export const CHART_TOOLTIP_CURSOR = { fill: "var(--color-surface-base)" };

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
  const yAxisWidth = Math.min(168, Math.max(68, Math.floor(longestLabelLength * 5.2)));
  const barSize = Math.max(12, Math.min(34, Math.floor(220 / safeCount)));
  const showValues = safeCount <= 9;

  return {
    yAxisWidth,
    barSize,
    showValues,
    rightMargin: showValues ? 24 : 12,
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
};

export function ChartCard({
  title,
  info,
  icon,
  children,
  height = "md",
  className,
  contentClassName,
}: ChartCardProps) {
  return (
    <Card className={cn("card-flat", className)}>
      <CardHeader className="border-b border-[var(--color-border-subtle)] pb-3">
        <div className="flex items-center justify-between gap-3">
          <InfoTitle title={title} info={info} />
          {icon ? <div className="text-[var(--color-text-secondary)]">{icon}</div> : null}
        </div>
      </CardHeader>
      <CardContent className={cn("p-3 sm:p-4 lg:p-5", contentClassName)}>
        <div className={cn("chart-container", HEIGHT_CLASSES[height])}>{children}</div>
      </CardContent>
    </Card>
  );
}
