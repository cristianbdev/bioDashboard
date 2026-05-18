"use client";

import dynamic from "next/dynamic";
import { useMemo, useState, useEffect, useRef } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Filter, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BottomSheet } from "@/components/layout/bottom-sheet";

import {
  ChartCard,
  CHART_TOOLTIP_CURSOR,
  CHART_TOOLTIP_STYLE,
  getAdaptiveChartHeight,
  truncateChartLabel,
} from "@/components/charts/chart-card";
import { EmptyChartState } from "@/components/charts/empty-chart-state";
import type { DashboardData, FacilitySummary } from "@/lib/kobo";
import { translateSectionLabel } from "@/lib/section-labels";
import { useChartColors, type ChartColors } from "@/hooks/useChartColors";
import { RiskBadge } from "./cards";
import { InfoTitle } from "./info-title";
import { DesktopFloatingFilter } from "./desktop-floating-filter";

const ReactECharts = dynamic(() => import("echarts-for-react"), { ssr: false });

type Props = {
  data: DashboardData;
  t: (key: string) => string;
  onSelectFacility: (id: number) => void;
};

function average(values: number[]) {
  if (values.length === 0) return 0;
  return Math.round(values.reduce((acc, value) => acc + value, 0) / values.length);
}

function avgByField(
  facilities: FacilitySummary[],
  getKey: (facility: FacilitySummary) => string | undefined,
): { name: string; avgScore: number; count: number }[] {
  const map: Record<string, number[]> = {};
  facilities.forEach((facility) => {
    const key = getKey(facility);
    if (!key) return;
    if (!map[key]) map[key] = [];
    map[key].push(facility.score);
  });
  return Object.entries(map)
    .map(([name, scores]) => ({ name, avgScore: average(scores), count: scores.length }))
    .sort((a, b) => b.count - a.count);
}

function buildHeatmapOption(
  facilities: FacilitySummary[],
  side: "external" | "internal",
  title: string,
  t: (key: string) => string,
  colors: ChartColors,
) {
  type HeatmapTooltipParam = {
    data: [number, number, number, number];
  };

  const rows = facilities.flatMap((facility) =>
    facility.sectionScores
      .filter((section) => section.side === side)
      .map((section) => ({
        facility: facility.name,
        subcategory: translateSectionLabel(section.section, t),
        value: section.score >= 70 ? 1 : 0,
        score: section.score,
      })),
  );

  if (rows.length === 0) return undefined;

  const facilitiesAxis = Array.from(new Set(rows.map((row) => row.facility)));
  const subcategoriesAxis = Array.from(new Set(rows.map((row) => row.subcategory)));

  return {
    title: {
      text: title,
      left: "center",
      textStyle: { fontSize: 14, fontWeight: 600, color: colors.textPrimary },
    },
    backgroundColor: "transparent",
    tooltip: {
      position: "top",
      backgroundColor: colors.raised,
      borderColor: colors.borderSubtle,
      textStyle: { color: colors.textPrimary },
      formatter: (params: HeatmapTooltipParam) => {
        const facility = facilitiesAxis[params.data[0]];
        const subcategory = subcategoriesAxis[params.data[1]];
        const score = params.data[3];
        const status = params.data[2] ? t("status.compliant") : t("status.nonCompliant");
        return `${facility}<br/>${subcategory}<br/>${t("table.score")}: ${score}/100<br/>${status}`;
      },
    },
    textStyle: { color: colors.textPrimary },
    grid: { top: 56, left: 90, right: 20, bottom: 80 },
    xAxis: {
      type: "category",
      data: facilitiesAxis,
      axisLabel: { rotate: 40, fontSize: 10, color: colors.textSecondary },
      axisLine: { lineStyle: { color: colors.borderDefault } },
      splitArea: { show: true, areaStyle: { color: [colors.surfaceBase, colors.surfaceElevated] } },
      splitLine: { lineStyle: { color: colors.borderSubtle } },
    },
    yAxis: {
      type: "category",
      data: subcategoriesAxis,
      axisLabel: { fontSize: 11, color: colors.textSecondary },
      axisLine: { lineStyle: { color: colors.borderDefault } },
      splitArea: { show: true, areaStyle: { color: [colors.surfaceBase, colors.surfaceElevated] } },
      splitLine: { lineStyle: { color: colors.borderSubtle } },
    },
    visualMap: {
      min: 0,
      max: 1,
      orient: "horizontal",
      left: "center",
      bottom: 12,
      precision: 0,
      text: [t("status.compliant"), t("status.nonCompliant")],
      textStyle: { color: colors.textPrimary },
      inRange: { color: [colors.danger, colors.success] },
    },
    series: [
      {
        type: "heatmap",
        data: rows.map((row) => [
          facilitiesAxis.indexOf(row.facility),
          subcategoriesAxis.indexOf(row.subcategory),
          row.value,
          row.score,
        ]),
      },
    ],
  };
}

