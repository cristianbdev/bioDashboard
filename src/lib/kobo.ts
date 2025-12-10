/* Utility functions to normalize KoboToolbox data into dashboard-friendly structures. */

export type KoboApiResponse = {
  count: number;
  results: KoboRawRecord[];
};

export type KoboRawRecord = Record<string, any> & {
  _id: number;
  _submission_time?: string;
  "Facility_General_Information/Facility_Name"?: string;
  "Facility_General_Information/Location"?: string;
  "Facility_General_Information/Which_species_are_cultured_in_"?: string;
  "Facility_General_Information/Production_system"?: string;
  "Facility_General_Information/respondent_role"?: string;
  "Facility_General_Information/Respondent_name"?: string;
};

export type SectionScore = {
  section: string;
  score: number;
  positives: number;
  total: number;
};

export type FacilitySummary = {
  id: number;
  name: string;
  location?: string;
  species?: string;
  productionSystem?: string;
  productionType?: string;
  basedOn?: string;
  market?: string;
  retailType?: string;
  respondent?: string;
  respondentRole?: string;
  respondentGender?: string;
  respondentEducation?: string;
  yearsOperation?: string;
  lastUpdated?: string;
  score: number;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  waterSource?: string;
  waterMonitoring?: string;
  waterMonitoringFrequency?: string;
  waterTreatment?: boolean;
  mortalityDisposal?: string;
  quarantine?: boolean;
  antibiotics?: boolean;
  antibioticTypes?: string[];
  antibioticRecords?: boolean;
  diagnostics?: boolean;
  diagnosticTypes?: string[];
  hasSOP?: boolean;
  hasRecords?: boolean;
  recordTypes?: string[];
  hasBiosecurityProgram?: boolean;
  feedType?: string;
  nearbyFacilities?: string;
  sectionScores: SectionScore[];
  riskFactors: {
    critical: string[];
    medium: string[];
    positive: string[];
  };
  geolocation?: [number, number];
};

export type DashboardData = {
  facilities: FacilitySummary[];
  stats: {
    totalRecords: number;
    avgScore: number;
    highRiskCount: number;
    mediumRiskCount: number;
    lowRiskCount: number;
    lastUpdated?: string;
  };
  practices: {
    quarantineRate: number;
    antibioticUseRate: number;
    antibioticRecordRate: number;
    diagnosticsLabRate: number;
    sopRate: number;
    recordKeepingRate: number;
    biosecurityProgramRate: number;
    waterTreatmentRate: number;
    waterMonitoring: { label: string; count: number }[];
    mortalityDisposal: { method: string; count: number }[];
    geoCoverage: number;
  };
  demographics: {
    byEducation: { level: string; count: number }[];
    byYearsOperation: { years: string; count: number }[];
    byGender: { gender: string; count: number }[];
    byRole: { role: string; count: number }[];
  };
  operations: {
    byMarket: { market: string; count: number }[];
    byProductionType: { type: string; count: number }[];
    byWaterSource: { source: string; count: number }[];
    byFeedType: { type: string; count: number }[];
  };
  antibioticUsage: { antibiotic: string; count: number }[];
  riskMix: { level: string; count: number; color: string }[];
  distribution: { bucket: string; count: number }[];
  submissionsOverTime: { date: string; count: number }[];
  sectionAverages: { section: string; score: number }[];
  topRiskFactors: { factor: string; count: number }[];
  positiveFactors: { factor: string; count: number }[];
  comparatives: {
    bySpecies: { name: string; avgScore: number; count: number }[];
    bySystem: { name: string; avgScore: number; count: number }[];
    byMarket: { name: string; avgScore: number; count: number }[];
    byEducation: { name: string; avgScore: number; count: number }[];
    byYearsOperation: { name: string; avgScore: number; count: number }[];
    byWaterSource: { name: string; avgScore: number; count: number }[];
    byFeedType: { name: string; avgScore: number; count: number }[];
  };
  heatmap: { facility: string; factor: string; value: number }[];
};

