"use client";

import { forwardRef, useMemo } from "react";
import type { AppLocale } from "@/i18n/routing";
import { buildSectionRadarData, type SectionRadarData } from "@/lib/chart-data/section-radar";
import type { DashboardData, FacilitySummary } from "@/lib/kobo";
import { translateSectionLabel } from "@/lib/section-labels";
import { RiskBadge } from "./cards";

type FacilityReportProps = {
  facility: FacilitySummary;
  networkStats?: DashboardData["stats"];
  sectionAverages: DashboardData["sectionAverages"];
  locale: AppLocale;
  t: (key: string, values?: Record<string, string | number>) => string;
};

export const FacilityReport = forwardRef<HTMLDivElement, FacilityReportProps>(function FacilityReport(
  { facility, networkStats, sectionAverages, locale, t },
  ref,
) {
  const recommendations = useMemo(
    () =>
      facility.subcategoryChecklist
        .flatMap((sub) =>
          sub.items
            .filter((item) => item.applicable && !item.compliant && item.recommendation)
            .map((item) => ({
              section: translateSectionLabel(sub.section, t),
              label: item.label,
              answer: item.answer,
              recommendation: item.recommendation,
            })),
        ),
    [facility.subcategoryChecklist, t],
  );

  const generatedAt = new Intl.DateTimeFormat(locale, { dateStyle: "long", timeStyle: "short" }).format(new Date());

  const reportRadarData = useMemo(() => {
    const networkSectionScores = sectionAverages.map((item) => ({
      ...item,
      positives: 0,
      total: 0,
    }));
    const inputs = (side: "external" | "internal") => [
      { name: facility.name, sectionScores: facility.sectionScores, side },
      ...(networkSectionScores.length > 0
        ? [{ name: t("facilities.networkAverage"), sectionScores: networkSectionScores, side }]
        : []),
    ];

    return {
      external: buildSectionRadarData(inputs("external"), "external", t),
      internal: buildSectionRadarData(inputs("internal"), "internal", t),
    };
  }, [facility.name, facility.sectionScores, sectionAverages, t]);

  const benchmarkData = useMemo(
    () =>
      facility.sectionScores.map((section) => ({
        label: translateSectionLabel(section.section, t),
        facility: section.score,
        average: sectionAverages.find((item) => item.section === section.section && item.side === section.side)?.score ?? 0,
      })),
    [facility.sectionScores, sectionAverages, t],
  );

  return (
    <div ref={ref} className="facility-report bg-white p-8 text-black">
      <header className="mb-8 border-b border-gray-300 pb-6">
        <p className="text-sm uppercase tracking-wider text-gray-500">{t("report.title")}</p>
        <h1 className="mt-2 text-2xl font-bold">{facility.name}</h1>
        <p className="mt-1 text-sm text-gray-600">
          {facility.basedOn ?? facility.location ?? ""} · {facility.species ?? ""} · {facility.productionSystem ?? ""}
        </p>
        <p className="mt-2 text-xs text-gray-500">
          {t("report.generatedOn")}: {generatedAt}
        </p>
      </header>

      <section className="mb-8">
        <h2 className="mb-4 text-lg font-semibold">{t("report.scores")}</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <ScoreBlock label={t("report.overallScore")} value={facility.score} />
          <ScoreBlock label={t("report.externalScore")} value={facility.externalScore} />
          <ScoreBlock label={t("report.internalScore")} value={facility.internalScore} />
          <div className="rounded-lg border border-gray-200 p-4">
            <p className="text-xs uppercase tracking-wide text-gray-500">{t("table.risk")}</p>
            <div className="mt-2">
              <RiskBadge level={facility.riskLevel} label={t(`risk.${facility.riskLevel.toLowerCase()}`)} />
            </div>
          </div>
        </div>
        {networkStats ? (
          <p className="mt-3 text-xs text-gray-500">
            {t("facilities.networkAverage")}: {networkStats.avgScore}/100 ({t("overview.external")}: {networkStats.avgExternalScore}, {t("overview.internal")}: {networkStats.avgInternalScore})
          </p>
        ) : null}
      </section>

      <section className="mb-8">
        <h2 className="mb-4 text-lg font-semibold">{t("report.charts")}</h2>
        <div className="report-chart-grid">
          <ReportBenchmarkChart
            rows={benchmarkData}
            title={t("facilities.benchmark")}
            networkLabel={t("facilities.networkAverage")}
            facilityLabel={t("table.facility")}
          />
          <ReportComparisonChart
            facility={facility}
            networkStats={networkStats}
            title={t("facilities.externalInternalComparison")}
            t={t}
          />
          <ReportRadarChart title={t("charts.sectionRadarExternal")} data={reportRadarData.external} />
          <ReportRadarChart title={t("charts.sectionRadarInternal")} data={reportRadarData.internal} />
        </div>
      </section>

      <section className="mb-8">
        <h2 className="mb-4 text-lg font-semibold">{t("facilities.scoreBySection")}</h2>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-gray-300 text-left">
              <th className="py-2 pr-4">{t("table.section")}</th>
              <th className="py-2 pr-4">{t("table.side")}</th>
              <th className="py-2">{t("table.score")}</th>
            </tr>
          </thead>
          <tbody>
            {facility.sectionScores.map((section) => (
              <tr key={`${section.section}-${section.side}`} className="border-b border-gray-100">
                <td className="py-2 pr-4">{translateSectionLabel(section.section, t)}</td>
                <td className="py-2 pr-4">{section.side === "external" ? t("overview.external") : t("overview.internal")}</td>
                <td className="py-2">{section.score}/100</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="mb-8">
        <h2 className="mb-4 text-lg font-semibold">{t("report.responses")}</h2>
        {facility.subcategoryChecklist.map((sub) => (
          <div key={sub.section} className="mb-6 break-inside-avoid">
            <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-700">
              {translateSectionLabel(sub.section, t)}
            </h3>
            <table className="w-full border-collapse text-sm">
              <tbody>
                {sub.items.map((item) => (
                  <tr key={item.id} className="border-b border-gray-100 align-top">
                    <td className="py-2 pr-4 font-medium">{item.label}</td>
                    <td className="py-2 pr-4 text-gray-700">{item.answer || "-"}</td>
                    <td className="py-2 text-gray-600">
                      {item.applicable
                        ? item.compliant
                          ? t("status.compliant")
                          : t("status.nonCompliant")
                        : t("status.notApplicable")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold">{t("report.recommendations")}</h2>
        {recommendations.length === 0 ? (
          <p className="text-sm text-gray-600">{t("report.noRecommendations")}</p>
        ) : (
          <ol className="space-y-4 text-sm">
            {recommendations.map((item, index) => (
              <li key={`${item.label}-${index}`} className="break-inside-avoid rounded-lg border border-gray-200 p-4">
                <p className="font-semibold">{item.label}</p>
                <p className="mt-1 text-xs uppercase tracking-wide text-gray-500">{item.section}</p>
                <p className="mt-2 text-gray-700">
                  <span className="font-medium">{t("table.answer")}: </span>
                  {item.answer || "-"}
                </p>
                <p className="mt-2 text-gray-800">{item.recommendation}</p>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
});

function ScoreBlock({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-gray-200 p-4">
      <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-2 text-3xl font-bold">{value}</p>
      <p className="text-xs text-gray-500">/100</p>
    </div>
  );
}

type ReportBenchmarkRow = {
  label: string;
  facility: number;
  average: number;
};

function ReportBenchmarkChart({
  rows,
  title,
  networkLabel,
  facilityLabel,
}: {
  rows: ReportBenchmarkRow[];
  title: string;
  networkLabel: string;
  facilityLabel: string;
}) {
  const rowHeight = 28;
  const chartHeight = Math.max(100, rows.length * rowHeight + 20);
  const barX = 250;
  const barWidth = 310;

  return (
    <div className="report-chart-card report-chart-card-wide">
      <h3 className="report-chart-title">{title}</h3>
      <svg
        className="report-chart-svg"
        viewBox={`0 0 640 ${chartHeight}`}
        role="img"
        aria-label={title}
      >
        {rows.map((row, index) => {
          const y = 18 + index * rowHeight;
          return (
            <g key={row.label}>
              <text x="0" y={y + 12} className="report-chart-label">
                {row.label}
              </text>
              <rect x={barX} y={y} width={barWidth} height="8" rx="4" className="report-bar-track" />
              <rect x={barX} y={y} width={(row.average / 100) * barWidth} height="8" rx="4" className="report-bar-average" />
              <rect x={barX} y={y + 11} width={barWidth} height="8" rx="4" className="report-bar-track" />
              <rect x={barX} y={y + 11} width={(row.facility / 100) * barWidth} height="8" rx="4" className="report-bar-facility" />
              <text x="575" y={y + 8} className="report-chart-value">
                {row.average}
              </text>
              <text x="575" y={y + 19} className="report-chart-value report-chart-value-strong">
                {row.facility}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="report-chart-legend">
        <span><span className="report-legend-swatch report-bar-average" /> {networkLabel}</span>
        <span><span className="report-legend-swatch report-bar-facility" /> {facilityLabel}</span>
      </div>
    </div>
  );
}

function ReportComparisonChart({
  facility,
  networkStats,
  title,
  t,
}: {
  facility: FacilitySummary;
  networkStats?: DashboardData["stats"];
  title: string;
  t: (key: string, values?: Record<string, string | number>) => string;
}) {
  const rows = [
    { label: t("overview.external"), value: facility.externalScore, network: networkStats?.avgExternalScore },
    { label: t("overview.internal"), value: facility.internalScore, network: networkStats?.avgInternalScore },
  ];

  return (
    <div className="report-chart-card">
      <h3 className="report-chart-title">{title}</h3>
      <svg className="report-chart-svg" viewBox="0 0 640 120" role="img" aria-label={title}>
        {rows.map((row, index) => {
          const y = 20 + index * 48;
          const barX = 185;
          const barWidth = 350;
          return (
            <g key={row.label}>
              <text x="0" y={y + 14} className="report-chart-label">
                {row.label}
              </text>
              <rect x={barX} y={y} width={barWidth} height="20" rx="5" className="report-bar-track" />
              <rect
                x={barX}
                y={y}
                width={(row.value / 100) * barWidth}
                height="20"
                rx="5"
                className={index === 0 ? "report-bar-external" : "report-bar-internal"}
              />
              {row.network !== undefined ? (
                <line
                  x1={barX + (row.network / 100) * barWidth}
                  x2={barX + (row.network / 100) * barWidth}
                  y1={y - 4}
                  y2={y + 24}
                  className="report-bar-network"
                />
              ) : null}
              <text x="575" y={y + 15} className="report-chart-value report-chart-value-strong">
                {row.value}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="report-chart-legend">
        <span><span className="report-legend-swatch report-bar-external" /> {t("overview.external")}</span>
        <span><span className="report-legend-swatch report-bar-internal" /> {t("overview.internal")}</span>
        {networkStats ? <span><span className="report-legend-line" /> {t("facilities.networkAverage")}</span> : null}
      </div>
    </div>
  );
}

function ReportRadarChart({ title, data }: { title: string; data: SectionRadarData }) {
  const center = 160;
  const centerY = 115;
  const radius = 78;
  const labelRadius = 108;
  const pointFor = (value: number, index: number, pointRadius: number) => {
    const angle = -Math.PI / 2 + (index * 2 * Math.PI) / data.indicators.length;
    return {
      x: center + Math.cos(angle) * pointRadius * (value / 100),
      y: centerY + Math.sin(angle) * pointRadius * (value / 100),
    };
  };
  const pointsFor = (values: number[], pointRadius: number) =>
    values.map((value, index) => {
      const point = pointFor(value, index, pointRadius);
      return `${point.x},${point.y}`;
    }).join(" ");

  return (
    <div className="report-chart-card">
      <h3 className="report-chart-title">{title}</h3>
      <svg className="report-chart-svg report-radar-svg" viewBox="0 0 320 240" role="img" aria-label={title}>
        {[25, 50, 75, 100].map((level) => (
          <polygon key={level} points={pointsFor(data.indicators.map(() => level), radius)} className="report-radar-grid" />
        ))}
        {data.indicators.map((indicator, index) => {
          const point = pointFor(100, index, radius);
          const labelPoint = pointFor(100, index, labelRadius);
          const textAnchor = labelPoint.x > center + 10 ? "start" : labelPoint.x < center - 10 ? "end" : "middle";
          return (
            <g key={indicator.name}>
              <line x1={center} y1={centerY} x2={point.x} y2={point.y} className="report-radar-spoke" />
              <text x={labelPoint.x} y={labelPoint.y} textAnchor={textAnchor} className="report-radar-label">
                {indicator.name}
              </text>
            </g>
          );
        })}
        {data.series.map((series, index) => (
          <polygon
            key={series.name}
            points={pointsFor(series.values, radius)}
            className={index === 0 ? "report-radar-facility" : "report-radar-network"}
          />
        ))}
      </svg>
      <div className="report-chart-legend">
        {data.series.map((series, index) => (
          <span key={series.name}>
            <span className={`report-legend-swatch ${index === 0 ? "report-radar-facility" : "report-radar-network"}`} />
            {series.name}
          </span>
        ))}
      </div>
    </div>
  );
}
