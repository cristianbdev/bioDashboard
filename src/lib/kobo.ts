import type { QuantificationCatalog, QuantificationQuestionRule, ScoringSide } from "@/lib/risk-quantification";
import { SCORING_POLICY } from "@/lib/scoring-policy";

/* KoboToolbox transformation logic using live Kobo data + instrument metadata. */

export type KoboApiResponse = {
  count: number;
  results: KoboRawRecord[];
};

export type KoboAssetResponse = {
  content?: {
    survey?: Array<{
      type?: string;
      name?: string;
      $xpath?: string;
      label?: string[];
      select_from_list_name?: string;
    }>;
    choices?: Array<{
      list_name?: string;
      name?: string;
      label?: string[];
    }>;
  };
};

export type KoboRawRecord = Record<string, unknown> & {
  _id: number;
  _submission_time?: string;
  _geolocation?: string;
};

export type RiskCategory = "NEGLIGIBLE" | "LOW" | "MEDIUM" | "HIGH";

export type SectionScore = {
  section: string;
  side: "external" | "internal";
  score: number;
  positives: number;
  total: number;
};

export type RuleStatus = {
  id: string;
  label: string;
  matched: boolean;
  applicable: boolean;
  answer: string;
};

export type QuestionStatus = {
  id: string;
  label: string;
  answer: string;
  applicable: boolean;
  compliant: boolean;
  score: number;
  maxScore: number;
  recommendation: string;
};

export type SubcategoryChecklist = {
  section: string;
  side: "external" | "internal";
  items: QuestionStatus[];
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
  respondent?: string;
  respondentRole?: string;
  respondentGender?: string;
  respondentEducation?: string;
  yearsOperation?: string;
  lastUpdated?: string;
  score: number;
  riskFactorRate: number;
  externalScore: number;
  internalScore: number;
  riskLevel: RiskCategory;
  waterSource?: string;
  waterMonitoringFrequency?: string;
  mortalityDisposal?: string;
  sectionScores: SectionScore[];
  highRiskFactors: string[];
  moderateRiskFactors: string[];
  positivePractices: string[];
  keyPractices: RuleStatus[];
  animalHealthMonitoring: RuleStatus[];
  questionChecklist: QuestionStatus[];
  subcategoryChecklist: SubcategoryChecklist[];
  responses: {
    waterMonitoring: string[];
    mortalityDisposal: string[];
    intakeWaterTreatmentApplied: string[];
    waterParametersMeasured: string[];
    personnelTrainingTopics: string[];
    recordsCoverage: string[];
    sopsCoverage: string[];
  };
  geolocation?: [number, number];
};

export type DashboardData = {
  facilities: FacilitySummary[];
  stats: {
    totalRecords: number;
    avgScore: number;
    avgExternalScore: number;
    avgInternalScore: number;
    negligibleRiskCount: number;
    highRiskCount: number;
    mediumRiskCount: number;
    lowRiskCount: number;
    lastUpdated?: string;
  };
  practices: {
    quarantineRate: number;
    writtenBiosecurityRate: number;
    noSharedEquipmentRate: number;
    equipmentDisinfectionRate: number;
    waterTreatmentRate: number;
    biovectorInspectionRate: number;
    waterMonitoring: { label: string; count: number }[];
    mortalityDisposal: { method: string; count: number }[];
    intakeWaterTreatmentApplied: { label: string; count: number }[];
    waterParametersMeasured: { label: string; count: number }[];
    personnelTrainingTopics: { label: string; count: number }[];
    recordsCoverage: { label: string; count: number }[];
    sopsCoverage: { label: string; count: number }[];
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
    bySpecies: { species: string; count: number }[];
    bySystem: { system: string; count: number }[];
    byLocation: { location: string; count: number }[];
  };
  complianceMix: { name: string; value: number; color: string }[];
  distribution: { bucket: string; count: number }[];
  sectionAverages: { section: string; side: "external" | "internal"; score: number }[];
  highRiskFactors: { factor: string; count: number }[];
  moderateRiskFactors: { factor: string; count: number }[];
  positivePractices: { factor: string; count: number }[];
  comparatives: {
    bySpecies: { name: string; avgScore: number; count: number }[];
    bySystem: { name: string; avgScore: number; count: number }[];
    byMarket: { name: string; avgScore: number; count: number }[];
    byEducation: { name: string; avgScore: number; count: number }[];
    byYearsOperation: { name: string; avgScore: number; count: number }[];
    byWaterSource: { name: string; avgScore: number; count: number }[];
    byProductionType: { name: string; avgScore: number; count: number }[];
    byLocation: { name: string; avgScore: number; count: number }[];
  };
  riskMatrixExternal: { facility: string; subcategory: string; value: number; score: number }[];
  riskMatrixInternal: { facility: string; subcategory: string; value: number; score: number }[];
  locations: { facility: string; location?: string; lat: number; lon: number }[];
  scoringMethodology: {
    sideWeights: { external: number; internal: number };
    subcategoryWeights: { section: string; side: "external" | "internal"; weight: number }[];
    questionRules: {
      id: string;
      section: string;
      side: "external" | "internal";
      question: string;
      mainScore: boolean;
      questionWeight: number;
      responses: { response: string; score: number | null; recommendation?: string }[];
    }[];
    decisions: {
      expertWeights: { status: string };
      noScore: { status: string };
    };
  };
};

