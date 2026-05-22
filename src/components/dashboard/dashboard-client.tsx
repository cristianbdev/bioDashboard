"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import type { KoboDashboardErrorCode } from "@/lib/kobo-dashboard";
import type { DashboardData, FacilitySummary } from "@/lib/kobo";
import { pickProducerFacilityId } from "@/lib/producer-facilities";
import { cn } from "@/lib/utils";

type ApiState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "loaded" };

const KOBO_ERROR_KEYS: Record<KoboDashboardErrorCode, string> = {
  missingUid: "errors.missingUid",
  unauthorizedProject: "errors.unauthorizedProject",
  missingToken: "errors.missingToken",
  koboApiError: "errors.koboApiError",
  koboAssetApiError: "errors.koboAssetApiError",
  facilityNotConfigured: "errors.facilityNotConfigured",
  facilityNotFound: "errors.facilityNotFound",
  unexpected: "errors.unexpected",
  rateLimited: "errors.rateLimited",
};

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
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface-base)]",
              isActive
                ? "bg-[var(--color-brand)] text-[var(--color-text-inverse)] shadow-sm"
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

function resolveErrorMessage(errorCode: KoboDashboardErrorCode | undefined, t: (key: string) => string, httpStatus?: number) {
  if (errorCode) {
    return t(KOBO_ERROR_KEYS[errorCode] ?? "errors.unknown");
  }
  if (httpStatus) {
    return t("errors.httpStatus").replace("{status}", String(httpStatus));
  }
  return t("errors.unknown");
}

export type DashboardClientProps = {
  initialUid: string;
  initialData: DashboardData | null;
  initialErrorCode?: KoboDashboardErrorCode;
};

