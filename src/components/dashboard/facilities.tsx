"use client";

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import type { ReactNode } from "react";
import { AlertCircle, AlertTriangle, ArrowUp, CheckCircle2, ClipboardList, MapPin, Search, Filter, X, Building2, Lightbulb } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getAdaptiveVerticalBarLayout } from "@/components/charts/chart-card";
import { EChartsChart } from "@/components/charts/echarts-chart";
import { useChartTheme } from "@/hooks/useChartTheme";
import { buildExternalInternalComparisonOption, buildHorizontalGroupedBarOption, buildSectionRadarOption } from "@/lib/chart-options";
import { buildSectionRadarData } from "@/lib/chart-data/section-radar";
import type { SectionRadarData } from "@/lib/chart-data/section-radar";
import type { AppRole } from "@/lib/access-control";
import { PrintReportButton } from "./print-report-button";
import { resolveMixedColor } from "@/lib/chart-theme";
import type { AppLocale } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import type { DashboardData, FacilitySummary, RuleStatus, SubcategoryChecklist } from "@/lib/kobo";
import { translateSectionLabel } from "@/lib/section-labels";
import { RiskBadge } from "./cards";
import { InfoTitle } from "./info-title";
import { ActionPlanCard } from "./action-plan-card";
import { ChartDataTable } from "@/components/charts/chart-data-table";

type Props = {
  facilities: FacilitySummary[];
  currentFacility?: FacilitySummary;
  onSelect: (id: number) => void;
  t: (key: string, values?: Record<string, string | number>) => string;
  sectionAverages: DashboardData["sectionAverages"];
  networkStats?: DashboardData["stats"];
  readOnlySelection?: boolean;
  isProducerView?: boolean;
  role?: AppRole;
  locale?: AppLocale;
};

function buildRadarTableRows(data: SectionRadarData): (string | number)[][] {
  return data.indicators.map((indicator, index) => [
    indicator.name,
    data.series[0]?.values[index] ?? 0,
    data.series[1]?.values[index] ?? 0,
  ]);
}