type InstrumentIndex = {
  idToXpath: Record<string, string>;
  idToLabel: Record<string, string>;
  idToType: Record<string, string>;
  idToOptions: Record<string, Array<{ code: string; label: string }>>;
};

type RuleDefinition = {
  id: string;
  label: string;
  expectedAny: string[];
  applicable?: (record: KoboRawRecord, index: InstrumentIndex) => boolean;
};

type EvaluatedQuestion = {
  score: number;
  maxScore: number;
  applicable: boolean;
  answer: string;
  recommendation?: string;
};

const SUBCATEGORIES = [
  { section: "Environment", side: "external", ids: ["_1_1", "_1_2", "_1_3", "_1_4", "_1_5"] },
  { section: "Introduction", side: "external", ids: ["_2_1", "_2_2", "_2_3", "_2_4", "_2_5", "_2_7", "_2_12", "_2_13"] },
  { section: "Water", side: "external", ids: ["_3_1", "_3_2", "_3_3", "_3_4", "_3_5", "_3_6", "_3_8", "_3_9", "_3_10", "_3_11"] },
  { section: "Fomites", side: "external", ids: ["_4_1", "_4_2", "_4_3", "_4_4", "_4_5", "_4_6", "_4_7", "_4_8", "_4_9", "_4_13", "_4_14", "_4_15"] },
  { section: "Biovectors", side: "external", ids: ["_5_1", "_5_2", "_5_3", "_5_4", "_5_5", "_5_6", "_5_7"] },
  { section: "Personnel", side: "external", ids: ["_6_1", "_6_2", "_6_3", "_6_4", "_6_5", "_6_6", "_6_7", "_6_8", "_6_9"] },
  { section: "Management", side: "internal", ids: ["_7_1", "_7_2", "_7_3", "_7_4", "_7_5"] },
  { section: "Health", side: "internal", ids: ["_8_1", "_8_2", "_8_3", "_8_4", "_8_5", "_8_6", "_8_7", "_8_8", "_8_9", "_8_10", "_8_11", "_8_12", "_8_13", "_8_14", "_8_15", "_8_16", "_8_17"] },
  { section: "VMP", side: "internal", ids: ["_9_1", "_9_2", "_9_3", "_9_4", "_9_5", "_9_6", "_9_7", "_9_8", "_9_9", "_9_10", "_9_11", "_9_12", "_9_13", "_9_14", "_9_15", "_9_16", "_9_17"] },
  { section: "Equipment", side: "internal", ids: ["_10_1", "_10_2", "_10_3", "_10_4", "_10_5", "_10_6", "_10_7", "_10_8", "_10_9", "_10_11", "_10_13", "_10_14", "_10_15", "_10_16"] },
  { section: "SOP", side: "internal", ids: ["_11_1", "_11_5", "_11_6", "_11_7", "_11_8"] },
] as const;

const CATEGORY_SIDE_WEIGHTS: Record<ScoringSide, number> = {
  external: SCORING_POLICY.sideWeights.external,
  internal: SCORING_POLICY.sideWeights.internal,
};

const CATEGORY_SIDE_POINTS: Record<ScoringSide, number> = {
  external: 50,
  internal: 50,
};

const HIGH_RISK_RULES: RuleDefinition[] = [
  { id: "_2_5", label: "Purchasing animals with unknown health status", expectedAny: ["no"] },
  { id: "_4_9", label: "Shared equipment with other facilities", expectedAny: ["yes"] },
  { id: "_6_1", label: "Personnel visit other aquaculture facilities", expectedAny: ["yes", "don_t_know", "don't know"] },
  { id: "_8_10", label: "No diagnostic tests to detect diseases of concern", expectedAny: ["never"] },
  { id: "_10_8", label: "Low frequency of equipment disinfection", expectedAny: ["never", "weekly", "monthly"] },
  { id: "_8_13", label: "Listed diseases are not reported", expectedAny: ["the_diseases_are_not_reported_to_the_vet", "not reported"] },
  { id: "_11_5", label: "No written records", expectedAny: ["no_records_available"] },
  { id: "_11_7", label: "No written SOPs", expectedAny: ["no_sops_available"] },
];

const MODERATE_RISK_RULES: RuleDefinition[] = [
  { id: "_4_5", label: "Transport vehicles/containers are not appropriate", expectedAny: ["no"] },
  { id: "_4_6", label: "Vehicles are not disinfected before entering facility", expectedAny: ["no"] },
  { id: "_5_7", label: "No pest control measures", expectedAny: ["no"] },
  { id: "_6_6", label: "No visitor biosecurity procedures", expectedAny: ["none"] },
  { id: "_8_16", label: "Handling equipment is not appropriate", expectedAny: ["no"] },
  { id: "_10_1", label: "Equipment shared between ponds/cages", expectedAny: ["yes"] },
  { id: "_10_14", label: "Personnel do not sanitize hands after contact", expectedAny: ["no"] },
  { id: "_10_15", label: "Personnel are not trained", expectedAny: ["none"] },
];

