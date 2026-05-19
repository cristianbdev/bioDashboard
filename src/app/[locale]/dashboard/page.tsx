"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { Database, Loader2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AdminLayout } from "@/components/dashboard/layouts/admin-layout";
import { ProducerLayout } from "@/components/dashboard/layouts/producer-layout";
import { PublicLayout } from "@/components/dashboard/layouts/public-layout";
import { AppHeader } from "@/components/layout/app-header";
import { BottomSheet } from "@/components/layout/bottom-sheet";
import { Activity, BarChart3, Building2, ClipboardList, Database as DbIcon, Users } from "lucide-react";
import type { AppRole, DashboardTab } from "@/lib/access-control";
import { canAccessTab, DEFAULT_PROJECT_UID, normalizeRole, parseFacilityId, ROLE_ACCESS_MATRIX } from "@/lib/access-control";
import type { DashboardData, FacilitySummary } from "@/lib/kobo";
import { cn } from "@/lib/utils";

type ApiState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "loaded" };

type KoboErrorCode = "missingUid" | "unauthorizedProject" | "missingToken" | "koboApiError" | "koboAssetApiError" | "unexpected";

const KOBO_ERROR_KEYS: Record<KoboErrorCode, string> = {
  missingUid: "errors.missingUid",
  unauthorizedProject: "errors.unauthorizedProject",
  missingToken: "errors.missingToken",
  koboApiError: "errors.koboApiError",
  koboAssetApiError: "errors.koboAssetApiError",
  unexpected: "errors.unexpected",
};

// Navigation items for mobile bottom sheet
const ADMIN_NAV_ITEMS: Array<{ id: DashboardTab; icon: typeof BarChart3; labelKey: string }> = [
  { id: "overview", icon: BarChart3, labelKey: "tabs.overview" },
  { id: "facilities", icon: Building2, labelKey: "tabs.facilities" },
  { id: "comparative", icon: Activity, labelKey: "tabs.comparative" },
  { id: "methodology", icon: DbIcon, labelKey: "tabs.methodology" },
  { id: "users", icon: Users, labelKey: "tabs.users" },
];

const PRODUCER_NAV_ITEMS: Array<{ id: "overview" | "facilities" | "summary"; icon: typeof BarChart3; labelKey: string }> = [
  { id: "facilities", icon: Building2, labelKey: "producer.myFacility" },
  { id: "overview", icon: BarChart3, labelKey: "producer.globalOverview" },
  { id: "summary", icon: ClipboardList, labelKey: "producer.summary" },
];

function NavigationContent({
  role,
  activeTab,
  onTabChange,
  onClose,
  t,
}: {
  role: AppRole;
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
  onClose: () => void;
  t: (key: string) => string;
}) {
  const items = role === "admin" ? ADMIN_NAV_ITEMS : PRODUCER_NAV_ITEMS;

  return (
    <nav className="space-y-1">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;

        return (
          <button
            type="button"
            key={item.id}
            onClick={() => {
              onTabChange(item.id as DashboardTab);
              onClose();
            }}
            className={cn(
              "flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium transition-all",
              isActive
                ? "bg-[var(--color-brand)] text-white shadow-sm"
                : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-base)] hover:text-[var(--color-brand)]",
            )}
          >
            <Icon className="h-4 w-4" />
            <span>{t(item.labelKey)}</span>
          </button>
        );
      })}
    </nav>
  );
}

