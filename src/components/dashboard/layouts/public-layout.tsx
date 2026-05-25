"use client";

import dynamic from "next/dynamic";
import type { AppLocale } from "@/i18n/routing";
import type { DashboardData } from "@/lib/kobo";

const OverviewClient = dynamic(() => import("@/components/dashboard/overview").then((mod) => mod.Overview), {
  ssr: false,
  loading: () => (
    <div className="h-[320px] animate-pulse rounded-xl bg-popover" aria-hidden />
  ),
});

type PublicLayoutProps = {
  data: DashboardData;
  t: (key: string) => string;
  locale: AppLocale;
};

export function PublicLayout({ data, t, locale }: PublicLayoutProps) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-6">
      <OverviewClient data={data} t={t} locale={locale} />
    </div>
  );
}