const POSITIVE_RULES: RuleDefinition[] = [
  { id: "_1_5", label: "Sanitary entry system in place", expectedAny: ["yes"] },
  { id: "_2_5", label: "Health status documentation required", expectedAny: ["yes"] },
  { id: "_3_4", label: "Intake water treatment implemented", expectedAny: ["yes"] },
  { id: "_5_1", label: "Barriers/fencing prevent vector entry", expectedAny: ["yes"] },
  { id: "_9_8", label: "Veterinary medicinal products prescribed", expectedAny: ["yes"] },
  { id: "_10_6", label: "Fallowing conducted before introducing new animals", expectedAny: ["yes"] },
  { id: "_10_13", label: "Debris and waste removed regularly", expectedAny: ["yes"] },
  { id: "_6_7", label: "Visitors receive biosecurity procedures", expectedAny: ["yes"] },
];

const WATER_TREATMENT_APPLICABILITY: RuleDefinition["applicable"] = (record, idx) => {
  const answers = getNormalizedAnswerSet(record, "Production_system", idx);
  if (answers.size === 0) return true;
  for (const v of answers) {
    if (v.includes("cage") || v.includes("jaula")) return false;
  }
  return true;
};

const KEY_PRACTICES: RuleDefinition[] = [
  { id: "_2_7", label: "Quarantine on arrival", expectedAny: ["yes"] },
  { id: "_11_1", label: "Written biosecurity plan", expectedAny: ["yes"] },
  { id: "_4_9", label: "No shared equipment with other farms", expectedAny: ["no"] },
  { id: "_10_8", label: "Equipment disinfection to handle animals", expectedAny: ["after_each_use", "daily"] },
  { id: "_3_4", label: "Treatment of water (if applicable)", expectedAny: ["yes"], applicable: WATER_TREATMENT_APPLICABILITY },
  { id: "_5_2", label: "Inspection of biovectors", expectedAny: ["yes"] },
];

const ANIMAL_HEALTH_RULES: RuleDefinition[] = [
  { id: "_8_1", label: "Monitoring abnormal behavior", expectedAny: ["at_least_once_a_day"] },
  { id: "_8_2", label: "Monitoring feeding behavior", expectedAny: ["at_least_once_a_day", "at_least_twice_a_day"] },
  {
    id: "_8_4",
    label: "Necropsies in disease monitoring",
    expectedAny: ["when_unusual_mortality_presented", "when_clinical_signs_of_disease_present", "at_least_once_a_week"],
  },
  {
    id: "_8_12",
    label: "Diagnostic testing frequency",
    expectedAny: ["at_least_once_a_month", "at_least_every_3_months", "at_least_every_6_months", "yearly", "once_every_production_cycle"],
  },
];

const POSITIVE_HINTS = ["yes", "daily", "weekly", "twice", "after_each_use", "approved", "filtration", "quarantine"];
const NEGATIVE_HINTS = ["no", "never", "none", "does_not", "not_applicable", "no_apply", "no_records", "no_sops"];

