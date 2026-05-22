"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactElement, type ReactNode } from "react";
import { ResponsiveContainer, type ResponsiveContainerProps } from "recharts";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { InfoTitle } from "@/components/dashboard/info-title";
import { cn } from "@/lib/utils";

type SafeResponsiveContainerProps = Omit<ResponsiveContainerProps, "width" | "height"> & {
  children: ReactElement;
};

/** Renders Recharts only after the parent has measurable size (avoids width/height 0 warnings). */
export function SafeResponsiveContainer({ children, initialDimension, ...props }: SafeResponsiveContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const update = () => {
      const { width, height } = node.getBoundingClientRect();
      setReady(width > 0 && height > 0);
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="h-full min-h-0 w-full min-w-0">
      {ready ? (
        <ResponsiveContainer width="100%" height="100%" initialDimension={initialDimension} {...props}>
          {children}
        </ResponsiveContainer>
      ) : null}
    </div>
  );
}

export type ChartCardHeight = "sm" | "md" | "lg" | "xl";

const HEIGHT_CLASSES: Record<ChartCardHeight, string> = {
  sm: "min-h-[180px] h-[180px] sm:h-[200px] md:h-[220px]",
  md: "min-h-[200px] h-[200px] sm:h-[230px] md:h-[260px]",
  lg: "min-h-[220px] h-[220px] sm:h-[260px] md:h-[300px]",
  xl: "min-h-[260px] h-[280px] sm:h-[320px] md:h-[380px] xl:h-[420px]",
};

export const CHART_TOOLTIP_STYLE: CSSProperties = {
  borderRadius: "12px",
  border: "1px solid var(--color-border-subtle)",
  backgroundColor: "var(--color-raised)",
  boxShadow: "0 4px 6px -1px rgba(0,0,0,0.2)",
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
  // Calculate yAxisWidth based on truncated label length (24 chars max displayed)
  const truncatedLength = Math.min(longestLabelLength, 24);
  const yAxisWidth = Math.min(120, Math.max(40, Math.floor(truncatedLength * 5.5)));
  // Bar size scales with item count but stays reasonable
  const barSize = Math.max(18, Math.min(32, Math.floor(180 / safeCount)));
  const showValues = safeCount <= 10;
  // No extra left margin - yAxisWidth already accounts for label space
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
