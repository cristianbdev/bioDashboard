"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Show, SignInButton, SignUpButton, UserButton, useUser } from "@clerk/nextjs";
import { Activity, BarChart3, Building2, Clock, Database, Languages, Loader2, RefreshCw, Shield, Users } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ComparativeView } from "@/components/dashboard/comparative";
import { FacilitiesView } from "@/components/dashboard/facilities";
import { MethodologyView } from "@/components/dashboard/methodology";
import { Overview } from "@/components/dashboard/overview";
import { UserManagementView } from "@/components/dashboard/user-management";
import { type AppRole, canAccessTab, DEFAULT_PROJECT_UID, normalizeRole, parseFacilityId, ROLE_ACCESS_MATRIX } from "@/lib/access-control";
import { Locale, supportedLocales, t as translate } from "@/lib/i18n";
import type { DashboardData, FacilitySummary } from "@/lib/kobo";

type ApiState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "loaded" };

export default function Home() {
  const { user, isLoaded } = useUser();

  const [uid, setUid] = useState(DEFAULT_PROJECT_UID);
  const [locale, setLocale] = useState<Locale>("en");
  const [data, setData] = useState<DashboardData | null>(null);
  const [state, setState] = useState<ApiState>({ status: "idle" });
  const [selectedFacility, setSelectedFacility] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "facilities" | "comparative" | "methodology" | "users">("overview");

  const role: AppRole = useMemo(() => normalizeRole(user?.publicMetadata?.role), [user?.publicMetadata?.role]);
  const assignedProjectUid = useMemo(() => {
    const value = user?.publicMetadata?.projectUid;
    return typeof value === "string" && value.length > 0 ? value : undefined;
  }, [user?.publicMetadata?.projectUid]);
  const producerFacilityId = useMemo(() => parseFacilityId(user?.publicMetadata?.facilityId), [user?.publicMetadata?.facilityId]);

  const t = useCallback((key: string) => translate(locale, key), [locale]);

  const currentFacility: FacilitySummary | undefined = useMemo(() => {
    if (!data || data.facilities.length === 0) return undefined;
    return data.facilities.find((facility) => facility.id === selectedFacility) ?? data.facilities[0];
  }, [data, selectedFacility]);

  const fetchData = useCallback(async (targetUid: string) => {
    setState({ status: "loading" });
    try {
      const params = new URLSearchParams({ uid: targetUid });
      const response = await fetch(`/api/kobo?${params.toString()}`, { cache: "no-store" });
      const payload = (await response.json()) as { data?: DashboardData; error?: string };

      if (!response.ok || !payload.data) {
        throw new Error(payload.error ?? `Error ${response.status}`);
      }

      setData(payload.data);
      setState({ status: "loaded" });

      const preferredFacility = producerFacilityId ?? payload.data.facilities[0]?.id ?? null;
      setSelectedFacility(preferredFacility);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      setState({ status: "error", message });
    }
  }, [producerFacilityId]);

  useEffect(() => {
    if (!isLoaded) return;

    const initialUid = role === "producer" && assignedProjectUid ? assignedProjectUid : DEFAULT_PROJECT_UID;
    setUid(initialUid);
    void fetchData(initialUid);
  }, [isLoaded, role, assignedProjectUid, fetchData]);

  useEffect(() => {
    if (!canAccessTab(role, activeTab)) {
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
    const timer = setTimeout(() => {
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("resize"));
      }
    }, 80);

    return () => clearTimeout(timer);
  }, [data, selectedFacility, activeTab]);

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

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-4">
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-slate-900">{t("header.title")}</h1>
              <p className="text-xs text-slate-500">{t("header.subtitle")}</p>
            </div>
            <Badge variant="secondary" className="capitalize">
              {t(`role.${role}`)}
            </Badge>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 text-xs text-slate-500 sm:flex">
              <Clock className="h-3.5 w-3.5" />
              <span>
                {t("header.lastUpdated")}: {" "}
                {data?.stats.lastUpdated
                  ? new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(data.stats.lastUpdated))
                  : "-"}
              </span>
            </div>

            <Select value={locale} onValueChange={(value) => setLocale(value as Locale)}>
              <SelectTrigger className="w-28">
                <SelectValue placeholder="Lang" />
              </SelectTrigger>
              <SelectContent>
                {supportedLocales.map((entry) => (
                  <SelectItem key={entry} value={entry}>
                    <div className="flex items-center gap-2">
                      <Languages className="h-4 w-4" />
                      <span className="uppercase">{entry}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button size="sm" variant="outline" onClick={() => fetchData(uid)} disabled={state.status === "loading"} className="gap-2">
              {state.status === "loading" ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              <span className="hidden sm:inline">{t("actions.refresh")}</span>
            </Button>

            <Show when="signed-out">
              <SignInButton mode="modal">
                <Button size="sm" variant="secondary">{t("auth.signIn")}</Button>
              </SignInButton>
              <SignUpButton mode="modal">
                <Button size="sm">{t("auth.signUp")}</Button>
              </SignUpButton>
            </Show>

            <Show when="signed-in">
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: "h-9 w-9",
                  },
                }}
              />
            </Show>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-6">
        <Card className="mb-6 border-slate-200 bg-white shadow-sm">
          <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-slate-100 p-2">
                <Database className="h-4 w-4 text-slate-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-700">{t("datasource.title")}</p>
                <p className="text-xs text-slate-500">{t("datasource.subtitle")}</p>
              </div>
            </div>

            <div className="flex flex-1 flex-col items-start gap-2 sm:flex-row sm:items-center">
              <Input
                value={uid}
                onChange={(event) => setUid(event.target.value)}
                placeholder="Project UID"
                className="h-9 text-sm"
                disabled={!canUseCustomUid}
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={() => fetchData(uid)} disabled={!uid || state.status === "loading"}>
                  {state.status === "loading" ? <Loader2 className="h-4 w-4 animate-spin" /> : t("actions.load")}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => fetchData(DEFAULT_PROJECT_UID)}>
                  {t("actions.demo")}
                </Button>
              </div>
            </div>
          </CardContent>
          {!canUseCustomUid && (
            <p className="px-4 pb-4 text-xs text-slate-500">{t("datasource.lockedByRole")}</p>
          )}
        </Card>

        {state.status === "error" && (
          <Alert variant="destructive" className="mb-6">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{state.message}</AlertDescription>
          </Alert>
        )}

        {data && (
          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as "overview" | "facilities" | "comparative" | "methodology" | "users")}
            className="space-y-6"
          >
            <TabsList className="flex w-full flex-wrap items-center justify-start gap-2 rounded-lg bg-slate-100 p-1 sm:justify-center">
              <TabsTrigger value="overview" className="min-w-[120px] flex-1 justify-center rounded-md px-3 py-2 text-sm">
                <BarChart3 className="mr-2 h-4 w-4" />
                {t("tabs.overview")}
              </TabsTrigger>

              {canAccessTab(role, "facilities") && (
                <TabsTrigger value="facilities" className="min-w-[120px] flex-1 justify-center rounded-md px-3 py-2 text-sm">
                  <Building2 className="mr-2 h-4 w-4" />
                  {t("tabs.facilities")}
                </TabsTrigger>
              )}

              {canAccessTab(role, "comparative") && (
                <TabsTrigger value="comparative" className="min-w-[120px] flex-1 justify-center rounded-md px-3 py-2 text-sm">
                  <Activity className="mr-2 h-4 w-4" />
                  {t("tabs.comparative")}
                </TabsTrigger>
              )}

              {canAccessTab(role, "methodology") && (
                <TabsTrigger value="methodology" className="min-w-[120px] flex-1 justify-center rounded-md px-3 py-2 text-sm">
                  <Database className="mr-2 h-4 w-4" />
                  {t("tabs.methodology")}
                </TabsTrigger>
              )}

              {canAccessTab(role, "users") && (
                <TabsTrigger value="users" className="min-w-[120px] flex-1 justify-center rounded-md px-3 py-2 text-sm">
                  <Users className="mr-2 h-4 w-4" />
                  {t("tabs.users")}
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="overview">
              {activeTab === "overview" && <Overview data={data} t={t} />}
            </TabsContent>

            <TabsContent value="facilities">
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
            </TabsContent>

            <TabsContent value="comparative">
              {activeTab === "comparative" && canAccessTab(role, "comparative") && (
                <ComparativeView data={data} t={t} onSelectFacility={setSelectedFacility} />
              )}
            </TabsContent>

            <TabsContent value="methodology">
              {activeTab === "methodology" && canAccessTab(role, "methodology") && <MethodologyView data={data} t={t} />}
            </TabsContent>

            <TabsContent value="users">
              {activeTab === "users" && canAccessTab(role, "users") && (
                <UserManagementView facilities={data.facilities} projectUid={uid} t={t} />
              )}
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  );
}