const SECTION_FIELDS: Record<string, string[]> = {
  Environment: [
    "Environment_and_surrounding_areas/_1_1",
    "Environment_and_surrounding_areas/_1_2",
    "Environment_and_surrounding_areas/_1_3",
    "Environment_and_surrounding_areas/_1_4",
    "Environment_and_surrounding_areas/_1_5",
  ],
  Introduction: [
    "Introduction_of_all_life_stages/_2_1",
    "Introduction_of_all_life_stages/_2_2",
    "Introduction_of_all_life_stages/_2_3",
    "Introduction_of_all_life_stages/_2_4",
    "Introduction_of_all_life_stages/_2_5",
    "Introduction_of_all_life_stages/_2_7",
    "Introduction_of_all_life_stages/_2_12",
    "Introduction_of_all_life_stages/_2_13",
  ],
  Water: [
    "source_of_water/_3_1",
    "source_of_water/_3_2",
    "source_of_water/_3_3",
    "source_of_water/_3_4",
    "source_of_water/_3_5",
    "source_of_water/_3_6",
    "source_of_water/_3_8",
    "source_of_water/_3_9",
    "source_of_water/_3_10",
    "source_of_water/_3_11",
  ],
  Fomites: [
    "fomites/_4_1",
    "fomites/_4_2",
    "fomites/_4_3",
    "fomites/_4_4",
    "fomites/_4_5",
    "fomites/_4_6",
    "fomites/_4_7",
    "fomites/_4_8",
    "fomites/_4_9",
    "fomites/_4_13",
    "fomites/_4_14",
    "fomites/_4_15",
  ],
  Biovectors: [
    "biovectors/_5_1",
    "biovectors/_5_2",
    "biovectors/_5_3",
    "biovectors/_5_4",
    "biovectors/_5_5",
    "biovectors/_5_6",
    "biovectors/_5_7",
  ],
  Personnel: [
    "personnel_and_visitor/_6_1",
    "personnel_and_visitor/_6_2",
    "personnel_and_visitor/_6_3",
    "personnel_and_visitor/_6_4",
    "personnel_and_visitor/_6_5",
    "personnel_and_visitor/_6_6",
    "personnel_and_visitor/_6_7",
    "personnel_and_visitor/_6_8",
    "personnel_and_visitor/_6_9",
  ],
  Management: [
    "management/_7_1",
    "management/_7_2",
    "management/_7_3",
    "management/_7_4",
    "management/_7_5",
  ],
  Health: [
    "health_monitoring/_8_1",
    "health_monitoring/_8_2",
    "health_monitoring/_8_3",
    "health_monitoring/_8_4",
    "health_monitoring/_8_5",
    "health_monitoring/_8_6",
    "health_monitoring/_8_7",
    "health_monitoring/_8_8",
    "health_monitoring/_8_9",
    "health_monitoring/_8_10",
    "health_monitoring/_8_11",
    "health_monitoring/_8_12",
    "health_monitoring/_8_13",
    "health_monitoring/_8_14",
    "health_monitoring/_8_15",
    "health_monitoring/_8_16",
    "health_monitoring/_8_17",
  ],
  VMP: [
    "VMP/_9_1",
    "VMP/_9_2",
    "VMP/_9_3",
    "VMP/_9_4",
    "VMP/_9_5",
    "VMP/_9_6",
    "VMP/_9_7",
    "VMP/_9_8",
    "VMP/_9_9",
    "VMP/_9_10",
    "VMP/_9_11",
    "VMP/_9_12",
    "VMP/_9_13",
    "VMP/_9_14",
    "VMP/_9_15",
    "VMP/_9_16",
    "VMP/_9_17",
  ],
  Equipment: [
    "equipment/_10_1",
    "equipment/_10_2",
    "equipment/_10_3",
    "equipment/_10_4",
    "equipment/_10_5",
    "equipment/_10_6",
    "equipment/_10_7",
    "equipment/_10_8",
    "equipment/_10_9",
    "equipment/_10_11",
    "equipment/_10_13",
    "equipment/_10_14",
    "equipment/_10_15",
    "equipment/_10_16",
  ],
  SOP: [
    "SOP/_11_1",
    "SOP/_11_5",
    "SOP/_11_6",
    "SOP/_11_7",
    "SOP/_11_8",
  ],
};

