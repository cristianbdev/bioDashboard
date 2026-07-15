"use client";

import dynamic from "next/dynamic";
import { useMemo, useState, useEffect, useCallback, useRef } from "react";
import { BarChart3, ClipboardList, DoorOpen, Droplets, Gauge, Leaf, MapPin, Radar, Shield, Waves } from "lucide-react";
import { CoveragePill, MetricCard } from "./cards";
import { DashboardPageHeading } from "./dashboard-page-heading";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ChartCard, getAdaptiveChartHeight, getAdaptiveVerticalBarLayout, type ChartCardHeight } from "@/components/charts/chart-card";
import { EChartsChart } from "@/components/charts/echarts-chart";
import { useChartTheme } from "@/hooks/useChartTheme";
import { buildDonutOption, buildExternalInternalComparisonOption, buildSectionRadarOption, buildSectionScoreBarOption, buildVerticalBarOption } from "@/lib/chart-options";
import { buildNetworkRadarFromAverages } from "@/lib/chart-data/section-radar";
import type { AppRole } from "@/lib/access-control";
import { filterRestrictedMapPoints, type CityMapPoint } from "@/lib/map-privacy";
import type { ChartThemeColors } from "@/lib/chart-theme";
import { EmptyChartState, type EmptyChartStateProps } from "@/components/charts/empty-chart-state";
import { ChartDataTable } from "@/components/charts/chart-data-table";
import type { AppLocale } from "@/i18n/routing";
import type { DashboardData, FacilitySummary } from "@/lib/kobo";
import { translateSectionLabel } from "@/lib/section-labels";
import { DesktopFloatingFilter } from "./desktop-floating-filter";
import { FloatingFilters } from "./floating-filters";
import { BottomSheet } from "@/components/layout/bottom-sheet";
import { CollapsibleSection } from "@/components/ui/collapsible-section";

const MapLibreFacilitiesMap = dynamic(
  () => import("./MapLibreFacilitiesMap").then((mod) => mod.MapLibreFacilitiesMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full min-h-[320px] items-center justify-center rounded-xl border border-border bg-popover">
        <div className="h-10 w-10 animate-pulse rounded-full bg-[var(--color-border-subtle)]" aria-hidden />
      </div>
    ),
  },
);

export type FilterState = {
  speciesFilter: string;
  systemFilter: string;
  locationFilter: string;
  setSpeciesFilter: (value: string) => void;
  setSystemFilter: (value: string) => void;
  setLocationFilter: (value: string) => void;
  hasActiveFilters: boolean;
  clearAllFilters: () => void;
  speciesOptions: string[];
  systemOptions: string[];
  locationOptions: string[];
};

type Props = {
  data: DashboardData;
  t: (key: string) => string;
  locale: AppLocale;
  externalFilters?: FilterState;
  role?: AppRole;
};

function average(values: number[]) {
  if (values.length === 0) return 0;
  return Math.round(values.reduce((acc, value) => acc + value, 0) / values.length);
}

function aggregateResponseValues(facilities: FacilitySummary[], key: keyof FacilitySummary["responses"]) {
  const map: Record<string, number> = {};
  facilities.forEach((facility) => {
    (facility.responses[key] ?? []).forEach((label) => {
      if (label) map[label] = (map[label] || 0) + 1;
    });
  });
  return Object.entries(map)
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);
}

function computeRate(facilities: FacilitySummary[], id: string) {
  const statuses = facilities
    .map((facility) => facility.keyPractices.find((item) => item.id === id))
    .filter((item): item is NonNullable<typeof item> => Boolean(item));
  const applicable = statuses.filter((item) => item.applicable);
  if (applicable.length === 0) return 0;
  const matched = applicable.filter((item) => item.matched).length;
  return Math.round((matched / applicable.length) * 100);
}

function aggregateFactors(facilities: FacilitySummary[], key: "highRiskFactors" | "moderateRiskFactors" | "positivePractices") {
  const map: Record<string, number> = {};
  facilities.forEach((facility) => {
    facility[key].forEach((factor) => {
      map[factor] = (map[factor] || 0) + 1;
    });
  });
  return Object.entries(map)
    .map(([factor, count]) => ({ factor, count }))
    .sort((a, b) => b.count - a.count);
}

function filteredSectionAverages(base: DashboardData["sectionAverages"], facilities: FacilitySummary[]) {
  return base.map((item) => {
    const values = facilities
      .map((facility) => facility.sectionScores.find((score) => score.section === item.section)?.score ?? 0);
    return { section: item.section, side: item.side, score: average(values) };
  });
}

