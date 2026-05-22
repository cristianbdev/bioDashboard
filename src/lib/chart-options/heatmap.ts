import type { EChartsOption } from "echarts";
import type { ChartThemeColors } from "@/lib/chart-theme";
import type { FacilitySummary } from "@/lib/kobo";
import { translateSectionLabel } from "@/lib/section-labels";

type HeatmapTooltipParam = {
  data: [number, number, number, number];
};

export function buildHeatmapOption(
  facilities: FacilitySummary[],
  side: "external" | "internal",
  title: string,
  t: (key: string) => string,
  colors: ChartThemeColors,
): EChartsOption | undefined {
  const rows = facilities.flatMap((facility) =>
    facility.sectionScores
      .filter((section) => section.side === side)
      .map((section) => ({
        facility: facility.name,
        subcategory: translateSectionLabel(section.section, t),
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
      textStyle: { fontSize: 14, fontWeight: 600, color: colors.textPrimary },
    },
    backgroundColor: "transparent",
    tooltip: {
      position: "top",
      backgroundColor: colors.raised,
      borderColor: colors.borderSubtle,
      textStyle: { color: colors.textPrimary },
      formatter: (params: unknown) => {
        const p = params as HeatmapTooltipParam;
        const facility = facilitiesAxis[p.data[0]];
        const subcategory = subcategoriesAxis[p.data[1]];
        const score = p.data[3];
        const status = p.data[2] ? t("status.compliant") : t("status.nonCompliant");
        return `${facility}<br/>${subcategory}<br/>${t("table.score")}: ${score}/100<br/>${status}`;
      },
    },
    textStyle: { color: colors.textPrimary },
    grid: { top: 56, left: 90, right: 20, bottom: 80 },
    xAxis: {
      type: "category",
      data: facilitiesAxis,
      axisLabel: { rotate: 40, fontSize: 10, color: colors.textSecondary },
      axisLine: { lineStyle: { color: colors.borderDefault } },
      splitArea: { show: true, areaStyle: { color: [colors.surfaceBase, colors.surfaceElevated] } },
      splitLine: { lineStyle: { color: colors.borderSubtle } },
    },
    yAxis: {
      type: "category",
      data: subcategoriesAxis,
      axisLabel: { fontSize: 11, color: colors.textSecondary },
      axisLine: { lineStyle: { color: colors.borderDefault } },
      splitArea: { show: true, areaStyle: { color: [colors.surfaceBase, colors.surfaceElevated] } },
      splitLine: { lineStyle: { color: colors.borderSubtle } },
    },
    visualMap: {
      min: 0,
      max: 1,
      orient: "horizontal",
      left: "center",
      bottom: 12,
      precision: 0,
      text: [t("status.compliant"), t("status.nonCompliant")],
      textStyle: { color: colors.textPrimary },
      inRange: { color: [colors.danger, colors.warning, colors.success] },
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
