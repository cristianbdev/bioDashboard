import type { EChartsOption } from "echarts";
import type { ChartThemeColors } from "@/lib/chart-theme";

export type ExternalInternalDatum = {
  label: string;
  external: number;
  internal: number;
};

export function buildExternalInternalBarOption({
  data,
  colors,
  externalLabel,
  internalLabel,
  networkExternal,
  networkInternal,
  networkLabel,
}: {
  data: ExternalInternalDatum[];
  colors: ChartThemeColors;
  externalLabel: string;
  internalLabel: string;
  networkExternal?: number;
  networkInternal?: number;
  networkLabel?: string;
}): EChartsOption {
  const categories = data.map((item) => item.label);
  const series: EChartsOption["series"] = [
    {
      name: externalLabel,
      type: "bar",
      data: data.map((item) => item.external),
      itemStyle: { color: colors.brand, borderRadius: [4, 4, 0, 0] },
      barGap: "20%",
    },
    {
      name: internalLabel,
      type: "bar",
      data: data.map((item) => item.internal),
      itemStyle: { color: colors.chart[7] ?? colors.chart[1], borderRadius: [4, 4, 0, 0] },
    },
  ];

  if (networkExternal !== undefined && networkInternal !== undefined && networkLabel) {
    series.push(
      {
        name: `${networkLabel} (${externalLabel})`,
        type: "line",
        data: categories.map(() => networkExternal),
        symbol: "none",
        lineStyle: { type: "dashed", color: colors.textSecondary, width: 1 },
        itemStyle: { color: colors.textSecondary },
      },
      {
        name: `${networkLabel} (${internalLabel})`,
        type: "line",
        data: categories.map(() => networkInternal),
        symbol: "none",
        lineStyle: { type: "dashed", color: colors.textSecondary, width: 1 },
        itemStyle: { color: colors.textSecondary },
      },
    );
  }

  return {
    backgroundColor: "transparent",
    grid: { top: 24, right: 16, left: 8, bottom: 48, containLabel: true },
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
      backgroundColor: colors.raised,
      borderColor: colors.borderSubtle,
      textStyle: { color: colors.textPrimary },
    },
    legend: {
      bottom: 0,
      textStyle: { color: colors.textSecondary, fontSize: 11 },
    },
    xAxis: {
      type: "category",
      data: categories,
      axisLabel: { color: colors.textSecondary, fontSize: 11 },
      axisLine: { lineStyle: { color: colors.borderSubtle } },
      axisTick: { show: false },
    },
    yAxis: {
      type: "value",
      min: 0,
      max: 100,
      axisLabel: { color: colors.textSecondary, fontSize: 11 },
      splitLine: { lineStyle: { color: colors.borderSubtle, type: "dashed" } },
    },
    series,
  };
}

export function buildExternalInternalComparisonOption({
  externalScore,
  internalScore,
  colors,
  externalLabel,
  internalLabel,
  categoryLabel = "Score",
}: {
  externalScore: number;
  internalScore: number;
  colors: ChartThemeColors;
  externalLabel: string;
  internalLabel: string;
  categoryLabel?: string;
}): EChartsOption {
  return buildExternalInternalBarOption({
    data: [{ label: categoryLabel, external: externalScore, internal: internalScore }],
    colors,
    externalLabel,
    internalLabel,
  });
}