export function FacilitiesView({
  facilities,
  currentFacility,
  onSelect,
  t,
  sectionAverages,
  networkStats,
  readOnlySelection = false,
  isProducerView = false,
  role = "admin",
  locale = "en",
}: Props) {
  const { colors } = useChartTheme();
  const peerAverage = useMemo(() => {
    if (sectionAverages.length === 0) return undefined;
    return Math.round(sectionAverages.reduce((acc, s) => acc + s.score, 0) / sectionAverages.length);
  }, [sectionAverages]);

  const actionItems = useMemo(() => {
    if (!currentFacility) return [];
    return currentFacility.subcategoryChecklist
      .flatMap((sub) => sub.items.map((item) => ({ ...item, section: sub.section })))
      .filter((item) => item.applicable && !item.compliant && item.recommendation)
      .map((item, index) => ({
        priority: index + 1,
        label: item.label,
        section: translateSectionLabel(item.section, t),
        recommendation: item.recommendation,
      }))
      .slice(0, 3);
  }, [currentFacility, t]);

  const benchmarkData = useMemo(() => {
    if (!currentFacility) return [];
    return currentFacility.sectionScores.map((section) => {
      const average =
        sectionAverages.find((item) => item.section === section.section && item.side === section.side)?.score ?? 0;
      return {
        section: translateSectionLabel(section.section, t),
        side: section.side,
        facility: section.score,
        average,
      };
    });
  }, [currentFacility, sectionAverages, t]);

  const benchmarkOption = useMemo(() => {
    if (benchmarkData.length === 0) return undefined;
    const externalAvg = resolveMixedColor("--color-brand", 60);
    const internalAvg = resolveMixedColor("--color-chart-8", 60);
    const chart8 = colors.chart[7] ?? colors.brand;
    const longestBenchmarkLabel = benchmarkData.reduce((max, item) => Math.max(max, item.section.length), 0);
    const benchmarkLayout = getAdaptiveVerticalBarLayout(benchmarkData.length, longestBenchmarkLabel);

    return buildHorizontalGroupedBarOption({
      categories: benchmarkData.map((entry) => entry.section),
      series: [
        {
          name: t("facilities.networkAverage"),
          values: benchmarkData.map((entry) => entry.average),
          colors: benchmarkData.map((entry) => (entry.side === "external" ? externalAvg : internalAvg)),
        },
        {
          name: t("table.facility"),
          values: benchmarkData.map((entry) => entry.facility),
          colors: benchmarkData.map((entry) => (entry.side === "external" ? colors.brand : chart8)),
        },
      ],
      colors,
      yAxisWidth: Math.min(132, benchmarkLayout.yAxisWidth),
      scoreLabel: t("table.facility"),
    });
  }, [benchmarkData, colors, t]);

  const externalInternalOption = useMemo(() => {
    if (!currentFacility) return undefined;
    return buildExternalInternalComparisonOption({
      externalScore: currentFacility.externalScore,
      internalScore: currentFacility.internalScore,
      colors,
      externalLabel: t("overview.external"),
      internalLabel: t("overview.internal"),
    });
  }, [colors, currentFacility, t]);

  const externalRadarData = useMemo(() => {
    if (!currentFacility) return undefined;
    return buildSectionRadarData(
      [
        { name: currentFacility.name, sectionScores: currentFacility.sectionScores, side: "external" },
        { name: t("facilities.networkAverage"), sectionScores: sectionAverages.map((item) => ({ section: item.section, side: item.side, score: item.score, positives: 0, total: 0 })), side: "external" },
      ],
      "external",
      t,
    );
  }, [currentFacility, sectionAverages, t]);

  const internalRadarData = useMemo(() => {
    if (!currentFacility) return undefined;
    return buildSectionRadarData(
      [
        { name: currentFacility.name, sectionScores: currentFacility.sectionScores, side: "internal" },
        { name: t("facilities.networkAverage"), sectionScores: sectionAverages.map((item) => ({ section: item.section, side: item.side, score: item.score, positives: 0, total: 0 })), side: "internal" },
      ],
      "internal",
      t,
    );
  }, [currentFacility, sectionAverages, t]);

  const externalRadarOption = useMemo(
    () => (externalRadarData ? buildSectionRadarOption({ data: externalRadarData, colors }) : undefined),
    [colors, externalRadarData],
  );
  const internalRadarOption = useMemo(
    () => (internalRadarData ? buildSectionRadarOption({ data: internalRadarData, colors }) : undefined),
    [colors, internalRadarData],
  );

  if (!currentFacility) return null;

  return (
    <div className="space-y-6 min-w-0">
      {/* Facility Selector - Enhanced for Admins */}
      {!readOnlySelection && (
        <FacilitySelector
          facilities={facilities}
          currentFacility={currentFacility}
          onSelect={onSelect}
          t={t}
        />
      )}

      {/* Hero Facility Details */}
      <Card className="card-flat overflow-hidden border-t-4 border-t-primary">
        <CardHeader className="pb-2">
          <InfoTitle title={t("facilities.information")} info={t("info.facilityDiagnostics")} />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-3 flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-2xl font-bold tracking-tight text-foreground">{currentFacility.name}</h2>
                <RiskBadge level={currentFacility.riskLevel} label={t(`risk.${currentFacility.riskLevel.toLowerCase()}`)} />
              </div>
              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5 bg-background px-2.5 py-1 rounded-md">
                  <MapPin className="h-4 w-4 text-primary" />
                  {currentFacility.basedOn ?? currentFacility.location ?? t("facilities.noData")}
                </span>
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                <Badge variant="secondary" className="bg-popover text-foreground">{currentFacility.species ?? t("facilities.noData")}</Badge>
                <Badge variant="outline" className="border-border text-muted-foreground">{currentFacility.productionSystem ?? t("facilities.noData")}</Badge>
                <Badge variant="outline" className="border-border text-muted-foreground">{currentFacility.productionType ?? t("facilities.noData")}</Badge>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center rounded-2xl bg-background border border-border px-8 py-6 shrink-0">
              <span className="text-sm font-medium uppercase tracking-wider text-muted-foreground mb-1">{t("table.score")}</span>
              <div className="flex items-baseline gap-1">
                <span
                  className={`text-5xl font-black font-scientific ${
                    currentFacility.score >= 70
                      ? "text-success"
                      : currentFacility.score >= 50
                      ? "text-warning"
                      : "text-destructive"
                  }`}
                >
                  {currentFacility.score}
                </span>
                <span className="text-lg font-medium text-muted-foreground">/100</span>
              </div>
              {isProducerView && (
                <p className="mt-2 text-xs text-muted-foreground text-center max-w-[200px]">
                  {currentFacility.score < 50
                    ? t("facilities.scoreHero.below50", { score: currentFacility.score })
                    : currentFacility.score < 70
                    ? t("facilities.scoreHero.below70", { score: currentFacility.score })
                    : t("facilities.scoreHero.good", { score: currentFacility.score })}
                </p>
              )}
              {isProducerView && peerAverage !== undefined && (
                <p className="mt-2 text-xs text-muted-foreground text-center max-w-[200px]">
                  {t("facilities.peerComparison", { score: currentFacility.score, peerAverage, species: currentFacility.species ?? "", region: currentFacility.basedOn ?? currentFacility.location ?? "" })}</p>
              )}
            </div>
          </div>

          {role !== "public" ? (
            <PrintReportButton
              facility={currentFacility}
              networkStats={networkStats}
              sectionAverages={sectionAverages}
              locale={locale}
              t={t}
            />
          ) : null}
        </CardContent>
      </Card>

      {/* External vs Internal + Radar */}
      <div className="grid gap-6 xl:grid-cols-2 2xl:grid-cols-3">
        <Card className="card-flat">
          <CardHeader className="pb-2">
            <InfoTitle title={t("facilities.externalInternalComparison")} info={t("info.facilityExternalInternal")} />
          </CardHeader>
          <CardContent className="h-[300px]">
            <EChartsChart option={externalInternalOption} />
            <ChartDataTable
              caption={t("facilities.externalInternalComparison")}
              headers={[t("charts.chartDataTableLabel"), t("charts.chartDataTableScore")]}
              rows={[
                [t("overview.external"), currentFacility.externalScore],
                [t("overview.internal"), currentFacility.internalScore],
              ]}
            />
          </CardContent>
        </Card>
        <Card className="card-flat">
          <CardHeader className="pb-2">
            <InfoTitle title={t("charts.sectionRadarExternal")} info={t("info.sectionRadarExternal")} />
          </CardHeader>
          <CardContent className="h-[300px]">
            <EChartsChart option={externalRadarOption} />
            {externalRadarData ? (
              <ChartDataTable
                caption={t("charts.sectionRadarExternal")}
                headers={[t("charts.chartDataTableSection"), t("table.facility"), t("facilities.networkAverage")]}
                rows={buildRadarTableRows(externalRadarData)}
              />
            ) : null}
          </CardContent>
        </Card>
        <Card className="card-flat">
          <CardHeader className="pb-2">
            <InfoTitle title={t("charts.sectionRadarInternal")} info={t("info.sectionRadarInternal")} />
          </CardHeader>
          <CardContent className="h-[300px]">
            <EChartsChart option={internalRadarOption} />
            {internalRadarData ? (
              <ChartDataTable
                caption={t("charts.sectionRadarInternal")}
                headers={[t("charts.chartDataTableSection"), t("table.facility"), t("facilities.networkAverage")]}
                rows={buildRadarTableRows(internalRadarData)}
              />
            ) : null}
          </CardContent>
        </Card>
      </div>

      {/* Core Insights */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Benchmark against average */}
        <Card className="card-flat lg:col-span-2">
          <CardHeader className="pb-2">
            <InfoTitle title={t("facilities.benchmark")} info={t("info.facilityBenchmark")} />
          </CardHeader>
          <CardContent className="h-[340px] md:h-[380px] xl:h-[420px]">
            <div role="img" aria-label={`${t("facilities.benchmark")}. ${benchmarkData.length} ${t("facilities.benchmarkAriaSuffix")}`} className="h-full w-full">
              <EChartsChart option={benchmarkOption} />
            </div>
            <ChartDataTable
              caption={t("facilities.benchmark")}
              headers={[t("charts.chartDataTableSection"), t("charts.chartDataTableScore"), t("charts.chartDataTableAverage")]}
              rows={benchmarkData.map((d) => [d.section, d.facility, d.average])}
            />
          </CardContent>
        </Card>

        {/* Quick Info / Action Plan */}
        {isProducerView ? (
          <ActionPlanCard items={actionItems} t={t} />
        ) : (
          <Card className="card-flat">
            <CardHeader className="pb-2">
              <InfoTitle title={t("facilities.quickInfo")} info={t("info.facilityDiagnostics")} />
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <InfoRow label={t("facilities.yearsOperation")} value={currentFacility.yearsOperation ?? t("facilities.noData")} />
              <Separator className="bg-[var(--color-border-subtle)]" />
              <InfoRow label={t("facilities.species")} value={currentFacility.species ?? t("facilities.noData")} />
              <Separator className="bg-[var(--color-border-subtle)]" />
              <InfoRow label={t("facilities.waterSource")} value={currentFacility.waterSource ?? t("facilities.noData")} />
              <Separator className="bg-[var(--color-border-subtle)]" />
              <InfoRow label={t("facilities.waterMonitoring")} value={currentFacility.waterMonitoringFrequency ?? t("facilities.noData")} />
            </CardContent>
          </Card>
        )}
      </div>

      {/* Risks & Suggestions (Prioritized for Producer) */}
      <h3 className="text-xl font-semibold text-foreground tracking-tight pt-4">{t("facilities.riskAndSuggestions")}</h3>
      <div className="grid gap-6 lg:grid-cols-3">
        <RiskCard
          color="rose"
          icon={<AlertTriangle className="h-5 w-5" />}
          title={t("facilities.risks.high")}
          items={currentFacility.highRiskFactors}
          emptyLabel={t("facilities.noData")}
        />
        <RiskCard
          color="amber"
          icon={<AlertCircle className="h-5 w-5" />}
          title={t("facilities.risks.medium")}
          items={currentFacility.moderateRiskFactors}
          emptyLabel={t("facilities.noData")}
        />
        <RiskCard
          color="emerald"
          icon={<CheckCircle2 className="h-5 w-5" />}
          title={t("facilities.risks.positive")}
          items={currentFacility.positivePractices}
          emptyLabel={t("facilities.noData")}
        />
      </div>

      {/* Operational Details */}
      <h3 className="text-xl font-semibold text-foreground tracking-tight pt-4">{t("tabs.operational")}</h3>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="card-flat">
          <CardHeader className="pb-2">
            <InfoTitle title={t("facilities.keyPractices")} info={t("info.practiceCoverage")} />
          </CardHeader>
          <CardContent className="space-y-3">
            {currentFacility.keyPractices.map((practice) => (
              <RuleRow key={practice.id} rule={practice} t={t} />
            ))}
          </CardContent>
        </Card>

        <Card className="card-flat">
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

      {/* Full Checklist - Redesigned with Sticky Navigation and Cards */}
      <div className="card-flat overflow-hidden gap-0 py-0 shadow-none">
        <div className="border-b border-border px-5 py-4">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-muted-foreground" />
            <InfoTitle title={t("facilities.subcategoryChecklist")} info={t("info.subcategoryChecklist")} />
          </div>
        </div>
        <ChecklistView 
          checklist={currentFacility.subcategoryChecklist} 
          t={t} 
        />
      </div>
    </div>
  );
}

