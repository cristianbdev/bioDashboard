import dynamic from "next/dynamic";
import {
  Area,
  AreaChart,
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
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { DashboardData } from "@/lib/kobo";
import { ComplianceBar, CoveragePill, MetricCard } from "./cards";
import { Droplets, FlaskConical, Gauge, MapPin, Pill as PillIcon, Shield, Syringe, Waves } from "lucide-react";
import { InfoTitle } from "./info-title";
import { useEffect, useState } from "react";

const ReactECharts = dynamic(() => import("echarts-for-react"), { ssr: false });

const scorePalette = ["#ef4444", "#f59e0b", "#eab308", "#22c55e", "#10b981"];
const SECTION_COLORS: Record<string, string> = {
  Environment: "#0ea5e9",
  Introduction: "#8b5cf6",
  Water: "#2563eb",
  Fomites: "#f97316",
  Biovectors: "#ef4444",
  Personnel: "#ec4899",
  Management: "#10b981",
  Health: "#14b8a6",
  VMP: "#f59e0b",
  Equipment: "#6366f1",
  SOP: "#84cc16",
};

type Props = {
  data: DashboardData;
  t: (key: string) => string;
  submissionData: { date: string; count: number }[];
  isDark: boolean;
};

export function Overview({ data, t, submissionData, isDark }: Props) {
  const [vw, setVw] = useState(1024);
  useEffect(() => {
    const update = () => setVw(typeof window !== "undefined" ? window.innerWidth : 1024);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  const chartWidth = Math.max(320, Math.min(vw - 48, 960));
  const radarOption = {
    tooltip: {
      trigger: "item",
      backgroundColor: isDark ? "#0f172a" : "#ffffff",
      textStyle: { color: isDark ? "#e2e8f0" : "#0f172a" },
    },
    radar: {
      indicator: data.sectionAverages.map((s) => ({ name: s.section, max: 100 })),
      shape: "polygon",
      splitNumber: 4,
      axisName: { color: isDark ? "#cbd5e1" : "#64748b", fontSize: 11 },
      splitLine: { lineStyle: { color: isDark ? "#1f2937" : "#e2e8f0" } },
      splitArea: { areaStyle: { color: isDark ? ["#0f172a", "#111827"] : ["#f8fafc", "#eef2ff"] } },
      axisLine: { lineStyle: { color: isDark ? "#1f2937" : "#e2e8f0" } },
    },
    series: [
      {
        type: "radar",
        data: [
          {
            value: data.sectionAverages.map((s) => s.score),
            name: "Score",
            areaStyle: { color: isDark ? "rgba(96,165,250,0.18)" : "rgba(37,99,235,0.15)" },
            lineStyle: { color: "#2563eb", width: 2 },
            itemStyle: { color: "#2563eb" },
          },
        ],
      },
    ],
  };

  return (
    <div className="space-y-6 min-w-0">
      <div className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard title={t("metrics.total.title")} value={data.stats.totalRecords} subtitle={t("metrics.total.subtitle")} icon={MapPin} color="sky" />
        <MetricCard
          title={t("metrics.avg.title")}
          value={`${data.stats.avgScore}/100`}
          subtitle={data.stats.avgScore < 50 ? t("metrics.avg.subtitle.bad") : t("metrics.avg.subtitle.good")}
          icon={Gauge}
          color={data.stats.avgScore >= 50 ? "emerald" : "amber"}
        />
        <MetricCard
          title={t("metrics.high.title")}
          value={data.stats.highRiskCount}
          subtitle={`${Math.round((data.stats.highRiskCount / Math.max(data.stats.totalRecords, 1)) * 100)}${t("metrics.high.subtitle")}`}
          icon={Shield}
          color="rose"
        />
        <MetricCard title={t("metrics.low.title")} value={data.stats.lowRiskCount} subtitle={t("metrics.low.subtitle")} icon={Shield} color="emerald" />
      </div>

      <div className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard title={t("metrics.geo.title")} value={data.practices.geoCoverage} subtitle={t("metrics.geo.subtitle")} icon={MapPin} color="violet" />
        <MetricCard
          title={t("coverage.waterMonitoring")}
          value={data.practices.waterMonitoring.reduce((acc, curr) => acc + curr.count, 0)}
          subtitle="Facilities reporting monitoring"
          icon={Gauge}
          color="sky"
        />
        <MetricCard
          title={t("metrics.submissions.title")}
          value={submissionData.slice(-3).reduce((acc, cur) => acc + cur.count, 0)}
          subtitle={t("metrics.submissions.subtitle")}
          icon={Gauge}
          color="amber"
        />
        <MetricCard
          title={t("coverage.diagnostics")}
          value={`${data.practices.diagnosticsLabRate}%`}
          subtitle="Use of lab diagnostics"
          icon={FlaskConical}
          color="emerald"
        />
      </div>

      <Card className="border-0 shadow-sm overflow-hidden min-w-0">
        <CardHeader className="pb-2">
          <InfoTitle title={t("charts.practiceCoverage")} info={t("info.practiceCoverage")} />
          <CardDescription>Key biosecurity practices adoption</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          <CoveragePill label={t("coverage.quarantine")} value={data.practices.quarantineRate} icon={Shield} color="#2563eb" />
          <CoveragePill label={t("coverage.waterTreatment")} value={data.practices.waterTreatmentRate} icon={Droplets} color="#0ea5e9" />
          <CoveragePill label={t("coverage.diagnostics")} value={data.practices.diagnosticsLabRate} icon={FlaskConical} color="#10b981" />
          <CoveragePill label={t("coverage.antibioticUse")} value={data.practices.antibioticUseRate} icon={Syringe} color="#f97316" />
          <CoveragePill label={t("coverage.antibioticRecords")} value={data.practices.antibioticRecordRate} icon={Gauge} color="#f59e0b" />
          <CoveragePill label={t("coverage.biosecurityProgram")} value={data.practices.sopRate} icon={Shield} color="#22c55e" />
        </CardContent>
      </Card>

      <div className="grid min-w-0 gap-6 lg:grid-cols-3">
        <Card className="border-0 shadow-sm overflow-hidden min-w-0">
        <CardHeader className="pb-2">
          <InfoTitle title={t("charts.riskDistribution")} info={t("info.riskDistribution")} />
        </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center">
              <div className="w-full min-w-0" style={{ height: 220, minWidth: 280 }}>
                <ResponsiveContainer width={chartWidth} height={220}>
                <PieChart>
                  <Pie data={data.riskMix} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3} dataKey="count" nameKey="level">
                    {data.riskMix.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name) => [`${value} inst.`, name]} />
                </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-slate-600">
              {data.riskMix.map((item) => (
                <div key={item.level} className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span>
                    {item.level}: {item.count}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm lg:col-span-2 overflow-hidden min-w-0">
        <CardHeader className="pb-2">
          <InfoTitle title={t("charts.practiceCompliance")} info={t("info.practiceCoverage")} />
        </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <ComplianceBar label={t("coverage.waterTreatment")} value={data.practices.waterTreatmentRate} color="#2563eb" />
            <ComplianceBar label={t("coverage.records")} value={data.practices.recordKeepingRate} color="#10b981" />
            <ComplianceBar label={t("coverage.diagnostics")} value={data.practices.diagnosticsLabRate} color="#8b5cf6" />
            <ComplianceBar label={t("coverage.antibioticRecords")} value={data.practices.antibioticRecordRate} color="#f59e0b" />
            <ComplianceBar label={t("coverage.biosecurityProgram")} value={data.practices.biosecurityProgramRate} color="#06b6d4" />
            <ComplianceBar label={t("coverage.quarantine")} value={data.practices.quarantineRate} color="#ef4444" />
          </CardContent>
        </Card>
      </div>

      <div className="grid min-w-0 gap-6 xl:grid-cols-3">
        <Card className="border-0 shadow-sm xl:col-span-2 overflow-hidden min-w-0">
        <CardHeader className="pb-2">
          <InfoTitle title={t("charts.scoreDistribution")} info={t("info.scoreDistribution")} />
        </CardHeader>
          <CardContent className="h-72 min-w-0">
            <div className="w-full h-full min-w-0" style={{ minWidth: 280 }}>
              <ResponsiveContainer width={chartWidth} height={288}>
              <BarChart data={data.distribution} barSize={42}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? "#1f2937" : "#e2e8f0"} />
                <XAxis dataKey="bucket" tick={{ fontSize: 12, fill: isDark ? "#cbd5e1" : "#475569" }} tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: isDark ? "#cbd5e1" : "#475569" }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {data.distribution.map((_, idx) => (
                    <Cell key={idx} fill={scorePalette[idx % scorePalette.length]} />
                  ))}
                </Bar>
              </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm overflow-hidden min-w-0">
        <CardHeader className="pb-2">
          <InfoTitle title={t("charts.topRiskFactors")} info={t("info.topRiskFactors")} />
        </CardHeader>
          <CardContent className="space-y-3">
            {data.topRiskFactors.slice(0, 6).map((item, idx) => (
              <div key={item.factor} className="flex items-start gap-3">
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-medium ${
                    idx < 3 ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {idx + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-slate-700">{item.factor}</p>
                  <p className="text-xs text-slate-500">{item.count} facilities</p>
                </div>
              </div>
            ))}
            <Separator />
            <p className="text-xs font-semibold text-slate-700">{t("charts.positiveFactors")}</p>
            {data.positiveFactors.slice(0, 4).map((item) => (
              <div key={item.factor} className="flex items-center justify-between text-sm">
                <span className="text-slate-700">{item.factor}</span>
                <Badge variant="secondary">{item.count}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid min-w-0 gap-6 lg:grid-cols-2">
        <Card className="border-0 shadow-sm overflow-hidden min-w-0">
        <CardHeader className="pb-2">
          <InfoTitle title={t("charts.sectionRadar")} info={t("info.sectionRadar")} />
        </CardHeader>
          <CardContent className="h-80 min-w-0">
            <div className="w-full h-full min-w-0" style={{ minWidth: 280 }}>
              <ReactECharts style={{ height: "100%", width: "100%" }} option={radarOption} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm overflow-hidden min-w-0">
        <CardHeader className="pb-2">
          <InfoTitle title={t("charts.sectionDetail")} info={t("info.sectionDetail")} />
        </CardHeader>
          <CardContent className="h-80 min-w-0">
            <div className="w-full h-full min-w-0" style={{ minWidth: 280 }}>
            <ResponsiveContainer width={chartWidth} height={320}>
              <BarChart data={data.sectionAverages} layout="vertical" barSize={16}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={isDark ? "#1f2937" : "#e2e8f0"} />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: isDark ? "#cbd5e1" : "#475569" }} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="section" tick={{ fontSize: 11, fill: isDark ? "#cbd5e1" : "#475569" }} tickLine={false} axisLine={false} width={90} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "none" }} formatter={(value) => [`${value}/100`, "Score"]} />
                <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                  {data.sectionAverages.map((entry) => (
                    <Cell key={entry.section} fill={SECTION_COLORS[entry.section] ?? "#64748b"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid min-w-0 gap-6 lg:grid-cols-3">
        <Card className="border-0 shadow-sm overflow-hidden min-w-0">
        <CardHeader className="pb-2">
          <InfoTitle title={t("charts.submissions")} info={t("info.submissions")} />
          <CardDescription>Data freshness</CardDescription>
        </CardHeader>
          <CardContent className="h-64 min-w-0">
            <div className="w-full h-full min-w-0" style={{ minWidth: 280 }}>
            <ResponsiveContainer width={chartWidth} height={256}>
              <AreaChart data={submissionData}>
                <defs>
                  <linearGradient id="colorSub" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? "#1f2937" : "#e2e8f0"} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: isDark ? "#cbd5e1" : "#475569" }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: isDark ? "#cbd5e1" : "#475569" }} />
                <Tooltip />
                <Area type="monotone" dataKey="count" stroke="#2563eb" fillOpacity={1} fill="url(#colorSub)" />
              </AreaChart>
            </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm overflow-hidden min-w-0">
        <CardHeader className="pb-2">
          <InfoTitle title={t("charts.waterMonitoring")} info={t("info.waterMonitoring")} />
        </CardHeader>
          <CardContent className="h-64 min-w-0">
            <div className="w-full h-full min-w-0" style={{ minWidth: 280 }}>
            <ResponsiveContainer width={chartWidth} height={256}>
              <BarChart data={data.practices.waterMonitoring} layout="vertical" barSize={14}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={isDark ? "#1f2937" : "#e2e8f0"} />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: isDark ? "#cbd5e1" : "#475569" }} />
                <YAxis type="category" dataKey="label" tick={{ fontSize: 11, fill: isDark ? "#cbd5e1" : "#475569" }} width={120} />
                <Tooltip />
                <Bar dataKey="count" radius={[0, 4, 4, 0]} fill="#0ea5e9" />
              </BarChart>
            </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm overflow-hidden min-w-0">
        <CardHeader className="pb-2">
          <InfoTitle title={t("charts.mortalityDisposal")} info={t("info.mortalityDisposal")} />
        </CardHeader>
          <CardContent className="h-64 min-w-0">
            <div className="w-full h-full min-w-0" style={{ minWidth: 280 }}>
            <ResponsiveContainer width={chartWidth} height={256}>
              <BarChart data={data.practices.mortalityDisposal} layout="vertical" barSize={14}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={isDark ? "#1f2937" : "#e2e8f0"} />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: isDark ? "#cbd5e1" : "#475569" }} />
                <YAxis type="category" dataKey="method" tick={{ fontSize: 11, fill: isDark ? "#cbd5e1" : "#475569" }} width={150} />
                <Tooltip />
                <Bar dataKey="count" radius={[0, 4, 4, 0]} fill="#f97316" />
              </BarChart>
            </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <PillIcon className="h-4 w-4 text-orange-500" />
            <InfoTitle title={t("charts.antibioticUse")} info={t("info.antibioticUse")} />
          </div>
        </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.antibioticUsage.length > 0 ? (
                data.antibioticUsage.map((item) => (
                  <div key={item.antibiotic} className="flex items-center justify-between">
                    <span className="text-sm text-slate-700">{item.antibiotic}</span>
                    <Badge variant="secondary">{item.count}</Badge>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">{t("facilities.noData")}</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Waves className="h-4 w-4 text-blue-500" />
            <InfoTitle title={t("charts.waterSources")} info={t("info.waterSources")} />
          </div>
        </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.operations.byWaterSource.map((item) => (
                <div key={item.source} className="flex items-center justify-between">
                  <span className="text-sm text-slate-700 dark:text-slate-200">{item.source}</span>
                  <Badge variant="secondary">{item.count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
