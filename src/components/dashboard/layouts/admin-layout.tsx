import { Database as DbIcon, Loader2, RefreshCw } from "lucide-react";
import dynamic from "next/dynamic";
import { ComparativeView } from "@/components/dashboard/comparative";
import { FacilitiesView } from "@/components/dashboard/facilities";
import { MethodologyView } from "@/components/dashboard/methodology";
import { UserManagementView } from "@/components/dashboard/user-management";

// Dynamically import Overview component with ssr: false to avoid ResponsiveContainer hydration warnings
// Recharts ResponsiveContainer doesn't support SSR and causes width(-1)/height(-1) warnings during hydration
const OverviewClient = dynamic(() => import("@/components/dashboard/overview").then((mod) => mod.Overview), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col gap-8 pb-6">
      <div className="space-y-4">
        <div className="h-[100px] animate-pulse rounded-xl bg-[var(--color-surface-elevated)]" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-[80px] animate-pulse rounded-xl bg-[var(--color-surface-elevated)]" />
          ))}
        </div>
      </div>
      <div className="h-[400px] animate-pulse rounded-xl bg-[var(--color-surface-elevated)]" />
    </div>
  ),
});
import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { canAccessTab, DEFAULT_PROJECT_UID, type AppRole, type DashboardTab } from "@/lib/access-control";
import type { DashboardData, FacilitySummary } from "@/lib/kobo";

type AdminLayoutProps = {
  data: DashboardData;
  role: AppRole;
  t: (key: string) => string;
  isNavOpen: boolean;
  onCloseNav: () => void;
  activeTab: DashboardTab;
  setActiveTab: (tab: DashboardTab) => void;
  uid: string;
  facilitiesForRole: FacilitySummary[];
  currentFacilityForRole?: FacilitySummary;
  setSelectedFacility: (id: number | null) => void;
  fetchData: (uid: string) => Promise<void>;
  canUseCustomUid: boolean;
  setUid: (uid: string) => void;
  state: { status: string; message?: string };
};

export function AdminLayout({
  data,
  role,
  t,
  isNavOpen,
  onCloseNav,
  activeTab,
  setActiveTab,
  uid,
  facilitiesForRole,
  currentFacilityForRole,
  setSelectedFacility,
  fetchData,
  canUseCustomUid,
  setUid,
  state,
}: AdminLayoutProps) {
  return (
    <div className="flex w-full flex-1 items-start bg-(--color-surface-base)">
      <AdminSidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isOpen={isNavOpen}
        onClose={onCloseNav}
        t={t}
      />

      <main className="min-w-0 flex-1 px-4 py-5 md:px-6 md:py-6 lg:px-8 lg:py-8">
        {/* Data Source bar */}
        <Card className="card-flat mb-6">
          <CardContent className="flex flex-col gap-4 p-4 lg:flex-row lg:items-center">
            <div className="flex items-center gap-3">
              <div className="rounded-xl border border-[var(--color-border-subtle)] bg-white p-2.5 shadow-sm">
                <DbIcon className="h-5 w-5 text-[var(--color-brand)]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--color-text-primary)]">{t("datasource.title")}</p>
                <p className="text-xs text-[var(--color-text-secondary)]">{t("datasource.subtitle")}</p>
              </div>
            </div>

            <div className="flex w-full flex-1 flex-col gap-2 sm:flex-row sm:items-center">
              <div className="relative w-full flex-1">
                <Input
                  value={uid}
                  onChange={(event) => setUid(event.target.value)}
                  placeholder="Project UID"
                  className="h-10 border-[var(--color-border-subtle)] bg-white text-sm font-scientific text-[var(--color-text-primary)] shadow-sm"
                  disabled={!canUseCustomUid}
                />
                {!canUseCustomUid ? (
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] px-1.5 py-0.5 text-[10px] font-semibold uppercase text-[var(--color-text-secondary)]">
                    Locked
                  </span>
                ) : null}
              </div>

              <div className="flex w-full gap-2 sm:w-auto">
                <Button
                  size="sm"
                  onClick={() => fetchData(uid)}
                  disabled={!uid || state.status === "loading"}
                  className="h-10 flex-1 bg-[var(--color-brand)] text-white hover:bg-[var(--color-brand)]/90 sm:flex-none"
                >
                  {state.status === "loading" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                  {t("actions.load")}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => fetchData(DEFAULT_PROJECT_UID)}
                  className="h-10 flex-1 border-[var(--color-border-subtle)] bg-white text-[var(--color-text-primary)] sm:flex-none"
                >
                  {t("actions.demo")}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tab contents */}
        {activeTab === "overview" && <OverviewClient data={data} t={t} />}
        {activeTab === "facilities" && canAccessTab(role, "facilities") && (
          <FacilitiesView
            facilities={facilitiesForRole}
            currentFacility={currentFacilityForRole}
            onSelect={setSelectedFacility}
            readOnlySelection={role === "producer"}
            t={t}
            sectionAverages={data.sectionAverages}
          />
        )}
        {activeTab === "comparative" && canAccessTab(role, "comparative") && (
          <ComparativeView data={data} t={t} onSelectFacility={setSelectedFacility} />
        )}
        {activeTab === "methodology" && canAccessTab(role, "methodology") && <MethodologyView data={data} t={t} />}
        {activeTab === "users" && canAccessTab(role, "users") && (
          <UserManagementView facilities={data.facilities} projectUid={uid} t={t} />
        )}
      </main>
    </div>
  );
}
