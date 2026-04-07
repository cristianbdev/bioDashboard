import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, LabelList, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { BarChart3, ClipboardList, DoorOpen, Droplets, Filter, Gauge, Leaf, MapPin, Shield, Waves } from "lucide-react";
import { MapLibreFacilitiesMap } from "./MapLibreFacilitiesMap";
import { CoveragePill, MetricCard } from "./cards";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ChartCard,
  CHART_TOOLTIP_CURSOR,
  CHART_TOOLTIP_STYLE,
  getAdaptiveChartHeight,
  getAdaptiveVerticalBarLayout,
  truncateChartLabel,
  type ChartCardHeight,
} from "@/components/charts/chart-card";
import { EmptyChartState } from "@/components/charts/empty-chart-state";
import { useLocaleContext } from "@/context/LocaleContext";
import type { DashboardData, FacilitySummary } from "@/lib/kobo";
import { FloatingFilters } from "./floating-filters";

type Props = {
  data: DashboardData;
  t: (key: string) => string;
};

const CHART_PALETTE = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
  "var(--color-chart-6)",
  "var(--color-chart-7)",
  "var(--color-chart-8)",
];

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

function sectionColor(score: number) {
  if (score >= 70) return "var(--color-success)";
  if (score >= 50) return "var(--color-warning)";
  return "var(--color-danger)";
}

function riskLabelToBarColor(kind: "high" | "positive") {
  return kind === "high" ? "var(--color-danger)" : "var(--color-success)";
}

