import { useMemo, useState } from "react";
import { MapLibreFacilitiesMap } from "./MapLibreFacilitiesMap";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Droplets, Gauge, MapPin, Shield, Waves } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { DashboardData, FacilitySummary } from "@/lib/kobo";
import { CoveragePill, MetricCard } from "./cards";
import { InfoTitle } from "./info-title";



const SECTION_COLORS: Record<string, string> = {
  Environment: "#16a34a",
  Introduction: "#22c55e",
  Water: "#10b981",
  Fomites: "#059669",
  Biovectors: "#65a30d",
  Personnel: "#84cc16",
  Management: "#2563eb",
  Health: "#1d4ed8",
  VMP: "#0ea5e9",
  Equipment: "#3b82f6",
  SOP: "#60a5fa",
};

const SCORE_COLORS = ["#ef4444", "#f59e0b", "#eab308", "#22c55e", "#10b981"];

type Props = {
  data: DashboardData;
  t: (key: string) => string;
};

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return Math.round(values.reduce((acc, value) => acc + value, 0) / values.length);
}

function aggregateResponseValues(facilities: FacilitySummary[], key: keyof FacilitySummary["responses"]) {
  const map: Record<string, number> = {};
  facilities.forEach((facility) => {
    (facility.responses[key] ?? []).forEach((label) => {
      map[label] = (map[label] || 0) + 1;
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
      .map((facility) => facility.sectionScores.find((score) => score.section === item.section)?.score ?? 0)
      .filter((value) => value > 0);
    return {
      section: item.section,
      side: item.side,
      score: average(values),
    };
  });
}

export function Overview({ data, t }: Props) {
  const [speciesFilter, setSpeciesFilter] = useState<string>("all");
  const [systemFilter, setSystemFilter] = useState<string>("all");
  const [locationFilter, setLocationFilter] = useState<string>("all");

  // Keep charts visible without overflowing 3-column sections.
  const chartWidth = Math.max(260, Math.min(1024 - 80, 380));

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



  const externalAvg = average(filteredFacilities.map((facility) => facility.externalScore));
  const internalAvg = average(filteredFacilities.map((facility) => facility.internalScore));
  const avgScore = average(filteredFacilities.map((facility) => facility.score));
  const highRiskCount = filteredFacilities.filter((facility) => facility.riskLevel === "HIGH").length;
  const lowRiskCount = filteredFacilities.filter((facility) => facility.riskLevel === "LOW" || facility.riskLevel === "NEGLIGIBLE").length;

  const complianceMix = [
    { name: t("overview.external"), value: externalAvg, color: "#16a34a" },
    { name: t("overview.internal"), value: internalAvg, color: "#2563eb" },
  ];

  const scoreDistribution = [
    { bucket: "0-20", min: 0, max: 20 },
    { bucket: "21-40", min: 21, max: 40 },
    { bucket: "41-60", min: 41, max: 60 },
    { bucket: "61-80", min: 61, max: 80 },
    { bucket: "81-100", min: 81, max: 100 },
  ].map((bucket) => ({
    bucket: bucket.bucket,
    count: filteredFacilities.filter((facility) => facility.score >= bucket.min && facility.score <= bucket.max).length,
  }));

  const practices = [
    { id: "_2_7", label: t("coverage.quarantine"), icon: Shield, color: "#2563eb" },
    { id: "_11_1", label: t("coverage.biosecurityPlan"), icon: Shield, color: "#22c55e" },
    { id: "_4_9", label: t("coverage.noSharedEquipment"), icon: Gauge, color: "#0ea5e9" },
    { id: "_10_8", label: t("coverage.equipmentDisinfection"), icon: Gauge, color: "#f59e0b" },
    { id: "_3_4", label: t("coverage.waterTreatment"), icon: Droplets, color: "#14b8a6" },
    { id: "_5_2", label: t("coverage.biovectorInspection"), icon: Waves, color: "#ef4444" },
  ].map((practice) => ({
    ...practice,
    value: computeRate(filteredFacilities, practice.id),
  }));

  const highRiskFactors = aggregateFactors(filteredFacilities, "highRiskFactors");
  const positivePractices = aggregateFactors(filteredFacilities, "positivePractices");

  const waterMonitoring = aggregateResponseValues(filteredFacilities, "waterMonitoring");
  const mortalityDisposal = aggregateResponseValues(filteredFacilities, "mortalityDisposal").map((item) => ({
    method: item.label,
    count: item.count,
  }));
  const intakeWaterTreatmentApplied = aggregateResponseValues(filteredFacilities, "intakeWaterTreatmentApplied");
  const waterParametersMeasured = aggregateResponseValues(filteredFacilities, "waterParametersMeasured");
  const personnelTrainingTopics = aggregateResponseValues(filteredFacilities, "personnelTrainingTopics");
  const recordsCoverage = aggregateResponseValues(filteredFacilities, "recordsCoverage");
  const sopsCoverage = aggregateResponseValues(filteredFacilities, "sopsCoverage");

  const speciesOptions = data.operations.bySpecies.map((item) => item.species).filter(Boolean);
  const systemOptions = data.operations.bySystem.map((item) => item.system).filter(Boolean);
  const locationOptions = data.operations.byLocation.map((item) => item.location).filter(Boolean);

  return (
    <div className="space-y-6 min-w-0">
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <InfoTitle title={t("overview.filters")} info={t("info.overviewFilters")} />
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <Select value={speciesFilter} onValueChange={setSpeciesFilter}>
            <SelectTrigger>
              <SelectValue placeholder={t("overview.filterSpecies")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("overview.filterAll")}</SelectItem>
              {speciesOptions.map((value) => (
                <SelectItem key={value} value={value}>
                  {value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={systemFilter} onValueChange={setSystemFilter}>
            <SelectTrigger>
              <SelectValue placeholder={t("overview.filterSystem")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("overview.filterAll")}</SelectItem>
              {systemOptions.map((value) => (
                <SelectItem key={value} value={value}>
                  {value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={locationFilter} onValueChange={setLocationFilter}>
            <SelectTrigger>
              <SelectValue placeholder={t("overview.filterLocation")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("overview.filterAll")}</SelectItem>
              {locationOptions.map((value) => (
                <SelectItem key={value} value={value}>
                  {value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <InfoTitle title={t("charts.mapCoverage")} info={t("info.mapCoverage")} />
          <CardDescription>Mapa interactivo con cobertura de facilities</CardDescription>
        </CardHeader>
        <CardContent className="h-[420px] p-0 overflow-hidden">
          <MapLibreFacilitiesMap data={data} filteredFacilities={filteredFacilities} />
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard title={t("metrics.total.title")} value={filteredFacilities.length} subtitle={t("metrics.total.subtitle")} icon={MapPin} color="sky" />
        <MetricCard
          title={t("metrics.avg.title")}
          value={`${avgScore}/100`}
          subtitle={avgScore < 50 ? t("metrics.avg.subtitle.bad") : t("metrics.avg.subtitle.good")}
          icon={Gauge}
          color={avgScore >= 50 ? "emerald" : "amber"}
        />
        <MetricCard title={t("metrics.high.title")} value={highRiskCount} subtitle={t("metrics.high.subtitle")} icon={Shield} color="rose" />
        <MetricCard title={t("metrics.low.title")} value={lowRiskCount} subtitle={t("metrics.low.subtitle")} icon={Shield} color="emerald" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="border-0 shadow-sm lg:col-span-2">
          <CardHeader className="pb-2">
            <InfoTitle title={t("charts.sectionDetail")} info={t("info.sectionDetail")} />
          </CardHeader>
          <CardContent className="h-96">
            <ResponsiveContainer width={chartWidth} height="100%">
              <BarChart data={sectionAverages} layout="vertical" margin={{ left: 20, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: "#475569" }} />
                <YAxis type="category" dataKey="section" width={130} tick={{ fontSize: 11, fill: "#475569" }} />
                <Tooltip formatter={(value) => [`${value}/100`, t("table.score")]} />
                <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                  {sectionAverages.map((entry) => (
                    <Cell key={entry.section} fill={SECTION_COLORS[entry.section] ?? "#64748b"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <InfoTitle title={t("charts.externalInternalCompliance")} info={t("info.externalInternalCompliance")} />
          </CardHeader>
          <CardContent>
            <div className="h-56">
              <ResponsiveContainer width={chartWidth} height="100%">
                <PieChart>
                  <Pie data={complianceMix} dataKey="value" nameKey="name" outerRadius={90} innerRadius={50}>
                    {complianceMix.map((item) => (
                      <Cell key={item.name} fill={item.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value}/100`, t("table.score")]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2">
              {complianceMix.map((item) => (
                <div key={item.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-slate-700">{item.name}</span>
                  </div>
                  <span className="font-semibold text-slate-900">{item.value}/100</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <InfoTitle title={t("charts.practiceCoverage")} info={t("info.practiceCoverage")} />
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {practices.map((item) => (
            <CoveragePill key={item.id} label={item.label} value={item.value} icon={item.icon} color={item.color} />
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <InfoTitle title={t("charts.highRiskFactors")} info={t("info.topRiskFactors")} />
          </CardHeader>
          <CardContent className="space-y-2">
            {highRiskFactors.length > 0 ? (
              highRiskFactors.slice(0, 8).map((item) => (
                <div key={item.factor} className="flex items-center justify-between text-sm">
                  <span className="text-slate-700">{item.factor}</span>
                  <Badge variant="secondary">{item.count}</Badge>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">{t("facilities.noData")}</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <InfoTitle title={t("charts.positiveFactors")} info={t("info.topRiskFactors")} />
          </CardHeader>
          <CardContent className="space-y-2">
            {positivePractices.length > 0 ? (
              positivePractices.slice(0, 8).map((item) => (
                <div key={item.factor} className="flex items-center justify-between text-sm">
                  <span className="text-slate-700">{item.factor}</span>
                  <Badge variant="secondary">{item.count}</Badge>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">{t("facilities.noData")}</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartBlock title={t("charts.scoreDistribution")} info={t("info.scoreDistribution")} data={scoreDistribution} labelKey="bucket" valueKey="count" chartWidth={chartWidth} />
        <ChartBlock title={t("charts.waterMonitoring")} info={t("info.waterMonitoring")} data={waterMonitoring} labelKey="label" valueKey="count" chartWidth={chartWidth} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartBlock title={t("charts.mortalityDisposal")} info={t("info.mortalityDisposal")} data={mortalityDisposal} labelKey="method" valueKey="count" chartWidth={chartWidth} />
        <ChartBlock title={t("charts.intakeWaterTreatmentApplied")} info={t("info.intakeWaterTreatmentApplied")} data={intakeWaterTreatmentApplied} labelKey="label" valueKey="count" chartWidth={chartWidth} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <ChartBlock title={t("charts.waterParametersMeasured")} info={t("info.waterParametersMeasured")} data={waterParametersMeasured} labelKey="label" valueKey="count" chartWidth={chartWidth} />
        <ChartBlock title={t("charts.personalTraining")} info={t("info.personalTraining")} data={personnelTrainingTopics} labelKey="label" valueKey="count" chartWidth={chartWidth} />
        <ChartBlock title={t("charts.records")} info={t("info.records")} data={recordsCoverage} labelKey="label" valueKey="count" chartWidth={chartWidth} />
      </div>

      <ChartBlock title={t("charts.sops")} info={t("info.sops")} data={sopsCoverage} labelKey="label" valueKey="count" chartWidth={chartWidth} />
    </div>
  );
}

function ChartBlock({
  title,
  info,
  data,
  labelKey,
  valueKey,
  chartWidth,
}: {
  title: string;
  info?: string;
  data: Record<string, string | number>[];
  labelKey: string;
  valueKey: string;
  chartWidth: number;
}) {
  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-2">
        <InfoTitle title={title} info={info} />
      </CardHeader>
      <CardContent className="h-80">
        {data.length > 0 ? (
          <ResponsiveContainer width={chartWidth} height="100%">
            <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: "#475569" }} />
              <YAxis type="category" dataKey={labelKey} width={160} tick={{ fontSize: 11, fill: "#475569" }} />
              <Tooltip />
              <Bar dataKey={valueKey} radius={[0, 4, 4, 0]}>
                {data.map((_, idx) => (
                  <Cell key={`${title}-${idx}`} fill={SCORE_COLORS[idx % SCORE_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-slate-500">No data</div>
        )}
      </CardContent>
    </Card>
  );
}