const RISK_MAPPING: { key: string; label: string; critical?: boolean }[] = [
  {
    key: "Introduction_of_all_life_stages/_2_12",
    label: "No quarantine or isolation on arrival",
    critical: true,
  },
  {
    key: "Introduction_of_all_life_stages/_2_13",
    label: "No diagnostic testing on arrival",
  },
  {
    key: "source_of_water/_3_4",
    label: "Water without filtration or treatment",
    critical: true,
  },
  {
    key: "source_of_water/_3_8",
    label: "No water-quality monitoring",
  },
  {
    key: "fomites/_4_6",
    label: "Vehicles/equipment not cleaned",
    critical: true,
  },
  {
    key: "fomites/_4_9",
    label: "Shared equipment without disinfection",
    critical: true,
  },
  {
    key: "biovectors/_5_6",
    label: "Waste released into water",
    critical: true,
  },
  {
    key: "personnel_and_visitor/_6_2",
    label: "No PPE for staff or visitors",
  },
  {
    key: "personnel_and_visitor/_6_3",
    label: "No hand hygiene on entry",
  },
  {
    key: "health_monitoring/_8_3",
    label: "No clinical monitoring",
  },
  {
    key: "health_monitoring/_8_11",
    label: "No laboratory diagnostics",
  },
  {
    key: "VMP/_9_6",
    label: "No expiry or storage control of VMP",
  },
  {
    key: "VMP/_9_15",
    label: "No antibiotic-use records",
    critical: true,
  },
  {
    key: "equipment/_10_9",
    label: "Equipment not disinfected",
  },
  {
    key: "SOP/_11_7",
    label: "No written SOPs",
    critical: true,
  },
  {
    key: "SOP/_11_8",
    label: "No operational records",
  },
];

const POSITIVE_HINTS = ["yes", "daily", "weekly", "twice", "original_packaging", "signalized", "protective", "designated", "cool_and_dry", "approved", "filtration"];
const NEGATIVE_HINTS = ["no", "never", "none", "does_not", "not_applicable", "no_apply", "no_diagnostics", "not_available"];

function scoreValue(value: unknown): number {
  if (!value) return 0.5;
  const v = String(value).toLowerCase();
  if (NEGATIVE_HINTS.some((k) => v.includes(k))) return 0;
  if (POSITIVE_HINTS.some((k) => v.includes(k))) return 1;
  return 0.6; // neutral/unknown, lean slightly positive
}

function computeSectionScores(record: KoboRawRecord): SectionScore[] {
  return Object.entries(SECTION_FIELDS).map(([section, fields]) => {
    let positives = 0;
    let total = 0;
    fields.forEach((field) => {
      if (record[field] !== undefined) {
        total += 1;
        positives += scoreValue(record[field]);
      }
    });
    const score = total ? Math.round((positives / total) * 100) : 50;
    return { section, score, positives, total };
  });
}

function toRiskLevel(score: number): "LOW" | "MEDIUM" | "HIGH" {
  if (score < 50) return "HIGH";
  if (score < 70) return "MEDIUM";
  return "LOW";
}

