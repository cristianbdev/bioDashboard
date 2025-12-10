import dynamic from "next/dynamic";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { DashboardData } from "@/lib/kobo";
import { RiskBadge } from "./cards";
import { InfoTitle } from "./info-title";
import { useEffect, useState } from "react";

const ReactECharts = dynamic(() => import("echarts-for-react"), { ssr: false });

type Props = {
  data: DashboardData;
  t: (key: string) => string;
  onSelectFacility: (id: number) => void;
  isDark: boolean;
};

export function ComparativeView({ data, t, onSelectFacility, isDark }: Props) {
  const [vw, setVw] = useState(1024);
  useEffect(() => {
    const update = () => setVw(typeof window !== "undefined" ? window.innerWidth : 1024);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  const chartWidth = Math.max(320, Math.min(vw - 48, 960));

  const heatmapOption = (() => {
    if (!data || data.heatmap.length === 0) return undefined;
    const facilities = Array.from(new Set(data.heatmap.map((h) => h.facility)));
    const factors = Array.from(new Set(data.heatmap.map((h) => h.factor)));
    return {
      tooltip: {
        position: "top",
        backgroundColor: isDark ? "#0f172a" : "#ffffff",
        textStyle: { color: isDark ? "#e2e8f0" : "#0f172a" },
        formatter: (params: any) => `${params.name}: ${params.data[2] ? t("risk.high") : t("risk.low")}`,
      },
      grid: { height: "60%", top: "12%", left: "14%", right: "4%", containLabel: true },
      xAxis: {
        type: "category",
        data: facilities.map((f) => f.slice(0, 14)),
        splitArea: { show: true },
        axisLabel: { rotate: 45, fontSize: 10, color: isDark ? "#e2e8f0" : "#475569" },
      },
      yAxis: {
        type: "category",
        data: factors.map((f) => f.slice(0, 26)),
        splitArea: { show: true },
        axisLabel: { fontSize: 10, color: isDark ? "#e2e8f0" : "#475569" },
      },
      visualMap: { min: 0, max: 1, show: false, inRange: { color: ["#dcfce7", "#fecaca"] } },
      series: [
        {
          name: "Risk",
          type: "heatmap",
          data: data.heatmap.map((h) => [facilities.indexOf(h.facility), factors.indexOf(h.factor), h.value]),
          label: { show: false },
        },
      ],
    };
  })();

  const renderBar = (chartData: { name: string; avgScore: number; count: number }[], color: string) => (
    <ResponsiveContainer width={chartWidth} height={260}>
      <BarChart data={chartData} barSize={28}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? "#1f2937" : "#e2e8f0"} />
        <XAxis dataKey="name" tick={{ fontSize: 11, fill: isDark ? "#cbd5e1" : "#475569" }} tickLine={false} axisLine={false} />
        <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: isDark ? "#cbd5e1" : "#475569" }} tickLine={false} axisLine={false} />
        <Tooltip formatter={(value, name, props) => [`${value}/100 (${props.payload.count} inst.)`, "Score"]} />
        <Bar dataKey="avgScore" fill={color} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );

  return (
    <div className="space-y-6 min-w-0">
      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title={t("comparative.scoreBySystem")} info={t("info.comparativeCharts")}>
          {renderBar(data.comparatives.bySystem, "#2563eb")}
        </ChartCard>
        <ChartCard title={t("comparative.scoreByEducation")} info={t("info.comparativeCharts")}>
          {renderBar(data.comparatives.byEducation, "#8b5cf6")}
        </ChartCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title={t("comparative.scoreByMarket")} info={t("info.comparativeCharts")}>
          {renderBar(data.comparatives.byMarket, "#10b981")}
        </ChartCard>
        <ChartCard title={t("comparative.scoreByYears")} info={t("info.comparativeCharts")}>
          {renderBar(data.comparatives.byYearsOperation, "#f59e0b")}
        </ChartCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title={t("comparative.scoreBySpecies")} info={t("info.comparativeCharts")}>
          {renderBar(data.comparatives.bySpecies, "#0ea5e9")}
        </ChartCard>
        <ChartCard title={t("comparative.scoreByWater")} info={t("info.comparativeCharts")}>
          {renderBar(data.comparatives.byWaterSource, "#06b6d4")}
        </ChartCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title={t("comparative.scoreByFeed")} info={t("info.comparativeCharts")}>
          {renderBar(data.comparatives.byFeedType, "#f97316")}
        </ChartCard>
        <Card className="border-0 shadow-sm overflow-hidden min-w-0">
          <CardHeader className="pb-2">
            <InfoTitle title={t("comparative.riskMatrix")} info={t("info.riskMatrix")} />
          <CardDescription>Green = OK, Red = risk</CardDescription>
        </CardHeader>
        <CardContent className="h-96 min-w-0">
          {heatmapOption ? (
            <ReactECharts style={{ height: "100%", width: "100%", minWidth: 280 }} option={heatmapOption} />
          ) : (
              <div className="flex h-full items-center justify-center text-sm text-slate-500">No data</div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-sm overflow-hidden min-w-0">
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
                  <TableHead className="font-semibold">{t("table.market")}</TableHead>
                  <TableHead className="font-semibold">{t("table.water")}</TableHead>
                  <TableHead className="font-semibold">{t("table.feed")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.facilities
                  .slice()
                  .sort((a, b) => b.score - a.score)
                  .map((f) => (
                    <TableRow key={f.id} className="cursor-pointer hover:bg-slate-50" onClick={() => onSelectFacility(f.id)}>
                      <TableCell className="font-medium">{f.name}</TableCell>
                      <TableCell className="text-center">
                        <span className={`font-semibold ${f.score >= 70 ? "text-emerald-600" : f.score >= 50 ? "text-amber-600" : "text-rose-600"}`}>{f.score}</span>
                      </TableCell>
                      <TableCell className="text-center">
                        <RiskBadge level={f.riskLevel} label={t(`risk.${f.riskLevel.toLowerCase()}`)} />
                      </TableCell>
                      <TableCell>{f.productionSystem ?? "-"}</TableCell>
                      <TableCell>{f.market ?? "-"}</TableCell>
                      <TableCell>{f.waterSource ?? "-"}</TableCell>
                      <TableCell>{f.feedType ?? "-"}</TableCell>
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

function ChartCard({ title, info, children }: { title: string; info?: string; children: React.ReactNode }) {
  return (
    <Card className="border-0 shadow-sm overflow-hidden min-w-0">
      <CardHeader className="pb-2">
        <InfoTitle title={title} info={info} />
      </CardHeader>
      <CardContent className="h-72 min-w-0">
        <div className="w-full h-full min-w-0" style={{ minWidth: 280 }}>{children}</div>
      </CardContent>
    </Card>
  );
}
