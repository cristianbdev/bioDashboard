import { AlertCircle, AlertTriangle, CheckCircle2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type MetricCardProps = {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  color?: "sky" | "emerald" | "rose" | "amber" | "violet";
};

const METRIC_ACCENT_CLASS: Record<NonNullable<MetricCardProps["color"]>, string> = {
  sky: "metric-card-sky",
  emerald: "metric-card-emerald",
  rose: "metric-card-rose",
  amber: "metric-card-amber",
  violet: "metric-card-violet",
};

export function MetricCard({ title, value, subtitle, icon: Icon, color = "sky" }: MetricCardProps) {
  const accentClass = METRIC_ACCENT_CLASS[color];

  return (
    <Card className={cn("card-flat metric-card-accent h-full", accentClass)}>
      <CardContent className="flex h-full flex-col border-l-4 p-4 sm:p-5">
        <div className="mb-2 flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-2">
          <div className="metric-icon-wrap w-fit rounded-md p-1.5">
            <Icon className="metric-icon h-4 w-4 sm:h-3.5 sm:w-3.5" />
          </div>
          <p className="text-xs font-medium uppercase leading-snug tracking-wider text-muted-foreground">{title}</p>
        </div>

        <p className="font-scientific mt-auto text-[26px] font-bold text-foreground sm:text-3xl">{value}</p>

        {subtitle && <p className="mt-1 text-xs leading-snug text-muted-foreground">{subtitle}</p>}
      </CardContent>
    </Card>
  );
}

export function ComplianceBar({ label, value, color }: { label: string; value: number; color: string }) {
  const boundedValue = Math.max(0, Math.min(100, value));

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-scientific font-semibold text-foreground">{boundedValue}%</span>
      </div>
      <div className="h-2 w-full rounded-full bg-background">
        <div
          className="compliance-bar-fill h-2 rounded-full"
          style={
            {
              "--compliance-pct": `${boundedValue}%`,
              "--compliance-color": color,
            } as React.CSSProperties
          }
        />
      </div>
    </div>
  );
}

const RISK_BADGE_VARS: Record<
  "NEGLIGIBLE" | "LOW" | "MEDIUM" | "HIGH",
  { color: string; border: string; bg: string; Icon: typeof CheckCircle2 }
> = {
  NEGLIGIBLE: {
    color: "var(--color-success)",
    border: "color-mix(in srgb, var(--color-success) 30%, transparent)",
    bg: "color-mix(in srgb, var(--color-success) 10%, transparent)",
    Icon: CheckCircle2,
  },
  LOW: {
    color: "var(--color-success)",
    border: "color-mix(in srgb, var(--color-success) 30%, transparent)",
    bg: "color-mix(in srgb, var(--color-success) 10%, transparent)",
    Icon: CheckCircle2,
  },
  MEDIUM: {
    color: "var(--color-warning)",
    border: "color-mix(in srgb, var(--color-warning) 30%, transparent)",
    bg: "color-mix(in srgb, var(--color-warning) 10%, transparent)",
    Icon: AlertCircle,
  },
  HIGH: {
    color: "var(--color-danger)",
    border: "color-mix(in srgb, var(--color-danger) 30%, transparent)",
    bg: "color-mix(in srgb, var(--color-danger) 10%, transparent)",
    Icon: AlertTriangle,
  },
};

export function RiskBadge({ level, label }: { level: "NEGLIGIBLE" | "LOW" | "MEDIUM" | "HIGH"; label: string }) {
  const c = RISK_BADGE_VARS[level];

  return (
    <span
      className="risk-badge inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium"
      style={
        {
          "--risk-badge-bg": c.bg,
          "--risk-badge-border": c.border,
          "--risk-badge-color": c.color,
        } as React.CSSProperties
      }
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
  const progressColor =
    boundedValue >= 80 ? "var(--color-success)" : boundedValue >= 50 ? "var(--color-warning)" : "var(--color-danger)";
  const valueClass =
    boundedValue >= 80
      ? "coverage-pill-value-success"
      : boundedValue >= 50
        ? "coverage-pill-value-warning"
        : "coverage-pill-value-danger";
  const circumference = 2 * Math.PI * 36;
  const strokeDashoffset = circumference - (boundedValue / 100) * circumference;

  return (
    <div className="card-flat flex flex-col items-center p-4 text-center">
      <div className="relative mb-3">
        <svg className="h-20 w-20 -rotate-90 transform" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r="36" fill="none" stroke="var(--color-surface-base)" strokeWidth="8" />
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
        <div className="absolute inset-0 flex items-center justify-center">
          <Icon className="coverage-pill-icon h-8 w-8" style={{ "--coverage-icon-color": color } as React.CSSProperties} />
        </div>
      </div>

      <p className="mb-2 line-clamp-2 text-xs font-medium leading-tight text-foreground">{label}</p>

      <span className={cn("font-scientific text-xl font-bold", valueClass)}>{boundedValue}%</span>
    </div>
  );
}