function normalize(value: unknown): string {
  if (value === undefined || value === null) return "";
  return String(value)
    .toLowerCase()
    .replace(/[\u2018\u2019\u201c\u201d]/g, "'")
    .replace(/[^a-z0-9_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanLabel(str?: string): string {
  if (!str) return "";
  return str.replace(/_/g, " ").replace(/\s+/g, " ").trim().replace(/\b\w/g, (c) => c.toUpperCase());
}

function toRiskCategory(score: number): RiskCategory {
  const rate = Math.max(0, Math.min(100, 100 - score));
  if (rate <= 10) return "NEGLIGIBLE";
  if (rate <= 40) return "LOW";
  if (rate <= 70) return "MEDIUM";
  return "HIGH";
}

function scoreValue(value: unknown): number {
  const v = normalize(value);
  if (!v) return 0.5;
  if (NEGATIVE_HINTS.some((k) => v.includes(k))) return 0;
  if (POSITIVE_HINTS.some((k) => v.includes(k))) return 1;
  return 0.6;
}

function getQuestionRule(catalog: QuantificationCatalog | undefined, id: string): QuantificationQuestionRule | undefined {
  return catalog?.questionRules[id];
}

function candidatesForValue(value: string, label?: string): string[] {
  const normalizedValue = normalize(value);
  const normalizedLabel = label ? normalize(label) : "";
  const candidates = [normalizedValue, normalizedLabel].filter(Boolean);
  return Array.from(new Set(candidates));
}

function findMatchingScore(rule: QuantificationQuestionRule, value: string, label?: string): EvaluatedQuestion {
  const candidates = candidatesForValue(value, label);
  const matchedRules = rule.responseRules.filter((option) => {
    const normalizedOption = option.normalizedResponse || normalize(option.response);
    if (!normalizedOption) return false;
    return candidates.some(
      (candidate) =>
        candidate === normalizedOption ||
        candidate.includes(normalizedOption) ||
        normalizedOption.includes(candidate),
    );
  });

  if (matchedRules.length === 0) {
    const fallback = scoreValue(value);
    return {
      score: fallback * rule.questionWeight,
      maxScore: rule.questionWeight,
      applicable: true,
      answer: label ? cleanLabel(label) : cleanLabel(value),
      recommendation: undefined,
    };
  }

  const numericScores = matchedRules.map((item) => item.score).filter((item): item is number => item !== null);
  const maxNumeric = matchedRules.length > 0 ? Math.max(...numericScores, 0) : 0;
  const recommendation = matchedRules.find((item) => item.recommendation)?.recommendation ?? undefined;

  if (numericScores.length === 0) {
    return {
      score: 0,
      maxScore: 0,
      applicable: false,
      answer: label ? cleanLabel(label) : cleanLabel(value),
      recommendation,
    };
  }

  return {
    score: maxNumeric * rule.questionWeight,
    maxScore: rule.questionWeight,
    applicable: true,
    answer: label ? cleanLabel(label) : cleanLabel(value),
    recommendation,
  };
}

function avg(values: number[]): number {
  if (values.length === 0) return 0;
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
}

function buildSubcategoryWeights(catalog?: QuantificationCatalog): Record<string, number> {
  const map: Record<string, number> = {};

  (["external", "internal"] as const).forEach((side) => {
    const subcategories = SUBCATEGORIES.filter((subcategory) => subcategory.side === side);
    const scoredSubcategories = subcategories.filter((subcategory) => {
      if (!catalog) return true;
      return subcategory.ids.some((id) => catalog.questionRules[id]?.mainScore);
    });
    const eligible = scoredSubcategories.length > 0 ? scoredSubcategories : subcategories;
    const weight = eligible.length > 0 ? CATEGORY_SIDE_POINTS[side] / eligible.length : 0;
    eligible.forEach((subcategory) => {
      map[subcategory.section] = weight;
    });
  });

  return map;
}

function buildInstrumentIndex(asset?: KoboAssetResponse): InstrumentIndex {
  const idToXpath: Record<string, string> = {};
  const idToLabel: Record<string, string> = {};
  const idToType: Record<string, string> = {};
  const idToOptions: Record<string, Array<{ code: string; label: string }>> = {};

  const survey = asset?.content?.survey ?? [];
  const choices = asset?.content?.choices ?? [];

  const optionsByList: Record<string, Array<{ code: string; label: string }>> = {};
  choices.forEach((c) => {
    const list = String(c.list_name ?? "").trim();
    const code = String(c.name ?? "").trim();
    const label = String(c.label?.[0] ?? code).trim();
    if (!list || !code) return;
    optionsByList[list] = optionsByList[list] || [];
    optionsByList[list].push({ code, label });
  });

  survey.forEach((q) => {
    const type = String(q.type ?? "").trim();
    if (!type || type === "begin_group" || type === "end_group") return;
    const xpath = String(q.$xpath ?? "").trim();
    if (!xpath) return;
    const name = String(q.name ?? "").trim();
    const id = name || (xpath.includes("/") ? xpath.slice(xpath.lastIndexOf("/") + 1) : xpath);
    if (!id) return;
    idToXpath[id] = xpath;
    idToLabel[id] = String(q.label?.[0] ?? id).trim();
    idToType[id] = type;
    const list = String(q.select_from_list_name ?? "").trim();
    if (list) idToOptions[id] = optionsByList[list] ?? [];
  });

  if (!idToXpath.Production_system) {
    idToXpath.Production_system = "Facility_General_Information/Production_system";
    idToType.Production_system = "select_multiple";
  }

  return { idToXpath, idToLabel, idToType, idToOptions };
}

function getRaw(record: KoboRawRecord, id: string, idx: InstrumentIndex): string {
  const xpath = idx.idToXpath[id];
  if (!xpath) return "";
  const value = record[xpath];
  return value === undefined || value === null ? "" : String(value).trim();
}

function getValues(record: KoboRawRecord, id: string, idx: InstrumentIndex): string[] {
  const raw = getRaw(record, id, idx);
  if (!raw) return [];
  return idx.idToType[id] === "select_multiple" ? raw.split(/\s+/).filter(Boolean) : [raw];
}

function getDisplayValues(record: KoboRawRecord, id: string, idx: InstrumentIndex): string[] {
  const values = getValues(record, id, idx);
  if (values.length === 0) return [];
  const labelByCode: Record<string, string> = {};
  (idx.idToOptions[id] ?? []).forEach((opt) => {
    labelByCode[opt.code] = opt.label;
  });
  return values.map((v) => cleanLabel(labelByCode[v] ?? v)).filter(Boolean);
}

function getNormalizedAnswerSet(record: KoboRawRecord, id: string, idx: InstrumentIndex): Set<string> {
  const set = new Set<string>();
  const values = getValues(record, id, idx);
  const labelByCode: Record<string, string> = {};
  (idx.idToOptions[id] ?? []).forEach((opt) => (labelByCode[opt.code] = opt.label));
  values.forEach((v) => {
    set.add(normalize(v));
    if (labelByCode[v]) set.add(normalize(labelByCode[v]));
  });
  const raw = getRaw(record, id, idx);
  if (raw) set.add(normalize(raw));
  return set;
}

function evaluateQuestion(
  record: KoboRawRecord,
  idx: InstrumentIndex,
  id: string,
  catalog?: QuantificationCatalog,
): EvaluatedQuestion {
  const rule = getQuestionRule(catalog, id);
  const raw = getRaw(record, id, idx);
  const display = getDisplayValues(record, id, idx);
  const type = idx.idToType[id];
  const values = getValues(record, id, idx);

  if (!rule || !rule.mainScore || rule.questionWeight <= 0) {
    const rawNormalized = normalize(raw);
    const applicable = Boolean(raw) && !rawNormalized.includes("does not apply") && !rawNormalized.includes("not applicable");
    const fallbackScore = applicable ? scoreValue(raw) : 0;
    return {
      score: fallbackScore,
      maxScore: applicable ? 1 : 0,
      applicable,
      answer: display.join(", ") || cleanLabel(raw) || "-",
      recommendation: undefined,
    };
  }

  if (!raw || values.length === 0) {
    return {
      score: 0,
      maxScore: 0,
      applicable: false,
      answer: "-",
      recommendation: undefined,
    };
  }

  if (type === "select_multiple") {
    const evaluations = values.map((value, index) => findMatchingScore(rule, value, display[index]));
    const applicableEvaluations = evaluations.filter((item) => item.applicable);
    if (applicableEvaluations.length === 0) {
      return {
        score: 0,
        maxScore: 0,
        applicable: false,
        answer: display.join(", ") || cleanLabel(raw) || "-",
        recommendation: evaluations.find((item) => item.recommendation)?.recommendation,
      };
    }
    const questionScore = Math.min(
      rule.questionWeight,
      applicableEvaluations.reduce((acc, item) => acc + item.score, 0),
    );
    return {
      score: questionScore,
      maxScore: rule.questionWeight,
      applicable: true,
      answer: display.join(", ") || cleanLabel(raw) || "-",
      recommendation: applicableEvaluations.find((item) => item.recommendation)?.recommendation,
    };
  }

  const matched = findMatchingScore(rule, values[0], display[0]);
  return {
    score: matched.score,
    maxScore: matched.maxScore,
    applicable: matched.applicable,
    answer: display.join(", ") || cleanLabel(raw) || "-",
    recommendation: matched.recommendation,
  };
}

function matches(record: KoboRawRecord, idx: InstrumentIndex, rule: RuleDefinition): boolean {
  const answers = getNormalizedAnswerSet(record, rule.id, idx);
  return rule.expectedAny.some((v) => answers.has(normalize(v)));
}

function ruleStatus(record: KoboRawRecord, idx: InstrumentIndex, rule: RuleDefinition): RuleStatus {
  const applicable = rule.applicable ? rule.applicable(record, idx) : true;
  const answer = getDisplayValues(record, rule.id, idx).join(", ") || getRaw(record, rule.id, idx) || "-";
  return { id: rule.id, label: rule.label, matched: applicable ? matches(record, idx, rule) : false, applicable, answer };
}

function countByField<T extends Record<string, unknown>>(items: T[], key: keyof T): { name: string; count: number }[] {
  const map: Record<string, number> = {};
  items.forEach((item) => {
    const v = item[key];
    if (!v) return;
    const k = String(v);
    map[k] = (map[k] || 0) + 1;
  });
  return Object.entries(map)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

function avgScoreByField<T extends { score: number } & Record<string, unknown>>(items: T[], key: keyof T): { name: string; avgScore: number; count: number }[] {
  const map: Record<string, number[]> = {};
  items.forEach((item) => {
    const v = item[key];
    if (!v) return;
    const k = String(v);
    map[k] = map[k] || [];
    map[k].push(item.score);
  });
  return Object.entries(map)
    .map(([name, scores]) => ({ name, avgScore: avg(scores), count: scores.length }))
    .sort((a, b) => b.count - a.count);
}

function aggregateResponseValues(
  facilities: FacilitySummary[],
  key: keyof FacilitySummary["responses"],
): { label: string; count: number }[] {
  const map: Record<string, number> = {};
  facilities.forEach((f) => {
    (f.responses[key] ?? []).forEach((label) => {
      if (!label) return;
      map[label] = (map[label] || 0) + 1;
    });
  });
  return Object.entries(map)
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);
}

function buildQuestionStatus(
  record: KoboRawRecord,
  idx: InstrumentIndex,
  id: string,
  catalog?: QuantificationCatalog,
  precomputed?: EvaluatedQuestion,
): QuestionStatus {
  const evaluation = precomputed ?? evaluateQuestion(record, idx, id, catalog);
  const threshold = evaluation.maxScore > 0 ? evaluation.maxScore * 0.6 : 0;
  const compliant = evaluation.applicable ? evaluation.score >= threshold : false;
  return {
    id,
    label: idx.idToLabel[id] || id,
    answer: evaluation.answer,
    applicable: evaluation.applicable,
    compliant,
    score: evaluation.score,
    maxScore: evaluation.maxScore,
    recommendation: !evaluation.applicable || compliant ? "" : evaluation.recommendation ?? "",
  };
}

function toRate(records: KoboRawRecord[], idx: InstrumentIndex, rule: RuleDefinition): number {
  const applicable = records.filter((r) => (rule.applicable ? rule.applicable(r, idx) : true));
  if (applicable.length === 0) return 0;
  const matched = applicable.filter((r) => matches(r, idx, rule)).length;
  return Math.round((matched / applicable.length) * 100);
}

function parseGeolocation(value: unknown): [number, number] | undefined {
  if (Array.isArray(value) && value.length >= 2) {
    const lat = Number(value[0]);
    const lon = Number(value[1]);
    if (Number.isFinite(lat) && Number.isFinite(lon)) return [lat, lon];
  }

  const raw = String(value ?? "").trim();
  if (!raw) return undefined;

  const numbers = raw
    .replace(/[;,]+/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => Number(part))
    .filter((num) => Number.isFinite(num));

  if (numbers.length < 2) return undefined;

  const first = numbers[0];
  const second = numbers[1];

  const latLon = Math.abs(first) <= 90 && Math.abs(second) <= 180;
  const lonLat = Math.abs(first) <= 180 && Math.abs(second) <= 90;

  if (latLon) return [first, second];
  if (lonLat) return [second, first];
  return undefined;
}

export function transformKoboData(raw: KoboApiResponse, asset?: KoboAssetResponse, catalog?: QuantificationCatalog): DashboardData {
  const idx = buildInstrumentIndex(asset);
  const records = raw.results ?? [];
  const subcategoryWeights = buildSubcategoryWeights(catalog);

  const facilities: FacilitySummary[] = records.map((record) => {
    const evaluatedQuestions: Record<string, EvaluatedQuestion> = {};
    SUBCATEGORIES.forEach((subcategory) => {
      subcategory.ids.forEach((id) => {
        if (!evaluatedQuestions[id]) {
          evaluatedQuestions[id] = evaluateQuestion(record, idx, id, catalog);
        }
      });
    });

    const subcategoryChecklist: SubcategoryChecklist[] = SUBCATEGORIES.map((subcategory) => {
      const items = subcategory.ids.map((id) =>
        buildQuestionStatus(record, idx, id, catalog, evaluatedQuestions[id]),
      );
      return { section: subcategory.section, side: subcategory.side, items };
    });

    const sectionScores: SectionScore[] = SUBCATEGORIES.map((subcategory) => {
      const values = subcategory.ids.map((id) => evaluatedQuestions[id]).filter(Boolean);
      const positives = values.reduce((acc, item) => acc + item.score, 0);
      const total = values.reduce((acc, item) => acc + item.maxScore, 0);
      return {
        section: subcategory.section,
        side: subcategory.side,
        score: total ? Math.round((positives / total) * 100) : 0,
        positives,
        total,
      };
    });

    const categoryScore = (side: ScoringSide): number => {
      const totalSidePoints = CATEGORY_SIDE_POINTS[side];
      if (!totalSidePoints) return 0;
      const weighted = sectionScores
        .filter((section) => section.side === side && section.total > 0)
        .reduce((acc, section) => {
          const weight = subcategoryWeights[section.section] ?? 0;
          return acc + (section.score / 100) * weight;
        }, 0);
      return Math.round((weighted / totalSidePoints) * 100);
    };

    const externalScore = categoryScore("external");
    const internalScore = categoryScore("internal");
    const score = Math.round(
      externalScore * CATEGORY_SIDE_WEIGHTS.external + internalScore * CATEGORY_SIDE_WEIGHTS.internal,
    );
    const riskLevel = toRiskCategory(score);

    const high = HIGH_RISK_RULES.map((r) => ruleStatus(record, idx, r));
    const moderate = MODERATE_RISK_RULES.map((r) => ruleStatus(record, idx, r));
    const positive = POSITIVE_RULES.map((r) => ruleStatus(record, idx, r));
    const keyPractices = KEY_PRACTICES.map((r) => ruleStatus(record, idx, r));
    const animalHealthMonitoring = ANIMAL_HEALTH_RULES.map((r) => ruleStatus(record, idx, r));

    const geolocation = parseGeolocation(record._geolocation);

    const speciesValues = getDisplayValues(record, "Which_species_are_cultured_in_", idx);
    const productionSystemValues = getDisplayValues(record, "Production_system", idx);
    const basedOn = cleanLabel(getRaw(record, "Based", idx)) || undefined;

    return {
      id: record._id,
      name: getRaw(record, "Facility_Name", idx) || `#${record._id}`,
      location: cleanLabel(getRaw(record, "Location", idx)) || basedOn,
      species: speciesValues[0] || undefined,
      productionSystem: productionSystemValues[0] || undefined,
      productionType: cleanLabel(getRaw(record, "Type_production", idx)) || undefined,
      basedOn,
      market: cleanLabel(getRaw(record, "Market", idx)) || undefined,
      respondent: getRaw(record, "Respondent_name", idx) || undefined,
      respondentRole: cleanLabel(getRaw(record, "respondent_role", idx)) || undefined,
      respondentGender: cleanLabel(getRaw(record, "Respondent_s_Gender", idx)) || undefined,
      respondentEducation: cleanLabel(getRaw(record, "Respondent_education", idx)) || undefined,
      yearsOperation: cleanLabel(getRaw(record, "Years_operation", idx)) || undefined,
      lastUpdated: record._submission_time,
      score,
      riskFactorRate: Math.max(0, Math.min(100, 100 - score)),
      externalScore,
      internalScore,
      riskLevel,
      waterSource: cleanLabel(getDisplayValues(record, "_3_1", idx)[0]) || undefined,
      waterMonitoringFrequency: cleanLabel(getDisplayValues(record, "_3_10", idx)[0]) || undefined,
      mortalityDisposal: cleanLabel(getDisplayValues(record, "_8_9", idx)[0]) || undefined,
      sectionScores,
      highRiskFactors: high.filter((r) => r.matched).map((r) => r.label),
      moderateRiskFactors: moderate.filter((r) => r.matched).map((r) => r.label),
      positivePractices: positive.filter((r) => r.matched).map((r) => r.label),
      keyPractices,
      animalHealthMonitoring,
      questionChecklist: subcategoryChecklist.flatMap((s) => s.items),
      subcategoryChecklist,
      responses: {
        waterMonitoring: getDisplayValues(record, "_3_10", idx),
        mortalityDisposal: getDisplayValues(record, "_8_9", idx),
        intakeWaterTreatmentApplied: getDisplayValues(record, "_3_5", idx),
        waterParametersMeasured: getDisplayValues(record, "_3_9", idx),
        personnelTrainingTopics: getDisplayValues(record, "_10_15", idx),
        recordsCoverage: getDisplayValues(record, "_11_5", idx),
        sopsCoverage: getDisplayValues(record, "_11_7", idx),
      },
      geolocation,
    };
  });

  const totalRecords = facilities.length;
  const avgScore = avg(facilities.map((f) => f.score));
  const avgExternalScore = avg(facilities.map((f) => f.externalScore));
  const avgInternalScore = avg(facilities.map((f) => f.internalScore));
  const negligibleRiskCount = facilities.filter((f) => f.riskLevel === "NEGLIGIBLE").length;
  const highRiskCount = facilities.filter((f) => f.riskLevel === "HIGH").length;
  const mediumRiskCount = facilities.filter((f) => f.riskLevel === "MEDIUM").length;
  const lowRiskCount = facilities.filter((f) => f.riskLevel === "LOW" || f.riskLevel === "NEGLIGIBLE").length;

  const highRiskMap: Record<string, number> = {};
  const moderateRiskMap: Record<string, number> = {};
  const positiveMap: Record<string, number> = {};
  facilities.forEach((f) => {
    f.highRiskFactors.forEach((x) => (highRiskMap[x] = (highRiskMap[x] || 0) + 1));
    f.moderateRiskFactors.forEach((x) => (moderateRiskMap[x] = (moderateRiskMap[x] || 0) + 1));
    f.positivePractices.forEach((x) => (positiveMap[x] = (positiveMap[x] || 0) + 1));
  });

  const sectionAverages = SUBCATEGORIES.map((sub) => {
    const vals = facilities
      .map((f) => f.sectionScores.find((s) => s.section === sub.section)?.score ?? 0)
      .filter((v) => v > 0);
    return { section: sub.section, side: sub.side, score: avg(vals) };
  });

  const distribution = [
    { bucket: "0-20", min: 0, max: 20 },
    { bucket: "21-40", min: 21, max: 40 },
    { bucket: "41-60", min: 41, max: 60 },
    { bucket: "61-80", min: 61, max: 80 },
    { bucket: "81-100", min: 81, max: 100 },
  ].map((b) => ({ bucket: b.bucket, count: facilities.filter((f) => f.score >= b.min && f.score <= b.max).length }));

  const riskMatrixExternal: { facility: string; subcategory: string; value: number; score: number }[] = [];
  const riskMatrixInternal: { facility: string; subcategory: string; value: number; score: number }[] = [];
  facilities.forEach((f) => {
    f.sectionScores.forEach((s) => {
      const row = { facility: f.name, subcategory: s.section, value: s.score >= 70 ? 1 : 0, score: s.score };
      if (s.side === "external") riskMatrixExternal.push(row);
      else riskMatrixInternal.push(row);
    });
  });

  const locations = facilities
    .filter((f) => f.geolocation)
    .map((f) => ({ facility: f.name, location: f.location ?? f.basedOn, lat: f.geolocation![0], lon: f.geolocation![1] }));

  const questionRulesForMethodology = SUBCATEGORIES.flatMap((subcategory) =>
    subcategory.ids.map((id) => {
      const rule = catalog?.questionRules[id];
      return {
        id,
        section: subcategory.section,
        side: subcategory.side,
        question: rule?.question || idx.idToLabel[id] || id,
        mainScore: rule?.mainScore ?? true,
        questionWeight: rule?.questionWeight ?? 1,
        responses:
          rule?.responseRules.map((response) => ({
            response: response.response,
            score: response.score,
            recommendation: response.recommendation ?? undefined,
          })) ?? [],
      };
    }),
  );

  return {
    facilities,
    stats: {
      totalRecords,
      avgScore,
      avgExternalScore,
      avgInternalScore,
      negligibleRiskCount,
      highRiskCount,
      mediumRiskCount,
      lowRiskCount,
      lastUpdated: facilities
        .map((f) => f.lastUpdated)
        .filter(Boolean)
        .sort()
        .reverse()[0] ?? undefined,
    },
    practices: {
      quarantineRate: toRate(records, idx, KEY_PRACTICES[0]),
      writtenBiosecurityRate: toRate(records, idx, KEY_PRACTICES[1]),
      noSharedEquipmentRate: toRate(records, idx, KEY_PRACTICES[2]),
      equipmentDisinfectionRate: toRate(records, idx, KEY_PRACTICES[3]),
      waterTreatmentRate: toRate(records, idx, KEY_PRACTICES[4]),
      biovectorInspectionRate: toRate(records, idx, KEY_PRACTICES[5]),
      waterMonitoring: aggregateResponseValues(facilities, "waterMonitoring"),
      mortalityDisposal: aggregateResponseValues(facilities, "mortalityDisposal").map((x) => ({ method: x.label, count: x.count })),
      intakeWaterTreatmentApplied: aggregateResponseValues(facilities, "intakeWaterTreatmentApplied"),
      waterParametersMeasured: aggregateResponseValues(facilities, "waterParametersMeasured"),
      personnelTrainingTopics: aggregateResponseValues(facilities, "personnelTrainingTopics"),
      recordsCoverage: aggregateResponseValues(facilities, "recordsCoverage"),
      sopsCoverage: aggregateResponseValues(facilities, "sopsCoverage"),
      geoCoverage: locations.length,
    },
    demographics: {
      byEducation: countByField(facilities.map((f) => ({ education: f.respondentEducation })), "education").map((x) => ({ level: x.name, count: x.count })),
      byYearsOperation: countByField(facilities.map((f) => ({ years: f.yearsOperation })), "years").map((x) => ({ years: x.name, count: x.count })),
      byGender: countByField(facilities.map((f) => ({ gender: f.respondentGender })), "gender").map((x) => ({ gender: x.name, count: x.count })),
      byRole: countByField(facilities.map((f) => ({ role: f.respondentRole })), "role").map((x) => ({ role: x.name, count: x.count })),
    },
    operations: {
      byMarket: countByField(facilities.map((f) => ({ market: f.market })), "market").map((x) => ({ market: x.name, count: x.count })),
      byProductionType: countByField(facilities.map((f) => ({ type: f.productionType })), "type").map((x) => ({ type: x.name, count: x.count })),
      byWaterSource: countByField(facilities.map((f) => ({ source: f.waterSource })), "source").map((x) => ({ source: x.name, count: x.count })),
      bySpecies: countByField(facilities.map((f) => ({ species: f.species })), "species").map((x) => ({ species: x.name, count: x.count })),
      bySystem: countByField(facilities.map((f) => ({ system: f.productionSystem })), "system").map((x) => ({ system: x.name, count: x.count })),
      byLocation: countByField(facilities.map((f) => ({ location: f.basedOn ?? f.location })), "location").map((x) => ({ location: x.name, count: x.count })),
    },
    complianceMix: [
      { name: "External", value: avgExternalScore, color: "var(--color-chart-2)" },
      { name: "Internal", value: avgInternalScore, color: "var(--color-chart-1)" },
    ],
    distribution,
    sectionAverages,
    highRiskFactors: Object.entries(highRiskMap)
      .map(([factor, count]) => ({ factor, count }))
      .sort((a, b) => b.count - a.count),
    moderateRiskFactors: Object.entries(moderateRiskMap)
      .map(([factor, count]) => ({ factor, count }))
      .sort((a, b) => b.count - a.count),
    positivePractices: Object.entries(positiveMap)
      .map(([factor, count]) => ({ factor, count }))
      .sort((a, b) => b.count - a.count),
    comparatives: {
      bySpecies: avgScoreByField(facilities, "species"),
      bySystem: avgScoreByField(facilities, "productionSystem"),
      byMarket: avgScoreByField(facilities, "market"),
      byEducation: avgScoreByField(facilities, "respondentEducation"),
      byYearsOperation: avgScoreByField(facilities, "yearsOperation"),
      byWaterSource: avgScoreByField(facilities, "waterSource"),
      byProductionType: avgScoreByField(facilities, "productionType"),
      byLocation: avgScoreByField(facilities, "basedOn"),
    },
    riskMatrixExternal,
    riskMatrixInternal,
    locations,
    scoringMethodology: {
      sideWeights: CATEGORY_SIDE_WEIGHTS,
      subcategoryWeights: SUBCATEGORIES.map((subcategory) => ({
        section: subcategory.section,
        side: subcategory.side,
        weight: subcategoryWeights[subcategory.section] ?? 0,
      })),
      questionRules: questionRulesForMethodology,
      decisions: {
        expertWeights: {
          status: SCORING_POLICY.expertWeightsDecision.status,
        },
        noScore: {
          status: SCORING_POLICY.noScoreDecision.status,
        },
      },
    },
  };
}
