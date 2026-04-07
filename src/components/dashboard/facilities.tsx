import type { ReactNode } from "react";
import { AlertCircle, AlertTriangle, CheckCircle2, ClipboardList, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CHART_TOOLTIP_CURSOR, CHART_TOOLTIP_STYLE, getAdaptiveVerticalBarLayout, truncateChartLabel } from "@/components/charts/chart-card";
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

// Update to theme colors
const FACILITY_COLORS = {
  external: "var(--color-brand)",
  internal: "var(--color-chart-8)",
};

const AVERAGE_COLORS = {
  external: "color-mix(in srgb, var(--color-brand) 40%, white)",
  internal: "color-mix(in srgb, var(--color-chart-8) 40%, white)",
};

export function FacilitiesView({
  facilities,
  currentFacility,
  onSelect,
  t,
  sectionAverages,
  readOnlySelection = false,
}: Props) {
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
  const longestBenchmarkLabel = benchmarkData.reduce((max, item) => Math.max(max, item.section.length), 0);
  const benchmarkLayout = getAdaptiveVerticalBarLayout(benchmarkData.length, longestBenchmarkLabel);

  return (
    <div className="space-y-6 min-w-0">
      {/* Selection & Overview Header */}
      {!readOnlySelection && (
        <Card className="card-flat transition-all duration-200 hover:shadow-md hover:border-[#0F766E]/30">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold text-[#1F2A2A]">{t("tabs.facilities.select")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <Select
                value={String(currentFacility.id)}
                onValueChange={(value) => onSelect(Number(value))}
                disabled={readOnlySelection}
              >
                <SelectTrigger className="w-full sm:w-96 bg-white border-[#E2E8E5]">
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
            </div>
          </CardContent>
        </Card>
      )}

      {/* Hero Facility Details */}
      <Card className="card-flat overflow-hidden transition-all duration-200 hover:shadow-md hover:border-[#0F766E]/30">
        <div className="h-2 w-full bg-gradient-to-r from-[#0F766E] to-[#5E7A8A]" />
        <CardHeader className="pb-2">
          <InfoTitle title={t("facilities.information")} info={t("info.facilityDiagnostics")} />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-3 flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-2xl font-bold tracking-tight text-[#1F2A2A]">{currentFacility.name}</h2>
                <RiskBadge level={currentFacility.riskLevel} label={t(`risk.${currentFacility.riskLevel.toLowerCase()}`)} />
              </div>
              <div className="flex flex-wrap items-center gap-3 text-sm text-[#6B7C72]">
                <span className="flex items-center gap-1.5 bg-[#F5F7F6] px-2.5 py-1 rounded-md">
                  <MapPin className="h-4 w-4 text-[#0F766E]" />
                  {currentFacility.basedOn ?? currentFacility.location ?? t("facilities.noData")}
                </span>
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                <Badge variant="secondary" className="bg-[#E2E8E5]/50 text-[#1F2A2A]">{currentFacility.species ?? t("facilities.noData")}</Badge>
                <Badge variant="outline" className="border-[#E2E8E5] text-[#6B7C72]">{currentFacility.productionSystem ?? t("facilities.noData")}</Badge>
                <Badge variant="outline" className="border-[#E2E8E5] text-[#6B7C72]">{currentFacility.productionType ?? t("facilities.noData")}</Badge>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center rounded-2xl bg-[#F5F7F6] border border-[#E2E8E5] px-8 py-6 shrink-0">
              <span className="text-sm font-medium uppercase tracking-wider text-[#6B7C72] mb-1">{t("table.score")}</span>
              <div className="flex items-baseline gap-1">
                <span
                  className={`text-5xl font-black font-scientific ${
                    currentFacility.score >= 70
                      ? "text-[#15803D]"
                      : currentFacility.score >= 50
                      ? "text-[#B7791F]"
                      : "text-[#BE123C]"
                  }`}
                >
                  {currentFacility.score}
                </span>
                <span className="text-lg font-medium text-[#6B7C72]">/100</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Core Insights */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Benchmark against average */}
        <Card className="card-flat lg:col-span-2 transition-all duration-200 hover:shadow-md hover:border-[#0F766E]/30">
          <CardHeader className="pb-2">
            <InfoTitle title={t("facilities.benchmark")} info={t("info.facilityBenchmark")} />
          </CardHeader>
          <CardContent className="h-[340px] md:h-[380px] xl:h-[420px]">
            <div role="img" aria-label={`${t("facilities.benchmark")}. ${benchmarkData.length} sections compared against the network average.`} className="h-full w-full">
              <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 500, height: 300 }}>
                <BarChart data={benchmarkData} layout="vertical" margin={{ left: 8, right: 20, top: 10, bottom: 10 }} barGap={2} barSize={benchmarkLayout.barSize}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--color-border-subtle)" />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: "var(--color-text-secondary)" }} tickLine={false} axisLine={false} />
                <YAxis
                  type="category"
                  dataKey="section"
                  width={Math.min(132, benchmarkLayout.yAxisWidth)}
                  tick={{ fontSize: 11, fill: "var(--color-text-secondary)" }}
                  tickFormatter={(value: string) => truncateChartLabel(value, 22)}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={CHART_TOOLTIP_STYLE}
                  cursor={CHART_TOOLTIP_CURSOR}
                  formatter={(value) => [`${value}/100`, t("table.score")]}
                />
                <Bar dataKey="average" name={t("facilities.networkAverage")} radius={[0, 4, 4, 0]} maxBarSize={12}>
                  {benchmarkData.map((entry) => (
                    <Cell key={`${entry.section}-average`} fill={entry.side === "external" ? AVERAGE_COLORS.external : AVERAGE_COLORS.internal} />
                  ))}
                </Bar>
                <Bar dataKey="facility" name={t("table.facility")} radius={[0, 4, 4, 0]} maxBarSize={12}>
                  {benchmarkData.map((entry) => (
                    <Cell key={`${entry.section}-facility`} fill={entry.side === "external" ? FACILITY_COLORS.external : FACILITY_COLORS.internal} />
                  ))}
                  <LabelList dataKey="facility" position="right" fontSize={10} fill="#1F2A2A" fontWeight={600} />
                </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Quick Info */}
        <Card className="card-flat transition-all duration-200 hover:shadow-md hover:border-[#0F766E]/30">
          <CardHeader className="pb-2">
            <InfoTitle title={t("facilities.quickInfo")} info={t("info.facilityDiagnostics")} />
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <InfoRow label={t("facilities.yearsOperation")} value={currentFacility.yearsOperation ?? t("facilities.noData")} />
            <Separator className="bg-[#E2E8E5]" />
            <InfoRow label={t("facilities.species")} value={currentFacility.species ?? t("facilities.noData")} />
            <Separator className="bg-[#E2E8E5]" />
            <InfoRow label={t("facilities.waterSource")} value={currentFacility.waterSource ?? t("facilities.noData")} />
            <Separator className="bg-[#E2E8E5]" />
            <InfoRow label={t("facilities.waterMonitoring")} value={currentFacility.waterMonitoringFrequency ?? t("facilities.noData")} />
          </CardContent>
        </Card>
      </div>

      {/* Risks & Suggestions (Prioritized for Producer) */}
      <h3 className="text-xl font-semibold text-[#1F2A2A] tracking-tight pt-4">{t("tabs.risk")} & Sugerencias</h3>
      <div className="grid gap-6 lg:grid-cols-3">
        <RiskCard
          color="rose"
          icon={<AlertTriangle className="h-5 w-5 text-[#BE123C]" />}
          title={t("facilities.risks.high")}
          items={currentFacility.highRiskFactors}
          emptyLabel={t("facilities.noData")}
        />
        <RiskCard
          color="amber"
          icon={<AlertCircle className="h-5 w-5 text-[#B7791F]" />}
          title={t("facilities.risks.medium")}
          items={currentFacility.moderateRiskFactors}
          emptyLabel={t("facilities.noData")}
        />
        <RiskCard
          color="emerald"
          icon={<CheckCircle2 className="h-5 w-5 text-[#15803D]" />}
          title={t("facilities.risks.positive")}
          items={currentFacility.positivePractices}
          emptyLabel={t("facilities.noData")}
        />
      </div>

      {/* Operational Details */}
      <h3 className="text-xl font-semibold text-[#1F2A2A] tracking-tight pt-4">{t("tabs.operational")}</h3>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="card-flat transition-all duration-200 hover:shadow-md hover:border-[#0F766E]/30">
          <CardHeader className="pb-2">
            <InfoTitle title={t("facilities.keyPractices")} info={t("info.practiceCoverage")} />
          </CardHeader>
          <CardContent className="space-y-3">
            {currentFacility.keyPractices.map((practice) => (
              <RuleRow key={practice.id} rule={practice} t={t} />
            ))}
          </CardContent>
        </Card>

        <Card className="card-flat transition-all duration-200 hover:shadow-md hover:border-[#0F766E]/30">
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

      {/* Full Checklist */}
      <Card className="card-flat transition-all duration-200 hover:shadow-md hover:border-[#0F766E]/30">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-[#6B7C72]" />
            <InfoTitle title={t("facilities.subcategoryChecklist")} info={t("info.subcategoryChecklist")} />
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {currentFacility.subcategoryChecklist.map((subcategory) => (
            <div key={subcategory.section} className="rounded-xl border border-[#E2E8E5] overflow-hidden">
              <div className="flex items-center justify-between border-b border-[#E2E8E5] bg-[#F5F7F6] px-5 py-3">
                <h4 className="text-sm font-semibold text-[#1F2A2A]">{subcategory.section}</h4>
                <Badge variant="outline" className={subcategory.side === "external" ? "border-[#0F766E] text-[#0F766E]" : "border-[#5E7A8A] text-[#5E7A8A]"}>
                  {subcategory.side === "external" ? t("overview.external") : t("overview.internal")}
                </Badge>
              </div>
              <div className="overflow-x-auto hide-scrollbar">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-[#E2E8E5]">
                      <TableHead className="text-[#6B7C72]">{t("table.question")}</TableHead>
                      <TableHead className="text-[#6B7C72]">{t("table.answer")}</TableHead>
                      <TableHead className="w-[140px] text-[#6B7C72]">{t("table.status")}</TableHead>
                      <TableHead className="text-[#6B7C72]">{t("table.recommendation")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subcategory.items.map((item) => (
                      <TableRow key={`${subcategory.section}-${item.id}`} className="border-[#E2E8E5]">
                        <TableCell className="font-medium text-[#1F2A2A]">{item.label}</TableCell>
                        <TableCell className="text-[#6B7C72]">{item.answer}</TableCell>
                        <TableCell>
                          {!item.applicable ? (
                            <Badge variant="secondary" className="bg-[#E2E8E5]/50 text-[#6B7C72]">{t("status.notApplicable")}</Badge>
                          ) : item.compliant ? (
                            <Badge variant="secondary" className="bg-[#F0FDF4] text-[#15803D] border border-[#15803D]/20">
                              {t("status.compliant")}
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-[#FEF2F2] text-[#BE123C] border border-[#BE123C]/20">
                              {t("status.nonCompliant")}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-[#6B7C72] text-sm">{item.recommendation}</TableCell>
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
    <div className="flex justify-between gap-4 items-center">
      <span className="text-[#6B7C72] text-sm">{label}</span>
      <span className="text-right font-medium text-[#1F2A2A]">{value}</span>
    </div>
  );
}

function RuleRow({ rule, t }: { rule: RuleStatus; t: (key: string) => string }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 rounded-xl border border-[#E2E8E5] px-4 py-3 bg-[#F5F7F6]/30">
      <div className="space-y-1.5 flex-1">
        <p className="text-sm font-medium text-[#1F2A2A]">{rule.label}</p>
        <p className="text-xs text-[#6B7C72] flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#5E7A8A]" />
          {t("table.answer")}: <span className="font-medium">{rule.answer}</span>
        </p>
      </div>
      <div className="shrink-0 mt-2 sm:mt-0">
        {!rule.applicable ? (
          <Badge variant="secondary" className="bg-[#E2E8E5]/50 text-[#6B7C72]">{t("status.notApplicable")}</Badge>
        ) : rule.matched ? (
          <Badge variant="secondary" className="bg-[#F0FDF4] text-[#15803D] border border-[#15803D]/20">
            {t("status.yes")}
          </Badge>
        ) : (
          <Badge variant="secondary" className="bg-[#FEF2F2] text-[#BE123C] border border-[#BE123C]/20">
            {t("status.no")}
          </Badge>
        )}
      </div>
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
    rose: "border-t-4 border-t-[#BE123C]",
    amber: "border-t-4 border-t-[#B7791F]",
    emerald: "border-t-4 border-t-[#15803D]",
  }[color];
  const IconBullet = color === "rose" ? AlertTriangle : color === "amber" ? AlertCircle : CheckCircle2;
  const iconColor = color === "rose" ? "text-[#BE123C]" : color === "amber" ? "text-[#B7791F]" : "text-[#15803D]";
  const bgClass = color === "rose" ? "hover:border-[#BE123C]/30" : color === "amber" ? "hover:border-[#B7791F]/30" : "hover:border-[#15803D]/30";
  return (
    <Card className={`card-flat transition-all duration-200 hover:shadow-md ${border} ${bgClass}`}>
      <CardHeader className="pb-3 bg-[#F5F7F6]/50 rounded-t-xl">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-white rounded-lg shadow-sm border border-[#E2E8E5]">{icon}</div>
          <CardTitle className="text-base font-semibold text-[#1F2A2A]">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        {items.length > 0 ? (
          <ul className="space-y-3">
            {items.map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-sm text-[#1F2A2A]">
                <IconBullet className={`mt-0.5 h-4 w-4 shrink-0 ${iconColor}`} />
                <span className="leading-snug">{item}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-[#6B7C72] italic">{emptyLabel}</p>
        )}
      </CardContent>
    </Card>
  );
}
