import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { AlertCircle, AlertTriangle, CheckCircle2, ClipboardList, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { DashboardData, FacilitySummary, RuleStatus } from "@/lib/kobo";
import { RiskBadge } from "./cards";
import { InfoTitle } from "./info-title";

type Props = {
  facilities: FacilitySummary[];
  currentFacility?: FacilitySummary;
  onSelect: (id: number) => void;
  t: (key: string) => string;
  sectionAverages: DashboardData["sectionAverages"];
  readOnlySelection?: boolean;
};

const FACILITY_COLORS = {
  external: "#16a34a",
  internal: "#2563eb",
};

const AVERAGE_COLORS = {
  external: "#86efac",
  internal: "#93c5fd",
};

export function FacilitiesView({
  facilities,
  currentFacility,
  onSelect,
  t,
  sectionAverages,
  readOnlySelection = false,
}: Props) {
  const [vw, setVw] = useState(1024);

  useEffect(() => {
    const update = () => setVw(typeof window !== "undefined" ? window.innerWidth : 1024);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const chartWidth = Math.max(280, Math.min(vw - 80, 760));

  if (!currentFacility) return null;

  const benchmarkData = currentFacility.sectionScores.map((section) => {
    const average = sectionAverages.find((item) => item.section === section.section)?.score ?? 0;
    return {
      section: section.section,
      side: section.side,
      facility: section.score,
      average,
    };
  });

  return (
    <div className="space-y-6 min-w-0">
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold">{t("tabs.facilities.select")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <Select
              value={String(currentFacility.id)}
              onValueChange={(value) => onSelect(Number(value))}
              disabled={readOnlySelection}
            >
              <SelectTrigger className="w-full sm:w-96">
                <SelectValue placeholder={t("tabs.facilities.select")} />
              </SelectTrigger>
              <SelectContent>
                {facilities.map((facility) => (
                  <SelectItem key={facility.id} value={String(facility.id)}>
                    {facility.name} - {facility.score}/100
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <RiskBadge level={currentFacility.riskLevel} label={t(`risk.${currentFacility.riskLevel.toLowerCase()}`)} />
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <InfoTitle title={t("facilities.information")} info={t("info.facilityDiagnostics")} />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-xl font-semibold text-slate-900">{currentFacility.name}</h2>
                <RiskBadge level={currentFacility.riskLevel} label={t(`risk.${currentFacility.riskLevel.toLowerCase()}`)} />
              </div>
              <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {currentFacility.basedOn ?? currentFacility.location ?? t("facilities.noData")}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">{currentFacility.species ?? t("facilities.noData")}</Badge>
                <Badge variant="outline">{currentFacility.productionSystem ?? t("facilities.noData")}</Badge>
                <Badge variant="outline">{currentFacility.productionType ?? t("facilities.noData")}</Badge>
              </div>
            </div>

            <div className="flex flex-col items-center rounded-xl bg-slate-50 px-5 py-4">
              <span className="text-sm text-slate-500">{t("table.score")}</span>
              <span
                className={`text-4xl font-bold ${
                  currentFacility.score >= 70
                    ? "text-emerald-600"
                    : currentFacility.score >= 50
                    ? "text-amber-600"
                    : "text-rose-600"
                }`}
              >
                {currentFacility.score}
              </span>
              <span className="text-xs text-slate-400">/100</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="border-0 shadow-sm lg:col-span-2">
          <CardHeader className="pb-2">
            <InfoTitle title={t("facilities.scoreBySection")} info={t("info.sectionDetail")} />
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width={chartWidth} height="100%">
              <BarChart data={currentFacility.sectionScores} layout="vertical" margin={{ left: 8, right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: "#475569" }} />
                <YAxis type="category" dataKey="section" width={130} tick={{ fontSize: 11, fill: "#475569" }} />
                <Tooltip formatter={(value) => [`${value}/100`, t("table.score")]} />
                <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                  {currentFacility.sectionScores.map((entry) => (
                    <Cell key={entry.section} fill={entry.side === "external" ? FACILITY_COLORS.external : FACILITY_COLORS.internal} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <InfoTitle title={t("facilities.quickInfo")} info={t("info.facilityDiagnostics")} />
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <InfoRow label={t("facilities.yearsOperation")} value={currentFacility.yearsOperation ?? t("facilities.noData")} />
            <Separator />
            <InfoRow label={t("facilities.species")} value={currentFacility.species ?? t("facilities.noData")} />
            <Separator />
            <InfoRow label={t("facilities.waterSource")} value={currentFacility.waterSource ?? t("facilities.noData")} />
            <Separator />
            <InfoRow label={t("facilities.waterMonitoring")} value={currentFacility.waterMonitoringFrequency ?? t("facilities.noData")} />
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <InfoTitle title={t("facilities.benchmark")} info={t("info.facilityBenchmark")} />
        </CardHeader>
        <CardContent className="h-96">
          <ResponsiveContainer width={chartWidth} height="100%">
            <BarChart data={benchmarkData} layout="vertical" margin={{ left: 8, right: 16 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: "#475569" }} />
              <YAxis type="category" dataKey="section" width={130} tick={{ fontSize: 11, fill: "#475569" }} />
              <Tooltip formatter={(value) => [`${value}/100`, t("table.score")]} />
              <Bar dataKey="average" name={t("facilities.networkAverage")} radius={[0, 4, 4, 0]}>
                {benchmarkData.map((entry) => (
                  <Cell key={`${entry.section}-average`} fill={entry.side === "external" ? AVERAGE_COLORS.external : AVERAGE_COLORS.internal} />
                ))}
              </Bar>
              <Bar dataKey="facility" name={t("table.facility")} radius={[0, 4, 4, 0]}>
                {benchmarkData.map((entry) => (
                  <Cell key={`${entry.section}-facility`} fill={entry.side === "external" ? FACILITY_COLORS.external : FACILITY_COLORS.internal} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <InfoTitle title={t("facilities.keyPractices")} info={t("info.practiceCoverage")} />
          </CardHeader>
          <CardContent className="space-y-3">
            {currentFacility.keyPractices.map((practice) => (
              <RuleRow key={practice.id} rule={practice} t={t} />
            ))}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <InfoTitle title={t("facilities.animalHealthMonitoring")} info={t("info.animalHealthMonitoring")} />
          </CardHeader>
          <CardContent className="space-y-3">
            {currentFacility.animalHealthMonitoring.map((rule) => (
              <RuleRow key={rule.id} rule={rule} t={t} />
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <RiskCard
          color="rose"
          icon={<AlertTriangle className="h-4 w-4 text-rose-500" />}
          title={t("facilities.risks.high")}
          items={currentFacility.highRiskFactors}
          emptyLabel={t("facilities.noData")}
        />
        <RiskCard
          color="amber"
          icon={<AlertCircle className="h-4 w-4 text-amber-500" />}
          title={t("facilities.risks.medium")}
          items={currentFacility.moderateRiskFactors}
          emptyLabel={t("facilities.noData")}
        />
        <RiskCard
          color="emerald"
          icon={<CheckCircle2 className="h-4 w-4 text-emerald-500" />}
          title={t("facilities.risks.positive")}
          items={currentFacility.positivePractices}
          emptyLabel={t("facilities.noData")}
        />
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-slate-600" />
            <InfoTitle title={t("facilities.subcategoryChecklist")} info={t("info.subcategoryChecklist")} />
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {currentFacility.subcategoryChecklist.map((subcategory) => (
            <div key={subcategory.section} className="rounded-lg border border-slate-200">
              <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-2">
                <h4 className="text-sm font-semibold text-slate-800">{subcategory.section}</h4>
                <Badge variant="outline" className={subcategory.side === "external" ? "text-emerald-700" : "text-blue-700"}>
                  {subcategory.side === "external" ? t("overview.external") : t("overview.internal")}
                </Badge>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>{t("table.question")}</TableHead>
                      <TableHead>{t("table.answer")}</TableHead>
                      <TableHead className="w-[130px]">{t("table.status")}</TableHead>
                      <TableHead>{t("table.recommendation")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subcategory.items.map((item) => (
                      <TableRow key={`${subcategory.section}-${item.id}`}>
                        <TableCell className="font-medium">{item.label}</TableCell>
                        <TableCell>{item.answer}</TableCell>
                        <TableCell>
                          {!item.applicable ? (
                            <Badge variant="secondary">{t("status.notApplicable")}</Badge>
                          ) : item.compliant ? (
                            <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">
                              {t("status.compliant")}
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-rose-100 text-rose-700">
                              {t("status.nonCompliant")}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>{item.recommendation}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-slate-600">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}

function RuleRow({ rule, t }: { rule: RuleStatus; t: (key: string) => string }) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-md border border-slate-100 px-3 py-2">
      <div className="space-y-1">
        <p className="text-sm text-slate-700">{rule.label}</p>
        <p className="text-xs text-slate-500">
          {t("table.answer")}: {rule.answer}
        </p>
      </div>
      {!rule.applicable ? (
        <Badge variant="secondary">{t("status.notApplicable")}</Badge>
      ) : rule.matched ? (
        <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">
          {t("status.yes")}
        </Badge>
      ) : (
        <Badge variant="secondary" className="bg-rose-100 text-rose-700">
          {t("status.no")}
        </Badge>
      )}
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
    <Card className={`border-0 shadow-sm ${border}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          {icon}
          <CardTitle className="text-base font-semibold text-slate-800">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {items.length > 0 ? (
          <ul className="space-y-2">
            {items.map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-slate-700">
                <IconBullet className={`mt-0.5 h-4 w-4 shrink-0 ${iconColor}`} />
                {item}
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
