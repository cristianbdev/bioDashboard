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
    <Card className="card-flat">
      <CardContent className="p-5 border-l-4" style={{ borderLeftColor: accentColor }}>
        {/* Title first, reading order */}
        <p className="mb-1 text-xs font-medium uppercase tracking-wider text-[var(--color-text-secondary)]">{title}</p>
        
        {/* Value is the hero */}
        <div className="mb-1 flex items-baseline gap-2">
          <p className="font-scientific text-3xl font-bold text-[var(--color-text-primary)]">{value}</p>
          {/* Subtle icon on the right, not competing */}
          <div className="rounded-md p-1.5 opacity-50" style={{ backgroundColor: `${accentColor}10` }}>
            <Icon className="h-3.5 w-3.5" style={{ color: accentColor }} />
          </div>
        </div>
        
        {subtitle && <p className="text-xs text-[var(--color-text-secondary)]">{subtitle}</p>}
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
    NEGLIGIBLE: { color: "#15803D", border: "#BBF7D0", bg: "#F0FDF4", Icon: CheckCircle2 },
    LOW: { color: "#15803D", border: "#BBF7D0", bg: "#F0FDF4", Icon: CheckCircle2 },
    MEDIUM: { color: "#B7791F", border: "#FDE68A", bg: "#FFFBEB", Icon: AlertCircle },
    HIGH: { color: "#B42318", border: "#FECACA", bg: "#FEF2F2", Icon: AlertTriangle },
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

  return (
    <div className="card-flat p-3">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="h-3.5 w-3.5" style={{ color: `${color}90`, opacity: 0.7 }} />
          <p className="text-sm font-medium text-[var(--color-text-primary)]">{label}</p>
        </div>
        <span className="font-scientific text-sm font-bold" style={{ color: progressColor }}>
          {boundedValue}%
        </span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-[var(--color-surface-base)]">
        <div className="h-1.5 rounded-full" style={{ width: `${boundedValue}%`, backgroundColor: progressColor }} />
      </div>
    </div>
  );
}
