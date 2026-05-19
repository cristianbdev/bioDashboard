"use client";

import { useTheme } from "next-themes";

export interface ChartColors {
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
}

export function useChartColors(): ChartColors {
  const { resolvedTheme } = useTheme();

  const isDark = resolvedTheme === "dark";

  return {
    textPrimary: isDark ? "#f1f5f9" : "#1e293b",
    textSecondary: isDark ? "#94a3b8" : "#64748b",
    borderSubtle: isDark ? "#334155" : "#e2e8f0",
    borderDefault: isDark ? "#475569" : "#cbd5e1",
    raised: isDark ? "#334155" : "#ffffff",
    surfaceBase: isDark ? "#0f172a" : "#f5f7f6",
    surfaceElevated: isDark ? "#1e293b" : "#fbfcfc",
    danger: isDark ? "#ef4444" : "#b42318",
    warning: isDark ? "#eab308" : "#a16207",
    success: isDark ? "#22c55e" : "#15803d",
  };
}
