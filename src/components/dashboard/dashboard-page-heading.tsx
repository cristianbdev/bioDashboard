import { cn } from "@/lib/utils";

type DashboardPageHeadingProps = {
  title: string;
  subtitle?: string;
  className?: string;
};

export function DashboardPageHeading({ title, subtitle, className }: DashboardPageHeadingProps) {
  return (
    <div className={cn(className)}>
      <h1 className="text-dashboard-title">{title}</h1>
      {subtitle ? <p className="mt-1 text-dashboard-subtitle">{subtitle}</p> : null}
    </div>
  );
}
