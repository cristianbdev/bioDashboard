export const SCORING_POLICY = {
  sideWeights: {
    external: 0.5,
    internal: 0.5,
  },
  expertWeightsDecision: {
    status: "accepted",
    description:
      "Se mantienen pesos expertos actuales: preguntas main score ponderan 1 y preguntas no-main quedan fuera del calculo principal.",
  },
  noScoreDecision: {
    status: "accepted",
    description:
      "Respuestas No-score se consideran no aplicables: no suman puntaje ni maximo posible dentro de la subcategoria.",
  },
} as const;

export type ScoringPolicy = typeof SCORING_POLICY;
