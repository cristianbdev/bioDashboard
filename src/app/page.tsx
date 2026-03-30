"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Activity, BarChart3, Building2, Clock, Database, Languages, Loader2, RefreshCw, Shield } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { DashboardData, FacilitySummary } from "@/lib/kobo";
import { Locale, supportedLocales, t as translate } from "@/lib/i18n";
import { Overview } from "@/components/dashboard/overview";
import { FacilitiesView } from "@/components/dashboard/facilities";
import { ComparativeView } from "@/components/dashboard/comparative";
import { MethodologyView } from "@/components/dashboard/methodology";

type ApiState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "loaded" };

const DEFAULT_UID = "atWJrmvMK43Gtr6zny6vs7";
type UserRole = "public" | "producer" | "admin";

export default function Home() {
  const [uid, setUid] = useState(DEFAULT_UID);
  const [locale, setLocale] = useState<Locale>("en");
  const [role, setRole] = useState<UserRole>("public");
  const [data, setData] = useState<DashboardData | null>(null);
  const [state, setState] = useState<ApiState>({ status: "idle" });
  const [selectedFacility, setSelectedFacility] = useState<number | null>(null);
  const [producerFacilityId, setProducerFacilityId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "facilities" | "comparative" | "methodology">("overview");

  const t = useCallback((key: string) => translate(locale, key), [locale]);

  const currentFacility: FacilitySummary | undefined = useMemo(() => {
    if (!data || data.facilities.length === 0) return undefined;
    return data.facilities.find((f) => f.id === selectedFacility) ?? data.facilities[0];
  }, [data, selectedFacility]);

  const fetchData = useCallback(async (targetUid: string) => {
    setState({ status: "loading" });
    try {
      const params = new URLSearchParams({ uid: targetUid });
      const res = await fetch(`/api/kobo?${params.toString()}`);
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const json = await res.json();
      setData(json.data);
      setState({ status: "loaded" });
      const firstId = json.data.facilities[0]?.id ?? null;
      setSelectedFacility(firstId);
      if (!producerFacilityId && firstId) setProducerFacilityId(firstId);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setState({ status: "error", message });
    }
  }, [producerFacilityId]);

  useEffect(() => {
    void fetchData(DEFAULT_UID);
  }, [fetchData]);

  // force charts to recalc after layout changes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("resize"));
      }
    }, 80);
    return () => clearTimeout(timer);
  }, [data, selectedFacility, activeTab]);

  useEffect(() => {
    if (role === "admin") return;
    if (role === "producer" && (activeTab === "comparative" || activeTab === "methodology")) setActiveTab("facilities");
    if (role === "public" && activeTab !== "overview") setActiveTab("overview");
  }, [role, activeTab]);

  const facilitiesForRole = useMemo(() => {
    if (!data) return [];
    if (role !== "producer") return data.facilities;
    const match = data.facilities.find((f) => f.id === producerFacilityId);
    return match ? [match] : data.facilities.slice(0, 1);
  }, [data, role, producerFacilityId]);

  const currentFacilityForRole = useMemo(() => {
    if (!data) return undefined;
    if (role !== "producer") return currentFacility;
    return data.facilities.find((f) => f.id === producerFacilityId) ?? data.facilities[0];
  }, [data, role, producerFacilityId, currentFacility]);

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
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 text-xs text-slate-500 sm:flex">
              <Clock className="h-3.5 w-3.5" />
              <span>
                {t("header.lastUpdated")}:{" "}
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
                {supportedLocales.map((l) => (
                  <SelectItem key={l} value={l}>
                    <div className="flex items-center gap-2">
                      <Languages className="h-4 w-4" />
                      <span className="uppercase">{l}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={role} onValueChange={(value) => setRole(value as UserRole)}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">Public</SelectItem>
                <SelectItem value="producer">Producer</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
            {/* <Button size="sm" variant="ghost" onClick={toggleTheme} className="gap-2" aria-label={t("theme.toggle")}>
              {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              <span className="hidden sm:inline">{theme === "light" ? t("theme.dark") : t("theme.light")}</span>
            </Button> */}
            <Button size="sm" variant="outline" onClick={() => fetchData(uid)} disabled={state.status === "loading"} className="gap-2">
              {state.status === "loading" ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              <span className="hidden sm:inline">{t("actions.refresh")}</span>
            </Button>
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
              <Input value={uid} onChange={(e) => setUid(e.target.value)} placeholder="Project UID" className="h-9 text-sm" />
              <div className="flex gap-2">
                <Button size="sm" onClick={() => fetchData(uid)} disabled={!uid || state.status === "loading"}>
                  {state.status === "loading" ? <Loader2 className="h-4 w-4 animate-spin" /> : t("actions.load")}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => fetchData(DEFAULT_UID)}>
                  {t("actions.demo")}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {state.status === "error" && (
          <Alert variant="destructive" className="mb-6">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{state.message}</AlertDescription>
          </Alert>
        )}

        {data && (
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "overview" | "facilities" | "comparative" | "methodology")} className="space-y-6">
             <TabsList className="flex w-full flex-wrap items-center justify-start gap-2 rounded-lg bg-slate-100 p-1 sm:justify-center">
              <TabsTrigger value="overview" className="flex-1 min-w-[120px] justify-center rounded-md px-3 py-2 text-sm">
                <BarChart3 className="mr-2 h-4 w-4" />
                {t("tabs.overview")}
              </TabsTrigger>
              {role !== "public" && (
                <TabsTrigger value="facilities" className="flex-1 min-w-[120px] justify-center rounded-md px-3 py-2 text-sm">
                  <Building2 className="mr-2 h-4 w-4" />
                  {t("tabs.facilities")}
                </TabsTrigger>
              )}
              {role === "admin" && (
                <TabsTrigger value="comparative" className="flex-1 min-w-[120px] justify-center rounded-md px-3 py-2 text-sm">
                  <Activity className="mr-2 h-4 w-4" />
                  {t("tabs.comparative")}
                </TabsTrigger>
              )}
              {role === "admin" && (
                <TabsTrigger value="methodology" className="flex-1 min-w-[120px] justify-center rounded-md px-3 py-2 text-sm">
                  <Database className="mr-2 h-4 w-4" />
                  {t("tabs.methodology")}
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="overview">
              {activeTab === "overview" && (
                <Overview data={data} t={t} />
              )}
            </TabsContent>

            <TabsContent value="facilities">
              {activeTab === "facilities" && role !== "public" && (
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
              {activeTab === "comparative" && role === "admin" && (
                <ComparativeView data={data} t={t} onSelectFacility={setSelectedFacility} />
              )}
            </TabsContent>

            <TabsContent value="methodology">
              {activeTab === "methodology" && role === "admin" && <MethodologyView data={data} t={t} />}
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  );
}
