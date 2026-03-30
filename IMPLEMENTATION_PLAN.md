# Dashboard Implementation Plan

## Objetivo operativo
Implementar el dashboard para que en runtime dependa unicamente de KoboToolbox:
- `GET /api/kobo?uid=...` obtiene submissions y asset del mismo proyecto.
- No hay dependencia funcional de `kobo_*_example.json`, `Risk_Quantification.csv` ni documentos `docs/*`.
- Los archivos de referencia se mantienen solo para analisis y gobernanza de cambios.

## Principios fijados
- Fuente de verdad en runtime: Kobo API (`data.json` + `assets/{uid}`).
- Las reglas de scoring/factores viven en codigo (`src/lib/kobo.ts`) y pueden versionarse.
- UI desacoplada de la capa de transformacion.
- Las decisiones no cerradas por autores del instrumento se registran en `IMPLEMENTATION_LOG.md`.

## Fases

### Fase 1: Core de datos Kobo
Estado: `Completada`

Trabajo ejecutado:
- Refactor de `transformKoboData` con indexacion de instrumento desde `asset.content`.
- Calculo de score global, externo e interno por subcategoria.
- Clasificacion de riesgo con rangos solicitados para comparativa:
  - `Negligible` (0-10)
  - `Low` (10-40)
  - `Medium` (40-70)
  - `High` (70-100)
  usando `risk factor rate = 100 - score`.
- Estructuras para:
  - High/Moderate/Positive factors
  - Key practices
  - Animal health monitoring
  - Checklist por subcategoria (pregunta/respuesta/cumple/recomendacion)
  - Matrix externa e interna
  - Series para `_3_5`, `_3_9`, `_10_15`, `_11_5`, `_11_7`

### Fase 2: Overview
Estado: `Completada`

Trabajo ejecutado:
- Mapa de cobertura geografica al inicio.
- Filtros por especie, sistema productivo y ubicacion.
- Mantenimiento de `Practice Coverage`.
- Eliminacion de `Practice Compliance`, `Submission Timeline` y `Section Radar`.
- Reemplazo por cumplimiento `External vs Internal`.
- Renombre a `High Risk Factors`.
- Inclusion de nuevas secciones (`_3_5`, `_3_9`, `_10_15`, `_11_5`, `_11_7`).

### Fase 3: Facilities
Estado: `Completada`

Trabajo ejecutado:
- Soporte de seleccion bloqueada para productor (`readOnlySelection`).
- Bloque `Facility information`.
- `Quick info` ajustado a `Years_operation` + `Species`.
- `Key Biosecurity Practices` alineado con Overview.
- Secciones de `High`, `Moderate` y `Positive`.
- Nueva seccion `Animal Health Monitoring`.
- Tabla final por subcategoria con pregunta, respuesta, estado y recomendacion.

### Fase 4: Comparative
Estado: `Completada`

Trabajo ejecutado:
- Filtros por ubicacion, tipo de produccion, sistema, especie y fuente de agua.
- Inclusion de `Score by Type of Production`.
- Eliminacion de `Score by Feed Type`.
- Matrices separadas externa/interna con subcategorias.
- Tabla comparativa con columnas ajustadas:
  - Facility
  - Score
  - Risk
  - System
  - Species
  - Type production
  - Facility located
  - Water source

### Fase 5: Acceso y seguridad basica
Estado: `Completada`

Trabajo ejecutado:
- `Overview`: acceso publico.
- `Facilities`: visible para producer/admin.
- `Comparative`: solo admin.
- API Kobo sin fallback local y sin token hardcodeado.

### Fase 6: Cierre tecnico
Estado: `Parcial`

Trabajo ejecutado:
- Compilacion de produccion (`npm run build`) exitosa.

Pendiente:
- Pruebas unitarias del transform/scoring.
- Definir autenticacion real y mapeo productor -> establecimiento.
- Confirmar pesos expertos finales y reglas finales de ponderacion.

## Cobertura frente a `docs/DASHBOARD REQUIREMENTS.docx`

### Cubierto
- Restriccion por rol de vistas (`overview` publico, `comparative` solo admin, `facilities` producer/admin).
- Filtros principales en overview y comparative.
- Split de cumplimiento externo/interno.
- Factores `high`, `moderate`, `positive` y `key practices`.
- Nuevas secciones solicitadas (`_3_5`, `_3_9`, `_10_15`, `_11_5`, `_11_7`).
- Matriz de riesgo dividida en externo/interno con subcategorias.
- Ajustes de tabla comparativa (species, type production, facility located, water source).
- Clasificacion de riesgo en comparativa con rangos `Negligible/Low/Medium/High`.

### Parcial / pendiente
- Modelo final de score con pesos expertos (`expert weight`) y comparacion con/ sin peso.
- Retomar secciones dedicadas de `Antibiotic Use` y `Water Sources` en overview (en esta iteracion no quedaron como bloque independiente).
- Recomendaciones finales por pregunta/subcategoria basadas en catalogo oficial del instrumento (hoy son genericas).
- Mapeo productor->predio respaldado por autenticacion real (hoy el filtro productor usa seleccion controlada a nivel UI).
