"use client";

import { BarChart3, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FacilitiesView } from "@/components/dashboard/facilities";
import { Overview } from "@/components/dashboard/overview";
import type { DashboardData, FacilitySummary } from "@/lib/kobo";
import { cn } from "@/lib/utils";

type ProducerLayoutProps = {
  data: DashboardData;
  t: (key: string) => string;
  activeTab: "overview" | "facilities" | "comparative" | "methodology" | "users";
  setActiveTab: (tab: "overview" | "facilities" | "comparative" | "methodology" | "users") => void;
  facilitiesForRole: FacilitySummary[];
  currentFacilityForRole?: FacilitySummary;
  setSelectedFacility: (id: number | null) => void;
};

const PRODUCER_NAV_ITEMS = [
  { id: "facilities" as const, icon: Building2, labelKey: "producer.myFacility" },
  { id: "overview" as const, icon: BarChart3, labelKey: "producer.globalOverview" },
];

export function ProducerLayout({
  data,
  t,
  activeTab,
  setActiveTab,
  facilitiesForRole,
  currentFacilityForRole,
  setSelectedFacility,
}: ProducerLayoutProps) {
  const activeItem = PRODUCER_NAV_ITEMS.find((item) => item.id === activeTab);

  return (
    <div className="flex flex-col gap-6">
      {/* Desktop navigation */}
      <nav className="hidden w-full items-center gap-2 rounded-xl border border-[var(--color-border-subtle)] bg-white p-2 shadow-sm md:flex">
        {PRODUCER_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <Button
              key={item.id}
              variant={isActive ? "secondary" : "ghost"}
              className={cn(
                "h-10 flex-1 justify-center gap-2",
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
            t={t}
            sectionAverages={data.sectionAverages}
          />
        )}
        {activeTab === "overview" && <Overview data={data} t={t} />}
      </div>
    </div>
  );
}