export function DashboardClient({ initialUid, initialData, initialErrorCode }: DashboardClientProps) {
  const { user, isLoaded } = useUser();
  const locale = useLocale();
  const translate = useTranslations();

  const [uid, setUid] = useState(initialUid);
  const [data, setData] = useState<DashboardData | null>(initialData);
  const [state, setState] = useState<ApiState>(() => {
    if (initialErrorCode) {
      return {
        status: "error",
        message: resolveErrorMessage(initialErrorCode, (key) => translate(key as never)),
      };
    }
    if (initialData) {
      return { status: "loaded" };
    }
    return { status: "idle" };
  });
  const [selectedFacility, setSelectedFacility] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<DashboardTab>("overview");
  const [isNavOpen, setIsNavOpen] = useState(false);
  const skipMountFetchRef = useRef(Boolean(initialData || initialErrorCode));

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
    if (role === "producer" && producerFacilityId !== undefined) {
      return data.facilities.find((facility) => facility.id === producerFacilityId);
    }
    return data.facilities.find((facility) => facility.id === selectedFacility) ?? data.facilities[0];
  }, [data, role, producerFacilityId, selectedFacility]);

  const fetchData = useCallback(
    async (targetUid: string) => {
      setState({ status: "loading" });
      try {
        const params = new URLSearchParams({ uid: targetUid });
        const response = await fetch(`/api/kobo?${params.toString()}`, { cache: "no-store" });
        const payload = (await response.json()) as {
          data?: DashboardData;
          errorCode?: KoboDashboardErrorCode;
        };

        if (!response.ok || !payload.data) {
          const errorMessage = resolveErrorMessage(payload.errorCode, t, response.status);
          throw new Error(errorMessage);
        }

        setData(payload.data);
        setState({ status: "loaded" });

        if (role === "producer") {
          setSelectedFacility(pickProducerFacilityId(payload.data.facilities, producerFacilityId));
        } else {
          setSelectedFacility(payload.data.facilities[0]?.id ?? null);
        }
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : t("errors.unknown");
        setState({ status: "error", message });
        setData(null);
      }
    },
    [producerFacilityId, role, t],
  );

  useEffect(() => {
    if (!isLoaded) return;

    const targetUid = role === "producer" && assignedProjectUid ? assignedProjectUid : uid || DEFAULT_PROJECT_UID;
    setUid(targetUid);
    setIsNavOpen(false);

    if (role === "producer") {
      setActiveTab("facilities");
    }

    if (skipMountFetchRef.current) {
      skipMountFetchRef.current = false;
      if (initialData && role === "producer") {
        setSelectedFacility(pickProducerFacilityId(initialData.facilities, producerFacilityId));
      }
      return;
    }

    void fetchData(targetUid);
  }, [isLoaded, role, assignedProjectUid, fetchData, initialData, producerFacilityId, uid]);

  useEffect(() => {
    if (!canAccessTab(role, activeTab) && role !== "producer") {
      setActiveTab("overview");
    }
  }, [role, activeTab]);

  const facilitiesForRole = useMemo(() => {
    if (!data) return [];
    if (role !== "producer") return data.facilities;
    if (producerFacilityId === undefined) return [];
    return data.facilities.filter((facility) => facility.id === producerFacilityId);
  }, [data, role, producerFacilityId]);

  const currentFacilityForRole = useMemo(() => {
    if (!data) return undefined;
    if (role === "producer") {
      return facilitiesForRole[0];
    }
    return currentFacility;
  }, [data, role, currentFacility, facilitiesForRole]);

  const canUseCustomUid = ROLE_ACCESS_MATRIX[role].canUseCustomProjectUid;
  const isSidebarLayout = role === "admin";
  const showProducerAssignmentError =
    role === "producer" && isLoaded && (initialErrorCode === "facilityNotFound" || initialErrorCode === "facilityNotConfigured" || facilitiesForRole.length === 0);

  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-surface-base)]">
      <AppHeader
        role={role}
        data={data}
        isLoaded={isLoaded}
        isNavOpen={isNavOpen}
        onRefresh={() => fetchData(uid)}
        isLoading={state.status === "loading"}
        onOpenNav={role !== "public" ? openNav : undefined}
      />

      {role !== "admin" ? (
        <BottomSheet
          isOpen={isNavOpen}
          onClose={closeNav}
          title={t("navigation.title")}
          closeLabel={t("navigation.closeMenu")}
        >
          <NavigationContent role={role} activeTab={activeTab} onTabChange={setActiveTab} onClose={closeNav} t={t} />
        </BottomSheet>
      ) : null}

      <main
        id="dashboard-main"
        className={cn(
          "mx-auto flex w-full flex-1 flex-col pt-16 md:flex-row",
          isSidebarLayout ? "max-w-[1800px]" : "max-w-7xl",
        )}
      >
        {!data && state.status === "loading" ? (
          <div className="flex min-h-[40vh] w-full items-center justify-center px-6 py-12">
            <div className="flex items-center gap-3 text-sm text-[var(--color-text-secondary)]">
              <Loader2 className="h-5 w-5 animate-spin text-[var(--color-brand)]" />
              <span>{t("actions.load")}...</span>
            </div>
          </div>
        ) : null}

        {!data && state.status === "error" ? (
          <div className="w-full px-6 py-10">
            <Alert variant="destructive" className="mx-auto max-w-3xl border-[var(--color-danger)]/25 bg-[var(--color-raised)]">
              <AlertTitle>{t("errors.title")}</AlertTitle>
              <AlertDescription>{state.message}</AlertDescription>
            </Alert>
          </div>
        ) : null}

        {showProducerAssignmentError && !data ? (
          <div className="w-full px-6 py-10">
            <Card className="mx-auto max-w-2xl border-[var(--color-warning)]/30 bg-[var(--color-raised)] shadow-sm">
              <CardContent className="space-y-3 p-6">
                <p className="text-sm font-semibold text-[var(--color-text-primary)]">{t("errors.producerAccessTitle")}</p>
                <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">
                  {t(
                    initialErrorCode === "facilityNotFound" || producerFacilityId !== undefined
                      ? "errors.facilityNotFound"
                      : "errors.facilityNotConfigured",
                  )}
                </p>
                {producerFacilityId !== undefined ? (
                  <p className="font-scientific text-xs text-[var(--color-text-muted)]">
                    {t("errors.assignedFacilityId")}: {producerFacilityId}
                  </p>
                ) : null}
              </CardContent>
            </Card>
          </div>
        ) : null}

        {data ? (
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
              <div className="flex-1 px-6 py-6">
                <Card className="card-flat mb-6 transition-all duration-200 hover:border-[var(--color-brand)]/30 hover:shadow-md">
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
                        className="h-9 border-[var(--color-border-subtle)] bg-[var(--color-raised)] font-scientific text-sm text-[var(--color-text-primary)] shadow-sm"
                        disabled={!canUseCustomUid}
                      />
                      <div className="flex w-full gap-2 sm:w-auto">
                        <Button
                          size="sm"
                          onClick={() => fetchData(uid)}
                          disabled={!uid || state.status === "loading"}
                          className="flex-1 bg-[var(--color-brand)] text-white shadow-sm transition-all duration-200 hover:bg-[var(--color-brand)]/90 hover:shadow-md sm:flex-none"
                        >
                          {state.status === "loading" ? <Loader2 className="h-4 w-4 animate-spin" /> : t("actions.load")}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => fetchData(DEFAULT_PROJECT_UID)}
                          className="flex-1 border-[var(--color-border-subtle)] bg-[var(--color-raised)] text-[var(--color-text-primary)] shadow-sm transition-all duration-200 hover:border-[var(--color-brand)]/30 hover:shadow-md sm:flex-none"
                        >
                          {t("actions.demo")}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                  {!canUseCustomUid ? (
                    <p className="px-4 pb-4 text-xs text-[var(--color-text-secondary)]">{t("datasource.lockedByRole")}</p>
                  ) : null}
                </Card>

                {state.status === "error" ? (
                  <Alert variant="destructive" className="mb-6 shadow-sm">
                    <AlertTitle>{t("errors.title")}</AlertTitle>
                    <AlertDescription>{state.message}</AlertDescription>
                  </Alert>
                ) : null}

                {role === "producer" && !showProducerAssignmentError ? (
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
                ) : null}
                {role === "public" ? <PublicLayout data={data} t={t} locale={locale} /> : null}
              </div>
            )}
          </>
        ) : null}
      </main>
    </div>
  );
}
