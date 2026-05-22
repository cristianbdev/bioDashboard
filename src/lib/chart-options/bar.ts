import type { EChartsOption } from "echarts";
import type { ChartThemeColors } from "@/lib/chart-theme";
import { truncateChartLabel } from "@/components/charts/chart-card";

export type VerticalBarDatum = Record<string, string | number>;

export function buildVerticalBarOption({
  data,
  labelKey,
  valueKey,
  colors,
  barColor,
  getItemColor,
  paletteIndexOffset = 0,
  domainMax = 100,
  showValueLabels = true,
  allowDecimals = false,
}: {
  data: VerticalBarDatum[];
  labelKey: string;
  valueKey: string;
  colors: ChartThemeColors;
  barColor?: string;
  getItemColor?: (item: VerticalBarDatum, index: number) => string;
  paletteIndexOffset?: number;
  domainMax?: number;
  showValueLabels?: boolean;
  allowDecimals?: boolean;
}): EChartsOption {
  const categories = data.map((item) => String(item[labelKey] ?? ""));
  const values = data.map((item) => Number(item[valueKey] ?? 0));
  const itemColors = data.map((item, index) => {
    if (getItemColor) return getItemColor(item, index);
    if (barColor) return barColor;
    return colors.chart[(index + paletteIndexOffset) % colors.chart.length];
  });

  return {
    backgroundColor: "transparent",
    grid: { top: 8, right: showValueLabels ? 32 : 16, left: 8, bottom: 8, containLabel: true },
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
      backgroundColor: colors.raised,
      borderColor: colors.borderSubtle,
      textStyle: { color: colors.textPrimary },
    },
    xAxis: {
      type: "value",
      max: domainMax,
      min: 0,
      minInterval: allowDecimals ? undefined : 1,
      axisLabel: { fontSize: 11, color: colors.textSecondary },
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: colors.borderSubtle, type: "dashed" } },
    },
    yAxis: {
      type: "category",
      data: categories,
      inverse: true,
      axisLabel: {
        fontSize: 11,
        color: colors.textPrimary,
        formatter: (value: string) => truncateChartLabel(value, 24),
      },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    series: [
      {
        type: "bar",
        data: values.map((value, index) => ({
          value,
          itemStyle: {
            color: itemColors[index],
            borderRadius: [0, 6, 6, 0],
          },
          label: showValueLabels
            ? {
                show: true,
                position: "right",
                fontSize: 11,
                color: colors.textPrimary,
              }
            : undefined,
        })),
        barMaxWidth: 32,
      },
    ],
  };
}

export function buildHorizontalGroupedBarOption({
  categories,
  series,
  colors,
  yAxisWidth = 120,
  domainMax = 100,
  scoreLabel,
}: {
  categories: string[];
  series: Array<{ name: string; values: number[]; colors: string[] }>;
  colors: ChartThemeColors;
  yAxisWidth?: number;
  domainMax?: number;
  scoreLabel: string;
}): EChartsOption {
  return {
    backgroundColor: "transparent",
    legend: {
      bottom: 0,
      textStyle: { color: colors.textSecondary, fontSize: 11 },
    },
    grid: { top: 10, right: 24, left: 8, bottom: 28, containLabel: true },
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
      backgroundColor: colors.raised,
      borderColor: colors.borderSubtle,
      textStyle: { color: colors.textPrimary },
      formatter: (params: unknown) => {
        const items = Array.isArray(params) ? params : [params];
        const lines = items.map((item) => {
          const row = item as { seriesName: string; value: number };
          return `${row.seriesName}: ${row.value}/${domainMax}`;
        });
        return lines.join("<br/>");
      },
    },
    xAxis: {
      type: "value",
      max: domainMax,
      axisLabel: { fontSize: 11, color: colors.textSecondary },
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: colors.borderSubtle, type: "dashed" } },
    },
    yAxis: {
      type: "category",
      data: categories,
      inverse: true,
      axisLabel: {
        fontSize: 11,
        color: colors.textSecondary,
        width: yAxisWidth,
        overflow: "truncate",
        formatter: (value: string) => truncateChartLabel(value, 22),
      },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    series: series.map((entry) => ({
      name: entry.name,
      type: "bar",
      data: entry.values.map((value, index) => ({
        value,
        itemStyle: {
          color: entry.colors[index],
          borderRadius: [0, 4, 4, 0],
        },
        label: entry.name === scoreLabel
          ? {
              show: true,
              position: "right",
              fontSize: 10,
              fontWeight: 600,
              color: colors.textPrimary,
            }
          : undefined,
      })),
      barMaxWidth: 12,
      barGap: "20%",
    })),
  };
}

export function buildComparisonBarOption({
  data,
  barColor,
  colors,
  scoreLabel,
}: {
  data: { name: string; avgScore: number; count: number }[];
  barColor: string;
  colors: ChartThemeColors;
  scoreLabel: string;
}): EChartsOption {
  const isDense = data.length > 4;
  const barSize = Math.max(18, Math.min(46, Math.floor(230 / Math.max(1, data.length))));

  return {
    backgroundColor: "transparent",
    grid: {
      top: 8,
      right: 12,
      left: 4,
      bottom: isDense ? 8 : 0,
      containLabel: true,
    },
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
      backgroundColor: colors.raised,
      borderColor: colors.borderSubtle,
      textStyle: { color: colors.textPrimary },
      formatter: (params: unknown) => {
        const item = (Array.isArray(params) ? params[0] : params) as {
          name: string;
          value: number;
          dataIndex: number;
        };
        const row = data[item.dataIndex];
        const count = row?.count ?? 0;
        return `${item.name}<br/>${scoreLabel}: ${item.value}/100 (${count})`;
      },
    },
    xAxis: {
      type: "category",
      data: data.map((d) => d.name),
      axisLabel: {
        fontSize: 11,
        color: colors.textSecondary,
        rotate: isDense ? 14 : 0,
        interval: 0,
        formatter: (value: string) => truncateChartLabel(value, 18),
      },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    yAxis: {
      type: "value",
      min: 0,
      max: 100,
      axisLabel: { fontSize: 11, color: colors.textSecondary },
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: colors.borderSubtle, type: "dashed" } },
    },
    series: [
      {
        type: "bar",
        data: data.map((d) => ({ value: d.avgScore, count: d.count })),
        itemStyle: { color: barColor, borderRadius: [4, 4, 0, 0] },
        barMaxWidth: 50,
        barWidth: barSize,
      },
    ],
  };
}

export function buildSectionScoreBarOption({
  data,
  colors,
  getBarColor,
}: {
  data: { section: string; score: number }[];
  colors: ChartThemeColors;
  getBarColor: (score: number) => string;
}): EChartsOption {
  const rows = data.map((item) => ({ section: item.section, score: item.score }));
  return buildVerticalBarOption({
    data: rows,
    labelKey: "section",
    valueKey: "score",
    colors,
    getItemColor: (item) => getBarColor(Number(item.score)),
    showValueLabels: true,
    domainMax: 100,
  });
}
