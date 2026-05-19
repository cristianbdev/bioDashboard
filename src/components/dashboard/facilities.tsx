"use client";

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import type { ReactNode } from "react";
import { AlertCircle, AlertTriangle, ArrowUp, CheckCircle2, ClipboardList, MapPin, Search, Filter, X, Building2, Lightbulb } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CHART_TOOLTIP_CURSOR, CHART_TOOLTIP_STYLE, getAdaptiveVerticalBarLayout, truncateChartLabel } from "@/components/charts/chart-card";
import { cn } from "@/lib/utils";
import type { DashboardData, FacilitySummary, RuleStatus, SubcategoryChecklist } from "@/lib/kobo";
import { translateSectionLabel } from "@/lib/section-labels";
import { RiskBadge } from "./cards";
import { InfoTitle } from "./info-title";
import { ActionPlanCard } from "./action-plan-card";

type Props = {
  facilities: FacilitySummary[];
  currentFacility?: FacilitySummary;
  onSelect: (id: number) => void;
  t: (key: string, values?: Record<string, string | number>) => string;
  sectionAverages: DashboardData["sectionAverages"];
  readOnlySelection?: boolean;
  isProducerView?: boolean;
};

// Update to theme colors - use CSS variables for dark mode support
const FACILITY_COLORS = {
  external: "var(--color-brand)",
  internal: "var(--color-chart-8)",
};

const AVERAGE_COLORS = {
  external: "color-mix(in srgb, var(--color-brand) 60%, transparent)",
  internal: "color-mix(in srgb, var(--color-chart-8) 60%, transparent)",
};