function sectionColor(score: number, colors: ChartThemeColors) {
  if (score >= 70) return colors.success;
  if (score >= 50) return colors.warning;
  return colors.danger;
}

function riskLabelToBarColor(kind: "high" | "positive") {
  return kind === "high" ? "var(--color-danger)" : "var(--color-success)";
}

export function useOverviewFilters(data: DashboardData): FilterState {
  const [speciesFilter, setSpeciesFilter] = useState("all");
  const [systemFilter, setSystemFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");

  const hasActiveFilters = speciesFilter !== "all" || systemFilter !== "all" || locationFilter !== "all";

  const clearAllFilters = useCallback(() => {
    setSpeciesFilter("all");
    setSystemFilter("all");
    setLocationFilter("all");
  }, []);

  const speciesOptions = useMemo(() => data.operations.bySpecies.map((item) => item.species).filter(Boolean), [data]);
  const systemOptions = useMemo(() => data.operations.bySystem.map((item) => item.system).filter(Boolean), [data]);
  const locationOptions = useMemo(() => data.operations.byLocation.map((item) => item.location).filter(Boolean), [data]);

  return {
    speciesFilter,
    systemFilter,
    locationFilter,
    setSpeciesFilter,
    setSystemFilter,
    setLocationFilter,
    hasActiveFilters,
    clearAllFilters,
    speciesOptions,
    systemOptions,
    locationOptions,
  };
}

export function Overview({ data, t, locale, externalFilters, role = "public" }: Props) {
  // Use external filters if provided (from parent), otherwise use internal state
  const internalFilters = useOverviewFilters(data);
  const filters = externalFilters ?? internalFilters;

  const {
    speciesFilter,
    systemFilter,
    locationFilter,
    setSpeciesFilter,
    setSystemFilter,
    setLocationFilter,
    hasActiveFilters,
    clearAllFilters,
    speciesOptions,
    systemOptions,
    locationOptions,
  } = filters;

  const [showDesktopFloating, setShowDesktopFloating] = useState(false);
  const headerRef = useRef<HTMLDivElement>(null);

  // Detect when header is not visible to show floating filter
  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        // Show floating filter when header is not intersecting (not visible)
        setShowDesktopFloating(!entry.isIntersecting);
      },
      {
        root: null,
        threshold: 0,
        rootMargin: "-50px 0px 0px 0px", // Trigger when header is 50px above viewport
      }
    );

    observer.observe(header);
    return () => observer.disconnect();
  }, []);

  const overviewFacilities = useMemo(
    () => data.overviewFacilities ?? data.facilities,
    [data.overviewFacilities, data.facilities],
  );

  const filteredFacilities = useMemo(() => {
    return overviewFacilities.filter((facility) => {
      if (speciesFilter !== "all" && facility.species !== speciesFilter) return false;
      if (systemFilter !== "all" && facility.productionSystem !== systemFilter) return false;
      const facilityLocation = facility.basedOn ?? facility.location;
      if (locationFilter !== "all" && facilityLocation !== locationFilter) return false;
      return true;
    });
  }, [overviewFacilities, speciesFilter, systemFilter, locationFilter]);

  const sectionAverages = useMemo(
    () => filteredSectionAverages(data.sectionAverages, filteredFacilities),
    [data.sectionAverages, filteredFacilities],
  );
  const translatedSectionAverages = useMemo(
    () => sectionAverages.map((item) => ({ ...item, section: translateSectionLabel(item.section, t) })),
    [sectionAverages, t],
  );
  const avgScore = average(filteredFacilities.map((f) => f.score));
  const avgExternalScore = average(filteredFacilities.map((f) => f.externalScore));
  const avgInternalScore = average(filteredFacilities.map((f) => f.internalScore));
  const restrictedCityPoints = useMemo<CityMapPoint[] | undefined>(() => {
    if (role === "admin" || !data.restrictedMapPoints) return undefined;
    return filterRestrictedMapPoints(data.restrictedMapPoints, filteredFacilities);
  }, [data.restrictedMapPoints, filteredFacilities, role]);
  const visibleProducerFacility = useMemo(() => {
    if (!data.producerMapFacility) return undefined;
    const isVisible = filteredFacilities.some((facility) => facility.id === data.producerMapFacility?.id);
    return isVisible ? data.producerMapFacility : undefined;
  }, [data.producerMapFacility, filteredFacilities]);
  const highRiskCount = filteredFacilities.filter((f) => f.riskLevel === "HIGH").length;
  const lowRiskCount = filteredFacilities.filter((f) => f.riskLevel === "LOW" || f.riskLevel === "NEGLIGIBLE").length;

  // Score Distribution - use pre-computed data.distribution when no filters
  const scoreDistribution = hasActiveFilters
    ? [
        { bucket: "0-20", min: 0, max: 20 },
        { bucket: "21-40", min: 21, max: 40 },
        { bucket: "41-60", min: 41, max: 60 },
        { bucket: "61-80", min: 61, max: 80 },
        { bucket: "81-100", min: 81, max: 100 },
      ].map((bucket) => ({
        bucket: bucket.bucket,
        count: filteredFacilities.filter((f) => f.score >= bucket.min && f.score <= bucket.max).length,
      }))
    : data.distribution;

  const practices = [
    { id: "_2_7", label: t("coverage.quarantine"), icon: Shield, color: "var(--color-chart-2)" },
    { id: "_11_1", label: t("coverage.biosecurityPlan"), icon: ClipboardList, color: "var(--color-chart-1)" },
    { id: "_4_9", label: t("coverage.noSharedEquipment"), icon: Gauge, color: "var(--color-chart-5)" },
    { id: "_10_8", label: t("coverage.equipmentDisinfection"), icon: DoorOpen, color: "var(--color-chart-3)" },
    { id: "_3_4", label: t("coverage.waterTreatment"), icon: Droplets, color: "var(--color-chart-2)" },
    { id: "_5_2", label: t("coverage.biovectorInspection"), icon: Waves, color: "var(--color-chart-6)" },
  ].map((practice) => ({
    ...practice,
    value: computeRate(filteredFacilities, practice.id),
  }));

  // Use pre-computed data.practices as primary source, only re-aggregate when filters are active
  const waterMonitoring = hasActiveFilters
    ? aggregateResponseValues(filteredFacilities, "waterMonitoring")
    : data.practices.waterMonitoring.map((x) => ({ label: x.label, count: x.count }));

  const mortalityDisposal = hasActiveFilters
    ? aggregateResponseValues(filteredFacilities, "mortalityDisposal").map((item) => ({ method: item.label, count: item.count }))
    : data.practices.mortalityDisposal.map((x) => ({ method: x.method, count: x.count }));

  const intakeWaterTreatmentApplied = hasActiveFilters
    ? aggregateResponseValues(filteredFacilities, "intakeWaterTreatmentApplied")
    : data.practices.intakeWaterTreatmentApplied.map((x) => ({ label: x.label, count: x.count }));

  const waterParametersMeasured = hasActiveFilters
    ? aggregateResponseValues(filteredFacilities, "waterParametersMeasured")
    : data.practices.waterParametersMeasured.map((x) => ({ label: x.label, count: x.count }));

  const personnelTrainingTopics = hasActiveFilters
    ? aggregateResponseValues(filteredFacilities, "personnelTrainingTopics")
    : data.practices.personnelTrainingTopics.map((x) => ({ label: x.label, count: x.count }));

  const recordsCoverage = hasActiveFilters
    ? aggregateResponseValues(filteredFacilities, "recordsCoverage")
    : data.practices.recordsCoverage.map((x) => ({ label: x.label, count: x.count }));

  const sopsCoverage = hasActiveFilters
    ? aggregateResponseValues(filteredFacilities, "sopsCoverage")
    : data.practices.sopsCoverage.map((x) => ({ label: x.label, count: x.count }));

  const topRiskFactors = hasActiveFilters
    ? aggregateFactors(filteredFacilities, "highRiskFactors").slice(0, 5)
    : data.highRiskFactors.slice(0, 5);
  const topPositiveFactors = hasActiveFilters
    ? aggregateFactors(filteredFacilities, "positivePractices").slice(0, 5)
    : data.positivePractices.slice(0, 5);

  const emptyStateProps: EmptyChartStateProps = filteredFacilities.length === 0 ? {
    title: t("charts.noData"),
    subtitle: t("charts.tryFilters"),
    blockingFilters: [
      ...(speciesFilter !== "all" ? [{ label: t("overview.filterSpecies"), value: speciesFilter, onClear: () => setSpeciesFilter("all") }] : []),
      ...(systemFilter !== "all" ? [{ label: t("overview.filterSystem"), value: systemFilter, onClear: () => setSystemFilter("all") }] : []),
      ...(locationFilter !== "all" ? [{ label: t("overview.filterLocation"), value: locationFilter, onClear: () => setLocationFilter("all") }] : []),
    ],
    onClearAll: clearAllFilters,
  } : { title: t("charts.noData"), subtitle: t("charts.tryFilters") };

  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  return (
    <div className="flex flex-col gap-8 pb-6">
      {/* Section 1: Header + KPIs - This ref is used to detect scroll */}
      <section ref={headerRef} className="space-y-4">
        <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-end">
          <DashboardPageHeading title={t("tabs.overview")} subtitle={t("overview.subtitle")} />
          {/* Mobile floating filters button */}
          <button
            type="button"
            onClick={() => setIsMobileFiltersOpen(true)}
            aria-label={t("overview.openFilters")}
            className="btn-brand flex min-h-11 items-center gap-2 rounded-full px-4 py-2.5 shadow-lg lg:hidden"
          >
            <span className="text-sm font-medium">{t("overview.filters")}</span>
            {hasActiveFilters && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-card text-xs font-bold text-primary">
                {[speciesFilter, systemFilter, locationFilter].filter(f => f !== "all").length}
              </span>
            )}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard title={t("metrics.total.title")} value={filteredFacilities.length} subtitle={t("metrics.total.subtitle")} icon={MapPin} color="sky" />
          <MetricCard
            title={t("metrics.avg.title")}
            value={`${avgScore}/100`}
            subtitle={avgScore < 50 ? t("metrics.avg.subtitle.bad") : t("metrics.avg.subtitle.good")}
            icon={Gauge}
            color={avgScore >= 50 ? "emerald" : "amber"}
          />
          <MetricCard title={t("metrics.high.title")} value={highRiskCount} subtitle={t("metrics.high.subtitle")} icon={Shield} color="rose" />
          <MetricCard title={t("metrics.low.title")} value={lowRiskCount} subtitle={t("metrics.low.subtitle")} icon={Leaf} color="emerald" />
        </div>
      </section>

      {/* Section 2: Map + Score Distribution */}
      <section className="grid gap-6 xl:grid-cols-3">
        <Card className="card-flat xl:col-span-2">
          <CardContent className="p-3 sm:p-4">
            <div className="h-[320px] sm:h-[360px] md:h-[420px] lg:h-[460px] xl:h-[480px]">
              <MapLibreFacilitiesMap
                filteredFacilities={filteredFacilities}
                restrictedCityPoints={restrictedCityPoints}
                producerOwnFacility={visibleProducerFacility}
                t={t}
                locale={locale}
                role={role}
              />
            </div>
          </CardContent>
        </Card>
        <ChartCard
          title={t("charts.scoreDistribution")}
          info={t("info.scoreDistribution")}
          icon={<BarChart3 className="h-4 w-4" />}
          height="md"
          ariaLabel={`${t("charts.scoreDistribution")}. ${scoreDistribution.length} buckets.`}
        >
          <div className="relative h-full w-full">
            <DonutChart
              data={scoreDistribution}
              labelKey="bucket"
              valueKey="count"
              emptyTitle={emptyStateProps.title}
              emptySubtitle={emptyStateProps.subtitle}
              blockingFilters={emptyStateProps.blockingFilters}
              onClearAll={emptyStateProps.onClearAll}
              caption={t("charts.scoreDistribution")}
              t={t}
            />
          </div>
        </ChartCard>
      </section>

      {/* Section 2b: External vs Internal + Radar charts */}
      <section className="grid gap-6 lg:grid-cols-2 2xl:grid-cols-3">
        <ChartCard
          title={t("charts.externalInternalCompliance")}
          info={t("info.externalInternalCompliance")}
          icon={<BarChart3 className="h-4 w-4" />}
          height="md"
          className="xl:col-span-1"
          ariaLabel={t("charts.externalInternalCompliance")}
        >
          <ExternalInternalChart
            externalScore={avgExternalScore}
            internalScore={avgInternalScore}
            emptyStateProps={emptyStateProps}
            t={t}
          />
        </ChartCard>
        <ChartCard
          title={t("charts.sectionRadarExternal")}
          info={t("info.sectionRadarExternal")}
          icon={<Radar className="h-4 w-4" />}
          height="md"
          ariaLabel={t("charts.sectionRadarExternal")}
        >
          <SectionRadarChart
            sectionAverages={sectionAverages}
            side="external"
            seriesName={t("overview.external")}
            emptyStateProps={emptyStateProps}
            t={t}
          />
        </ChartCard>
        <ChartCard
          title={t("charts.sectionRadarInternal")}
          info={t("info.sectionRadarInternal")}
          icon={<Radar className="h-4 w-4" />}
          height="md"
          ariaLabel={t("charts.sectionRadarInternal")}
        >
          <SectionRadarChart
            sectionAverages={sectionAverages}
            side="internal"
            seriesName={t("overview.internal")}
            emptyStateProps={emptyStateProps}
            t={t}
          />
        </ChartCard>
      </section>

      {/* Section 3: Section Detail (bar chart) */}
      <section>
        <ChartCard
          title={t("charts.sectionDetail")}
          info={t("info.sectionDetail")}
          icon={<BarChart3 className="h-4 w-4" />}
          height="xl"
          ariaLabel={`${t("charts.sectionDetail")}. ${sectionAverages.length} sections.`}
        >
          {translatedSectionAverages.length === 0 ? (
            <EmptyChartState {...emptyStateProps} />
          ) : (
            <SectionScoresChart data={translatedSectionAverages} caption={t("charts.sectionDetail")} t={t} />
          )}
        </ChartCard>
      </section>

      {/* Section 4: Risk Analysis */}
      <section className="grid gap-6 lg:grid-cols-2">
        <FactorList title={t("charts.highRiskFactors")} factors={topRiskFactors} color="high" emptyStateProps={emptyStateProps} t={t} />
        <FactorList title={t("charts.positiveFactors")} factors={topPositiveFactors} color="positive" emptyStateProps={emptyStateProps} t={t} />
      </section>

      {/* Section 5: Practice Coverage */}
      <section className="space-y-4">
        <h3 className="text-dashboard-section">{t("charts.practiceCoverage")}</h3>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {practices.map((item) => (
            <CoveragePill key={item.id} label={item.label} value={item.value} icon={item.icon} color={item.color} />
          ))}
        </div>
      </section>

      {/* Section 6: Operational Charts */}
      <section className="space-y-4">
        <CollapsibleSection title={t("tabs.operational")} defaultOpen={false}>
          <div className="grid gap-6 md:grid-cols-2 2xl:grid-cols-3">
      <ChartBlock title={t("charts.waterMonitoring")} info={t("info.waterMonitoring")} data={waterMonitoring} labelKey="label" valueKey="count" emptyStateProps={emptyStateProps} t={t} caption={t("charts.waterMonitoring")} />
            <ChartBlock title={t("charts.mortalityDisposal")} info={t("info.mortalityDisposal")} data={mortalityDisposal} labelKey="method" valueKey="count" emptyStateProps={emptyStateProps} t={t} caption={t("charts.mortalityDisposal")} />
            <ChartBlock title={t("charts.intakeWaterTreatmentApplied")} info={t("info.intakeWaterTreatmentApplied")} data={intakeWaterTreatmentApplied} labelKey="label" valueKey="count" emptyStateProps={emptyStateProps} t={t} caption={t("charts.intakeWaterTreatmentApplied")} />
            <ChartBlock title={t("charts.waterParametersMeasured")} info={t("info.waterParametersMeasured")} data={waterParametersMeasured} labelKey="label" valueKey="count" emptyStateProps={emptyStateProps} t={t} caption={t("charts.waterParametersMeasured")} />
            <ChartBlock title={t("charts.personalTraining")} info={t("info.personalTraining")} data={personnelTrainingTopics} labelKey="label" valueKey="count" emptyStateProps={emptyStateProps} t={t} caption={t("charts.personalTraining")} />
            <ChartBlock title={t("charts.records")} info={t("info.records")} data={recordsCoverage} labelKey="label" valueKey="count" emptyStateProps={emptyStateProps} t={t} caption={t("charts.records")} />
            <ChartBlock title={t("charts.sops")} info={t("info.sops")} data={sopsCoverage} labelKey="label" valueKey="count" emptyStateProps={emptyStateProps} t={t} caption={t("charts.sops")} />
          </div>
        </CollapsibleSection>
      </section>

      {/* Mobile floating filter button - shown on scroll when header not visible */}
      <button
        type="button"
        onClick={() => setIsMobileFiltersOpen(true)}
        className={`btn-brand lg:hidden fixed bottom-20 right-4 z-40 flex min-h-11 items-center gap-2 rounded-full px-4 py-2 shadow-lg transition-all duration-300 ${
          showDesktopFloating ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"
        }`}
        aria-label={t("overview.openFilters")}
      >
        <span className="text-sm font-medium">{t("overview.filters")}</span>
        {hasActiveFilters && (
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-card text-xs font-bold text-primary">
            {[speciesFilter, systemFilter, locationFilter].filter((f) => f !== "all").length}
          </span>
        )}
      </button>


      {/* Mobile Filters Bottom Sheet */}
      <BottomSheet
        isOpen={isMobileFiltersOpen}
        onClose={() => setIsMobileFiltersOpen(false)}
        title={t("overview.filters")}
        closeLabel={t("navigation.closeMenu")}
      >
        <FloatingFilters
          isOpen={isMobileFiltersOpen}
          onOpen={() => setIsMobileFiltersOpen(true)}
          onClose={() => setIsMobileFiltersOpen(false)}
          filters={[
            { label: t("overview.filterSpecies"), activeValue: speciesFilter, allValue: "all", onClear: () => setSpeciesFilter("all") },
            { label: t("overview.filterSystem"), activeValue: systemFilter, allValue: "all", onClear: () => setSystemFilter("all") },
            { label: t("overview.filterLocation"), activeValue: locationFilter, allValue: "all", onClear: () => setLocationFilter("all") },
          ]}
          onClearAll={clearAllFilters}
          speciesFilter={speciesFilter}
          systemFilter={systemFilter}
          locationFilter={locationFilter}
          speciesOptions={speciesOptions}
          systemOptions={systemOptions}
          locationOptions={locationOptions}
          speciesPlaceholder={t("overview.filterSpecies")}
          systemPlaceholder={t("overview.filterSystem")}
          locationPlaceholder={t("overview.filterLocation")}
          setSpeciesFilter={setSpeciesFilter}
          setSystemFilter={setSystemFilter}
          setLocationFilter={setLocationFilter}
          t={t}
        />
      </BottomSheet>

      {/* Desktop Floating Filter */}
      <DesktopFloatingFilter
        isVisible={showDesktopFloating}
        filters={[
          { label: t("overview.filterSpecies"), activeValue: speciesFilter, allValue: "all", onClear: () => setSpeciesFilter("all") },
          { label: t("overview.filterSystem"), activeValue: systemFilter, allValue: "all", onClear: () => setSystemFilter("all") },
          { label: t("overview.filterLocation"), activeValue: locationFilter, allValue: "all", onClear: () => setLocationFilter("all") },
        ]}
        selectControls={[
          { id: "species", value: speciesFilter, options: speciesOptions, placeholder: t("overview.filterSpecies"), onChange: setSpeciesFilter },
          { id: "system", value: systemFilter, options: systemOptions, placeholder: t("overview.filterSystem"), onChange: setSystemFilter },
          { id: "location", value: locationFilter, options: locationOptions, placeholder: t("overview.filterLocation"), onChange: setLocationFilter },
        ]}
        onClearAll={clearAllFilters}
        activeCount={[speciesFilter, systemFilter, locationFilter].filter((f) => f !== "all").length}
        labels={{
          title: t("overview.filters"),
          openButton: t("overview.filters"),
          openButtonAria: t("overview.openFilters"),
          activeFilters: t("overview.activeFilters"),
          filterAll: t("overview.filterAll"),
          close: t("navigation.closeMenu"),
          clearAll: t("overview.clearAll"),
        }}
      />
    </div>
  );
}

