import type { EChartsOption } from "echarts";
import type { ChartThemeColors } from "@/lib/chart-theme";

export function buildDonutOption({
  data,
  labelKey,
  valueKey,
  colors,
  totalLabel = "Total",
}: {
  data: Record<string, string | number>[];
  labelKey: string;
  valueKey: string;
  colors: ChartThemeColors;
  totalLabel?: string;
}): EChartsOption {
  const pieData = data.map((item, index) => ({
    name: String(item[labelKey] ?? ""),
    value: Number(item[valueKey] ?? 0),
    itemStyle: { color: colors.chart[index % colors.chart.length] },
  }));
  const total = pieData.reduce((sum, item) => sum + item.value, 0);

  return {
    backgroundColor: "transparent",
    tooltip: {
      trigger: "item",
      backgroundColor: colors.raised,
      borderColor: colors.borderSubtle,
      textStyle: { color: colors.textPrimary },
      formatter: (params: unknown) => {
        const p = params as { name: string; value: number; percent?: number };
        const pct = p.percent ?? (total > 0 ? (p.value / total) * 100 : 0);
        return `${p.name}<br/>${p.value} (${pct.toFixed(1)}%)`;
      },
    },
    series: [
      {
        type: "pie",
        radius: ["55%", "75%"],
        center: ["50%", "46%"],
        padAngle: 2,
        label: { show: false },
        data: pieData,
      },
    ],
    graphic: [
      {
        type: "text",
        left: "center",
        top: "42%",
        style: {
          text: String(total),
          fill: colors.textPrimary,
          fontSize: 24,
          fontWeight: 700,
          align: "center",
        },
      },
      {
        type: "text",
        left: "center",
        top: "50%",
        style: {
          text: totalLabel,
          fill: colors.textSecondary,
          fontSize: 11,
          align: "center",
        },
      },
    ],
  };
}