export function Overview({ data, t }: Props) {
  const { locale } = useLocaleContext();

  const [speciesFilter, setSpeciesFilter] = useState("all");
  const [systemFilter, setSystemFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  const hasActiveFilters = speciesFilter !== "all" || systemFilter !== "all" || locationFilter !== "all";

  const filteredFacilities = useMemo(() => {
    return data.facilities.filter((facility) => {
      if (speciesFilter !== "all" && facility.species !== speciesFilter) return false;
      if (systemFilter !== "all" && facility.productionSystem !== systemFilter) return false;
      const facilityLocation = facility.basedOn ?? facility.location;
      if (locationFilter !== "all" && facilityLocation !== locationFilter) return false;
      return true;
    });
  }, [data.facilities, speciesFilter, systemFilter, locationFilter]);

  const sectionAverages = useMemo(
    () => filteredSectionAverages(data.sectionAverages, filteredFacilities),
    [data.sectionAverages, filteredFacilities],
  );
  const sectionLongestLabel = sectionAverages.reduce((max, item) => Math.max(max, item.section.length), 0);
  const sectionLayout = getAdaptiveVerticalBarLayout(sectionAverages.length, sectionLongestLabel);

  const avgScore = average(filteredFacilities.map((f) => f.score));
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

  const speciesOptions = data.operations.bySpecies.map((item) => item.species).filter(Boolean);
  const systemOptions = data.operations.bySystem.map((item) => item.system).filter(Boolean);
  const locationOptions = data.operations.byLocation.map((item) => item.location).filter(Boolean);

  return (
    <div className="flex flex-col gap-8 pb-6">
      {/* Section 1: Filters + KPIs */}
      <section className="space-y-4">
        <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-end">
          <div>
            <h2 className="text-dashboard-title">{t("tabs.overview")}</h2>
            <p className="mt-1 text-dashboard-subtitle">Global biosecurity overview and analytics for all registered facilities.</p>
          </div>
          {/* Desktop filters */}
          <div className="hidden lg:block rounded-xl border-2 border-[var(--color-brand)]/20 bg-gradient-to-br from-white to-[var(--color-surface-base)] p-4 shadow-md">
            <div className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-[var(--color-brand)]">
              <Filter className="h-4 w-4" />
              <span>{t("overview.filters") || "Filters"}</span>
            </div>
            <div className="grid gap-3 lg:grid-cols-3">
              <FilterSelect value={speciesFilter} onChange={setSpeciesFilter} options={speciesOptions} placeholder={t("overview.filterSpecies")} label={t("overview.filterSpecies")} t={t} />
              <FilterSelect value={systemFilter} onChange={setSystemFilter} options={systemOptions} placeholder={t("overview.filterSystem")} label={t("overview.filterSystem")} t={t} />
              <FilterSelect value={locationFilter} onChange={setLocationFilter} options={locationOptions} placeholder={t("overview.filterLocation")} label={t("overview.filterLocation")} t={t} />
            </div>
            {hasActiveFilters && (
              <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-[var(--color-border-subtle)] pt-2">
                {speciesFilter !== "all" && <FilterPill label={`${t("overview.filterSpecies")}: ${speciesFilter}`} />}
                {systemFilter !== "all" && <FilterPill label={`${t("overview.filterSystem")}: ${systemFilter}`} />}
                {locationFilter !== "all" && <FilterPill label={`${t("overview.filterLocation")}: ${locationFilter}`} />}
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 text-xs text-[var(--color-brand)]"
                  onClick={() => { setSpeciesFilter("all"); setSystemFilter("all"); setLocationFilter("all"); }}
                >
                  {t("overview.clearAll")}
                </Button>
              </div>
            )}
          </div>
          {/* Mobile floating filters */}
          <FloatingFilters
            isOpen={isFiltersOpen}
            onOpen={() => setIsFiltersOpen(true)}
            onClose={() => setIsFiltersOpen(false)}
            filters={[
              { label: t("overview.filterSpecies"), activeValue: speciesFilter, allValue: "all", onClear: () => setSpeciesFilter("all") },
              { label: t("overview.filterSystem"), activeValue: systemFilter, allValue: "all", onClear: () => setSystemFilter("all") },
              { label: t("overview.filterLocation"), activeValue: locationFilter, allValue: "all", onClear: () => setLocationFilter("all") },
            ]}
            onClearAll={() => { setSpeciesFilter("all"); setSystemFilter("all"); setLocationFilter("all"); }}
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
              <MapLibreFacilitiesMap filteredFacilities={filteredFacilities} t={t} locale={locale} />
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
              emptyTitle={t("charts.noData")}
              emptySubtitle={t("charts.tryFilters")}
            />
          </div>
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
          {sectionAverages.length === 0 ? (
            <EmptyChartState title={t("charts.noData")} subtitle={t("charts.tryFilters")} />
          ) : (
            <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 500, height: 300 }}>
              <BarChart data={sectionAverages} layout="vertical" margin={{ top: 8, right: 24, left: 8, bottom: 8 }} barSize={sectionLayout.barSize}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--color-border-subtle)" />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12, fill: "var(--color-text-secondary)" }} axisLine={false} tickLine={false} />
                <YAxis
                  type="category"
                  dataKey="section"
                  width={sectionLayout.yAxisWidth}
                  tick={{ fontSize: 11, fill: "var(--color-text-primary)" }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip contentStyle={CHART_TOOLTIP_STYLE} cursor={CHART_TOOLTIP_CURSOR} />
                <Bar dataKey="score" radius={[0, 6, 6, 0]}>
                  {sectionAverages.map((entry) => (
                    <Cell key={entry.section} fill={sectionColor(entry.score)} />
                  ))}
                  <LabelList dataKey="score" position="right" fontSize={11} fill="var(--color-text-primary)" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </section>

      {/* Section 4: Risk Analysis */}
      <section className="grid gap-6 lg:grid-cols-2">
        <FactorList title={t("charts.highRiskFactors")} factors={topRiskFactors} color="high" t={t} />
        <FactorList title={t("charts.positiveFactors")} factors={topPositiveFactors} color="positive" t={t} />
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
        <h3 className="text-dashboard-section">{t("tabs.operational")}</h3>
        <div className="grid gap-6 md:grid-cols-2 2xl:grid-cols-3">
          <ChartBlock title={t("charts.scoreDistribution")} info={t("info.scoreDistribution")} data={scoreDistribution} labelKey="bucket" valueKey="count" t={t} />
          <ChartBlock title={t("charts.waterMonitoring")} info={t("info.waterMonitoring")} data={waterMonitoring} labelKey="label" valueKey="count" t={t} />
          <ChartBlock title={t("charts.mortalityDisposal")} info={t("info.mortalityDisposal")} data={mortalityDisposal} labelKey="method" valueKey="count" t={t} />
          <ChartBlock title={t("charts.intakeWaterTreatmentApplied")} info={t("info.intakeWaterTreatmentApplied")} data={intakeWaterTreatmentApplied} labelKey="label" valueKey="count" t={t} />
          <ChartBlock title={t("charts.waterParametersMeasured")} info={t("info.waterParametersMeasured")} data={waterParametersMeasured} labelKey="label" valueKey="count" t={t} />
          <ChartBlock title={t("charts.personalTraining")} info={t("info.personalTraining")} data={personnelTrainingTopics} labelKey="label" valueKey="count" t={t} />
          <ChartBlock title={t("charts.records")} info={t("info.records")} data={recordsCoverage} labelKey="label" valueKey="count" t={t} />
          <ChartBlock title={t("charts.sops")} info={t("info.sops")} data={sopsCoverage} labelKey="label" valueKey="count" t={t} />
        </div>
      </section>
    </div>
  );
}

function FilterSelect({ value, onChange, options, placeholder, label, t }: { value: string; onChange: (value: string) => void; options: string[]; placeholder: string; label: string; t: (key: string) => string }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-[var(--color-text-secondary)]">{label}</label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-10 w-full border-[var(--color-border-subtle)] bg-white text-[var(--color-text-primary)] hover:border-[var(--color-brand)]/40 focus:border-[var(--color-brand)] focus:ring-1 focus:ring-[var(--color-brand)]">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("overview.filterAll")}</SelectItem>
          {options.map((option) => (
            <SelectItem key={option} value={option}>{option}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function FilterPill({ label }: { label: string }) {
  return (
    <Badge variant="secondary" className="bg-[var(--color-surface-base)] text-[var(--color-text-secondary)]">
      {label}
    </Badge>
  );
}

function FactorList({ title, factors, color, t }: { title: string; factors: { factor: string; count: number }[]; color: "high" | "positive"; t: (key: string) => string }) {
  const barColor = riskLabelToBarColor(color);
  return (
    <Card className="card-flat">
      <CardContent className="space-y-4 p-5">
        <h4 className="text-base font-semibold text-[var(--color-text-primary)]">{title}</h4>
        {factors.length === 0 ? (
          <EmptyChartState title={t("charts.noData")} subtitle={t("charts.tryFilters")} />
        ) : (
          factors.map((item) => (
            <div key={item.factor} className="space-y-2">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="font-medium text-[var(--color-text-primary)]">{item.factor}</span>
                <Badge variant="outline" className="text-[var(--color-text-secondary)]">{item.count}</Badge>
              </div>
              <div className="h-2 rounded-full bg-[var(--color-surface-base)]">
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

function ChartBlock({ title, info, data, labelKey, valueKey, height, t }: { title: string; info?: string; data: Record<string, string | number>[]; labelKey: string; valueKey: string; height?: ChartCardHeight; t: (key: string) => string }) {
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
        emptyTitle={t("charts.noData")}
        emptySubtitle={t("charts.tryFilters")}
      />
    </ChartCard>
  );
}

function SimpleVerticalBar({ data, labelKey, valueKey, barColor, emptyTitle, emptySubtitle }: { data: Record<string, string | number>[]; labelKey: string; valueKey: string; barColor?: string; emptyTitle: string; emptySubtitle: string }) {
  if (data.length === 0) {
    return <EmptyChartState title={emptyTitle} subtitle={emptySubtitle} />;
  }

  const nonZeroData = data.filter((item) => Number(item[valueKey] ?? 0) > 0);
  const chartData = nonZeroData.length > 0 ? nonZeroData : data;
  const hasAnyValue = chartData.some((item) => Number(item[valueKey] ?? 0) > 0);

  if (!hasAnyValue) {
    return <EmptyChartState title={emptyTitle} subtitle={emptySubtitle} />;
  }

  const longestLabel = chartData.reduce((max, item) => {
    const label = String(item[labelKey] ?? "");
    return Math.max(max, label.length);
  }, 0);
  const layout = getAdaptiveVerticalBarLayout(chartData.length, longestLabel);

  return (
    <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 500, height: 300 }}>
      <BarChart data={chartData} layout="vertical" margin={{ top: 8, right: layout.rightMargin, left: layout.leftMargin ?? 8, bottom: 8 }} barSize={layout.barSize}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--color-border-subtle)" />
        <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: "var(--color-text-secondary)" }} axisLine={false} tickLine={false} />
        <YAxis
          type="category"
          dataKey={labelKey}
          width={layout.yAxisWidth}
          tick={{ fontSize: 11, fill: "var(--color-text-primary)" }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(value: string) => truncateChartLabel(value, 24)}
        />
        <Tooltip contentStyle={CHART_TOOLTIP_STYLE} cursor={CHART_TOOLTIP_CURSOR} />
        <Bar dataKey={valueKey} radius={[0, 4, 4, 0]}>
          {chartData.map((_, index) => (
            <Cell key={index} fill={barColor ?? CHART_PALETTE[index % CHART_PALETTE.length]} />
          ))}
          {layout.showValues ? <LabelList dataKey={valueKey} position="right" fontSize={11} fill="var(--color-text-primary)" /> : null}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function DonutChart({ data, labelKey, valueKey, emptyTitle, emptySubtitle }: { data: Record<string, string | number>[]; labelKey: string; valueKey: string; emptyTitle: string; emptySubtitle: string }) {
  if (data.length === 0) {
    return <EmptyChartState title={emptyTitle} subtitle={emptySubtitle} />;
  }

  const hasAnyValue = data.some((item) => Number(item[valueKey] ?? 0) > 0);
  if (!hasAnyValue) {
    return <EmptyChartState title={emptyTitle} subtitle={emptySubtitle} />;
  }

  const total = data.reduce((sum, item) => sum + Number(item[valueKey] ?? 0), 0);

  return (
    <div className="flex h-full w-full items-center justify-center">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius="55%"
            outerRadius="80%"
            paddingAngle={2}
            dataKey={valueKey}
            nameKey={labelKey}
            stroke="none"
          >
            {data.map((_, index) => (
              <Cell key={index} fill={CHART_PALETTE[index % CHART_PALETTE.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={CHART_TOOLTIP_STYLE}
            cursor={CHART_TOOLTIP_CURSOR}
            formatter={(value, name) => {
              const numericValue = typeof value === "number" ? value : Number(value ?? 0);
              return [`${numericValue} (${((numericValue / total) * 100).toFixed(1)}%)`, String(name)] as [string, string];
            }}
          />
          {/* Center label */}
          <text x="50%" y="46%" textAnchor="middle" dominantBaseline="middle" className="fill-[var(--color-text-primary)]" fontSize={28} fontWeight={700}>
            {total}
          </text>
          <text x="50%" y="56%" textAnchor="middle" dominantBaseline="middle" className="fill-[var(--color-text-secondary)]" fontSize={12}>
            Total
          </text>
        </PieChart>
      </ResponsiveContainer>
      {/* Legend below chart */}
      <div className="absolute bottom-2 left-0 right-0 flex flex-wrap justify-center gap-3 px-4">
        {data.map((item, index) => (
          <div key={index} className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: CHART_PALETTE[index % CHART_PALETTE.length] }} />
            <span className="text-xs text-[var(--color-text-secondary)]">{String(item[labelKey])}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
