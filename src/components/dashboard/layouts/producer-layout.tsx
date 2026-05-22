"use client";

import { BarChart3, Building2, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FacilitiesView } from "@/components/dashboard/facilities";
import { Overview } from "@/components/dashboard/overview";
import { SummaryView } from "@/components/dashboard/summary-view";
import type { AppLocale } from "@/i18n/routing";
import type { DashboardData, FacilitySummary } from "@/lib/kobo";
import type { DashboardTab } from "@/lib/access-control";
import { translateSectionLabel } from "@/lib/section-labels";
import { cn } from "@/lib/utils";

type ProducerLayoutProps = {
  data: DashboardData;
  t: (key: string, values?: Record<string, string | number>) => string;
  locale: AppLocale;
  activeTab: DashboardTab;
  setActiveTab: (tab: DashboardTab) => void;
  facilitiesForRole: FacilitySummary[];
  currentFacilityForRole?: FacilitySummary;
  setSelectedFacility: (id: number | null) => void;
};

const PRODUCER_NAV_ITEMS = [
  { id: "facilities" as const, icon: Building2, labelKey: "producer.myFacility" },
  { id: "overview" as const, icon: BarChart3, labelKey: "producer.globalOverview" },
  { id: "summary" as const, icon: ClipboardList, labelKey: "producer.summary" },
];

export function ProducerLayout({
  data,
  t,
  locale,
  activeTab,
  setActiveTab,
  facilitiesForRole,
  currentFacilityForRole,
  setSelectedFacility,
}: ProducerLayoutProps) {
  return (
    <div className="flex flex-col gap-6">
      {/* Desktop navigation */}
      <nav className="hidden w-full items-center gap-2 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-raised)] p-2 shadow-sm md:flex">
        {PRODUCER_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <Button
              key={item.id}
              variant={isActive ? "secondary" : "ghost"}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "min-h-11 flex-1 justify-center gap-2",
                isActive
                  ? "bg-[var(--color-brand)]/10 text-[var(--color-brand)] font-medium"
                  : "text-[var(--color-text-secondary)]",
              )}
              onClick={() => setActiveTab(item.id)}
            >
              <Icon className="h-4 w-4" />
              {t(item.labelKey)}
            </Button>
          );
        })}
      </nav>

      {/* Mobile tab indicator (subtle) */}
      <div className="flex items-center justify-center gap-4 py-2 md:hidden">
        {PRODUCER_NAV_ITEMS.map((item) => {
          const isActive = activeTab === item.id;
          if (!isActive) return null;
          return (
            <div key={item.id} className="flex items-center gap-2 text-sm text-[var(--color-brand)]">
              <item.icon className="h-4 w-4" />
              <span className="font-medium">{t(item.labelKey)}</span>
            </div>
          );
        })}
      </div>

      <div className="flex-1 min-w-0 pb-20 md:pb-0">
        {activeTab === "facilities" && (
          <FacilitiesView
            facilities={facilitiesForRole}
            currentFacility={currentFacilityForRole}
            onSelect={setSelectedFacility}
            readOnlySelection={true}
            isProducerView={true}
            t={t}
            sectionAverages={data.sectionAverages}
          />
        )}
        {activeTab === "overview" && <Overview data={data} t={t} locale={locale} />}
        {activeTab === "summary" && currentFacilityForRole && (
          <SummaryView
            facility={currentFacilityForRole}
            peerAverage={data.sectionAverages.length > 0 ? Math.round(data.sectionAverages.reduce((acc, s) => acc + s.score, 0) / data.sectionAverages.length) : undefined}
            topActions={currentFacilityForRole.subcategoryChecklist
              .flatMap((s) => s.items.map((i) => ({ ...i, section: s.section })))
              .filter((i) => i.applicable && !i.compliant && i.recommendation)
              .slice(0, 3)
              .map((i) => ({ label: i.label, section: translateSectionLabel(i.section, t) }))}
            t={t}
          />
        )}
      </div>
    </div>
  );
}
