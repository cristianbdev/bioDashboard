"use client";

import { useSyncExternalStore } from "react";
import {
  readChartThemeColors,
  syncAtlasEchartsThemes,
  type AtlasThemeName,
  type ChartThemeColors,
} from "@/lib/chart-theme";

export type ChartThemeSnapshot = {
  colors: ChartThemeColors;
  themeName: AtlasThemeName;
};

function colorsEqual(a: ChartThemeColors, b: ChartThemeColors): boolean {
  if (
    a.textPrimary !== b.textPrimary ||
    a.textSecondary !== b.textSecondary ||
    a.borderSubtle !== b.borderSubtle ||
    a.borderDefault !== b.borderDefault ||
    a.raised !== b.raised ||
    a.surfaceBase !== b.surfaceBase ||
    a.surfaceElevated !== b.surfaceElevated ||
    a.danger !== b.danger ||
    a.warning !== b.warning ||
    a.success !== b.success ||
    a.brand !== b.brand
  ) {
    return false;
  }

  if (a.chart.length !== b.chart.length) return false;
  return a.chart.every((value, index) => value === b.chart[index]);
}

function subscribeToThemeChanges(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const observer = new MutationObserver(onStoreChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });

  const media = window.matchMedia("(prefers-color-scheme: dark)");
  media.addEventListener("change", onStoreChange);

  return () => {
    observer.disconnect();
    media.removeEventListener("change", onStoreChange);
  };
}

/** Stable snapshot reference — required by useSyncExternalStore (Object.is). */
let cachedSnapshot: ChartThemeSnapshot | null = null;

function getThemeSnapshot(): ChartThemeSnapshot {
  const colors = readChartThemeColors();
  const isDark =
    typeof document !== "undefined" && document.documentElement.classList.contains("dark");
  const themeName = syncAtlasEchartsThemes(colors, isDark);

  if (cachedSnapshot && cachedSnapshot.themeName === themeName && colorsEqual(cachedSnapshot.colors, colors)) {
    return cachedSnapshot;
  }

  cachedSnapshot = { colors, themeName };
  return cachedSnapshot;
}

const SERVER_SNAPSHOT: ChartThemeSnapshot = {
  colors: {
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
  },
  themeName: "atlas-light",
};

export function useChartTheme(): ChartThemeSnapshot {
  return useSyncExternalStore(subscribeToThemeChanges, getThemeSnapshot, () => SERVER_SNAPSHOT);
}