export function ComparativeView({ data, t, onSelectFacility }: Props) {
  const colors = useChartColors();
  const [locationFilter, setLocationFilter] = useState<string>("all");
  const [productionTypeFilter, setProductionTypeFilter] = useState<string>("all");
  const [systemFilter, setSystemFilter] = useState<string>("all");
  const [speciesFilter, setSpeciesFilter] = useState<string>("all");
  const [waterSourceFilter, setWaterSourceFilter] = useState<string>("all");
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [showFloatingFilters, setShowFloatingFilters] = useState(false);
  const headerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setShowFloatingFilters(!entry.isIntersecting);
      },
      {
        root: null,
        threshold: 0,
        rootMargin: "-50px 0px 0px 0px",
      },
    );

    observer.observe(header);
    return () => observer.disconnect();
  }, []);

  const filteredFacilities = useMemo(() => {
    return data.facilities.filter((facility) => {
      const facilityLocation = facility.basedOn ?? facility.location;
      if (locationFilter !== "all" && facilityLocation !== locationFilter) return false;
      if (productionTypeFilter !== "all" && facility.productionType !== productionTypeFilter) return false;
      if (systemFilter !== "all" && facility.productionSystem !== systemFilter) return false;
      if (speciesFilter !== "all" && facility.species !== speciesFilter) return false;
      if (waterSourceFilter !== "all" && facility.waterSource !== waterSourceFilter) return false;
      return true;
    });
  }, [data.facilities, locationFilter, productionTypeFilter, systemFilter, speciesFilter, waterSourceFilter]);

  const charts = useMemo(
    () => ({
      bySystem: avgByField(filteredFacilities, (facility) => facility.productionSystem),
      byProductionType: avgByField(filteredFacilities, (facility) => facility.productionType),
      byEducation: avgByField(filteredFacilities, (facility) => facility.respondentEducation),
      byMarket: avgByField(filteredFacilities, (facility) => facility.market),
      byYears: avgByField(filteredFacilities, (facility) => facility.yearsOperation),
      bySpecies: avgByField(filteredFacilities, (facility) => facility.species),
      byWaterSource: avgByField(filteredFacilities, (facility) => facility.waterSource),
    }),
    [filteredFacilities],
  );

  const externalHeatmap = useMemo(
    () => buildHeatmapOption(filteredFacilities, "external", t("comparative.riskMatrixExternal"), t, colors),
    [filteredFacilities, t, colors],
  );
  const internalHeatmap = useMemo(
    () => buildHeatmapOption(filteredFacilities, "internal", t("comparative.riskMatrixInternal"), t, colors),
    [filteredFacilities, t, colors],
  );

  const locationOptions = data.operations.byLocation.map((item) => item.location).filter(Boolean);
  const productionTypeOptions = data.operations.byProductionType.map((item) => item.type).filter(Boolean);
  const systemOptions = data.operations.bySystem.map((item) => item.system).filter(Boolean);
  const speciesOptions = data.operations.bySpecies.map((item) => item.species).filter(Boolean);
  const waterSourceOptions = data.operations.byWaterSource.map((item) => item.source).filter(Boolean);

  const hasActiveFilters = locationFilter !== "all" || productionTypeFilter !== "all" || systemFilter !== "all" || speciesFilter !== "all" || waterSourceFilter !== "all";

  const clearAllFilters = () => {
    setLocationFilter("all");
    setProductionTypeFilter("all");
    setSystemFilter("all");
    setSpeciesFilter("all");
    setWaterSourceFilter("all");
  };

  return (
    <div className="space-y-6 min-w-0">
      {/* Section Header with Mobile Filter Button */}
      <div ref={headerRef} className="flex flex-col justify-between gap-3 lg:flex-row lg:items-end">
        <div>
          <h2 className="text-dashboard-title">{t("tabs.comparative")}</h2>
          <p className="mt-1 text-dashboard-subtitle">{t("info.comparativeCharts")}</p>
        </div>
        {/* Mobile filter button removed - filters are now inline below */}
      </div>

      {/* Mobile floating filter button - opens filter drawer when header not visible */}
      <button
        type="button"
        onClick={() => setIsMobileFiltersOpen(true)}
        className={`lg:hidden fixed right-4 z-40 flex items-center gap-2 rounded-full bg-[var(--color-brand)] px-4 py-2 text-white shadow-lg transition-all duration-300 ${
          showFloatingFilters ? "bottom-6 translate-y-0 opacity-100" : "bottom-6 pointer-events-none translate-y-4 opacity-0"
        }`}
        aria-label={t("comparative.openFilters")}
      >
        <Filter className="h-4 w-4" />
        <span className="text-sm font-medium">{t("comparative.filters")}</span>
        {hasActiveFilters && (
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-raised)] text-xs font-bold text-[var(--color-brand)]">
            {[locationFilter, productionTypeFilter, systemFilter, speciesFilter, waterSourceFilter].filter((f) => f !== "all").length}
          </span>
        )}
      </button>

      {/* Mobile Filters - Always visible on mobile (inline at top) */}
      <div className="lg:hidden">
        <Card className="card-flat">
          <CardContent className="p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-[var(--color-brand)]">
              <Filter className="h-4 w-4" />
              <span>{t("comparative.filters")}</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {/* Location Filter */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[var(--color-text-secondary)]">{t("overview.filterLocation")}</label>
                <Select value={locationFilter} onValueChange={setLocationFilter}>
                  <SelectTrigger className="h-10 w-full border-[var(--color-border-subtle)] bg-[var(--color-raised)] text-[var(--color-text-primary)] hover:border-[var(--color-brand)]/40 focus:border-[var(--color-brand)] focus:ring-1 focus:ring-[var(--color-brand)]">
                    <SelectValue placeholder={t("overview.filterLocation")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("overview.filterAll")}</SelectItem>
                    {locationOptions.map((value) => (
                      <SelectItem key={value} value={value}>{value}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Production Type Filter */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[var(--color-text-secondary)]">{t("table.productionType")}</label>
                <Select value={productionTypeFilter} onValueChange={setProductionTypeFilter}>
                  <SelectTrigger className="h-10 w-full border-[var(--color-border-subtle)] bg-[var(--color-raised)] text-[var(--color-text-primary)] hover:border-[var(--color-brand)]/40 focus:border-[var(--color-brand)] focus:ring-1 focus:ring-[var(--color-brand)]">
                    <SelectValue placeholder={t("table.productionType")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("overview.filterAll")}</SelectItem>
                    {productionTypeOptions.map((value) => (
                      <SelectItem key={value} value={value}>{value}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* System Filter */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[var(--color-text-secondary)]">{t("table.system")}</label>
                <Select value={systemFilter} onValueChange={setSystemFilter}>
                  <SelectTrigger className="h-10 w-full border-[var(--color-border-subtle)] bg-[var(--color-raised)] text-[var(--color-text-primary)] hover:border-[var(--color-brand)]/40 focus:border-[var(--color-brand)] focus:ring-1 focus:ring-[var(--color-brand)]">
                    <SelectValue placeholder={t("table.system")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("overview.filterAll")}</SelectItem>
                    {systemOptions.map((value) => (
                      <SelectItem key={value} value={value}>{value}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Species Filter */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[var(--color-text-secondary)]">{t("table.species")}</label>
                <Select value={speciesFilter} onValueChange={setSpeciesFilter}>
                  <SelectTrigger className="h-10 w-full border-[var(--color-border-subtle)] bg-[var(--color-raised)] text-[var(--color-text-primary)] hover:border-[var(--color-brand)]/40 focus:border-[var(--color-brand)] focus:ring-1 focus:ring-[var(--color-brand)]">
                    <SelectValue placeholder={t("table.species")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("overview.filterAll")}</SelectItem>
                    {speciesOptions.map((value) => (
                      <SelectItem key={value} value={value}>{value}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Water Source Filter */}
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-medium text-[var(--color-text-secondary)]">{t("table.water")}</label>
                <Select value={waterSourceFilter} onValueChange={setWaterSourceFilter}>
                  <SelectTrigger className="h-10 w-full border-[var(--color-border-subtle)] bg-[var(--color-raised)] text-[var(--color-text-primary)] hover:border-[var(--color-brand)]/40 focus:border-[var(--color-brand)] focus:ring-1 focus:ring-[var(--color-brand)]">
                    <SelectValue placeholder={t("table.water")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("overview.filterAll")}</SelectItem>
                    {waterSourceOptions.map((value) => (
                      <SelectItem key={value} value={value}>{value}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Active Filters Summary */}
            {hasActiveFilters && (
              <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-[var(--color-border-subtle)] pt-3">
                {locationFilter !== "all" && (
                  <Badge variant="secondary" className="bg-[var(--color-surface-base)] text-[var(--color-text-secondary)] flex items-center gap-1 pr-1">
                    {t("overview.filterLocation")}: {locationFilter}
                    <button onClick={() => setLocationFilter("all")} className="ml-1 rounded-full p-0.5 hover:bg-[var(--color-brand)]/10">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {productionTypeFilter !== "all" && (
                  <Badge variant="secondary" className="bg-[var(--color-surface-base)] text-[var(--color-text-secondary)] flex items-center gap-1 pr-1">
                    {t("table.productionType")}: {productionTypeFilter}
                    <button onClick={() => setProductionTypeFilter("all")} className="ml-1 rounded-full p-0.5 hover:bg-[var(--color-brand)]/10">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {systemFilter !== "all" && (
                  <Badge variant="secondary" className="bg-[var(--color-surface-base)] text-[var(--color-text-secondary)] flex items-center gap-1 pr-1">
                    {t("table.system")}: {systemFilter}
                    <button onClick={() => setSystemFilter("all")} className="ml-1 rounded-full p-0.5 hover:bg-[var(--color-brand)]/10">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {speciesFilter !== "all" && (
                  <Badge variant="secondary" className="bg-[var(--color-surface-base)] text-[var(--color-text-secondary)] flex items-center gap-1 pr-1">
                    {t("table.species")}: {speciesFilter}
                    <button onClick={() => setSpeciesFilter("all")} className="ml-1 rounded-full p-0.5 hover:bg-[var(--color-brand)]/10">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {waterSourceFilter !== "all" && (
                  <Badge variant="secondary" className="bg-[var(--color-surface-base)] text-[var(--color-text-secondary)] flex items-center gap-1 pr-1">
                    {t("table.water")}: {waterSourceFilter}
                    <button onClick={() => setWaterSourceFilter("all")} className="ml-1 rounded-full p-0.5 hover:bg-[var(--color-brand)]/10">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 text-xs text-[var(--color-brand)]"
                  onClick={clearAllFilters}
                >
                  {t("overview.clearAll")}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Desktop Filters - Always visible on desktop */}
      <div className="hidden lg:block">
        <Card className="card-flat">
          <CardContent className="p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-[var(--color-brand)]">
              <Filter className="h-4 w-4" />
              <span>{t("comparative.filters")}</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              {/* Location Filter */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[var(--color-text-secondary)]">{t("overview.filterLocation")}</label>
                <Select value={locationFilter} onValueChange={setLocationFilter}>
                  <SelectTrigger className="h-10 w-full border-[var(--color-border-subtle)] bg-[var(--color-raised)] text-[var(--color-text-primary)] hover:border-[var(--color-brand)]/40 focus:border-[var(--color-brand)] focus:ring-1 focus:ring-[var(--color-brand)]">
                    <SelectValue placeholder={t("overview.filterLocation")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("overview.filterAll")}</SelectItem>
                    {locationOptions.map((value) => (
                      <SelectItem key={value} value={value}>{value}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Production Type Filter */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[var(--color-text-secondary)]">{t("table.productionType")}</label>
                <Select value={productionTypeFilter} onValueChange={setProductionTypeFilter}>
                  <SelectTrigger className="h-10 w-full border-[var(--color-border-subtle)] bg-[var(--color-raised)] text-[var(--color-text-primary)] hover:border-[var(--color-brand)]/40 focus:border-[var(--color-brand)] focus:ring-1 focus:ring-[var(--color-brand)]">
                    <SelectValue placeholder={t("table.productionType")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("overview.filterAll")}</SelectItem>
                    {productionTypeOptions.map((value) => (
                      <SelectItem key={value} value={value}>{value}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* System Filter */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[var(--color-text-secondary)]">{t("table.system")}</label>
                <Select value={systemFilter} onValueChange={setSystemFilter}>
                  <SelectTrigger className="h-10 w-full border-[var(--color-border-subtle)] bg-[var(--color-raised)] text-[var(--color-text-primary)] hover:border-[var(--color-brand)]/40 focus:border-[var(--color-brand)] focus:ring-1 focus:ring-[var(--color-brand)]">
                    <SelectValue placeholder={t("table.system")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("overview.filterAll")}</SelectItem>
                    {systemOptions.map((value) => (
                      <SelectItem key={value} value={value}>{value}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Species Filter */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[var(--color-text-secondary)]">{t("table.species")}</label>
                <Select value={speciesFilter} onValueChange={setSpeciesFilter}>
                  <SelectTrigger className="h-10 w-full border-[var(--color-border-subtle)] bg-[var(--color-raised)] text-[var(--color-text-primary)] hover:border-[var(--color-brand)]/40 focus:border-[var(--color-brand)] focus:ring-1 focus:ring-[var(--color-brand)]">
                    <SelectValue placeholder={t("table.species")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("overview.filterAll")}</SelectItem>
                    {speciesOptions.map((value) => (
                      <SelectItem key={value} value={value}>{value}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Water Source Filter */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[var(--color-text-secondary)]">{t("table.water")}</label>
                <Select value={waterSourceFilter} onValueChange={setWaterSourceFilter}>
                  <SelectTrigger className="h-10 w-full border-[var(--color-border-subtle)] bg-[var(--color-raised)] text-[var(--color-text-primary)] hover:border-[var(--color-brand)]/40 focus:border-[var(--color-brand)] focus:ring-1 focus:ring-[var(--color-brand)]">
                    <SelectValue placeholder={t("table.water")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("overview.filterAll")}</SelectItem>
                    {waterSourceOptions.map((value) => (
                      <SelectItem key={value} value={value}>{value}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Active Filters Summary */}
            {hasActiveFilters && (
              <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-[var(--color-border-subtle)] pt-3">
                {locationFilter !== "all" && (
                  <Badge variant="secondary" className="bg-[var(--color-surface-base)] text-[var(--color-text-secondary)] flex items-center gap-1 pr-1">
                    {t("overview.filterLocation")}: {locationFilter}
                    <button onClick={() => setLocationFilter("all")} className="ml-1 rounded-full p-0.5 hover:bg-[var(--color-brand)]/10">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {productionTypeFilter !== "all" && (
                  <Badge variant="secondary" className="bg-[var(--color-surface-base)] text-[var(--color-text-secondary)] flex items-center gap-1 pr-1">
                    {t("table.productionType")}: {productionTypeFilter}
                    <button onClick={() => setProductionTypeFilter("all")} className="ml-1 rounded-full p-0.5 hover:bg-[var(--color-brand)]/10">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {systemFilter !== "all" && (
                  <Badge variant="secondary" className="bg-[var(--color-surface-base)] text-[var(--color-text-secondary)] flex items-center gap-1 pr-1">
                    {t("table.system")}: {systemFilter}
                    <button onClick={() => setSystemFilter("all")} className="ml-1 rounded-full p-0.5 hover:bg-[var(--color-brand)]/10">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {speciesFilter !== "all" && (
                  <Badge variant="secondary" className="bg-[var(--color-surface-base)] text-[var(--color-text-secondary)] flex items-center gap-1 pr-1">
                    {t("table.species")}: {speciesFilter}
                    <button onClick={() => setSpeciesFilter("all")} className="ml-1 rounded-full p-0.5 hover:bg-[var(--color-brand)]/10">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {waterSourceFilter !== "all" && (
                  <Badge variant="secondary" className="bg-[var(--color-surface-base)] text-[var(--color-text-secondary)] flex items-center gap-1 pr-1">
                    {t("table.water")}: {waterSourceFilter}
                    <button onClick={() => setWaterSourceFilter("all")} className="ml-1 rounded-full p-0.5 hover:bg-[var(--color-brand)]/10">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 text-xs text-[var(--color-brand)]"
                  onClick={clearAllFilters}
                >
                  {t("overview.clearAll")}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Mobile Filters Bottom Sheet */}
      <BottomSheet
        isOpen={isMobileFiltersOpen}
        onClose={() => setIsMobileFiltersOpen(false)}
        title={t("comparative.filters")}
        closeLabel={t("navigation.closeMenu")}
      >
        <div className="space-y-4">
          {/* Location Filter */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-[var(--color-text-secondary)]">{t("overview.filterLocation")}</p>
            <Select value={locationFilter} onValueChange={setLocationFilter}>
              <SelectTrigger className="w-full border-[var(--color-border-subtle)] bg-[var(--color-raised)]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("overview.filterAll")}</SelectItem>
                {locationOptions.map((value) => (
                  <SelectItem key={value} value={value}>{value}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Production Type Filter */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-[var(--color-text-secondary)]">{t("table.productionType")}</p>
            <Select value={productionTypeFilter} onValueChange={setProductionTypeFilter}>
              <SelectTrigger className="w-full border-[var(--color-border-subtle)] bg-[var(--color-raised)]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("overview.filterAll")}</SelectItem>
                {productionTypeOptions.map((value) => (
                  <SelectItem key={value} value={value}>{value}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* System Filter */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-[var(--color-text-secondary)]">{t("table.system")}</p>
            <Select value={systemFilter} onValueChange={setSystemFilter}>
              <SelectTrigger className="w-full border-[var(--color-border-subtle)] bg-[var(--color-raised)]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("overview.filterAll")}</SelectItem>
                {systemOptions.map((value) => (
                  <SelectItem key={value} value={value}>{value}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Species Filter */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-[var(--color-text-secondary)]">{t("table.species")}</p>
            <Select value={speciesFilter} onValueChange={setSpeciesFilter}>
              <SelectTrigger className="w-full border-[var(--color-border-subtle)] bg-[var(--color-raised)]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("overview.filterAll")}</SelectItem>
                {speciesOptions.map((value) => (
                  <SelectItem key={value} value={value}>{value}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Water Source Filter */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-[var(--color-text-secondary)]">{t("table.water")}</p>
            <Select value={waterSourceFilter} onValueChange={setWaterSourceFilter}>
              <SelectTrigger className="w-full border-[var(--color-border-subtle)] bg-[var(--color-raised)]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("overview.filterAll")}</SelectItem>
                {waterSourceOptions.map((value) => (
                  <SelectItem key={value} value={value}>{value}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Active filters summary */}
          {hasActiveFilters && (
            <div className="border-t border-[var(--color-border-subtle)] pt-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">{t("overview.activeFilters")}</p>
              <div className="flex flex-wrap gap-2">
                {locationFilter !== "all" && (
                  <Badge variant="secondary" className="bg-[var(--color-brand)]/10 text-[var(--color-brand)] border border-[var(--color-brand)]/20 pr-1.5">
                    {t("overview.filterLocation")}: {locationFilter}
                    <button onClick={() => setLocationFilter("all")} className="ml-1.5 rounded-full p-0.5 hover:bg-[var(--color-brand)]/20">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {productionTypeFilter !== "all" && (
                  <Badge variant="secondary" className="bg-[var(--color-brand)]/10 text-[var(--color-brand)] border border-[var(--color-brand)]/20 pr-1.5">
                    {t("table.productionType")}: {productionTypeFilter}
                    <button onClick={() => setProductionTypeFilter("all")} className="ml-1.5 rounded-full p-0.5 hover:bg-[var(--color-brand)]/20">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {systemFilter !== "all" && (
                  <Badge variant="secondary" className="bg-[var(--color-brand)]/10 text-[var(--color-brand)] border border-[var(--color-brand)]/20 pr-1.5">
                    {t("table.system")}: {systemFilter}
                    <button onClick={() => setSystemFilter("all")} className="ml-1.5 rounded-full p-0.5 hover:bg-[var(--color-brand)]/20">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {speciesFilter !== "all" && (
                  <Badge variant="secondary" className="bg-[var(--color-brand)]/10 text-[var(--color-brand)] border border-[var(--color-brand)]/20 pr-1.5">
                    {t("table.species")}: {speciesFilter}
                    <button onClick={() => setSpeciesFilter("all")} className="ml-1.5 rounded-full p-0.5 hover:bg-[var(--color-brand)]/20">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {waterSourceFilter !== "all" && (
                  <Badge variant="secondary" className="bg-[var(--color-brand)]/10 text-[var(--color-brand)] border border-[var(--color-brand)]/20 pr-1.5">
                    {t("table.water")}: {waterSourceFilter}
                    <button onClick={() => setWaterSourceFilter("all")} className="ml-1.5 rounded-full p-0.5 hover:bg-[var(--color-brand)]/20">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={clearAllFilters}
                className="mt-3 text-xs text-[var(--color-brand)]"
              >
                {t("overview.clearAll")}
              </Button>
            </div>
          )}
        </div>
      </BottomSheet>

      <DesktopFloatingFilter
        isVisible={showFloatingFilters}
        filters={[
          { label: t("overview.filterLocation"), activeValue: locationFilter, allValue: "all", onClear: () => setLocationFilter("all") },
          { label: t("table.productionType"), activeValue: productionTypeFilter, allValue: "all", onClear: () => setProductionTypeFilter("all") },
          { label: t("table.system"), activeValue: systemFilter, allValue: "all", onClear: () => setSystemFilter("all") },
          { label: t("table.species"), activeValue: speciesFilter, allValue: "all", onClear: () => setSpeciesFilter("all") },
          { label: t("table.water"), activeValue: waterSourceFilter, allValue: "all", onClear: () => setWaterSourceFilter("all") },
        ]}
        selectControls={[
          { id: "location", value: locationFilter, options: locationOptions, placeholder: t("overview.filterLocation"), onChange: setLocationFilter },
          { id: "productionType", value: productionTypeFilter, options: productionTypeOptions, placeholder: t("table.productionType"), onChange: setProductionTypeFilter },
          { id: "system", value: systemFilter, options: systemOptions, placeholder: t("table.system"), onChange: setSystemFilter },
          { id: "species", value: speciesFilter, options: speciesOptions, placeholder: t("table.species"), onChange: setSpeciesFilter },
          { id: "waterSource", value: waterSourceFilter, options: waterSourceOptions, placeholder: t("table.water"), onChange: setWaterSourceFilter },
        ]}
        onClearAll={clearAllFilters}
        activeCount={[locationFilter, productionTypeFilter, systemFilter, speciesFilter, waterSourceFilter].filter((f) => f !== "all").length}
        labels={{
          title: t("comparative.filters"),
          openButton: t("comparative.filters"),
          openButtonAria: t("comparative.openFilters"),
          activeFilters: t("overview.activeFilters"),
          filterAll: t("overview.filterAll"),
          close: t("navigation.closeMenu"),
          clearAll: t("overview.clearAll"),
        }}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title={t("comparative.scoreBySystem")} info={t("info.comparativeCharts")} height={getAdaptiveChartHeight(charts.bySystem.length)} ariaLabel={`${t("comparative.scoreBySystem")}. ${charts.bySystem.length} ${t("comparative.groupsAriaSuffix")}`}>
          <ComparisonBar data={charts.bySystem} color="var(--color-chart-2)" t={t} />
        </ChartCard>
        <ChartCard title={t("comparative.scoreByProductionType")} info={t("info.comparativeCharts")} height={getAdaptiveChartHeight(charts.byProductionType.length)} ariaLabel={`${t("comparative.scoreByProductionType")}. ${charts.byProductionType.length} ${t("comparative.groupsAriaSuffix")}`}>
          <ComparisonBar data={charts.byProductionType} color="var(--color-chart-1)" t={t} />
        </ChartCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title={t("comparative.scoreByEducation")} info={t("info.comparativeCharts")} height={getAdaptiveChartHeight(charts.byEducation.length)} ariaLabel={`${t("comparative.scoreByEducation")}. ${charts.byEducation.length} ${t("comparative.groupsAriaSuffix")}`}>
          <ComparisonBar data={charts.byEducation} color="var(--color-chart-4)" t={t} />
        </ChartCard>
        <ChartCard title={t("comparative.scoreByMarket")} info={t("info.comparativeCharts")} height={getAdaptiveChartHeight(charts.byMarket.length)} ariaLabel={`${t("comparative.scoreByMarket")}. ${charts.byMarket.length} ${t("comparative.groupsAriaSuffix")}`}>
          <ComparisonBar data={charts.byMarket} color="var(--color-chart-7)" t={t} />
        </ChartCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-2 2xl:grid-cols-3">
        <ChartCard title={t("comparative.scoreByYears")} info={t("info.comparativeCharts")} height={getAdaptiveChartHeight(charts.byYears.length)} ariaLabel={`${t("comparative.scoreByYears")}. ${charts.byYears.length} ${t("comparative.groupsAriaSuffix")}`}>
          <ComparisonBar data={charts.byYears} color="var(--color-chart-3)" t={t} />
        </ChartCard>
        <ChartCard title={t("comparative.scoreBySpecies")} info={t("info.comparativeCharts")} height={getAdaptiveChartHeight(charts.bySpecies.length)} ariaLabel={`${t("comparative.scoreBySpecies")}. ${charts.bySpecies.length} ${t("comparative.groupsAriaSuffix")}`}>
          <ComparisonBar data={charts.bySpecies} color="var(--color-chart-5)" t={t} />
        </ChartCard>
        <ChartCard title={t("comparative.scoreByWater")} info={t("info.comparativeCharts")} height={getAdaptiveChartHeight(charts.byWaterSource.length)} ariaLabel={`${t("comparative.scoreByWater")}. ${charts.byWaterSource.length} ${t("comparative.groupsAriaSuffix")}`}>
          <ComparisonBar data={charts.byWaterSource} color="var(--color-chart-6)" t={t} />
        </ChartCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="card-flat">
          <CardHeader className="pb-2">
            <InfoTitle title={t("comparative.riskMatrixExternal")} info={t("info.riskMatrix")} />
            <CardDescription>{t("comparative.riskMatrixLegend")}</CardDescription>
          </CardHeader>
          <CardContent className="h-[460px]">
            {externalHeatmap ? (
              <div role="img" aria-label={`${t("comparative.riskMatrixExternal")}. ${t("comparative.heatmapAriaSuffix")}`} className="h-full w-full">
                <ReactECharts style={{ height: "100%", width: "100%" }} option={externalHeatmap} />
              </div>
            ) : (
              <EmptyChartState />
            )}
          </CardContent>
        </Card>

        <Card className="card-flat">
          <CardHeader className="pb-2">
            <InfoTitle title={t("comparative.riskMatrixInternal")} info={t("info.riskMatrix")} />
            <CardDescription>{t("comparative.riskMatrixLegend")}</CardDescription>
          </CardHeader>
          <CardContent className="h-[460px]">
            {internalHeatmap ? (
              <div role="img" aria-label={`${t("comparative.riskMatrixInternal")}. ${t("comparative.heatmapAriaSuffix")}`} className="h-full w-full">
                <ReactECharts style={{ height: "100%", width: "100%" }} option={internalHeatmap} />
              </div>
            ) : (
              <EmptyChartState />
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="card-flat">
        <CardHeader className="pb-2">
          <InfoTitle title={t("comparative.tableTitle")} info={t("info.table")} />
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-semibold">{t("table.facility")}</TableHead>
                  <TableHead className="font-semibold text-center">{t("table.score")}</TableHead>
                  <TableHead className="font-semibold text-center">{t("table.risk")}</TableHead>
                  <TableHead className="font-semibold">{t("table.system")}</TableHead>
                  <TableHead className="font-semibold">{t("table.species")}</TableHead>
                  <TableHead className="font-semibold">{t("table.productionType")}</TableHead>
                  <TableHead className="font-semibold">{t("table.facilityLocation")}</TableHead>
                  <TableHead className="font-semibold">{t("table.water")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFacilities
                  .slice()
                  .sort((a, b) => b.score - a.score)
                  .map((facility) => (
                    <TableRow
                      key={facility.id}
                      tabIndex={0}
                      role="button"
                      aria-label={`${t("table.facility")}: ${facility.name}. ${t("table.score")}: ${facility.score}. ${t("table.risk")}: ${t(`risk.${facility.riskLevel.toLowerCase()}`)}`}
                      className="cursor-pointer hover:bg-slate-50 focus-visible:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--color-brand)]"
                      onClick={() => onSelectFacility(facility.id)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          onSelectFacility(facility.id);
                        }
                      }}
                    >
                      <TableCell className="font-medium">{facility.name}</TableCell>
                      <TableCell className="text-center">
                        <span
                          className={`font-semibold ${
                            facility.score >= 70
                              ? "text-emerald-600"
                              : facility.score >= 50
                              ? "text-amber-600"
                              : "text-rose-600"
                          }`}
                        >
                          {facility.score}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <RiskBadge level={facility.riskLevel} label={t(`risk.${facility.riskLevel.toLowerCase()}`)} />
                      </TableCell>
                      <TableCell>{facility.productionSystem ?? "-"}</TableCell>
                      <TableCell>{facility.species ?? "-"}</TableCell>
                      <TableCell>{facility.productionType ?? "-"}</TableCell>
                      <TableCell>{facility.basedOn ?? facility.location ?? "-"}</TableCell>
                      <TableCell>{facility.waterSource ?? "-"}</TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ComparisonBar({
  data,
  color,
  t,
}: {
  data: { name: string; avgScore: number; count: number }[];
  color: string;
  t: (key: string) => string;
}) {
  if (data.length === 0) {
    return <EmptyChartState />;
  }

  const isDense = data.length > 4;
  const xAxisHeight = isDense ? 52 : 30;
  const barSize = Math.max(18, Math.min(46, Math.floor(230 / Math.max(1, data.length))));
  return (
    <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 500, height: 300 }}>
      <BarChart data={data} margin={{ left: 4, right: 12, top: 8, bottom: isDense ? 8 : 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border-subtle)" />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 11, fill: "var(--color-text-secondary)" }}
          tickFormatter={(value: string) => truncateChartLabel(value, 18)}
          tickLine={false}
          axisLine={false}
          interval={0}
          angle={isDense ? -14 : 0}
          textAnchor={isDense ? "end" : "middle"}
          height={xAxisHeight}
        />
        <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "var(--color-text-secondary)" }} tickLine={false} axisLine={false} width={34} />
        <Tooltip
          contentStyle={CHART_TOOLTIP_STYLE}
          cursor={CHART_TOOLTIP_CURSOR}
          formatter={(value, _name, props) => [`${value}/100 (${props.payload.count})`, t("table.score")]}
        />
        <Bar dataKey="avgScore" fill={color} radius={[4, 4, 0, 0]} maxBarSize={50} barSize={barSize} />
      </BarChart>
    </ResponsiveContainer>
  );
}
