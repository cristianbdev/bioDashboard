import { Overview } from "@/components/dashboard/overview";
import type { DashboardData } from "@/lib/kobo";

type PublicLayoutProps = {
  data: DashboardData;
  t: (key: string) => string;
};

export function PublicLayout({ data, t }: PublicLayoutProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex-1 min-w-0">
        {/* Render Overview directly for public users as a continuous report */}
        <Overview data={data} t={t} />
      </div>
    </div>
  );
}