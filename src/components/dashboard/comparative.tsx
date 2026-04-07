import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  ChartCard,
  CHART_TOOLTIP_CURSOR,
  CHART_TOOLTIP_STYLE,
  getAdaptiveChartHeight,
  truncateChartLabel,
} from "@/components/charts/chart-card";
import { EmptyChartState } from "@/components/charts/empty-chart-state";
import type { DashboardData, FacilitySummary } from "@/lib/kobo";
import { RiskBadge } from "./cards";
import { InfoTitle } from "./info-title";

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
) {
  type HeatmapTooltipParam = {
    data: [number, number, number, number];
  };

  const rows = facilities.flatMap((facility) =>
    facility.sectionScores
      .filter((section) => section.side === side)
      .map((section) => ({
        facility: facility.name,
        subcategory: section.section,
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
      textStyle: { fontSize: 14, fontWeight: 600, color: "#334155" },
    },
    tooltip: {
      position: "top",
      formatter: (params: HeatmapTooltipParam) => {
        const facility = facilitiesAxis[params.data[0]];
        const subcategory = subcategoriesAxis[params.data[1]];
        const score = params.data[3];
        const status = params.data[2] ? t("status.compliant") : t("status.nonCompliant");
        return `${facility}<br/>${subcategory}<br/>${t("table.score")}: ${score}/100<br/>${status}`;
      },
    },
    grid: { top: 56, left: 90, right: 20, bottom: 80 },
    xAxis: {
      type: "category",
      data: facilitiesAxis,
      axisLabel: { rotate: 40, fontSize: 10, color: "#475569" },
      splitArea: { show: true },
    },
    yAxis: {
      type: "category",
      data: subcategoriesAxis,
      axisLabel: { fontSize: 11, color: "#475569" },
      splitArea: { show: true },
    },
    visualMap: {
      min: 0,
      max: 1,
      orient: "horizontal",
      left: "center",
      bottom: 12,
      precision: 0,
      text: [t("status.compliant"), t("status.nonCompliant")],
      inRange: { color: ["#ef4444", "#16a34a"] },
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
  const [locationFilter, setLocationFilter] = useState<string>("all");
  const [productionTypeFilter, setProductionTypeFilter] = useState<string>("all");
  const [systemFilter, setSystemFilter] = useState<string>("all");
  const [speciesFilter, setSpeciesFilter] = useState<string>("all");
  const [waterSourceFilter, setWaterSourceFilter] = useState<string>("all");
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
    () => buildHeatmapOption(filteredFacilities, "external", t("comparative.riskMatrixExternal"), t),
    [filteredFacilities, t],
  );
  const internalHeatmap = useMemo(
    () => buildHeatmapOption(filteredFacilities, "internal", t("comparative.riskMatrixInternal"), t),
    [filteredFacilities, t],
  );

  const locationOptions = data.operations.byLocation.map((item) => item.location).filter(Boolean);
  const productionTypeOptions = data.operations.byProductionType.map((item) => item.type).filter(Boolean);
  const systemOptions = data.operations.bySystem.map((item) => item.system).filter(Boolean);
  const speciesOptions = data.operations.bySpecies.map((item) => item.species).filter(Boolean);
  const waterSourceOptions = data.operations.byWaterSource.map((item) => item.source).filter(Boolean);

  return (
    <div className="space-y-6 min-w-0">
      <Card className="card-flat">
        <CardHeader className="pb-2">
          <InfoTitle title={t("comparative.filters")} info={t("info.comparativeFilters")} />
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
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

          <Select value={productionTypeFilter} onValueChange={setProductionTypeFilter}>
            <SelectTrigger>
              <SelectValue placeholder={t("table.productionType")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("overview.filterAll")}</SelectItem>
              {productionTypeOptions.map((value) => (
                <SelectItem key={value} value={value}>
                  {value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={systemFilter} onValueChange={setSystemFilter}>
            <SelectTrigger>
              <SelectValue placeholder={t("table.system")} />
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

          <Select value={speciesFilter} onValueChange={setSpeciesFilter}>
            <SelectTrigger>
              <SelectValue placeholder={t("table.species")} />
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

          <Select value={waterSourceFilter} onValueChange={setWaterSourceFilter}>
            <SelectTrigger>
              <SelectValue placeholder={t("table.water")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("overview.filterAll")}</SelectItem>
              {waterSourceOptions.map((value) => (
                <SelectItem key={value} value={value}>
                  {value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title={t("comparative.scoreBySystem")} info={t("info.comparativeCharts")} height={getAdaptiveChartHeight(charts.bySystem.length)}>
          <ComparisonBar data={charts.bySystem} color="var(--color-chart-2)" />
        </ChartCard>
        <ChartCard title={t("comparative.scoreByProductionType")} info={t("info.comparativeCharts")} height={getAdaptiveChartHeight(charts.byProductionType.length)}>
          <ComparisonBar data={charts.byProductionType} color="var(--color-chart-1)" />
        </ChartCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title={t("comparative.scoreByEducation")} info={t("info.comparativeCharts")} height={getAdaptiveChartHeight(charts.byEducation.length)}>
          <ComparisonBar data={charts.byEducation} color="var(--color-chart-4)" />
        </ChartCard>
        <ChartCard title={t("comparative.scoreByMarket")} info={t("info.comparativeCharts")} height={getAdaptiveChartHeight(charts.byMarket.length)}>
          <ComparisonBar data={charts.byMarket} color="var(--color-chart-7)" />
        </ChartCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-2 2xl:grid-cols-3">
        <ChartCard title={t("comparative.scoreByYears")} info={t("info.comparativeCharts")} height={getAdaptiveChartHeight(charts.byYears.length)}>
          <ComparisonBar data={charts.byYears} color="var(--color-chart-3)" />
        </ChartCard>
        <ChartCard title={t("comparative.scoreBySpecies")} info={t("info.comparativeCharts")} height={getAdaptiveChartHeight(charts.bySpecies.length)}>
          <ComparisonBar data={charts.bySpecies} color="var(--color-chart-5)" />
        </ChartCard>
        <ChartCard title={t("comparative.scoreByWater")} info={t("info.comparativeCharts")} height={getAdaptiveChartHeight(charts.byWaterSource.length)}>
          <ComparisonBar data={charts.byWaterSource} color="var(--color-chart-6)" />
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
              <ReactECharts style={{ height: "100%", width: "100%" }} option={externalHeatmap} />
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
              <ReactECharts style={{ height: "100%", width: "100%" }} option={internalHeatmap} />
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
                      className="cursor-pointer hover:bg-slate-50"
                      onClick={() => onSelectFacility(facility.id)}
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
}: {
  data: { name: string; avgScore: number; count: number }[];
  color: string;
}) {
  if (data.length === 0) {
    return <EmptyChartState />;
  }

  const isDense = data.length > 4;
  const xAxisHeight = isDense ? 52 : 30;
  const barSize = Math.max(18, Math.min(46, Math.floor(230 / Math.max(1, data.length))));
  return (
    <ResponsiveContainer width="100%" height="100%">
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
          formatter={(value, _name, props) => [`${value}/100 (${props.payload.count})`, "Score"]}
        />
        <Bar dataKey="avgScore" fill={color} radius={[4, 4, 0, 0]} maxBarSize={50} barSize={barSize} />
      </BarChart>
    </ResponsiveContainer>
  );
}
