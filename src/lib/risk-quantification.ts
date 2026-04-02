export type ScoringSide = "external" | "internal";

export type QuantificationResponseRule = {
  response: string;
  normalizedResponse?: string;
  score: number | null;
  rawScore: string;
  recommendation?: string | null;
};

export type QuantificationQuestionRule = {
  id: string;
  subcategory: string;
  question: string;
  mainScore: boolean;
  questionWeight: number;
  responseRules: QuantificationResponseRule[];
};

export type QuantificationCatalog = {
  questionRules: Record<string, QuantificationQuestionRule>;
  source: string;
};

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[\u2018\u2019\u201c\u201d]/g, "'")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseCsvRows(content: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let i = 0;
  let inQuotes = false;

  while (i < content.length) {
    const ch = content[i];

    if (inQuotes) {
      if (ch === '"') {
        if (content[i + 1] === '"') {
          cell += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i += 1;
        continue;
      }
      cell += ch;
      i += 1;
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
      i += 1;
      continue;
    }

    if (ch === ",") {
      row.push(cell);
      cell = "";
      i += 1;
      continue;
    }

    if (ch === "\r" || ch === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
      if (ch === "\r" && content[i + 1] === "\n") i += 2;
      else i += 1;
      continue;
    }

    cell += ch;
    i += 1;
  }

  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }

  return rows;
}

function parseScoreValue(raw: string): number | null {
  const value = raw.trim();
  if (!value) return null;

  const normalized = value.toLowerCase().replace(/\s+/g, "");
  if (normalized.includes("no-score") || normalized.includes("noscore")) {
    return null;
  }

  const numberLike = value.replace(",", ".").trim();
  const numeric = Number(numberLike);
  if (Number.isFinite(numeric)) return numeric;

  return null;
}

function findColumn(headers: string[], match: RegExp): number {
  const index = headers.findIndex((header) => match.test(header.toLowerCase()));
  return index;
}

export function parseRiskQuantificationCsv(content: string, source = "Risk_Quantification.csv"): QuantificationCatalog {
  const rows = parseCsvRows(content).filter((row) => row.some((cell) => cell.trim().length > 0));
  if (rows.length === 0) {
    return { questionRules: {}, source };
  }

  const headers = rows[0].map((header) => header.trim());
  const subcategoryIdx = findColumn(headers, /^subcategory$/);
  const idIdx = findColumn(headers, /^id$/);
  const questionIdx = findColumn(headers, /^question$/);
  const mainScoreIdx = findColumn(headers, /^main score/);
  const responsesIdx = findColumn(headers, /^responses/);
  const calcScoreIdx = findColumn(headers, /^calculate score/);
  const recommendationIdx = findColumn(headers, /^recommended biosecurity measure$/);

  if (idIdx < 0 || mainScoreIdx < 0 || responsesIdx < 0 || calcScoreIdx < 0) {
    return { questionRules: {}, source };
  }

  const questionRules: Record<string, QuantificationQuestionRule> = {};
  let currentQuestionId = "";

  for (let i = 1; i < rows.length; i += 1) {
    const row = rows[i];
    const getCell = (idx: number) => (idx >= 0 && idx < row.length ? row[idx].trim() : "");

    const id = getCell(idIdx);
    if (id) {
      currentQuestionId = id;
      const subcategory = getCell(subcategoryIdx);
      const question = getCell(questionIdx);
      const mainScoreRaw = getCell(mainScoreIdx);
      const mainScore = mainScoreRaw === "1";
      const questionWeight = mainScore ? 1 : 0;

      if (!questionRules[id]) {
        questionRules[id] = {
          id,
          subcategory,
          question,
          mainScore,
          questionWeight,
          responseRules: [],
        };
      } else {
        if (subcategory) questionRules[id].subcategory = subcategory;
        if (question) questionRules[id].question = question;
        questionRules[id].mainScore = mainScore;
        questionRules[id].questionWeight = questionWeight;
      }
    }

    if (!currentQuestionId || !questionRules[currentQuestionId]) continue;

    const response = getCell(responsesIdx);
    const rawScore = getCell(calcScoreIdx);
    if (!response || !rawScore) continue;

    const score = parseScoreValue(rawScore);
    const recommendation = getCell(recommendationIdx);
    questionRules[currentQuestionId].responseRules.push({
      response,
      normalizedResponse: normalizeText(response),
      score,
      rawScore,
      recommendation: recommendation || undefined,
    });
  }

  return { questionRules, source };
}
