# Implementation Status: Score Engine And Methodology

## Estado general
- Estado: `Completado (iteración actual)`
- Fecha: `2026-03-28`

## Completado
- Se creó un archivo propio de modelo de scoring:
  - `src/data/score-model.json`
- El runtime dejó de depender del CSV para cálculo.
- Se integró cálculo formal en `transformKoboData` con pasos A/B/C:
  - score por subcategoría
  - score por categoría externa/interna
  - score global ponderado
- Se conservó clasificación de riesgo existente (`Negligible/Low/Medium/High` sobre `100 - score`).
- Se añadió salida `scoringMethodology` al payload del dashboard.
- Se creó vista admin de metodología:
  - tab `Methodology`
  - fórmulas
  - pesos de subcategoría
  - reglas pregunta/respuesta/puntaje.
- Se añadieron traducciones EN/ES para la nueva vista.

## Pendiente
- Definir pesos expertos finales por pregunta/subcategoría si cambian desde el estado actual.
- Confirmar con autores si algunos valores `No-score` deben excluirse siempre o mapearse explícitamente a `1`.
- Endurecer autenticación/autorización real de roles (actualmente sigue siendo control de UI).

## Validaciones ejecutadas
- `npm run lint`: OK
- `npm run build`: OK

## Bloqueadores
- Ninguno técnico para este alcance.

## Riesgos
- El archivo `src/data/score-model.json` debe actualizarse cuando cambie la definición experta del instrumento.
- Existen reglas de respuesta con redacción heterogénea; cambios de etiqueta/código en Kobo pueden requerir ajuste de matching.

## Próximos pasos concretos
1. Añadir script de regeneración controlada del `score-model.json` desde CSV para mantenimiento.
2. Validar resultados con autores usando una muestra de establecimientos y comparar score esperado vs score calculado.
3. Definir y aplicar autenticación real para que la vista de metodología y comparativo queden realmente restringidas.
