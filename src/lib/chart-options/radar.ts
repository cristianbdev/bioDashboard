import type { EChartsOption } from "echarts";
import type { ChartThemeColors } from "@/lib/chart-theme";
import type { SectionRadarData } from "@/lib/chart-data/section-radar";

export function buildSectionRadarOption({
  data,
  colors,
}: {
  data: SectionRadarData;
  colors: ChartThemeColors;
}): EChartsOption {
  const palette = [colors.brand, colors.chart[7] ?? colors.chart[1], colors.chart[2], colors.chart[3]];

  return {
    backgroundColor: "transparent",
    tooltip: {
      trigger: "item",
      backgroundColor: colors.raised,
      borderColor: colors.borderSubtle,
      textStyle: { color: colors.textPrimary },
    },
    legend: {
      bottom: 0,
      textStyle: { color: colors.textSecondary, fontSize: 11 },
      itemWidth: 12,
      itemHeight: 8,
    },
    radar: {
      indicator: data.indicators,
      center: ["50%", "43%"],
      radius: "55%",
      axisName: {
        color: colors.textSecondary,
        fontSize: 9,
        overflow: "truncate",
        width: 68,
      },
      splitLine: { lineStyle: { color: colors.borderSubtle } },
      splitArea: { show: false },
      axisLine: { lineStyle: { color: colors.borderSubtle } },
    },
    series: [
      {
        type: "radar",
        data: data.series.map((entry, index) => ({
          name: entry.name,
          value: entry.values,
          lineStyle: { width: 2, color: palette[index % palette.length] },
          itemStyle: { color: palette[index % palette.length] },
          areaStyle: { opacity: index === 0 ? 0.18 : 0.08, color: palette[index % palette.length] },
        })),
      },
    ],
  };
}
