# Plan: Score Engine And Methodology

## Objetivo
Implementar un motor de score cuantitativo (pasos A/B/C) desacoplado del CSV en runtime, usando un archivo propio del proyecto como fuente de reglas, y exponer una vista admin que documente la metodología.

## Tareas

### T1 - Crear modelo propio de scoring
depends_on: []
- Generar `src/data/score-model.json` desde `docs/Risk_Quantification.csv`.
- Definir estructura con:
  - `sideWeights`
  - `sidePoints`
  - `questionRules[id]` con `mainScore`, `questionWeight`, `responseRules`.

### T2 - Integrar motor matemático en transform
depends_on: [T1]
- Reemplazar heurística de score por cálculo:
  - Paso A: subcategoría
  - Paso B: categoría (externa/interna)
  - Paso C: score global
- Mantener clasificación de riesgo y estructuras existentes de salida.

### T3 - Integrar catálogo propio en API
depends_on: [T1, T2]
- Cargar `src/data/score-model.json` en API.
- Pasar el catálogo al `transformKoboData`.
- No usar CSV en runtime.

### T4 - Vista admin de metodología
depends_on: [T2, T3]
- Agregar tab admin `Methodology`.
- Crear componente con:
  - fórmulas del cálculo
  - pesos por subcategoría
  - reglas pregunta/respuesta/puntaje.

### T5 - i18n y validación técnica
depends_on: [T4]
- Agregar textos EN/ES para la nueva vista.
- Ejecutar `npm run lint` y `npm run build`.

## Dependency Graph
`T1 -> T2 -> T3 -> T4 -> T5`