export default function Home() {
  const { user, isLoaded } = useUser();
  const locale = useLocale();
  const translate = useTranslations();

  const [uid, setUid] = useState(DEFAULT_PROJECT_UID);
  const [data, setData] = useState<DashboardData | null>(null);
  const [state, setState] = useState<ApiState>({ status: "idle" });
  const [selectedFacility, setSelectedFacility] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "facilities" | "comparative" | "methodology" | "users" | "summary">("overview");
  const [isNavOpen, setIsNavOpen] = useState(false);

  const openNav = useCallback(() => setIsNavOpen(true), []);
  const closeNav = useCallback(() => setIsNavOpen(false), []);

  const role: AppRole = useMemo(() => normalizeRole(user?.publicMetadata?.role), [user?.publicMetadata?.role]);
  const assignedProjectUid = useMemo(() => {
    const value = user?.publicMetadata?.projectUid;
    return typeof value === "string" && value.length > 0 ? value : undefined;
  }, [user?.publicMetadata?.projectUid]);
  const producerFacilityId = useMemo(() => parseFacilityId(user?.publicMetadata?.facilityId), [user?.publicMetadata?.facilityId]);

  const t = useCallback((key: string) => translate(key as never), [translate]);

  const currentFacility: FacilitySummary | undefined = useMemo(() => {
    if (!data || data.facilities.length === 0) return undefined;
    return data.facilities.find((facility) => facility.id === selectedFacility) ?? data.facilities[0];
  }, [data, selectedFacility]);

  const fetchData = useCallback(async (targetUid: string) => {
    setState({ status: "loading" });
    try {
      const params = new URLSearchParams({ uid: targetUid });
      const response = await fetch(`/api/kobo?${params.toString()}`, { cache: "no-store" });
      const payload = (await response.json()) as { data?: DashboardData; errorCode?: KoboErrorCode };

      if (!response.ok || !payload.data) {
        const errorMessage = payload.errorCode
          ? t(KOBO_ERROR_KEYS[payload.errorCode] ?? "errors.unknown")
          : t("errors.httpStatus").replace("{status}", String(response.status));
        throw new Error(errorMessage);
      }

      setData(payload.data);
      setState({ status: "loaded" });

      const preferredFacility = producerFacilityId ?? payload.data.facilities[0]?.id ?? null;
      setSelectedFacility(preferredFacility);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : t("errors.unknown");
      setState({ status: "error", message });
    }
  }, [producerFacilityId, t]);

  useEffect(() => {
    if (!isLoaded) return;

    const initialUid = role === "producer" && assignedProjectUid ? assignedProjectUid : DEFAULT_PROJECT_UID;
    setUid(initialUid);
    setIsNavOpen(false);
    void fetchData(initialUid);
    if (role === "producer") {
      setActiveTab("facilities");
    }
  }, [isLoaded, role, assignedProjectUid, fetchData]);

  useEffect(() => {
    if (!canAccessTab(role, activeTab) && role !== "producer") {
      setActiveTab("overview");
    }
  }, [role, activeTab]);

  useEffect(() => {
    if (!data || role !== "producer") return;

    const fallbackFacility = data.facilities[0]?.id;
    const nextFacility = producerFacilityId ?? fallbackFacility ?? null;
    setSelectedFacility(nextFacility);
  }, [data, role, producerFacilityId]);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const facilitiesForRole = useMemo(() => {
    if (!data) return [];
    if (role !== "producer") return data.facilities;

    const ownFacility = data.facilities.find((facility) => facility.id === producerFacilityId);
    return ownFacility ? [ownFacility] : data.facilities.slice(0, 1);
  }, [data, role, producerFacilityId]);

  const currentFacilityForRole = useMemo(() => {
    if (!data) return undefined;
    if (role !== "producer") return currentFacility;

    return facilitiesForRole[0];
  }, [data, role, currentFacility, facilitiesForRole]);

  const canUseCustomUid = ROLE_ACCESS_MATRIX[role].canUseCustomProjectUid;

  // Layout selection based on role
  const isSidebarLayout = role === "admin";

  return (
    <div className="min-h-screen bg-[var(--color-surface-base)] flex flex-col">
      <AppHeader
        role={role}
        data={data}
        isLoaded={isLoaded}
        isNavOpen={isNavOpen}
        onRefresh={() => fetchData(uid)}
        isLoading={state.status === "loading"}
        onOpenNav={role !== "public" ? openNav : undefined}
      />

      {/* Mobile navigation bottom sheet */}
      {role !== "admin" ? (
        <BottomSheet
          isOpen={isNavOpen}
          onClose={closeNav}
          title={t("navigation.title")}
          closeLabel={t("navigation.closeMenu")}
        >
          <NavigationContent
            role={role}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            onClose={closeNav}
            t={t}
          />
        </BottomSheet>
      ) : null}

      <div className={cn(
        "flex-1 flex flex-col pt-16 md:flex-row mx-auto w-full",
        isSidebarLayout ? "max-w-[1800px]" : "max-w-7xl"
      )}>
        {!data && state.status === "loading" ? (
          <main className="flex min-h-[40vh] w-full items-center justify-center px-6 py-12">
            <div className="flex items-center gap-3 text-sm text-[var(--color-text-secondary)]">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>{t("actions.load")}...</span>
            </div>
          </main>
        ) : null}

        {!data && state.status === "error" ? (
          <main className="w-full px-6 py-10">
            <Alert variant="destructive" className="mx-auto max-w-3xl">
              <AlertTitle>{t("errors.title")}</AlertTitle>
              <AlertDescription>{state.message}</AlertDescription>
            </Alert>
          </main>
        ) : null}

        {data && (
          <>
            {role === "admin" ? (
              <AdminLayout
                data={data}
                role={role}
                t={t}
                locale={locale}
                isNavOpen={isNavOpen}
                onCloseNav={closeNav}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                uid={uid}
                facilitiesForRole={facilitiesForRole}
                currentFacilityForRole={currentFacilityForRole}
                setSelectedFacility={setSelectedFacility}
                fetchData={fetchData}
                canUseCustomUid={canUseCustomUid}
                setUid={setUid}
                state={state}
              />
            ) : (
              <main className="flex-1 px-6 py-6">
                <Card className="card-flat mb-6 transition-all duration-200 hover:shadow-md hover:border-[var(--color-brand)]/30">
                  <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-2">
                        <Database className="h-4 w-4 text-[var(--color-text-secondary)]" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[var(--color-text-primary)]">{t("datasource.title")}</p>
                        <p className="text-xs text-[var(--color-text-secondary)]">{t("datasource.subtitle")}</p>
                      </div>
                    </div>

                    <div className="flex flex-1 flex-col items-start gap-2 sm:flex-row sm:items-center">
                      <Input
                        value={uid}
                        onChange={(event) => setUid(event.target.value)}
                        placeholder={t("datasource.projectUidPlaceholder")}
                        className="h-9 border-[var(--color-border-subtle)] bg-[var(--color-raised)] text-sm text-[var(--color-text-primary)] font-scientific shadow-sm"
                        disabled={!canUseCustomUid}
                      />
                      <div className="flex gap-2 w-full sm:w-auto">
                        <Button size="sm" onClick={() => fetchData(uid)} disabled={!uid || state.status === "loading"} className="flex-1 sm:flex-none bg-[var(--color-brand)] text-white hover:bg-[var(--color-brand)]/90 shadow-sm transition-all duration-200 hover:shadow-md">
                          {state.status === "loading" ? <Loader2 className="h-4 w-4 animate-spin" /> : t("actions.load")}
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => fetchData(DEFAULT_PROJECT_UID)} className="flex-1 sm:flex-none border-[var(--color-border-subtle)] bg-[var(--color-raised)] text-[var(--color-text-primary)] shadow-sm transition-all duration-200 hover:shadow-md hover:border-[var(--color-brand)]/30">
                          {t("actions.demo")}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                  {!canUseCustomUid && (
                    <p className="px-4 pb-4 text-xs text-[var(--color-text-secondary)]">{t("datasource.lockedByRole")}</p>
                  )}
                </Card>

                {state.status === "error" && (
                  <Alert variant="destructive" className="mb-6 shadow-sm">
                    <AlertTitle>{t("errors.title")}</AlertTitle>
                    <AlertDescription>{state.message}</AlertDescription>
                  </Alert>
                )}

                {role === "producer" && (
                  <ProducerLayout
                    data={data}
                    t={t}
                    locale={locale}
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    facilitiesForRole={facilitiesForRole}
                    currentFacilityForRole={currentFacilityForRole}
                    setSelectedFacility={setSelectedFacility}
                  />
                )}
                {role === "public" && <PublicLayout data={data} t={t} locale={locale} />}
              </main>
            )}
          </>
        )}
      </div>
    </div>
  );
}