function FactorList({ title, factors, color, emptyStateProps, t }: { title: string; factors: { factor: string; count: number }[]; color: "high" | "positive"; emptyStateProps?: EmptyChartStateProps; t: (key: string) => string }) {
  const barColor = riskLabelToBarColor(color);
  return (
    <Card className="card-flat">
      <CardContent className="space-y-4 p-5">
        <h4 className="text-base font-semibold text-foreground">{title}</h4>
        {factors.length === 0 ? (
          <EmptyChartState title={emptyStateProps?.title ?? t("charts.noData")} subtitle={emptyStateProps?.subtitle ?? t("charts.tryFilters")} blockingFilters={emptyStateProps?.blockingFilters} onClearAll={emptyStateProps?.onClearAll} />
        ) : (
          factors.map((item) => (
            <div key={item.factor} className="space-y-2">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="font-medium text-foreground">{item.factor}</span>
                <Badge variant="outline" className="text-muted-foreground">{item.count}</Badge>
              </div>
              <div className="h-2 rounded-full bg-background">
                <div
                  className="h-2 rounded-full"
                  style={{ width: `${(item.count / (factors[0]?.count || 1)) * 100}%`, backgroundColor: barColor }}
                />
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function ChartBlock({ title, info, data, labelKey, valueKey, height, emptyStateProps, t, caption }: { title: string; info?: string; data: Record<string, string | number>[]; labelKey: string; valueKey: string; height?: ChartCardHeight; emptyStateProps?: EmptyChartStateProps; t: (key: string) => string; caption?: string }) {
  const nonZeroCount = data.filter((item) => Number(item[valueKey] ?? 0) > 0).length;
  const effectiveCount = nonZeroCount > 0 ? nonZeroCount : data.length;

  return (
    <ChartCard
      title={title}
      info={info}
      icon={<BarChart3 className="h-4 w-4" />}
      height={height ?? getAdaptiveChartHeight(effectiveCount)}
      ariaLabel={`${title}. ${effectiveCount} categories.`}
    >
      <SimpleVerticalBar
        data={data}
        labelKey={labelKey}
        valueKey={valueKey}
        emptyTitle={emptyStateProps?.title ?? t("charts.noData")}
        emptySubtitle={emptyStateProps?.subtitle ?? t("charts.tryFilters")}
        blockingFilters={emptyStateProps?.blockingFilters}
        onClearAll={emptyStateProps?.onClearAll}
        caption={caption}
        t={t}
      />
    </ChartCard>
  );
}

function SectionScoresChart({ data, caption, t }: { data: { section: string; score: number }[]; caption?: string; t: (key: string) => string }) {
  const { colors } = useChartTheme();
  const option = useMemo(
    () =>
      buildSectionScoreBarOption({
        data,
        colors,
        getBarColor: (score) => sectionColor(score, colors),
      }),
    [data, colors],
  );

  return (
    <>
      <EChartsChart option={option} />
      {caption && (
        <ChartDataTable
          caption={caption}
          headers={[t("charts.chartDataTableSection"), t("charts.chartDataTableScore")]}
          rows={data.map((d) => [d.section, d.score])}
        />
      )}
    </>
  );
}

function SimpleVerticalBar({ data, labelKey, valueKey, barColor, emptyTitle, emptySubtitle, blockingFilters, onClearAll, caption, t }: { data: Record<string, string | number>[]; labelKey: string; valueKey: string; barColor?: string; emptyTitle?: string; emptySubtitle?: string; blockingFilters?: EmptyChartStateProps["blockingFilters"]; onClearAll?: EmptyChartStateProps["onClearAll"]; caption?: string; t: (key: string) => string }) {
  const { colors } = useChartTheme();

  const nonZeroData = data.filter((item) => Number(item[valueKey] ?? 0) > 0);
  const chartData = nonZeroData.length > 0 ? nonZeroData : data;
  const hasAnyValue = chartData.some((item) => Number(item[valueKey] ?? 0) > 0);

  const longestLabel = chartData.reduce((max, item) => {
    const label = String(item[labelKey] ?? "");
    return Math.max(max, label.length);
  }, 0);
  const layout = getAdaptiveVerticalBarLayout(chartData.length, longestLabel);

  const option = useMemo(
    () =>
      buildVerticalBarOption({
        data: chartData,
        labelKey,
        valueKey,
        colors,
        barColor,
        showValueLabels: layout.showValues,
        allowDecimals: false,
        domainMax: Math.max(...chartData.map((item) => Number(item[valueKey] ?? 0)), 1) * 1.1,
      }),
    [chartData, labelKey, valueKey, colors, barColor, layout.showValues],
  );

  if (data.length === 0) {
    return <EmptyChartState title={emptyTitle} subtitle={emptySubtitle} blockingFilters={blockingFilters} onClearAll={onClearAll} />;
  }

  if (!hasAnyValue) {
    return <EmptyChartState title={emptyTitle} subtitle={emptySubtitle} blockingFilters={blockingFilters} onClearAll={onClearAll} />;
  }

  return (
    <>
      <EChartsChart option={option} />
      {caption && (
        <ChartDataTable
          caption={caption}
          headers={[t("charts.chartDataTableLabel"), t("charts.chartDataTableValue")]}
          rows={data.map((item) => [String(item[labelKey]), Number(item[valueKey])])}
        />
      )}
    </>
  );
}

function DonutChart({ data, labelKey, valueKey, emptyTitle, emptySubtitle, blockingFilters, onClearAll, caption, t }: { data: Record<string, string | number>[]; labelKey: string; valueKey: string; emptyTitle?: string; emptySubtitle?: string; blockingFilters?: EmptyChartStateProps["blockingFilters"]; onClearAll?: EmptyChartStateProps["onClearAll"]; caption?: string; t: (key: string) => string }) {
  const { colors } = useChartTheme();
  const hasAnyValue = data.some((item) => Number(item[valueKey] ?? 0) > 0);

  const option = useMemo(
    () =>
      buildDonutOption({
        data,
        labelKey,
        valueKey,
        colors,
        totalLabel: "Total",
      }),
    [data, labelKey, valueKey, colors],
  );

  if (data.length === 0) {
    return <EmptyChartState title={emptyTitle} subtitle={emptySubtitle} blockingFilters={blockingFilters} onClearAll={onClearAll} />;
  }

  if (!hasAnyValue) {
    return <EmptyChartState title={emptyTitle} subtitle={emptySubtitle} blockingFilters={blockingFilters} onClearAll={onClearAll} />;
  }

  return (
    <div className="flex h-full w-full flex-col">
      <div className="min-h-0 flex-1">
        <EChartsChart option={option} />
      </div>
      <div className="flex shrink-0 flex-wrap justify-center gap-x-3 gap-y-1.5 px-2 py-2">
        {data.map((item, index) => (
          <div key={index} className="flex items-center gap-1.5">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: colors.chart[index % colors.chart.length] }}
            />
            <span className="whitespace-nowrap text-xs text-muted-foreground">{String(item[labelKey])}</span>
          </div>
        ))}
      </div>
      {caption && (
        <ChartDataTable
          caption={caption}
          headers={[t("charts.chartDataTableLabel"), t("charts.chartDataTableCount")]}
          rows={data.map((item) => [String(item[labelKey]), Number(item[valueKey])])}
        />
      )}
    </div>
  );
}

function ExternalInternalChart({
  externalScore,
  internalScore,
  emptyStateProps,
  t,
}: {
  externalScore: number;
  internalScore: number;
  emptyStateProps: EmptyChartStateProps;
  t: (key: string) => string;
}) {
  const { colors } = useChartTheme();
  const option = useMemo(
    () =>
      buildExternalInternalComparisonOption({
        externalScore,
        internalScore,
        colors,
        externalLabel: t("overview.external"),
        internalLabel: t("overview.internal"),
      }),
    [colors, externalScore, internalScore, t],
  );

  if (externalScore === 0 && internalScore === 0) {
    return <EmptyChartState {...emptyStateProps} />;
  }

  return (
    <>
      <EChartsChart option={option} />
      <ChartDataTable
        caption={t("charts.externalInternalCompliance")}
        headers={[t("charts.chartDataTableLabel"), t("charts.chartDataTableScore")]}
        rows={[
          [t("overview.external"), externalScore],
          [t("overview.internal"), internalScore],
        ]}
      />
    </>
  );
}

function SectionRadarChart({
  sectionAverages,
  side,
  seriesName,
  emptyStateProps,
  t,
}: {
  sectionAverages: DashboardData["sectionAverages"];
  side: "external" | "internal";
  seriesName: string;
  emptyStateProps: EmptyChartStateProps;
  t: (key: string) => string;
}) {
  const { colors } = useChartTheme();
  const radarData = useMemo(
    () => buildNetworkRadarFromAverages(sectionAverages, side, t, seriesName),
    [sectionAverages, side, seriesName, t],
  );
  const option = useMemo(() => buildSectionRadarOption({ data: radarData, colors }), [radarData, colors]);

  if (sectionAverages.length === 0) {
    return <EmptyChartState {...emptyStateProps} />;
  }

  return (
    <>
      <EChartsChart option={option} />
      <ChartDataTable
        caption={side === "external" ? t("charts.sectionRadarExternal") : t("charts.sectionRadarInternal")}
        headers={[t("charts.chartDataTableSection"), t("charts.chartDataTableScore")]}
        rows={radarData.indicators.map((indicator, index) => [indicator.name, radarData.series[0]?.values[index] ?? 0])}
      />
    </>
  );
}
