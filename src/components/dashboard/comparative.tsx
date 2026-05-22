"use client";

import { useId, useMemo, useState, useEffect, useRef } from "react";
import { Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BottomSheet } from "@/components/layout/bottom-sheet";

import { ChartCard, getAdaptiveChartHeight } from "@/components/charts/chart-card";
import { EChartsChart } from "@/components/charts/echarts-chart";
import { EmptyChartState, type EmptyChartStateProps } from "@/components/charts/empty-chart-state";
import { useChartTheme } from "@/hooks/useChartTheme";
import type { DashboardData, FacilitySummary } from "@/lib/kobo";
import { buildComparisonBarOption, buildHeatmapOption } from "@/lib/chart-options";
import { resolveChartTokenColor } from "@/lib/chart-theme";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { RiskBadge } from "./cards";
import { DashboardPageHeading } from "./dashboard-page-heading";
import { InfoTitle } from "./info-title";
import { FilterClearButton } from "@/components/ui/filter-clear-button";
import { DesktopFloatingFilter } from "./desktop-floating-filter";
import { MobileHeatmapTable } from "./mobile-heatmap-table";

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

export function ComparativeView({ data, t, onSelectFacility }: Props) {
  const baseId = useId();
  const loc1 = `${baseId}-loc1`;
  const prod1 = `${baseId}-prod1`;
  const sys1 = `${baseId}-sys1`;
  const spec1 = `${baseId}-spec1`;
  const water1 = `${baseId}-water1`;
  const loc2 = `${baseId}-loc2`;
  const prod2 = `${baseId}-prod2`;
  const sys2 = `${baseId}-sys2`;
  const spec2 = `${baseId}-spec2`;
  const water2 = `${baseId}-water2`;
  const loc3 = `${baseId}-loc3`;
  const prod3 = `${baseId}-prod3`;
  const sys3 = `${baseId}-sys3`;
  const spec3 = `${baseId}-spec3`;
  const water3 = `${baseId}-water3`;

  const { colors } = useChartTheme();
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

  const [showAllCharts, setShowAllCharts] = useState(false);
  const [showHeatmapAsList, setShowHeatmapAsList] = useState(false);
  const isMdUp = useMediaQuery("(min-width: 768px)");

  const emptyStateProps: EmptyChartStateProps = filteredFacilities.length === 0 ? {
    title: t("charts.noData"),
    subtitle: t("charts.tryFilters"),
    blockingFilters: [
      ...(locationFilter !== "all" ? [{ label: t("overview.filterLocation"), value: locationFilter, onClear: () => setLocationFilter("all") }] : []),
      ...(productionTypeFilter !== "all" ? [{ label: t("table.productionType"), value: productionTypeFilter, onClear: () => setProductionTypeFilter("all") }] : []),
      ...(systemFilter !== "all" ? [{ label: t("table.system"), value: systemFilter, onClear: () => setSystemFilter("all") }] : []),
      ...(speciesFilter !== "all" ? [{ label: t("table.species"), value: speciesFilter, onClear: () => setSpeciesFilter("all") }] : []),
      ...(waterSourceFilter !== "all" ? [{ label: t("table.water"), value: waterSourceFilter, onClear: () => setWaterSourceFilter("all") }] : []),
    ],
    onClearAll: clearAllFilters,
  } : { title: t("charts.noData"), subtitle: t("charts.tryFilters") };

  return (
    <div className="space-y-6 min-w-0">
      {/* Section Header with Mobile Filter Button */}
      <div ref={headerRef} className="flex flex-col justify-between gap-3 lg:flex-row lg:items-end">
        <DashboardPageHeading title={t("tabs.comparative")} subtitle={t("comparative.subtitle")} />
        {/* Mobile filter button removed - filters are now inline below */}
      </div>

      {/* Mobile floating filter button - opens filter drawer when header not visible */}
      <button
        type="button"
        onClick={() => setIsMobileFiltersOpen(true)}
        aria-label={t("comparative.openFilters")}
        className={`btn-brand fixed right-4 z-40 flex min-h-11 items-center gap-2 rounded-full px-4 py-2.5 shadow-lg transition-all duration-300 lg:hidden ${
          showFloatingFilters ? "bottom-6 translate-y-0 opacity-100" : "bottom-6 pointer-events-none translate-y-4 opacity-0"
        }`}
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
                <label htmlFor={loc1} className="text-xs font-medium text-[var(--color-text-secondary)]">{t("overview.filterLocation")}</label>
                <Select value={locationFilter} onValueChange={setLocationFilter}>
                  <SelectTrigger id={loc1} className="h-10 w-full border-[var(--color-border-subtle)] bg-[var(--color-raised)] text-[var(--color-text-primary)] hover:border-[var(--color-brand)]/40 focus:border-[var(--color-brand)] focus:ring-1 focus:ring-[var(--color-brand)]">
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
                <label htmlFor={prod1} className="text-xs font-medium text-[var(--color-text-secondary)]">{t("table.productionType")}</label>
                <Select value={productionTypeFilter} onValueChange={setProductionTypeFilter}>
                  <SelectTrigger id={prod1} className="h-10 w-full border-[var(--color-border-subtle)] bg-[var(--color-raised)] text-[var(--color-text-primary)] hover:border-[var(--color-brand)]/40 focus:border-[var(--color-brand)] focus:ring-1 focus:ring-[var(--color-brand)]">
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
                <label htmlFor={sys1} className="text-xs font-medium text-[var(--color-text-secondary)]">{t("table.system")}</label>
                <Select value={systemFilter} onValueChange={setSystemFilter}>
                  <SelectTrigger id={sys1} className="h-10 w-full border-[var(--color-border-subtle)] bg-[var(--color-raised)] text-[var(--color-text-primary)] hover:border-[var(--color-brand)]/40 focus:border-[var(--color-brand)] focus:ring-1 focus:ring-[var(--color-brand)]">
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
                <label htmlFor={spec1} className="text-xs font-medium text-[var(--color-text-secondary)]">{t("table.species")}</label>
                <Select value={speciesFilter} onValueChange={setSpeciesFilter}>
                  <SelectTrigger id={spec1} className="h-10 w-full border-[var(--color-border-subtle)] bg-[var(--color-raised)] text-[var(--color-text-primary)] hover:border-[var(--color-brand)]/40 focus:border-[var(--color-brand)] focus:ring-1 focus:ring-[var(--color-brand)]">
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
                <label htmlFor={water1} className="text-xs font-medium text-[var(--color-text-secondary)]">{t("table.water")}</label>
                <Select value={waterSourceFilter} onValueChange={setWaterSourceFilter}>
                  <SelectTrigger id={water1} className="h-10 w-full border-[var(--color-border-subtle)] bg-[var(--color-raised)] text-[var(--color-text-primary)] hover:border-[var(--color-brand)]/40 focus:border-[var(--color-brand)] focus:ring-1 focus:ring-[var(--color-brand)]">
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
                    <FilterClearButton onClick={() => setLocationFilter("all")} filterName={t("table.location")} className="ml-1" />
                  </Badge>
                )}
                {productionTypeFilter !== "all" && (
                  <Badge variant="secondary" className="bg-[var(--color-surface-base)] text-[var(--color-text-secondary)] flex items-center gap-1 pr-1">
                    {t("table.productionType")}: {productionTypeFilter}
                    <FilterClearButton onClick={() => setProductionTypeFilter("all")} filterName={t("table.productionType")} className="ml-1" />
                  </Badge>
                )}
                {systemFilter !== "all" && (
                  <Badge variant="secondary" className="bg-[var(--color-surface-base)] text-[var(--color-text-secondary)] flex items-center gap-1 pr-1">
                    {t("table.system")}: {systemFilter}
                    <FilterClearButton onClick={() => setSystemFilter("all")} filterName={t("table.system")} className="ml-1" />
                  </Badge>
                )}
                {speciesFilter !== "all" && (
                  <Badge variant="secondary" className="bg-[var(--color-surface-base)] text-[var(--color-text-secondary)] flex items-center gap-1 pr-1">
                    {t("table.species")}: {speciesFilter}
                    <FilterClearButton onClick={() => setSpeciesFilter("all")} filterName={t("table.species")} className="ml-1" />
                  </Badge>
                )}
                {waterSourceFilter !== "all" && (
                  <Badge variant="secondary" className="bg-[var(--color-surface-base)] text-[var(--color-text-secondary)] flex items-center gap-1 pr-1">
                    {t("table.water")}: {waterSourceFilter}
                    <FilterClearButton onClick={() => setWaterSourceFilter("all")} filterName={t("table.water")} className="ml-1" />
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
                <label htmlFor={loc2} className="text-xs font-medium text-[var(--color-text-secondary)]">{t("overview.filterLocation")}</label>
                <Select value={locationFilter} onValueChange={setLocationFilter}>
                  <SelectTrigger id={loc2} className="h-10 w-full border-[var(--color-border-subtle)] bg-[var(--color-raised)] text-[var(--color-text-primary)] hover:border-[var(--color-brand)]/40 focus:border-[var(--color-brand)] focus:ring-1 focus:ring-[var(--color-brand)]">
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
                <label htmlFor={prod2} className="text-xs font-medium text-[var(--color-text-secondary)]">{t("table.productionType")}</label>
                <Select value={productionTypeFilter} onValueChange={setProductionTypeFilter}>
                  <SelectTrigger id={prod2} className="h-10 w-full border-[var(--color-border-subtle)] bg-[var(--color-raised)] text-[var(--color-text-primary)] hover:border-[var(--color-brand)]/40 focus:border-[var(--color-brand)] focus:ring-1 focus:ring-[var(--color-brand)]">
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
                <label htmlFor={sys2} className="text-xs font-medium text-[var(--color-text-secondary)]">{t("table.system")}</label>
                <Select value={systemFilter} onValueChange={setSystemFilter}>
                  <SelectTrigger id={sys2} className="h-10 w-full border-[var(--color-border-subtle)] bg-[var(--color-raised)] text-[var(--color-text-primary)] hover:border-[var(--color-brand)]/40 focus:border-[var(--color-brand)] focus:ring-1 focus:ring-[var(--color-brand)]">
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
                <label htmlFor={spec2} className="text-xs font-medium text-[var(--color-text-secondary)]">{t("table.species")}</label>
                <Select value={speciesFilter} onValueChange={setSpeciesFilter}>
                  <SelectTrigger id={spec2} className="h-10 w-full border-[var(--color-border-subtle)] bg-[var(--color-raised)] text-[var(--color-text-primary)] hover:border-[var(--color-brand)]/40 focus:border-[var(--color-brand)] focus:ring-1 focus:ring-[var(--color-brand)]">
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
                <label htmlFor={water2} className="text-xs font-medium text-[var(--color-text-secondary)]">{t("table.water")}</label>
                <Select value={waterSourceFilter} onValueChange={setWaterSourceFilter}>
                  <SelectTrigger id={water2} className="h-10 w-full border-[var(--color-border-subtle)] bg-[var(--color-raised)] text-[var(--color-text-primary)] hover:border-[var(--color-brand)]/40 focus:border-[var(--color-brand)] focus:ring-1 focus:ring-[var(--color-brand)]">
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
                    <FilterClearButton onClick={() => setLocationFilter("all")} filterName={t("table.location")} className="ml-1" />
                  </Badge>
                )}
                {productionTypeFilter !== "all" && (
                  <Badge variant="secondary" className="bg-[var(--color-surface-base)] text-[var(--color-text-secondary)] flex items-center gap-1 pr-1">
                    {t("table.productionType")}: {productionTypeFilter}
                    <FilterClearButton onClick={() => setProductionTypeFilter("all")} filterName={t("table.productionType")} className="ml-1" />
                  </Badge>
                )}
                {systemFilter !== "all" && (
                  <Badge variant="secondary" className="bg-[var(--color-surface-base)] text-[var(--color-text-secondary)] flex items-center gap-1 pr-1">
                    {t("table.system")}: {systemFilter}
                    <FilterClearButton onClick={() => setSystemFilter("all")} filterName={t("table.system")} className="ml-1" />
                  </Badge>
                )}
                {speciesFilter !== "all" && (
                  <Badge variant="secondary" className="bg-[var(--color-surface-base)] text-[var(--color-text-secondary)] flex items-center gap-1 pr-1">
                    {t("table.species")}: {speciesFilter}
                    <FilterClearButton onClick={() => setSpeciesFilter("all")} filterName={t("table.species")} className="ml-1" />
                  </Badge>
                )}
                {waterSourceFilter !== "all" && (
                  <Badge variant="secondary" className="bg-[var(--color-surface-base)] text-[var(--color-text-secondary)] flex items-center gap-1 pr-1">
                    {t("table.water")}: {waterSourceFilter}
                    <FilterClearButton onClick={() => setWaterSourceFilter("all")} filterName={t("table.water")} className="ml-1" />
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
            <label htmlFor={loc3} className="text-xs font-medium text-[var(--color-text-secondary)]">{t("overview.filterLocation")}</label>
            <Select value={locationFilter} onValueChange={setLocationFilter}>
              <SelectTrigger id={loc3} className="w-full border-[var(--color-border-subtle)] bg-[var(--color-raised)]">
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
            <label htmlFor={prod3} className="text-xs font-medium text-[var(--color-text-secondary)]">{t("table.productionType")}</label>
            <Select value={productionTypeFilter} onValueChange={setProductionTypeFilter}>
              <SelectTrigger id={prod3} className="w-full border-[var(--color-border-subtle)] bg-[var(--color-raised)]">
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
            <label htmlFor={sys3} className="text-xs font-medium text-[var(--color-text-secondary)]">{t("table.system")}</label>
            <Select value={systemFilter} onValueChange={setSystemFilter}>
              <SelectTrigger id={sys3} className="w-full border-[var(--color-border-subtle)] bg-[var(--color-raised)]">
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
            <label htmlFor={spec3} className="text-xs font-medium text-[var(--color-text-secondary)]">{t("table.species")}</label>
            <Select value={speciesFilter} onValueChange={setSpeciesFilter}>
              <SelectTrigger id={spec3} className="w-full border-[var(--color-border-subtle)] bg-[var(--color-raised)]">
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
            <label htmlFor={water3} className="text-xs font-medium text-[var(--color-text-secondary)]">{t("table.water")}</label>
            <Select value={waterSourceFilter} onValueChange={setWaterSourceFilter}>
              <SelectTrigger id={water3} className="w-full border-[var(--color-border-subtle)] bg-[var(--color-raised)]">
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
                    <FilterClearButton onClick={() => setLocationFilter("all")} filterName={t("table.location")} className="ml-1.5" />
                  </Badge>
                )}
                {productionTypeFilter !== "all" && (
                  <Badge variant="secondary" className="bg-[var(--color-brand)]/10 text-[var(--color-brand)] border border-[var(--color-brand)]/20 pr-1.5">
                    {t("table.productionType")}: {productionTypeFilter}
                    <FilterClearButton onClick={() => setProductionTypeFilter("all")} filterName={t("table.productionType")} className="ml-1.5" />
                  </Badge>
                )}
                {systemFilter !== "all" && (
                  <Badge variant="secondary" className="bg-[var(--color-brand)]/10 text-[var(--color-brand)] border border-[var(--color-brand)]/20 pr-1.5">
                    {t("table.system")}: {systemFilter}
                    <FilterClearButton onClick={() => setSystemFilter("all")} filterName={t("table.system")} className="ml-1.5" />
                  </Badge>
                )}
                {speciesFilter !== "all" && (
                  <Badge variant="secondary" className="bg-[var(--color-brand)]/10 text-[var(--color-brand)] border border-[var(--color-brand)]/20 pr-1.5">
                    {t("table.species")}: {speciesFilter}
                    <FilterClearButton onClick={() => setSpeciesFilter("all")} filterName={t("table.species")} className="ml-1.5" />
                  </Badge>
                )}
                {waterSourceFilter !== "all" && (
                  <Badge variant="secondary" className="bg-[var(--color-brand)]/10 text-[var(--color-brand)] border border-[var(--color-brand)]/20 pr-1.5">
                    {t("table.water")}: {waterSourceFilter}
                    <FilterClearButton onClick={() => setWaterSourceFilter("all")} filterName={t("table.water")} className="ml-1.5" />
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
          <ComparisonBar data={charts.bySystem} color="var(--color-chart-2)" emptyStateProps={emptyStateProps} t={t} />
        </ChartCard>
        <ChartCard title={t("comparative.scoreByProductionType")} info={t("info.comparativeCharts")} height={getAdaptiveChartHeight(charts.byProductionType.length)} ariaLabel={`${t("comparative.scoreByProductionType")}. ${charts.byProductionType.length} ${t("comparative.groupsAriaSuffix")}`}>
          <ComparisonBar data={charts.byProductionType} color="var(--color-chart-1)" emptyStateProps={emptyStateProps} t={t} />
        </ChartCard>
      </div>

      {showAllCharts && (
        <>
          <div className="grid gap-6 lg:grid-cols-2">
            <ChartCard title={t("comparative.scoreByEducation")} info={t("info.comparativeCharts")} height={getAdaptiveChartHeight(charts.byEducation.length)} ariaLabel={`${t("comparative.scoreByEducation")}. ${charts.byEducation.length} ${t("comparative.groupsAriaSuffix")}`}>
              <ComparisonBar data={charts.byEducation} color="var(--color-chart-4)" emptyStateProps={emptyStateProps} t={t} />
            </ChartCard>
            <ChartCard title={t("comparative.scoreByMarket")} info={t("info.comparativeCharts")} height={getAdaptiveChartHeight(charts.byMarket.length)} ariaLabel={`${t("comparative.scoreByMarket")}. ${charts.byMarket.length} ${t("comparative.groupsAriaSuffix")}`}>
              <ComparisonBar data={charts.byMarket} color="var(--color-chart-7)" emptyStateProps={emptyStateProps} t={t} />
            </ChartCard>
          </div>

          <div className="grid gap-6 xl:grid-cols-2 2xl:grid-cols-3">
            <ChartCard title={t("comparative.scoreByYears")} info={t("info.comparativeCharts")} height={getAdaptiveChartHeight(charts.byYears.length)} ariaLabel={`${t("comparative.scoreByYears")}. ${charts.byYears.length} ${t("comparative.groupsAriaSuffix")}`}>
              <ComparisonBar data={charts.byYears} color="var(--color-chart-3)" emptyStateProps={emptyStateProps} t={t} />
            </ChartCard>
            <ChartCard title={t("comparative.scoreBySpecies")} info={t("info.comparativeCharts")} height={getAdaptiveChartHeight(charts.bySpecies.length)} ariaLabel={`${t("comparative.scoreBySpecies")}. ${charts.bySpecies.length} ${t("comparative.groupsAriaSuffix")}`}>
              <ComparisonBar data={charts.bySpecies} color="var(--color-chart-5)" emptyStateProps={emptyStateProps} t={t} />
            </ChartCard>
            <ChartCard title={t("comparative.scoreByWater")} info={t("info.comparativeCharts")} height={getAdaptiveChartHeight(charts.byWaterSource.length)} ariaLabel={`${t("comparative.scoreByWater")}. ${charts.byWaterSource.length} ${t("comparative.groupsAriaSuffix")}`}>
              <ComparisonBar data={charts.byWaterSource} color="var(--color-chart-6)" emptyStateProps={emptyStateProps} t={t} />
            </ChartCard>
          </div>
        </>
      )}

      <div className="flex justify-center">
        <button
          onClick={() => setShowAllCharts(!showAllCharts)}
          className="flex items-center gap-2 rounded-full border border-[var(--color-border-subtle)] bg-[var(--color-raised)] px-5 py-2.5 text-sm font-medium text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-surface-base)] hover:border-[var(--color-brand)]/40"
        >
          {showAllCharts ? t("comparative.hideAnalysis") : t("comparative.addAnalysis")}
        </button>
      </div>

      {/* Desktop heatmaps (md+) */}
      {isMdUp ? (
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="card-flat">
          <CardHeader className="pb-2">
            <InfoTitle title={t("comparative.riskMatrixExternal")} info={t("info.riskMatrix")} />
            <CardDescription>{t("comparative.riskMatrixLegend")}</CardDescription>
          </CardHeader>
          <CardContent className="h-[460px]">
            {externalHeatmap ? (
              <div role="img" aria-label={`${t("comparative.riskMatrixExternal")}. ${t("comparative.heatmapAriaSuffix")}`} className="h-full w-full">
                <EChartsChart option={externalHeatmap} emptyFallback={<EmptyChartState {...emptyStateProps} />} />
              </div>
            ) : (
              <EmptyChartState {...emptyStateProps} />
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
                <EChartsChart option={internalHeatmap} emptyFallback={<EmptyChartState {...emptyStateProps} />} />
              </div>
            ) : (
              <EmptyChartState {...emptyStateProps} />
            )}
          </CardContent>
        </Card>
      </div>
      ) : null}

      {/* Mobile: toggle between chart and scrollable table */}
      {!isMdUp ? (
      <div className="space-y-4">
        <div className="flex justify-center">
          <button
            onClick={() => setShowHeatmapAsList(!showHeatmapAsList)}
            className="flex items-center gap-2 rounded-full border border-[var(--color-border-subtle)] bg-[var(--color-raised)] px-4 py-2 text-sm font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-surface-base)]"
          >
            {showHeatmapAsList ? t("comparative.viewAsChart") : t("comparative.viewAsList")}
          </button>
        </div>
        {showHeatmapAsList ? (
          <>
            <MobileHeatmapTable facilities={filteredFacilities} side="external" title={t("comparative.riskMatrixExternal")} t={t} />
            <MobileHeatmapTable facilities={filteredFacilities} side="internal" title={t("comparative.riskMatrixInternal")} t={t} />
          </>
        ) : (
          <div className="grid gap-6">
            <Card className="card-flat">
              <CardHeader className="pb-2">
                <InfoTitle title={t("comparative.riskMatrixExternal")} info={t("info.riskMatrix")} />
                <CardDescription>{t("comparative.riskMatrixLegend")}</CardDescription>
              </CardHeader>
              <CardContent className="h-[460px]">
                {externalHeatmap ? (
                  <div role="img" aria-label={`${t("comparative.riskMatrixExternal")}. ${t("comparative.heatmapAriaSuffix")}`} className="h-full w-full">
                    <EChartsChart option={externalHeatmap} emptyFallback={<EmptyChartState {...emptyStateProps} />} />
                  </div>
                ) : (
                  <EmptyChartState {...emptyStateProps} />
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
                    <EChartsChart option={internalHeatmap} emptyFallback={<EmptyChartState {...emptyStateProps} />} />
                  </div>
                ) : (
                  <EmptyChartState {...emptyStateProps} />
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
      ) : null}

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
                      className="cursor-pointer hover:bg-[var(--color-surface-elevated)] focus-visible:bg-[var(--color-surface-elevated)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--color-brand)]"
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
                              ? "text-[var(--color-success)]"
                              : facility.score >= 50
                              ? "text-[var(--color-warning)]"
                              : "text-[var(--color-danger)]"
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
  emptyStateProps,
  t,
}: {
  data: { name: string; avgScore: number; count: number }[];
  color: string;
  emptyStateProps?: EmptyChartStateProps;
  t: (key: string) => string;
}) {
  const { colors } = useChartTheme();
  const barColor = resolveChartTokenColor(color, colors);

  const option = useMemo(
    () =>
      data.length > 0
        ? buildComparisonBarOption({
            data,
            barColor,
            colors,
            scoreLabel: t("table.score"),
          })
        : undefined,
    [data, barColor, colors, t],
  );

  if (data.length === 0) {
    return <EmptyChartState {...(emptyStateProps ?? {})} />;
  }

  return <EChartsChart option={option} />;
}