export function FacilitiesView({
  facilities,
  currentFacility,
  onSelect,
  t,
  sectionAverages,
  readOnlySelection = false,
  isProducerView = false,
}: Props) {
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

  if (!currentFacility) return null;

  const benchmarkData = currentFacility.sectionScores.map((section) => {
    const average = sectionAverages.find((item) => item.section === section.section && item.side === section.side)?.score ?? 0;
    return {
      section: translateSectionLabel(section.section, t),
      side: section.side,
      facility: section.score,
      average,
    };
  });
  const longestBenchmarkLabel = benchmarkData.reduce((max, item) => Math.max(max, item.section.length), 0);
  const benchmarkLayout = getAdaptiveVerticalBarLayout(benchmarkData.length, longestBenchmarkLabel);

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
      <Card className="card-flat overflow-hidden">
        <div className="h-2 w-full bg-gradient-to-r from-[var(--color-brand)] to-[var(--color-chart-8)]" />
        <CardHeader className="pb-2">
          <InfoTitle title={t("facilities.information")} info={t("info.facilityDiagnostics")} />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-3 flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">{currentFacility.name}</h2>
                <RiskBadge level={currentFacility.riskLevel} label={t(`risk.${currentFacility.riskLevel.toLowerCase()}`)} />
              </div>
              <div className="flex flex-wrap items-center gap-3 text-sm text-[var(--color-text-secondary)]">
                <span className="flex items-center gap-1.5 bg-[var(--color-surface-base)] px-2.5 py-1 rounded-md">
                  <MapPin className="h-4 w-4 text-[var(--color-brand)]" />
                  {currentFacility.basedOn ?? currentFacility.location ?? t("facilities.noData")}
                </span>
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                <Badge variant="secondary" className="bg-[var(--color-surface-elevated)] text-[var(--color-text-primary)]">{currentFacility.species ?? t("facilities.noData")}</Badge>
                <Badge variant="outline" className="border-[var(--color-border-subtle)] text-[var(--color-text-secondary)]">{currentFacility.productionSystem ?? t("facilities.noData")}</Badge>
                <Badge variant="outline" className="border-[var(--color-border-subtle)] text-[var(--color-text-secondary)]">{currentFacility.productionType ?? t("facilities.noData")}</Badge>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center rounded-2xl bg-[var(--color-surface-base)] border border-[var(--color-border-subtle)] px-8 py-6 shrink-0">
              <span className="text-sm font-medium uppercase tracking-wider text-[var(--color-text-secondary)] mb-1">{t("table.score")}</span>
              <div className="flex items-baseline gap-1">
                <span
                  className={`text-5xl font-black font-scientific ${
                    currentFacility.score >= 70
                      ? "text-[var(--color-success)]"
                      : currentFacility.score >= 50
                      ? "text-[var(--color-warning)]"
                      : "text-[var(--color-danger)]"
                  }`}
                >
                  {currentFacility.score}
                </span>
                <span className="text-lg font-medium text-[var(--color-text-secondary)]">/100</span>
              </div>
              {isProducerView && (
                <p className="mt-2 text-xs text-[var(--color-text-secondary)] text-center max-w-[200px]">
                  {currentFacility.score < 50
                    ? t("facilities.scoreHero.below50", { score: currentFacility.score })
                    : currentFacility.score < 70
                    ? t("facilities.scoreHero.below70", { score: currentFacility.score })
                    : t("facilities.scoreHero.good", { score: currentFacility.score })}
                </p>
              )}
              {isProducerView && peerAverage !== undefined && (
                <p className="mt-2 text-xs text-[var(--color-text-muted)] text-center max-w-[200px]">
                  {t("facilities.peerComparison", { score: currentFacility.score, peerAverage, species: currentFacility.species ?? "", region: currentFacility.basedOn ?? currentFacility.location ?? "" })}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Core Insights */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Benchmark against average */}
        <Card className="card-flat lg:col-span-2">
          <CardHeader className="pb-2">
            <InfoTitle title={t("facilities.benchmark")} info={t("info.facilityBenchmark")} />
          </CardHeader>
          <CardContent className="h-[340px] md:h-[380px] xl:h-[420px]">
            <div role="img" aria-label={`${t("facilities.benchmark")}. ${benchmarkData.length} ${t("facilities.benchmarkAriaSuffix")}`} className="h-full w-full">
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
                  <LabelList dataKey="facility" position="right" fontSize={10} fill="var(--color-text-primary)" fontWeight={600} />
                </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
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
      <h3 className="text-xl font-semibold text-[var(--color-text-primary)] tracking-tight pt-4">{t("facilities.riskAndSuggestions")}</h3>
      <div className="grid gap-6 lg:grid-cols-3">
        <RiskCard
          color="rose"
          icon={<AlertTriangle className="h-5 w-5 text-[var(--color-danger)]" />}
          title={t("facilities.risks.high")}
          items={currentFacility.highRiskFactors}
          emptyLabel={t("facilities.noData")}
        />
        <RiskCard
          color="amber"
          icon={<AlertCircle className="h-5 w-5 text-[var(--color-warning)]" />}
          title={t("facilities.risks.medium")}
          items={currentFacility.moderateRiskFactors}
          emptyLabel={t("facilities.noData")}
        />
        <RiskCard
          color="emerald"
          icon={<CheckCircle2 className="h-5 w-5 text-[var(--color-success)]" />}
          title={t("facilities.risks.positive")}
          items={currentFacility.positivePractices}
          emptyLabel={t("facilities.noData")}
        />
      </div>

      {/* Operational Details */}
      <h3 className="text-xl font-semibold text-[var(--color-text-primary)] tracking-tight pt-4">{t("tabs.operational")}</h3>
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
      <div className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-raised)] overflow-hidden">
        <div className="px-5 py-4 border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-[var(--color-text-secondary)]" />
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
      <div className="bg-[var(--color-surface-base)] px-4 py-3 border-b border-[var(--color-border-subtle)]">
        <p className="text-sm text-[var(--color-text-secondary)]">
          {t("checklist.navigationHint")}
        </p>
      </div>

      {/* Horizontal Scrollable Navigation */}
      <div id="checklist-nav-bar" className="bg-[var(--color-raised)] border-b border-[var(--color-border-subtle)] sticky top-0 z-30 shadow-sm">
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
                      ? "border-[var(--color-brand)] bg-[var(--color-brand)]/10 shadow-md" 
                      : "border-[var(--color-chart-8)] bg-[var(--color-chart-8)]/10 shadow-md"
                    : "border-[var(--color-border-subtle)] bg-[var(--color-raised)] hover:border-[var(--color-brand)]/60 hover:bg-[var(--color-surface-base)]",
                  isExternal ? "focus:ring-[var(--color-brand)]/50" : "focus:ring-[var(--color-chart-8)]/50"
                )}
              >
                {/* Side indicator dot */}
                <div className={cn(
                  "w-3 h-3 rounded-full shrink-0",
                  isExternal ? "bg-[var(--color-brand)]" : "bg-[var(--color-chart-8)]",
                  isActive && "ring-2 ring-offset-1 ring-[var(--color-text-primary)]/20"
                )} />
                
                <div className="flex flex-col items-start">
                  <span className={cn(
                    "text-sm font-semibold leading-tight whitespace-nowrap",
                    isActive ? "text-[var(--color-text-primary)]" : "text-[var(--color-text-secondary)] group-hover:text-[var(--color-text-primary)]"
                  )}>
                    {translateSectionLabel(stats.section, t)}
                  </span>
                  <div className="flex items-center gap-2 text-[11px] mt-0.5">
                    <span className={cn(
                      "font-medium",
                      stats.compliant === (stats.total - stats.notApplicable) 
                        ? "text-[var(--color-success)]" 
                        : isActive ? "text-[var(--color-text-primary)]" : "text-[var(--color-text-secondary)]"
                    )}>
                      {stats.compliant}/{stats.total - stats.notApplicable}
                    </span>
                    {stats.nonCompliant > 0 && (
                      <span className="text-[var(--color-danger)] font-semibold flex items-center gap-0.5">
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

      {/* Section Content with Cards Grid */}
      <div className="bg-[var(--color-raised)] px-4 py-6 space-y-10">
        {checklist.map((subcategory, index) => (
          <section
            key={subcategory.section}
            ref={setSectionRef(subcategory.section)}
            data-section={subcategory.section}
            className={cn(
              index > 0 && "pt-8 border-t-2 border-[var(--color-border-subtle)]"
            )}
          >
            {/* Section Header - Prominent */}
            <div className={cn(
              "flex items-center gap-3 mb-6 p-4 rounded-xl",
              subcategory.side === "external" 
                ? "bg-[var(--color-brand)]/8 border border-[var(--color-brand)]/20" 
                : "bg-[var(--color-chart-8)]/8 border border-[var(--color-chart-8)]/20"
            )}>
              <div className={cn(
                "w-1.5 h-8 rounded-full",
                subcategory.side === "external" ? "bg-[var(--color-brand)]" : "bg-[var(--color-chart-8)]"
              )} />
              <div className="flex-1">
                <h4 className="text-lg font-bold text-[var(--color-text-primary)]">{translateSectionLabel(subcategory.section, t)}</h4>
                <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                  {subcategory.items.length} {t("checklist.questions")} • {subcategory.items.filter((i) => i.compliant).length} {t("checklist.compliant")}
                </p>
              </div>
              <Badge 
                variant="outline" 
                className={cn(
                  "text-xs px-2 py-1",
                  subcategory.side === "external" 
                    ? "border-[var(--color-brand)] text-[var(--color-brand)] bg-[var(--color-raised)] font-semibold" 
                    : "border-[var(--color-chart-8)] text-[var(--color-chart-8)] bg-[var(--color-raised)] font-semibold"
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
      <ChecklistBackToTopButton containerRef={containerRef} t={t} />
    </div>
  );
}

// Back to Top Button Component
function ChecklistBackToTopButton({ 
  containerRef,
  t
}: { 
  containerRef: React.RefObject<HTMLDivElement | null>;
  t: (key: string) => string;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const navBarRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    // Find the sticky nav bar inside the container by ID
    const navBar = container.querySelector('#checklist-nav-bar') as HTMLDivElement;
    if (navBar) {
      navBarRef.current = navBar;
    }
  }, [containerRef]);

  useEffect(() => {
    const handleScroll = () => {
      const container = containerRef.current;
      const navBar = navBarRef.current;
      
      if (!container) {
        setIsVisible(false);
        return;
      }

      // Get positions
      const containerRect = container.getBoundingClientRect();
      const scrollY = window.scrollY;
      
      // Find the navigation bar element
      let navBarBottom = 0;
      if (navBar) {
        const navBarRect = navBar.getBoundingClientRect();
        navBarBottom = navBarRect.bottom;
      } else {
        // Fallback: find nav bar by ID
        const navBarEl = document.getElementById('checklist-nav-bar');
        if (navBarEl) {
          const navBarRect = navBarEl.getBoundingClientRect();
          navBarBottom = navBarRect.bottom;
        }
      }
      
      // Show button when the nav bar is scrolled out of view (bottom < 0)
      // AND we've scrolled past the beginning of the checklist
      const isNavOutOfView = navBarBottom < 0;
      
      // Only show after scrolling some distance into the checklist
      const containerTopAbsolute = containerRect.top + scrollY;
      const hasScrolledIntoChecklist = scrollY > containerTopAbsolute + 100;
      
      setIsVisible(isNavOutOfView && hasScrolledIntoChecklist);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // Check initial state
    
    return () => window.removeEventListener("scroll", handleScroll);
  }, [containerRef]);

  const scrollToTop = () => {
    const container = containerRef.current;
    if (container) {
      // Get the container's position and scroll to it
      const rect = container.getBoundingClientRect();
      const absoluteTop = rect.top + window.scrollY;
      
      // Scroll to just above the container
      window.scrollTo({
        top: absoluteTop - 80, // 80px offset for better visibility
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
        "bg-[var(--color-brand)] text-white shadow-lg hover:bg-[var(--color-brand)]/90",
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
    <div className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-raised)] p-3 sm:p-4">
      {/* Question */}
      <h5 className="text-sm font-medium text-[var(--color-text-primary)] leading-relaxed mb-3">
        {item.label}
      </h5>

      {/* Answer & Status Row */}
      <div className="flex items-center justify-between gap-3 mb-3 pb-3 border-b border-[var(--color-border-subtle)]/60">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-[var(--color-text-secondary)]">{t("table.answer")}:</span>
          <span className="font-medium text-[var(--color-text-primary)]">{item.answer}</span>
        </div>
        
        {!item.applicable ? (
          <Badge variant="secondary" className="bg-[var(--color-surface-elevated)] text-[var(--color-text-secondary)] text-xs">
            {t("status.notApplicable")}
          </Badge>
        ) : item.compliant ? (
          <Badge variant="secondary" className="bg-[var(--color-success)]/10 text-[var(--color-success)] border border-[var(--color-success)]/20 text-xs">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            {t("status.compliant")}
          </Badge>
        ) : (
          <Badge variant="secondary" className="bg-[var(--color-danger)]/10 text-[var(--color-danger)] border border-[var(--color-danger)]/20 text-xs">
            <AlertCircle className="h-3 w-3 mr-1" />
            {t("status.nonCompliant")}
          </Badge>
        )}
      </div>

      {/* Recommendation */}
      {item.recommendation && (
        <div className="flex items-start gap-2 text-sm">
          <Lightbulb className="h-4 w-4 text-[var(--color-warning)] shrink-0 mt-0.5" />
          <div>
            <span className="text-[var(--color-warning)] font-medium text-xs uppercase tracking-wide">
              {t("table.recommendation")}
            </span>
            <p className="text-[var(--color-text-secondary)] mt-0.5 leading-relaxed">
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
      <span className="text-[var(--color-text-secondary)] text-sm">{label}</span>
      <span className="text-right font-medium text-[var(--color-text-primary)]">{value}</span>
    </div>
  );
}

function RuleRow({ rule, t }: { rule: RuleStatus; t: (key: string) => string }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 rounded-xl border border-[var(--color-border-subtle)] px-4 py-3 bg-[var(--color-surface-base)]">
      <div className="space-y-1.5 flex-1">
        <p className="text-sm font-medium text-[var(--color-text-primary)]">{rule.label}</p>
        <p className="text-xs text-[var(--color-text-secondary)] flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-chart-8)]" />
          {t("table.answer")}: <span className="font-medium">{rule.answer}</span>
        </p>
      </div>
      <div className="shrink-0 mt-2 sm:mt-0">
        {!rule.applicable ? (
          <Badge variant="secondary" className="bg-[var(--color-surface-elevated)] text-[var(--color-text-secondary)]">{t("status.notApplicable")}</Badge>
        ) : rule.matched ? (
          <Badge variant="secondary" className="bg-[var(--color-success)]/10 text-[var(--color-success)] border border-[var(--color-success)]/20">
            {t("status.yes")}
          </Badge>
        ) : (
          <Badge variant="secondary" className="bg-[var(--color-danger)]/10 text-[var(--color-danger)] border border-[var(--color-danger)]/20">
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
    rose: "border-t-4 border-t-[var(--color-danger)]",
    amber: "border-t-4 border-t-[var(--color-warning)]",
    emerald: "border-t-4 border-t-[var(--color-success)]",
  }[color];
  const IconBullet = color === "rose" ? AlertTriangle : color === "amber" ? AlertCircle : CheckCircle2;
  const iconColor = color === "rose" ? "text-[var(--color-danger)]" : color === "amber" ? "text-[var(--color-warning)]" : "text-[var(--color-success)]";
  return (
    <Card className={`card-flat ${border}`}>
      <CardHeader className="pb-3 bg-[var(--color-raised)] rounded-t-xl">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-[var(--color-raised)] rounded-lg shadow-sm border border-[var(--color-border-subtle)]">{icon}</div>
          <CardTitle className="text-base font-semibold text-[var(--color-text-primary)]">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        {items.length > 0 ? (
          <ul className="space-y-3">
            {items.map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-sm text-[var(--color-text-primary)]">
                <IconBullet className={`mt-0.5 h-4 w-4 shrink-0 ${iconColor}`} />
                <span className="leading-snug">{item}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-[var(--color-text-secondary)] italic">{emptyLabel}</p>
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
      case "HIGH": return "bg-[var(--color-danger)]/10 text-[var(--color-danger)] border-[var(--color-danger)]/20";
      case "MEDIUM": return "bg-[var(--color-warning)]/10 text-[var(--color-warning)] border-[var(--color-warning)]/20";
      case "LOW": return "bg-[var(--color-success)]/10 text-[var(--color-success)] border-[var(--color-success)]/20";
      case "NEGLIGIBLE": return "bg-[var(--color-muted)]/10 text-[var(--color-text-secondary)] border-[var(--color-border-default)]";
      default: return "bg-[var(--color-muted)]/10 text-[var(--color-text-secondary)] border-[var(--color-border-default)]";
    }
  };

  const getRiskDot = (level: string) => {
    switch (level) {
      case "HIGH": return "bg-[var(--color-danger)]";
      case "MEDIUM": return "bg-[var(--color-warning)]";
      case "LOW": return "bg-[var(--color-success)]";
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
            <Building2 className="h-5 w-5 text-[var(--color-brand)]" />
            <CardTitle className="text-base font-semibold text-[var(--color-text-primary)]">
              {t("tabs.facilitiesSelect")}
              {!isExpanded && (
                <span className="ml-2 text-sm font-normal text-[var(--color-text-secondary)]">
                  ({t("table.facilities")}: {facilities.length})
                </span>
              )}
            </CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {!isExpanded && currentFacility && (
              <span className="hidden sm:inline text-sm text-[var(--color-text-secondary)] mr-2">
                {currentFacility.name}
              </span>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-8 gap-1.5 text-xs"
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
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-secondary)]" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`${t("actions.search")} ${t("table.facilities")}...`}
              className="pl-10 bg-[var(--color-raised)] border-[var(--color-border-subtle)]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-[var(--color-surface-base)]"
              >
                <X className="h-3.5 w-3.5 text-[var(--color-text-secondary)]" />
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
                  "h-7 text-xs border-[var(--color-border-subtle)]",
                  riskFilter === "all" && "bg-[var(--color-brand)] text-white border-[var(--color-brand)]"
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
                    "h-7 text-xs border-[var(--color-border-subtle)] gap-1.5",
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
                <div className="p-8 text-center text-sm text-[var(--color-text-secondary)]">
                  {t("charts.noData")}
                </div>
              ) : (
                <div className="divide-y">
                  {filteredFacilities.map((facility) => (
                    <button
                      key={facility.id}
                      onClick={() => handleSelect(facility.id)}
                      className={cn(
                        "w-full px-4 py-3 flex items-center gap-3 text-left transition-colors hover:bg-[var(--color-surface-base)]",
                        currentFacility.id === facility.id && "bg-[var(--color-brand)]/5 border-l-2 border-l-[var(--color-brand)]"
                      )}
                    >
                      {/* Selection indicator */}
                      <div className={cn(
                        "h-4 w-4 rounded-full border-2 flex-shrink-0",
                        currentFacility.id === facility.id
                          ? "border-[var(--color-brand)] bg-[var(--color-brand)]"
                          : "border-[var(--color-border-subtle)]"
                      )}>
                        {currentFacility.id === facility.id && (
                          <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                        )}
                      </div>

                      {/* Facility info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm text-[var(--color-text-primary)] truncate">
                            {facility.name}
                          </span>
                          <span className={cn("h-2 w-2 rounded-full flex-shrink-0", getRiskDot(facility.riskLevel))} />
                        </div>
                        <div className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)] mt-0.5">
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
                        facility.score >= 70 ? "bg-[var(--color-success)]/10 text-[var(--color-success)]" :
                        facility.score >= 50 ? "bg-[var(--color-warning)]/10 text-[var(--color-warning)]" :
                        "bg-[var(--color-danger)]/10 text-[var(--color-danger)]"
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
          <div className="flex flex-wrap gap-4 text-xs text-[var(--color-text-secondary)] pt-1">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[var(--color-danger)]" />
              {facilities.filter(f => f.riskLevel === "HIGH").length} {t("metrics.high.title")}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[var(--color-warning)]" />
              {facilities.filter(f => f.riskLevel === "MEDIUM").length} {t("metrics.medium.title")}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[var(--color-success)]" />
              {facilities.filter(f => f.riskLevel === "LOW" || f.riskLevel === "NEGLIGIBLE").length} {t("metrics.low.title")}
            </span>
          </div>
        </CardContent>
      )}
      
      {/* Collapsed view summary */}
      {!isExpanded && currentFacility && (
        <CardContent className="pt-0 pb-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-[var(--color-surface-base)] border border-[var(--color-border-subtle)]">
            <div className={cn(
              "h-3 w-3 rounded-full",
              getRiskDot(currentFacility.riskLevel)
            )} />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm text-[var(--color-text-primary)] truncate">
                {currentFacility.name}
              </p>
              <p className="text-xs text-[var(--color-text-secondary)]">
                {t("facilities.selector.selected")} • {t("table.score")}: {currentFacility.score}/100
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(true)}
              className="h-7 text-xs shrink-0"
            >
              {t("facilities.selector.show")}
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
