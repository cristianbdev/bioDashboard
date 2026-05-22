import { echarts } from "@/lib/echarts";

export type AtlasThemeName = "atlas-light" | "atlas-dark";

export interface ChartThemeColors {
  textPrimary: string;
  textSecondary: string;
  borderSubtle: string;
  borderDefault: string;
  raised: string;
  surfaceBase: string;
  surfaceElevated: string;
  danger: string;
  warning: string;
  success: string;
  brand: string;
  chart: string[];
}

const SEMANTIC_KEYS: Array<[keyof Omit<ChartThemeColors, "chart">, string]> = [
  ["textPrimary", "--color-text-primary"],
  ["textSecondary", "--color-text-secondary"],
  ["borderSubtle", "--color-border-subtle"],
  ["borderDefault", "--color-border-default"],
  ["raised", "--color-raised"],
  ["surfaceBase", "--color-surface-base"],
  ["surfaceElevated", "--color-surface-elevated"],
  ["danger", "--color-danger"],
  ["warning", "--color-warning"],
  ["success", "--color-success"],
  ["brand", "--color-brand"],
];

const CHART_VAR_NAMES = [
  "--color-chart-1",
  "--color-chart-2",
  "--color-chart-3",
  "--color-chart-4",
  "--color-chart-5",
  "--color-chart-6",
  "--color-chart-7",
  "--color-chart-8",
] as const;

const LIGHT_FALLBACK: ChartThemeColors = {
  textPrimary: "#1e293b",
  textSecondary: "#475569",
  borderSubtle: "#e2e8e5",
  borderDefault: "#cbd5e1",
  raised: "#ffffff",
  surfaceBase: "#f5f7f6",
  surfaceElevated: "#fbfcfc",
  danger: "#b42318",
  warning: "#a16207",
  success: "#15803d",
  brand: "#0f766e",
  chart: ["#0f766e", "#3b82f6", "#f59e0b", "#8b5cf6", "#06b6d4", "#ef4444", "#10b981", "#64748b"],
};

const DARK_FALLBACK: ChartThemeColors = {
  textPrimary: "#f1f5f9",
  textSecondary: "#94a3b8",
  borderSubtle: "#334155",
  borderDefault: "#475569",
  raised: "#334155",
  surfaceBase: "#0f172a",
  surfaceElevated: "#1e293b",
  danger: "#ef4444",
  warning: "#eab308",
  success: "#22c55e",
  brand: "#14b8a6",
  chart: ["#2dd4bf", "#93c5fd", "#fcd34d", "#c4b5fd", "#67e8f9", "#fca5a5", "#6ee7b7", "#94a3b8"],
};

export function readChartThemeColors(): ChartThemeColors {
  if (typeof document === "undefined") {
    return LIGHT_FALLBACK;
  }

  const styles = getComputedStyle(document.documentElement);
  const base = document.documentElement.classList.contains("dark") ? DARK_FALLBACK : LIGHT_FALLBACK;
  const colors: ChartThemeColors = { ...base, chart: [...base.chart] };

  for (const [key, cssVar] of SEMANTIC_KEYS) {
    const value = styles.getPropertyValue(cssVar).trim();
    if (value) {
      colors[key] = value;
    }
  }

  colors.chart = CHART_VAR_NAMES.map((cssVar, index) => {
    const value = styles.getPropertyValue(cssVar).trim();
    return value || base.chart[index] || "#64748b";
  });

  return colors;
}

function buildEchartsTheme(colors: ChartThemeColors): Record<string, unknown> {
  return {
    color: colors.chart,
    backgroundColor: "transparent",
    textStyle: {
      color: colors.textPrimary,
      fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
    },
    title: {
      textStyle: { color: colors.textPrimary },
    },
    legend: {
      textStyle: { color: colors.textSecondary },
    },
    tooltip: {
      backgroundColor: colors.raised,
      borderColor: colors.borderSubtle,
      textStyle: { color: colors.textPrimary },
    },
    categoryAxis: {
      axisLine: { lineStyle: { color: colors.borderDefault } },
      axisTick: { lineStyle: { color: colors.borderSubtle } },
      axisLabel: { color: colors.textSecondary },
      splitLine: { lineStyle: { color: colors.borderSubtle } },
    },
    valueAxis: {
      axisLine: { lineStyle: { color: colors.borderDefault } },
      axisTick: { lineStyle: { color: colors.borderSubtle } },
      axisLabel: { color: colors.textSecondary },
      splitLine: { lineStyle: { color: colors.borderSubtle, type: "dashed" } },
    },
  };
}

let registeredLight = false;
let registeredDark = false;

export function syncAtlasEchartsThemes(colors: ChartThemeColors, isDark: boolean): AtlasThemeName {
  const themeName: AtlasThemeName = isDark ? "atlas-dark" : "atlas-light";
  const themeOption = buildEchartsTheme(colors);

  if (isDark) {
    if (!registeredDark) {
      echarts.registerTheme("atlas-dark", themeOption);
      registeredDark = true;
    } else {
      echarts.registerTheme("atlas-dark", themeOption);
    }
  } else if (!registeredLight) {
    echarts.registerTheme("atlas-light", themeOption);
    registeredLight = true;
  } else {
    echarts.registerTheme("atlas-light", themeOption);
  }

  return themeName;
}

/** Resolves `var(--color-chart-N)` to the current theme hex. */
export function resolveChartTokenColor(token: string, colors: ChartThemeColors): string {
  const match = token.match(/chart-(\d)/);
  if (match) {
    const index = Number(match[1]) - 1;
    return colors.chart[index] ?? colors.chart[0];
  }
  return token;
}

export function resolveMixedColor(baseCssVar: string, mixPercent: number): string {
  if (typeof document === "undefined") {
    return LIGHT_FALLBACK.brand;
  }

  const el = document.createElement("div");
  el.style.position = "absolute";
  el.style.visibility = "hidden";
  el.style.backgroundColor = `color-mix(in srgb, var(${baseCssVar}) ${mixPercent}%, transparent)`;
  document.body.appendChild(el);
  const resolved = getComputedStyle(el).backgroundColor;
  document.body.removeChild(el);
  return resolved || readChartThemeColors().brand;
}
