export const SCORING_POLICY = {
  sideWeights: {
    external: 0.5,
    internal: 0.5,
  },
  expertWeightsDecision: {
    status: "accepted",
  },
  noScoreDecision: {
    status: "accepted",
  },
} as const;

export type ScoringPolicy = typeof SCORING_POLICY;