// New Checklist View Component with Simple Navigation and Cards
function ChecklistView({ 
  checklist, 
  t 
}: { 
  checklist: SubcategoryChecklist[]; 
  t: (key: string) => string;
}) {
  const [activeSection, setActiveSection] = useState<string>(checklist[0]?.section ?? "");
  const sectionRefs = useRef<Map<string, HTMLElement>>(new Map());
  const containerRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Calculate compliance stats for each section
  const sectionStats = useMemo(() => {
    return checklist.map(subcategory => {
      const total = subcategory.items.length;
      const compliant = subcategory.items.filter(item => item.compliant).length;
      const nonCompliant = subcategory.items.filter(item => !item.compliant && item.applicable).length;
      const notApplicable = subcategory.items.filter(item => !item.applicable).length;
      return {
        section: subcategory.section,
        side: subcategory.side,
        total,
        compliant,
        nonCompliant,
        notApplicable
      };
    });
  }, [checklist]);

  // Simple scroll to section - NO intersection observer to avoid scroll jumping
  const scrollToSection = useCallback((section: string) => {
    setActiveSection(section);
    const element = sectionRefs.current.get(section);
    if (element) {
      // Use native scroll with offset for the nav bar height
      const navHeight = 120; // Approximate height of nav bar + padding
      const elementPosition = element.getBoundingClientRect().top + window.scrollY;
      const offsetPosition = elementPosition - navHeight;
      
      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
    }
  }, []);

  const setSectionRef = useCallback((section: string) => (el: HTMLElement | null) => {
    if (el) {
      sectionRefs.current.set(section, el);
    }
  }, []);

  return (
    <div ref={containerRef} className="relative">
      {/* Section Header with Navigation Hint */}
      <div className="bg-background px-4 py-3 border-b border-border">
        <p className="text-sm text-muted-foreground">
          {t("checklist.navigationHint")}
        </p>
      </div>

      {/* Horizontal Scrollable Navigation */}
      <div id="checklist-nav-bar" className="bg-card border-b border-border sticky top-0 z-30 shadow-sm">
        <div className="flex gap-3 p-4 overflow-x-auto scroll-smooth snap-x">
          {sectionStats.map((stats) => {
            const isActive = activeSection === stats.section;
            const isExternal = stats.side === "external";
            
            return (
              <button
                key={stats.section}
                onClick={() => scrollToSection(stats.section)}
                className={cn(
                  "group flex items-center gap-3 px-4 py-3 rounded-lg border-2 transition-all duration-200 snap-start shrink-0",
                  "hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2",
                  isActive 
                    ? isExternal 
                      ? "border-primary bg-primary/10 shadow-md" 
                      : "border-[var(--color-chart-8)] bg-[var(--color-chart-8)]/10 shadow-md"
                    : "border-border bg-card hover:border-primary/60 hover:bg-background",
                  isExternal ? "focus:ring-[var(--color-brand)]/50" : "focus:ring-[var(--color-chart-8)]/50"
                )}
              >
                {/* Side indicator dot */}
                <div className={cn(
                  "w-3 h-3 rounded-full shrink-0",
                  isExternal ? "bg-primary" : "bg-[var(--color-chart-8)]",
                  isActive && "ring-2 ring-offset-1 ring-[var(--color-text-primary)]/20"
                )} />
                
                <div className="flex flex-col items-start">
                  <span className={cn(
                    "text-sm font-semibold leading-tight whitespace-nowrap",
                    isActive ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
                  )}>
                    {translateSectionLabel(stats.section, t)}
                  </span>
                  <div className="flex items-center gap-2 text-2xs mt-0.5">
                    <span className={cn(
                      "font-medium",
                      stats.compliant === (stats.total - stats.notApplicable) 
                        ? "text-success" 
                        : isActive ? "text-foreground" : "text-muted-foreground"
                    )}>
                      {stats.compliant}/{stats.total - stats.notApplicable}
                    </span>
                    {stats.nonCompliant > 0 && (
                      <span className="text-destructive font-semibold flex items-center gap-0.5">
                        <AlertCircle className="h-3 w-3" />
                        {stats.nonCompliant}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
      <div ref={sentinelRef} className="h-0" aria-hidden="true" />

      {/* Section Content with Cards Grid */}
      <div className="bg-card px-4 py-6 space-y-10">
        {checklist.map((subcategory, index) => (
          <section
            key={subcategory.section}
            ref={setSectionRef(subcategory.section)}
            data-section={subcategory.section}
            className={cn(
              index > 0 && "pt-8 border-t-2 border-border"
            )}
          >
            {/* Section Header - Prominent */}
            <div className={cn(
              "flex items-center gap-3 mb-6 p-4 rounded-xl",
              subcategory.side === "external" 
                ? "bg-primary/8 border border-primary/20" 
                : "bg-[var(--color-chart-8)]/8 border border-[var(--color-chart-8)]/20"
            )}>
              <div className={cn(
                "w-1.5 h-8 rounded-full",
                subcategory.side === "external" ? "bg-primary" : "bg-[var(--color-chart-8)]"
              )} />
              <div className="flex-1">
                <h4 className="text-lg font-bold text-foreground">{translateSectionLabel(subcategory.section, t)}</h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {subcategory.items.length} {t("checklist.questions")} • {subcategory.items.filter((i) => i.compliant).length} {t("checklist.compliant")}
                </p>
              </div>
              <Badge 
                variant="outline" 
                className={cn(
                  "text-xs px-2 py-1",
                  subcategory.side === "external" 
                    ? "border-primary text-primary bg-card font-semibold" 
                    : "border-[var(--color-chart-8)] text-[var(--color-chart-8)] bg-card font-semibold"
                )}
              >
                {subcategory.side === "external" ? t("overview.external") : t("overview.internal")}
              </Badge>
            </div>

            {/* Cards Grid */}
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
              {subcategory.items.map((item) => (
                <ChecklistCard key={item.id} item={item} t={t} />
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* Back to Top Button */}
      <ChecklistBackToTopButton containerRef={containerRef} sentinelRef={sentinelRef} t={t} />
    </div>
  );
}

// Back to Top Button Component
function ChecklistBackToTopButton({ 
  containerRef,
  sentinelRef,
  t
}: { 
  containerRef: React.RefObject<HTMLDivElement | null>;
  sentinelRef: React.RefObject<HTMLDivElement | null>;
  t: (key: string) => string;
}) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(!entry.isIntersecting && entry.boundingClientRect.top < 0);
      },
      { threshold: 0 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [sentinelRef]);

  const scrollToTop = () => {
    const container = containerRef.current;
    if (container) {
      const rect = container.getBoundingClientRect();
      const absoluteTop = rect.top + window.scrollY;
      window.scrollTo({
        top: absoluteTop - 80,
        behavior: "smooth"
      });
    }
  };

  if (!isVisible) return null;

  return (
    <button
      onClick={scrollToTop}
      className={cn(
        "fixed bottom-6 right-6 z-[35] flex items-center gap-2 px-4 py-3 rounded-full",
        "btn-brand shadow-lg",
        "transition-all duration-300 hover:shadow-xl hover:scale-105",
        "focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)]/50 focus:ring-offset-2"
      )}
      aria-label={t("checklist.backToSections")}
    >
      <ArrowUp className="h-4 w-4" />
      <span className="text-sm font-medium">{t("checklist.backToSections")}</span>
    </button>
  );
}

// Individual Checklist Card Component
function ChecklistCard({ 
  item, 
  t 
}: { 
  item: SubcategoryChecklist["items"][0]; 
  t: (key: string) => string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-3 sm:p-4">
      {/* Question */}
      <h5 className="text-sm font-medium text-foreground leading-relaxed mb-3">
        {item.label}
      </h5>

      {/* Answer & Status Row */}
      <div className="flex items-center justify-between gap-3 mb-3 pb-3 border-b border-border/60">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">{t("table.answer")}:</span>
          <span className="font-medium text-foreground">{item.answer}</span>
        </div>
        
        {!item.applicable ? (
          <Badge variant="secondary" className="bg-popover text-muted-foreground text-xs">
            {t("status.notApplicable")}
          </Badge>
        ) : item.compliant ? (
          <Badge variant="secondary" className="bg-success/10 text-success border border-success/20 text-xs">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            {t("status.compliant")}
          </Badge>
        ) : (
          <Badge variant="secondary" className="bg-destructive/10 text-destructive border border-destructive/20 text-xs">
            <AlertCircle className="h-3 w-3 mr-1" />
            {t("status.nonCompliant")}
          </Badge>
        )}
      </div>

      {/* Recommendation */}
      {item.recommendation && (
        <div className="flex items-start gap-2 text-sm">
          <Lightbulb className="h-4 w-4 text-warning shrink-0 mt-0.5" />
          <div>
            <span className="text-warning font-medium text-xs uppercase tracking-wide">
              {t("table.recommendation")}
            </span>
            <p className="text-muted-foreground mt-0.5 leading-relaxed">
              {item.recommendation}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 items-center">
      <span className="text-muted-foreground text-sm">{label}</span>
      <span className="text-right font-medium text-foreground">{value}</span>
    </div>
  );
}

function RuleRow({ rule, t }: { rule: RuleStatus; t: (key: string) => string }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 rounded-xl border border-border px-4 py-3 bg-background">
      <div className="space-y-1.5 flex-1">
        <p className="text-sm font-medium text-foreground">{rule.label}</p>
        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-chart-8)]" />
          {t("table.answer")}: <span className="font-medium">{rule.answer}</span>
        </p>
      </div>
      <div className="shrink-0 mt-2 sm:mt-0">
        {!rule.applicable ? (
          <Badge variant="secondary" className="bg-popover text-muted-foreground">{t("status.notApplicable")}</Badge>
        ) : rule.matched ? (
          <Badge variant="secondary" className="bg-success/10 text-success border border-success/20">
            {t("status.yes")}
          </Badge>
        ) : (
          <Badge variant="secondary" className="bg-destructive/10 text-destructive border border-destructive/20">
            {t("status.no")}
          </Badge>
        )}
      </div>
    </div>
  );
}

const RISK_CARD_VARIANT = {
  rose: {
    accent: "border-t-[var(--color-danger)]",
    tint: "text-destructive",
    iconWrap: "border-destructive/20 bg-destructive/10",
    bullet: AlertTriangle,
  },
  amber: {
    accent: "border-t-[var(--color-warning)]",
    tint: "text-warning",
    iconWrap: "border-warning/20 bg-warning/10",
    bullet: AlertCircle,
  },
  emerald: {
    accent: "border-t-[var(--color-success)]",
    tint: "text-success",
    iconWrap: "border-success/20 bg-success/10",
    bullet: CheckCircle2,
  },
} as const;

function RiskCard({
  color,
  icon,
  title,
  items,
  emptyLabel,
}: {
  color: keyof typeof RISK_CARD_VARIANT;
  icon: ReactNode;
  title: string;
  items: string[];
  emptyLabel: string;
}) {
  const variant = RISK_CARD_VARIANT[color];
  const IconBullet = variant.bullet;

  return (
    <Card className={cn("card-flat gap-0 border-t-4 py-0 shadow-none", variant.accent)}>
      <CardHeader className="border-b border-border pb-4 pt-5">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border",
              variant.iconWrap,
              variant.tint,
            )}
          >
            {icon}
          </div>
          <CardTitle className="text-base font-semibold text-foreground">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="py-4">
        {items.length > 0 ? (
          <ul className="space-y-3">
            {items.map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                <IconBullet className={cn("mt-0.5 h-4 w-4 shrink-0", variant.tint)} aria-hidden />
                <span className="leading-snug text-foreground">{item}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground italic">{emptyLabel}</p>
        )}
      </CardContent>
    </Card>
  );
}

// Enhanced Facility Selector Component
type FacilitySelectorProps = {
  facilities: FacilitySummary[];
  currentFacility: FacilitySummary;
  onSelect: (id: number) => void;
  t: (key: string) => string;
};

function FacilitySelector({ facilities, currentFacility, onSelect, t }: FacilitySelectorProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [riskFilter, setRiskFilter] = useState<string>("all");
  const [isExpanded, setIsExpanded] = useState(true);

  // Filter facilities based on search and risk
  const filteredFacilities = useMemo(() => {
    return facilities.filter((facility) => {
      const matchesSearch = searchQuery === "" || 
        facility.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (facility.location && facility.location.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (facility.species && facility.species.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesRisk = riskFilter === "all" || facility.riskLevel === riskFilter;
      
      return matchesSearch && matchesRisk;
    });
  }, [facilities, searchQuery, riskFilter]);

  // Get unique risk levels for filter buttons
  const availableRisks = useMemo(() => {
    const risks = new Set(facilities.map(f => f.riskLevel));
    return Array.from(risks).sort();
  }, [facilities]);

  const getRiskColor = (level: string) => {
    switch (level) {
      case "HIGH": return "bg-destructive/10 text-destructive border-destructive/20";
      case "MEDIUM": return "bg-warning/10 text-warning border-warning/20";
      case "LOW": return "bg-success/10 text-success border-success/20";
      case "NEGLIGIBLE": return "bg-[var(--color-muted)]/10 text-muted-foreground border-[var(--color-border-default)]";
      default: return "bg-[var(--color-muted)]/10 text-muted-foreground border-[var(--color-border-default)]";
    }
  };

  const getRiskDot = (level: string) => {
    switch (level) {
      case "HIGH": return "bg-destructive";
      case "MEDIUM": return "bg-warning";
      case "LOW": return "bg-success";
      case "NEGLIGIBLE": return "bg-[var(--color-muted)]";
      default: return "bg-[var(--color-muted)]";
    }
  };

  // When facility is selected, collapse the selector
  const handleSelect = (id: number) => {
    onSelect(id);
    setIsExpanded(false);
  };

  return (
    <Card className="card-flat-interactive">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            <CardTitle className="text-base font-semibold text-foreground">
              {t("tabs.facilitiesSelect")}
              {!isExpanded && (
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  ({t("table.facilities")}: {facilities.length})
                </span>
              )}
            </CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {!isExpanded && currentFacility && (
              <span className="hidden sm:inline text-sm text-muted-foreground mr-2">
                {currentFacility.name}
              </span>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="min-h-11 gap-1.5 text-xs"
            >
              {isExpanded ? (
                <>
                  <X className="h-3.5 w-3.5" />
                  {t("facilities.selector.hide")}
                </>
              ) : (
                <>
                  <Filter className="h-3.5 w-3.5" />
                  {t("facilities.selector.show")}
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`${t("actions.search")} ${t("table.facilities")}...`}
              aria-label={t("actions.searchFacilities")}
              className="pl-10 bg-card border-border"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                aria-label={t("actions.clearSearch")}
                className="absolute right-1 top-1/2 -translate-y-1/2 h-11 w-11 flex items-center justify-center rounded-full hover:bg-background"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
          </div>

          {/* Risk Filter Buttons */}
          <div className="flex flex-wrap gap-2 pb-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRiskFilter("all")}
                className={cn(
                  "min-h-11 text-xs border-border",
                  riskFilter === "all" && "bg-primary text-primary-foreground border-primary"
                )}
              >
                {t("overview.filterAll")}
              </Button>
              {availableRisks.map((risk) => (
              <Button
                key={risk}
                variant="outline"
                size="sm"
                onClick={() => setRiskFilter(risk)}
                className={cn(
                  "min-h-11 text-xs border-border gap-1.5",
                  riskFilter === risk && getRiskColor(risk)
                )}
              >
                  <span className={cn("h-2 w-2 rounded-full", getRiskDot(risk))} />
                  {t(`risk.${risk.toLowerCase()}`)}
                </Button>
              ))}
            </div>

          {/* Facilities List */}
          <div className="border rounded-lg overflow-hidden">
            <div className="max-h-[280px] overflow-y-auto">
              {filteredFacilities.length === 0 ? (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  {t("charts.noData")}
                </div>
              ) : (
                <div className="divide-y">
                  {filteredFacilities.map((facility) => (
                    <button
                      key={facility.id}
                      onClick={() => handleSelect(facility.id)}
                      className={cn(
                        "w-full px-4 py-3 flex items-center gap-3 text-left transition-colors hover:bg-background",
                        currentFacility.id === facility.id && "bg-primary/5 border-l-2 border-l-primary"
                      )}
                    >
                      {/* Selection indicator */}
                      <div className={cn(
                        "h-4 w-4 rounded-full border-2 flex-shrink-0",
                        currentFacility.id === facility.id
                          ? "border-primary bg-primary"
                          : "border-border"
                      )}>
                        {currentFacility.id === facility.id && (
                          <CheckCircle2 className="h-3.5 w-3.5 text-[var(--color-text-inverse)]" />
                        )}
                      </div>

                      {/* Facility info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm text-foreground truncate">
                            {facility.name}
                          </span>
                          <span className={cn("h-2 w-2 rounded-full flex-shrink-0", getRiskDot(facility.riskLevel))} />
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                          <span>{facility.location || facility.basedOn}</span>
                          {facility.species && (
                            <>
                              <span>•</span>
                              <span>{facility.species}</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Score badge */}
                      <div className={cn(
                        "flex-shrink-0 text-xs font-semibold px-2 py-1 rounded",
                        facility.score >= 70 ? "bg-success/10 text-success" :
                        facility.score >= 50 ? "bg-warning/10 text-warning" :
                        "bg-destructive/10 text-destructive"
                      )}>
                        {facility.score}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Quick stats */}
          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-1">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-destructive" />
              {facilities.filter(f => f.riskLevel === "HIGH").length} {t("metrics.high.title")}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-warning" />
              {facilities.filter(f => f.riskLevel === "MEDIUM").length} {t("metrics.medium.title")}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-success" />
              {facilities.filter(f => f.riskLevel === "LOW" || f.riskLevel === "NEGLIGIBLE").length} {t("metrics.low.title")}
            </span>
          </div>
        </CardContent>
      )}
      
      {/* Collapsed view summary */}
      {!isExpanded && currentFacility && (
        <CardContent className="pt-0 pb-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-background border border-border">
            <div className={cn(
              "h-3 w-3 rounded-full",
              getRiskDot(currentFacility.riskLevel)
            )} />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm text-foreground truncate">
                {currentFacility.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {t("facilities.selector.selected")} • {t("table.score")}: {currentFacility.score}/100
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(true)}
              className="min-h-11 text-xs shrink-0"
            >
              {t("facilities.selector.show")}
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