function cleanLabel(str?: string): string {
  if (!str) return "";
  return str
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function extractSingle(value?: string): string | undefined {
  if (!value) return undefined;
  return cleanLabel(value.split(" ")[0] ?? value);
}

function isPositive(value?: string): boolean {
  if (!value) return false;
  const v = value.toLowerCase();
  if (NEGATIVE_HINTS.some((k) => v.includes(k))) return false;
  return POSITIVE_HINTS.some((k) => v.includes(k));
}

function includeWord(value: unknown, word: string) {
  if (!value) return false;
  return String(value).toLowerCase().includes(word.toLowerCase());
}

function detectRisks(record: KoboRawRecord) {
  const critical: string[] = [];
  const medium: string[] = [];
  const positive: string[] = [];

  RISK_MAPPING.forEach(({ key, label, critical: isCritical }) => {
    const raw = record[key];
    if (raw === undefined) return;
    const val = String(raw).toLowerCase();
    const isNegative = NEGATIVE_HINTS.some((k) => val.includes(k));
    const isPositive = POSITIVE_HINTS.some((k) => val.includes(k));
    if (isNegative) {
      (isCritical ? critical : medium).push(label);
    } else if (isPositive) {
      positive.push(label);
    }
  });

  return { critical, medium, positive };
}

function extractList(value?: string): string[] {
  if (!value) return [];
  return value.split(" ").map((v) => cleanLabel(v)).filter(Boolean);
}

function countByField<T extends Record<string, any>>(
  items: T[],
  field: keyof T,
): { name: string; count: number }[] {
  const map: Record<string, number> = {};
  items.forEach((item) => {
    const val = item[field];
    if (val) {
      const key = String(val);
      map[key] = (map[key] || 0) + 1;
    }
  });
  return Object.entries(map)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

function avgScoreByField<T extends { score: number } & Record<string, any>>(
  items: T[],
  field: keyof T,
): { name: string; avgScore: number; count: number }[] {
  const map: Record<string, number[]> = {};
  items.forEach((item) => {
    const val = item[field];
    if (val) {
      const key = String(val);
      map[key] = map[key] || [];
      map[key].push(item.score);
    }
  });
  return Object.entries(map).map(([name, scores]) => ({
    name,
    avgScore: Math.round(scores.reduce((a, b) => a + b, 0) / Math.max(scores.length, 1)),
    count: scores.length,
  }));
}

export function transformKoboData(raw: KoboApiResponse): DashboardData {
  const facilities: FacilitySummary[] = raw.results.map((record) => {
    const sectionScores = computeSectionScores(record);
    const score =
      sectionScores.length > 0
        ? Math.round(
            sectionScores.reduce((acc, s) => acc + s.score, 0) /
              sectionScores.length,
          )
        : 0;
    const riskFactors = detectRisks(record);

    const waterMonitoringFreq = record["source_of_water/_3_10"];
    const waterParams = record["source_of_water/_3_9"];
    const mortalityDisposal = record["health_monitoring/_8_9"];
    const quarantine = includeWord(record["Introduction_of_all_life_stages/_2_12"], "yes");
    const antibiotics = includeWord(record["VMP/_9_7"], "antibiotic");
    const antibioticRecords = includeWord(record["VMP/_9_15"], "yes");
    const diagnostics = !NEGATIVE_HINTS.some((n) =>
      String(record["health_monitoring/_8_11"] ?? "").toLowerCase().includes(n),
    );
    const hasSOP = includeWord(record["SOP/_11_1"], "yes");
    const hasRecords = !includeWord(record["SOP/_11_5"], "no_records");
    const hasBiosecurityProgram = includeWord(record["SOP/_11_2"], "biosecurity");
    const waterTreatment = includeWord(record["source_of_water/_3_4"], "yes") || 
                           includeWord(record["source_of_water/_3_5"], "filtration");

    const geolocation = record._geolocation as [number, number] | undefined;

    return {
      id: record._id,
      name:
        record["Facility_General_Information/Facility_Name"] ??
        `Facility ${record._id}`,
      location: record["Facility_General_Information/Location"],
      species: extractSingle(
        record["Facility_General_Information/Which_species_are_cultured_in_"],
      ),
      productionSystem: extractSingle(
        record["Facility_General_Information/Production_system"],
      ),
      productionType: cleanLabel(record["Facility_General_Information/Type_production"]),
      basedOn: cleanLabel(record["Facility_General_Information/Based"]),
      market: cleanLabel(record["Facility_General_Information/Market"]),
      retailType: cleanLabel(record["Facility_General_Information/Type_retails"]),
      respondent: record["Facility_General_Information/Respondent_name"],
      respondentRole: cleanLabel(record["Facility_General_Information/respondent_role"]),
      respondentGender: cleanLabel(record["Facility_General_Information/Respondent_s_Gender"]),
      respondentEducation: cleanLabel(record["Facility_General_Information/Respondent_education"]),
      yearsOperation: cleanLabel(record["Facility_General_Information/Years_operation"]),
      lastUpdated: record._submission_time,
      waterSource: cleanLabel(record["source_of_water/_3_1"]),
      waterMonitoring: cleanLabel(waterParams),
      waterMonitoringFrequency: cleanLabel(waterMonitoringFreq),
      waterTreatment,
      mortalityDisposal: cleanLabel(mortalityDisposal),
      quarantine,
      antibiotics,
      antibioticTypes: extractList(record["VMP/_9_11"]),
      antibioticRecords,
      diagnostics,
      diagnosticTypes: extractList(record["health_monitoring/_8_11"]),
      hasSOP,
      hasRecords,
      recordTypes: extractList(record["SOP/_11_5"]),
      hasBiosecurityProgram,
      feedType: cleanLabel(record["fomites/_4_1"]),
      nearbyFacilities: cleanLabel(record["Environment_and_surrounding_areas/_1_2"]),
      score,
      riskLevel: toRiskLevel(score),
      sectionScores,
      riskFactors,
      geolocation,
    };
  });

  const totalRecords = facilities.length;
  const avgScore =
    totalRecords > 0
      ? Math.round(
          facilities.reduce((acc, f) => acc + f.score, 0) / totalRecords,
        )
      : 0;
  const highRiskCount = facilities.filter((f) => f.riskLevel === "HIGH").length;
  const mediumRiskCount = facilities.filter((f) => f.riskLevel === "MEDIUM").length;
  const lowRiskCount = facilities.filter((f) => f.riskLevel === "LOW").length;
  const lastUpdated =
    facilities
      .map((f) => f.lastUpdated)
      .filter(Boolean)
      .sort()
      .reverse()[0] ?? undefined;

  const riskMix = [
    { level: "High", count: highRiskCount, color: "#ef4444" },
    { level: "Medium", count: mediumRiskCount, color: "#f59e0b" },
    { level: "Low", count: lowRiskCount, color: "#22c55e" },
  ];

  const calcRate = (filter: (f: FacilitySummary) => boolean) =>
    facilities.length > 0
      ? Math.round((facilities.filter(filter).length / facilities.length) * 100)
      : 0;

  const quarantineRate = calcRate((f) => f.quarantine === true);
  const antibioticUseRate = calcRate((f) => f.antibiotics === true);
  const antibioticRecordRate = calcRate((f) => f.antibioticRecords === true);
  const diagnosticsLabRate = calcRate((f) => f.diagnostics === true);
  const sopRate = calcRate((f) => f.hasSOP === true);
  const recordKeepingRate = calcRate((f) => f.hasRecords === true);
  const biosecurityProgramRate = calcRate((f) => f.hasBiosecurityProgram === true);
  const waterTreatmentRate = calcRate((f) => f.waterTreatment === true);

  const waterMonitoringMap: Record<string, number> = {};
  facilities.forEach((f) => {
    if (!f.waterMonitoringFrequency) return;
    const key = f.waterMonitoringFrequency;
    waterMonitoringMap[key] = (waterMonitoringMap[key] || 0) + 1;
  });
  const waterMonitoring = Object.entries(waterMonitoringMap)
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);

  const mortalityMap: Record<string, number> = {};
  facilities.forEach((f) => {
    if (!f.mortalityDisposal) return;
    const key = f.mortalityDisposal;
    mortalityMap[key] = (mortalityMap[key] || 0) + 1;
  });
  const mortalityDisposal = Object.entries(mortalityMap)
    .map(([method, count]) => ({ method, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  const geoCoverage = facilities.filter((f) => !!f.geolocation).length;

  // Demographics
  const byEducation = countByField(
    facilities.map((f) => ({ education: f.respondentEducation })),
    "education"
  ).map((e) => ({ level: e.name, count: e.count }));

  const byYearsOperation = countByField(
    facilities.map((f) => ({ years: f.yearsOperation })),
    "years"
  ).map((e) => ({ years: e.name, count: e.count }));

  const byGender = countByField(
    facilities.map((f) => ({ gender: f.respondentGender })),
    "gender"
  ).map((e) => ({ gender: e.name, count: e.count }));

  const byRole = countByField(
    facilities.map((f) => ({ role: f.respondentRole })),
    "role"
  ).map((e) => ({ role: e.name, count: e.count }));

  // Operations
  const byMarketOps = countByField(
    facilities.map((f) => ({ market: f.market })),
    "market"
  ).map((e) => ({ market: e.name, count: e.count }));

  const byProductionType = countByField(
    facilities.map((f) => ({ type: f.productionType })),
    "type"
  ).map((e) => ({ type: e.name, count: e.count }));

  const byWaterSource = countByField(
    facilities.map((f) => ({ source: f.waterSource })),
    "source"
  ).map((e) => ({ source: e.name, count: e.count }));

  const byFeedType = countByField(
    facilities.map((f) => ({ type: f.feedType })),
    "type"
  ).map((e) => ({ type: e.name, count: e.count }));

  // Antibiotic usage breakdown
  const antibioticCounts: Record<string, number> = {};
  facilities.forEach((f) => {
    (f.antibioticTypes ?? []).forEach((ab) => {
      antibioticCounts[ab] = (antibioticCounts[ab] || 0) + 1;
    });
  });
  const antibioticUsage = Object.entries(antibioticCounts)
    .map(([antibiotic, count]) => ({ antibiotic, count }))
    .sort((a, b) => b.count - a.count);

  const distributionBuckets = [
    { label: "0-20", min: 0, max: 20 },
    { label: "21-40", min: 21, max: 40 },
    { label: "41-60", min: 41, max: 60 },
    { label: "61-80", min: 61, max: 80 },
    { label: "81-100", min: 81, max: 100 },
  ];
  const distribution = distributionBuckets.map((b) => ({
    bucket: b.label,
    count: facilities.filter(
      (f) => f.score >= b.min && f.score <= b.max,
    ).length,
  }));

  // Submission timeline (by day)
  const submissionMap: Record<string, number> = {};
  facilities.forEach((f) => {
    if (!f.lastUpdated) return;
    const date = String(f.lastUpdated).slice(0, 10);
    submissionMap[date] = (submissionMap[date] || 0) + 1;
  });
  const submissionsOverTime = Object.entries(submissionMap)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => (a.date > b.date ? 1 : -1));

  const sectionAverages = Object.keys(SECTION_FIELDS).map((section) => {
    const values: number[] = [];
    facilities.forEach((f) => {
      const match = f.sectionScores.find((s) => s.section === section);
      if (match) values.push(match.score);
    });
    const score =
      values.length > 0
        ? Math.round(values.reduce((a, b) => a + b, 0) / values.length)
        : 0;
    return { section, score };
  });

  const riskCounts: Record<string, number> = {};
  const positiveCounts: Record<string, number> = {};
  facilities.forEach((f) => {
    [...f.riskFactors.critical, ...f.riskFactors.medium].forEach((factor) => {
      riskCounts[factor] = (riskCounts[factor] || 0) + 1;
    });
    f.riskFactors.positive.forEach((factor) => {
      positiveCounts[factor] = (positiveCounts[factor] || 0) + 1;
    });
  });
  const topRiskFactors = Object.entries(riskCounts)
    .map(([factor, count]) => ({ factor, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const positiveFactors = Object.entries(positiveCounts)
    .map(([factor, count]) => ({ factor, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  const bySpecies = avgScoreByField(facilities, "species");
  const bySystem = avgScoreByField(facilities, "productionSystem");
  const byMarket = avgScoreByField(facilities, "market");
  const byEducationComp = avgScoreByField(facilities, "respondentEducation");
  const byYearsComp = avgScoreByField(facilities, "yearsOperation");
  const byWaterSourceComp = avgScoreByField(facilities, "waterSource");
  const byFeedTypeComp = avgScoreByField(facilities, "feedType");

  const heatmap: { facility: string; factor: string; value: number }[] = [];
  const heatmapFactors = topRiskFactors.slice(0, 6).map((r) => r.factor);
  facilities.forEach((f) => {
    heatmapFactors.forEach((factor) => {
      const hasFactor =
        f.riskFactors.critical.includes(factor) ||
        f.riskFactors.medium.includes(factor);
      heatmap.push({
        facility: f.name,
        factor,
        value: hasFactor ? 1 : 0,
      });
    });
  });

  return {
    facilities,
    stats: { totalRecords, avgScore, highRiskCount, mediumRiskCount, lowRiskCount, lastUpdated },
    practices: {
      quarantineRate,
      antibioticUseRate,
      antibioticRecordRate,
      diagnosticsLabRate,
      sopRate,
      recordKeepingRate,
      biosecurityProgramRate,
      waterTreatmentRate,
      waterMonitoring,
      mortalityDisposal,
      geoCoverage,
    },
    demographics: {
      byEducation,
      byYearsOperation,
      byGender,
      byRole,
    },
    operations: {
      byMarket: byMarketOps,
      byProductionType,
      byWaterSource,
      byFeedType,
    },
    antibioticUsage,
    riskMix,
    distribution,
    sectionAverages,
    topRiskFactors,
    positiveFactors,
    comparatives: {
      bySpecies,
      bySystem,
      byMarket,
      byEducation: byEducationComp,
      byYearsOperation: byYearsComp,
      byWaterSource: byWaterSourceComp,
      byFeedType: byFeedTypeComp,
    },
    heatmap,
    submissionsOverTime,
  };
}
