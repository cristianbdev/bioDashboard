import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
  const [vw, setVw] = useState(1024);

  useEffect(() => {
    const update = () => setVw(typeof window !== "undefined" ? window.innerWidth : 1024);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const chartWidth = Math.max(260, Math.min(vw - 80, 380));

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
      <Card className="border-0 shadow-sm">
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
        <ChartCard title={t("comparative.scoreBySystem")} info={t("info.comparativeCharts")}>
          <ComparisonBar data={charts.bySystem} color="#2563eb" chartWidth={chartWidth} />
        </ChartCard>
        <ChartCard title={t("comparative.scoreByProductionType")} info={t("info.comparativeCharts")}>
          <ComparisonBar data={charts.byProductionType} color="#14b8a6" chartWidth={chartWidth} />
        </ChartCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title={t("comparative.scoreByEducation")} info={t("info.comparativeCharts")}>
          <ComparisonBar data={charts.byEducation} color="#8b5cf6" chartWidth={chartWidth} />
        </ChartCard>
        <ChartCard title={t("comparative.scoreByMarket")} info={t("info.comparativeCharts")}>
          <ComparisonBar data={charts.byMarket} color="#10b981" chartWidth={chartWidth} />
        </ChartCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <ChartCard title={t("comparative.scoreByYears")} info={t("info.comparativeCharts")}>
          <ComparisonBar data={charts.byYears} color="#f59e0b" chartWidth={chartWidth} />
        </ChartCard>
        <ChartCard title={t("comparative.scoreBySpecies")} info={t("info.comparativeCharts")}>
          <ComparisonBar data={charts.bySpecies} color="#0ea5e9" chartWidth={chartWidth} />
        </ChartCard>
        <ChartCard title={t("comparative.scoreByWater")} info={t("info.comparativeCharts")}>
          <ComparisonBar data={charts.byWaterSource} color="#06b6d4" chartWidth={chartWidth} />
        </ChartCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <InfoTitle title={t("comparative.riskMatrixExternal")} info={t("info.riskMatrix")} />
            <CardDescription>{t("comparative.riskMatrixLegend")}</CardDescription>
          </CardHeader>
          <CardContent className="h-[460px]">
            {externalHeatmap ? (
              <ReactECharts style={{ height: "100%", width: "100%" }} option={externalHeatmap} />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-slate-500">No data</div>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <InfoTitle title={t("comparative.riskMatrixInternal")} info={t("info.riskMatrix")} />
            <CardDescription>{t("comparative.riskMatrixLegend")}</CardDescription>
          </CardHeader>
          <CardContent className="h-[460px]">
            {internalHeatmap ? (
              <ReactECharts style={{ height: "100%", width: "100%" }} option={internalHeatmap} />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-slate-500">No data</div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-sm">
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
  chartWidth,
}: {
  data: { name: string; avgScore: number; count: number }[];
  color: string;
  chartWidth: number;
}) {
  if (data.length === 0) {
    return <div className="flex h-full items-center justify-center text-sm text-slate-500">No data</div>;
  }

  return (
    <ResponsiveContainer width={chartWidth} height="100%">
      <BarChart data={data} margin={{ left: 8, right: 16, top: 6 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
        <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#334155" }} tickLine={false} axisLine={false} />
        <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: "#334155" }} tickLine={false} axisLine={false} />
        <Tooltip formatter={(value, _name, props) => [`${value}/100 (${props.payload.count})`, "Score"]} />
        <Bar dataKey="avgScore" fill={color} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function ChartCard({ title, info, children }: { title: string; info?: string; children: React.ReactNode }) {
  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-2">
        <InfoTitle title={title} info={info} />
      </CardHeader>
      <CardContent className="h-80">
        <div className="h-full w-full">{children}</div>
      </CardContent>
    </Card>
  );
}
