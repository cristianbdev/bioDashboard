"use client";

import { useEffect, useState } from "react";

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

const CSS_VAR_KEYS: Array<[keyof ChartColors, string]> = [
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
];

const LIGHT_FALLBACK: ChartColors = {
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
};

function readChartColorsFromDocument(): ChartColors {
  if (typeof document === "undefined") {
    return LIGHT_FALLBACK;
  }

  const styles = getComputedStyle(document.documentElement);
  const colors = { ...LIGHT_FALLBACK };

  for (const [key, cssVar] of CSS_VAR_KEYS) {
    const value = styles.getPropertyValue(cssVar).trim();
    if (value) {
      colors[key] = value;
    }
  }

  return colors;
}

export function useChartColors(): ChartColors {
  const [colors, setColors] = useState<ChartColors>(LIGHT_FALLBACK);

  useEffect(() => {
    setColors(readChartColorsFromDocument());
  }, []);

  return colors;
}
