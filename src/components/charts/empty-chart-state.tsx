import { BarChart3 } from "lucide-react";

type EmptyChartStateProps = {
  title?: string;
  subtitle?: string;
};

export function EmptyChartState({
  title = "No data available",
  subtitle = "Adjust your filters or check back later",
}: EmptyChartStateProps) {
  return (
    <div className="flex h-full min-h-[280px] flex-col items-center justify-center rounded-xl border border-dashed border-[var(--color-border-subtle)] text-[var(--color-text-secondary)]">
      <BarChart3 className="mb-3 h-12 w-12 opacity-20" />
      <p className="text-sm font-medium">{title}</p>
      <p className="mt-1 text-xs">{subtitle}</p>
    </div>
  );
}
