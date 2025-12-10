import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Flame,
  FlaskConical,
  MapPin,
  Shield,
  Syringe,
  Trash2,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DashboardData, FacilitySummary } from "@/lib/kobo";
import { RiskBadge } from "./cards";
import { InfoTitle } from "./info-title";

type Props = {
  facilities: FacilitySummary[];
  currentFacility?: FacilitySummary;
  onSelect: (id: number) => void;
  t: (key: string) => string;
  sectionAverages: DashboardData["sectionAverages"];
  isDark: boolean;
};

export function FacilitiesView({ facilities, currentFacility, onSelect, t, sectionAverages, isDark }: Props) {
  if (!currentFacility) return null;

  const benchmarkData = currentFacility.sectionScores.map((s) => ({
    section: s.section,
    facility: s.score,
    average: sectionAverages.find((a) => a.section === s.section)?.score ?? 0,
  }));

  const [vw, setVw] = useState(1024);
  useEffect(() => {
    const update = () => setVw(typeof window !== "undefined" ? window.innerWidth : 1024);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  const chartWidth = Math.max(320, Math.min(vw - 48, 960));

  return (
    <div className="space-y-6 min-w-0">
      <Card className="border-0 shadow-sm overflow-hidden min-w-0">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold">{t("tabs.facilities.select")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <Select value={String(currentFacility.id)} onValueChange={(value) => onSelect(Number(value))}>
              <SelectTrigger className="w-full sm:w-80">
                <SelectValue placeholder={t("tabs.facilities.select")} />
              </SelectTrigger>
              <SelectContent>
                {facilities.map((f) => (
                  <SelectItem key={f.id} value={String(f.id)}>
                    {f.name} - {f.score}/100
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <RiskBadge level={currentFacility.riskLevel} label={t(`risk.${currentFacility.riskLevel.toLowerCase()}`)} />
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm overflow-hidden min-w-0">
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-xl font-semibold text-slate-900">{currentFacility.name}</h2>
                <RiskBadge level={currentFacility.riskLevel} label={t(`risk.${currentFacility.riskLevel.toLowerCase()}`)} />
              </div>
              <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {currentFacility.location ?? t("facilities.noData")}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {currentFacility.respondent ?? "N/A"}
                </span>
              </div>
              <div className="flex flex-wrap gap-2 pt-2">
                <Badge variant="secondary">{currentFacility.species ?? "N/A"}</Badge>
                <Badge variant="outline">{currentFacility.productionSystem ?? "N/A"}</Badge>
                <Badge variant="outline">{currentFacility.market ?? "N/A"}</Badge>
              </div>
            </div>
            <div className="flex flex-col items-center rounded-xl bg-slate-50 px-5 py-4">
              <span className="text-sm text-slate-500">Score</span>
              <span
                className={`text-4xl font-bold ${
                  currentFacility.score >= 70 ? "text-emerald-600" : currentFacility.score >= 50 ? "text-amber-600" : "text-rose-600"
                }`}
              >
                {currentFacility.score}
              </span>
              <span className="text-xs text-slate-400">/100</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid min-w-0 gap-6 lg:grid-cols-3">
        <Card className="border-0 shadow-sm lg:col-span-2 overflow-hidden min-w-0">
        <CardHeader className="pb-2">
          <InfoTitle title={t("facilities.scoreBySection")} info={t("info.sectionDetail")} />
        </CardHeader>
          <CardContent className="h-72 min-w-0">
            <div className="w-full h-full min-w-0" style={{ minWidth: 280 }}>
            <ResponsiveContainer width={chartWidth} height={288}>
              <BarChart data={currentFacility.sectionScores} barSize={24}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? "#1f2937" : "#e2e8f0"} />
                <XAxis dataKey="section" tick={{ fontSize: 10, fill: isDark ? "#cbd5e1" : "#475569" }} tickLine={false} axisLine={false} angle={-45} textAnchor="end" height={60} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: isDark ? "#cbd5e1" : "#475569" }} tickLine={false} axisLine={false} />
                <Tooltip formatter={(value) => [`${value}/100`, "Score"]} />
                <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                  {currentFacility.sectionScores.map((entry) => (
                    <Cell key={entry.section} fill={entry.score >= 70 ? "#22c55e" : entry.score >= 50 ? "#f59e0b" : "#ef4444"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm overflow-hidden min-w-0">
        <CardHeader className="pb-2">
          <InfoTitle title={t("facilities.quickInfo")} info={t("info.facilityDiagnostics")} />
        </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-600">{t("facilities.education")}</span>
              <span className="font-medium">{currentFacility.respondentEducation ?? t("facilities.noData")}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-slate-600">{t("facilities.waterSource")}</span>
              <span className="font-medium">{currentFacility.waterSource ?? t("facilities.noData")}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-slate-600">{t("facilities.feed")}</span>
              <span className="font-medium">{currentFacility.feedType ?? t("facilities.noData")}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-slate-600">{t("facilities.waterMonitoring")}</span>
              <span className="font-medium">{currentFacility.waterMonitoringFrequency ?? t("facilities.noData")}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid min-w-0 gap-6 lg:grid-cols-3">
        <Card className="border-0 shadow-sm lg:col-span-2 overflow-hidden min-w-0">
        <CardHeader className="pb-2">
          <InfoTitle title={t("facilities.benchmark")} info={t("info.facilityBenchmark")} />
        </CardHeader>
          <CardContent className="h-72 min-w-0">
            <div className="w-full h-full min-w-0" style={{ minWidth: 280 }}>
            <ResponsiveContainer width={chartWidth} height={288}>
              <BarChart data={benchmarkData} barSize={16}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? "#1f2937" : "#e2e8f0"} />
                <XAxis dataKey="section" tick={{ fontSize: 10, fill: isDark ? "#cbd5e1" : "#475569" }} tickLine={false} axisLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: isDark ? "#cbd5e1" : "#475569" }} tickLine={false} axisLine={false} />
                <Tooltip />
                <Bar dataKey="average" stackId="a" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="facility" stackId="a" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm overflow-hidden min-w-0">
        <CardHeader className="pb-2">
          <InfoTitle title={t("facilities.diagnostics")} info={t("info.facilityDiagnostics")} />
        </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <RowItem icon={<Shield className="h-4 w-4 text-blue-500" />} label={t("facilities.quarantine")} value={currentFacility.quarantine} t={t} />
            <RowItem icon={<Flame className="h-4 w-4 text-amber-500" />} label={t("facilities.waterTreatment")} value={currentFacility.waterTreatment} t={t} />
            <RowItem icon={<Syringe className="h-4 w-4 text-orange-500" />} label={t("facilities.antibiotics")} value={!!currentFacility.antibiotics} t={t} />
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2 text-slate-700">
                <FlaskConical className="h-4 w-4 text-emerald-500" />
                <span>{t("facilities.diagnostics")}</span>
              </div>
              <span className="text-right text-sm text-slate-700">
                {(currentFacility.diagnosticTypes ?? []).join(", ") || t("facilities.noData")}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid min-w-0 gap-6 lg:grid-cols-3">
        <RiskCard
          color="rose"
          icon={<Trash2 className="h-4 w-4 text-rose-500" />}
          title={t("facilities.risks.critical")}
          items={currentFacility.riskFactors.critical}
          emptyLabel={t("facilities.noData")}
        />
        <RiskCard
          color="amber"
          icon={<AlertCircle className="h-4 w-4 text-amber-500" />}
          title={t("facilities.risks.medium")}
          items={currentFacility.riskFactors.medium}
          emptyLabel={t("facilities.noData")}
        />
        <RiskCard
          color="emerald"
          icon={<CheckCircle2 className="h-4 w-4 text-emerald-500" />}
          title={t("facilities.risks.positive")}
          items={currentFacility.riskFactors.positive}
          emptyLabel={t("facilities.noData")}
        />
      </div>
    </div>
  );
}

function RowItem({ icon, label, value, t }: { icon: ReactNode; label: string; value?: boolean; t: (k: string) => string }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-slate-700">
        {icon}
        <span>{label}</span>
      </div>
      <Badge variant="outline">{value ? t("status.yes") : t("status.no")}</Badge>
    </div>
  );
}

function RiskCard({
  color,
  icon,
  title,
  items,
  emptyLabel,
}: {
  color: "rose" | "amber" | "emerald";
  icon: ReactNode;
  title: string;
  items: string[];
  emptyLabel: string;
}) {
  const border = {
    rose: "border-l-4 border-l-rose-500",
    amber: "border-l-4 border-l-amber-500",
    emerald: "border-l-4 border-l-emerald-500",
  }[color];
  const IconBullet = color === "rose" ? AlertTriangle : color === "amber" ? AlertCircle : CheckCircle2;
  const iconColor = color === "rose" ? "text-rose-500" : color === "amber" ? "text-amber-500" : "text-emerald-500";
  return (
    <Card className={`border-0 shadow-sm ${border} overflow-hidden`}>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          {icon}
          <CardTitle className="text-base font-semibold text-slate-800">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {items.length > 0 ? (
          <ul className="space-y-2">
            {items.map((r) => (
              <li key={r} className="flex items-start gap-2 text-sm text-slate-700">
                <IconBullet className={`mt-0.5 h-4 w-4 shrink-0 ${iconColor}`} />
                {r}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-500">{emptyLabel}</p>
        )}
      </CardContent>
    </Card>
  );
}
