import { AlertCircle, AlertTriangle, CheckCircle2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

type MetricCardProps = {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  color?: "sky" | "emerald" | "rose" | "amber" | "violet";
};

const METRIC_COLORS: Record<NonNullable<MetricCardProps["color"]>, string> = {
  sky: "var(--color-brand)",
  emerald: "var(--color-success)",
  rose: "var(--color-danger)",
  amber: "var(--color-warning)",
  violet: "var(--color-chart-8)",
};

export function MetricCard({ title, value, subtitle, icon: Icon, color = "sky" }: MetricCardProps) {
  const accentColor = METRIC_COLORS[color] ?? "#0F766E";

  return (
    <Card className="card-flat h-full">
      <CardContent className="p-4 sm:p-5 border-l-4 h-full flex flex-col" style={{ borderLeftColor: accentColor }}>
        {/* Mobile: Icon above title | Desktop: Icon left of title */}
        <div className="mb-2 flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2">
          <div className="rounded-md p-1.5 w-fit" style={{ backgroundColor: `${accentColor}15` }}>
            <Icon className="h-4 w-4 sm:h-3.5 sm:w-3.5" style={{ color: accentColor }} />
          </div>
          <p className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-secondary)] leading-snug">{title}</p>
        </div>

        {/* Value as hero */}
        <p className="font-scientific text-[26px] sm:text-3xl font-bold text-[var(--color-text-primary)] mt-auto">{value}</p>

        {subtitle && <p className="mt-1 text-xs text-[var(--color-text-secondary)] leading-snug">{subtitle}</p>}
      </CardContent>
    </Card>
  );
}

export function ComplianceBar({ label, value, color }: { label: string; value: number; color: string }) {
  const boundedValue = Math.max(0, Math.min(100, value));

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-[var(--color-text-secondary)]">{label}</span>
        <span className="font-scientific font-semibold text-[var(--color-text-primary)]">{boundedValue}%</span>
      </div>
      <div className="h-2 w-full rounded-full bg-[var(--color-surface-base)]">
        <div className="h-2 rounded-full" style={{ width: `${boundedValue}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

export function RiskBadge({ level, label }: { level: "NEGLIGIBLE" | "LOW" | "MEDIUM" | "HIGH"; label: string }) {
  const config = {
    NEGLIGIBLE: { color: "var(--color-success)", border: "color-mix(in srgb, var(--color-success) 30%, transparent)", bg: "color-mix(in srgb, var(--color-success) 10%, transparent)", Icon: CheckCircle2 },
    LOW: { color: "var(--color-success)", border: "color-mix(in srgb, var(--color-success) 30%, transparent)", bg: "color-mix(in srgb, var(--color-success) 10%, transparent)", Icon: CheckCircle2 },
    MEDIUM: { color: "var(--color-warning)", border: "color-mix(in srgb, var(--color-warning) 30%, transparent)", bg: "color-mix(in srgb, var(--color-warning) 10%, transparent)", Icon: AlertCircle },
    HIGH: { color: "var(--color-danger)", border: "color-mix(in srgb, var(--color-danger) 30%, transparent)", bg: "color-mix(in srgb, var(--color-danger) 10%, transparent)", Icon: AlertTriangle },
  };
  const c = config[level];

  return (
    <span
      className="inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium"
      style={{ backgroundColor: c.bg, borderColor: c.border, color: c.color }}
    >
      <c.Icon className="h-3.5 w-3.5" />
      {label}
    </span>
  );
}

export function CoveragePill({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number;
  icon: LucideIcon;
  color: string;
}) {
  const boundedValue = Math.max(0, Math.min(100, value));
  const progressColor = boundedValue >= 80 ? "var(--color-success)" : boundedValue >= 50 ? "var(--color-warning)" : "var(--color-danger)";
  const circumference = 2 * Math.PI * 36;
  const strokeDashoffset = circumference - (boundedValue / 100) * circumference;

  return (
    <div className="card-flat flex flex-col items-center p-4 text-center">
      {/* Circular Progress */}
      <div className="relative mb-3">
        <svg className="h-20 w-20 -rotate-90 transform" viewBox="0 0 80 80">
          {/* Background circle */}
          <circle
            cx="40"
            cy="40"
            r="36"
            fill="none"
            stroke="var(--color-surface-base)"
            strokeWidth="8"
          />
          {/* Progress circle */}
          <circle
            cx="40"
            cy="40"
            r="36"
            fill="none"
            stroke={progressColor}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-500 ease-out"
          />
        </svg>
        {/* Icon in center */}
        <div className="absolute inset-0 flex items-center justify-center">
          <Icon className="h-8 w-8" style={{ color }} />
        </div>
      </div>

      {/* Label */}
      <p className="mb-2 line-clamp-2 text-xs font-medium leading-tight text-[var(--color-text-primary)]">
        {label}
      </p>

      {/* Percentage */}
      <span className="font-scientific text-xl font-bold" style={{ color: progressColor }}>
        {boundedValue}%
      </span>
    </div>
  );
}
