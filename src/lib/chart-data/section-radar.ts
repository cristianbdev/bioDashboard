import type { SectionScore } from "@/lib/kobo";
import type { Translator } from "@/lib/section-labels";
import { translateSectionLabel } from "@/lib/section-labels";

export type RadarSeriesInput = {
  name: string;
  sectionScores: SectionScore[];
  side: "external" | "internal";
};

export type SectionRadarData = {
  indicators: { name: string; max: number }[];
  series: { name: string; values: number[] }[];
};

const EXTERNAL_SECTIONS = ["Environment", "Introduction", "Water", "Fomites", "Biovectors", "Personnel"] as const;
const INTERNAL_SECTIONS = ["Management", "Health", "VMP", "Equipment", "SOP"] as const;

function scoresForSide(sectionScores: SectionScore[], side: "external" | "internal", sections: readonly string[]) {
  return sections.map((section) => sectionScores.find((item) => item.section === section && item.side === side)?.score ?? 0);
}

export function buildSectionRadarData(
  inputs: RadarSeriesInput[],
  side: "external" | "internal",
  t: Translator,
): SectionRadarData {
  const sections = side === "external" ? EXTERNAL_SECTIONS : INTERNAL_SECTIONS;
  const indicators = sections.map((section) => ({
    name: translateSectionLabel(section, t),
    max: 100,
  }));

  const series = inputs.map((input) => ({
    name: input.name,
    values: scoresForSide(input.sectionScores, side, sections),
  }));

  return { indicators, series };
}

export function buildNetworkRadarFromAverages(
  sectionAverages: { section: string; side: "external" | "internal"; score: number }[],
  side: "external" | "internal",
  t: Translator,
  seriesName: string,
): SectionRadarData {
  const sections = side === "external" ? EXTERNAL_SECTIONS : INTERNAL_SECTIONS;
  const indicators = sections.map((section) => ({
    name: translateSectionLabel(section, t),
    max: 100,
  }));

  const values = sections.map(
    (section) => sectionAverages.find((item) => item.section === section && item.side === side)?.score ?? 0,
  );

  return {
    indicators,
    series: [{ name: seriesName, values }],
  };
}
