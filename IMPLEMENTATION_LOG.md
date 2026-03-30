# Implementation Log

## Estado actual
- Fecha de actualizacion: `2026-03-28`
- Estado general: `Implementacion principal completada`
- Build de validacion: `npm run build` exitoso

## Regla de dependencia (fija)
- Runtime del dashboard depende solo de KoboToolbox:
  - endpoint `data.json` (submissions)
  - endpoint `assets/{uid}` (instrumento)
- `kobo_asset_example.json`, `kobo_data_example.json`, `docs/Risk_Quantification.csv` y `docs/*.docx` quedan como referencia documental, no como fuente de ejecucion.

## Registro por fases

### Fase 1 - Core (completada)
Cambios:
- Refactor de `src/lib/kobo.ts`.
- Motor de transformacion con index de preguntas/opciones desde `asset.content`.
- Salidas nuevas para UI:
  - `keyPractices`
  - `animalHealthMonitoring`
  - `highRiskFactors` / `moderateRiskFactors` / `positivePractices`
  - `subcategoryChecklist` y `questionChecklist`
  - `riskMatrixExternal` y `riskMatrixInternal`
  - agregados para `_3_5`, `_3_9`, `_10_15`, `_11_5`, `_11_7`

Decisiones relevantes:
- Clasificacion de riesgo aplicada en comparativa:
  - Negligible: `0-10`
  - Low: `10-40`
  - Medium: `40-70`
  - High: `70-100`
  sobre `risk factor rate = 100 - score`.
- Para `Treatment of water (if applicable)` (`_3_4`) se considera no aplicable en sistemas de jaula/cage.

### Fase 2 - Overview (completada)
Cambios:
- Reescritura de `src/components/dashboard/overview.tsx`.
- Mapa geografico al inicio (puntos por coordenadas).
- Filtros por especie, sistema productivo y ubicacion.
- Eliminados: `Practice Compliance`, `Submission Timeline`, `Section Radar`.
- Incluidos:
  - `External vs Internal Compliance`
  - `High Risk Factors`
  - nuevas secciones `_3_5`, `_3_9`, `_10_15`, `_11_5`, `_11_7`

### Fase 3 - Facilities (completada)
Cambios:
- Reescritura de `src/components/dashboard/facilities.tsx`.
- Soporte `readOnlySelection` para usuario productor.
- Bloques:
  - `Facility information`
  - `Quick info` (Years_operation + Species)
  - `Key Biosecurity Practices`
  - `Animal Health Monitoring`
  - `High/Moderate/Positive factors`
  - checklist final por subcategoria (pregunta/respuesta/estado/recomendacion)

Nota:
- Las recomendaciones del checklist se generan de forma generica en codigo (`Strengthen measure: ...`) mientras se define un catalogo oficial final de recomendaciones.

### Fase 4 - Comparative (completada)
Cambios:
- Reescritura de `src/components/dashboard/comparative.tsx`.
- Filtros implementados:
  - ubicacion
  - tipo de produccion
  - sistema productivo
  - especie
  - fuente de agua
- Incluido `Score by Type of Production`.
- Eliminado `Score by Feed Type`.
- Matriz de riesgo dividida en externa e interna.
- Tabla comparativa actualizada con columnas solicitadas.

### Fase 5 - Acceso y API (completada)
Cambios:
- `src/app/page.tsx`: control de tabs por rol.
  - `public`: overview
  - `producer`: overview + facilities
  - `admin`: overview + facilities + comparative
- `src/app/api/kobo/route.ts`:
  - sin fallback a archivos locales
  - sin token hardcodeado
  - requiere `KOBOTOOLBOX_TOKEN`

## Archivos principales modificados
- `src/lib/kobo.ts`
- `src/app/api/kobo/route.ts`
- `src/app/page.tsx`
- `src/components/dashboard/overview.tsx`
- `src/components/dashboard/facilities.tsx`
- `src/components/dashboard/comparative.tsx`
- `src/components/dashboard/cards.tsx`
- `src/lib/i18n.ts`

## Decisiones pendientes de autores del instrumento
- Definicion final de pesos expertos por subcategoria/pregunta.
- Confirmacion de respuestas objetivo finales para reglas que pueden cambiar.
- Catalogo oficial de recomendaciones por pregunta/subcategoria.
- Definicion de autenticacion real y mapeo productor -> establecimiento.

## Notas para siguientes iteraciones
- Si cambian reglas del instrumento, ajustar primero `src/lib/kobo.ts` y luego validar impacto en UI.
- Mantener invariantes:
  - no consumir CSV/JSON de referencia en runtime
  - no hardcodear token ni secretos
  - conservar split de bioseguridad externa/interna en analitica y matrix

## QA posterior a pruebas de usuario (2026-03-28)

### Incidente reportado
- Sintoma: API `/api/kobo` respondia `200` con datos, pero el dashboard mostraba varios graficos vacios.

### Causa identificada
- Los bloques de graficos basados en `recharts` se estaban montando con `ResponsiveContainer` en modo que resultaba en lienzos sin dibujo visible en este layout.
- El problema no era de datos: los agregados (`sectionAverages`, `distribution`, `waterMonitoring`, etc.) llegaban con contenido.

### Correccion aplicada
- Se ajusto el render de graficos en:
  - `src/components/dashboard/overview.tsx`
  - `src/components/dashboard/facilities.tsx`
  - `src/components/dashboard/comparative.tsx`
- Estrategia: usar ancho calculado por viewport para `ResponsiveContainer` en lugar de depender solo de ancho relativo.
- Se robustecio parseo de geolocalizacion en:
  - `src/lib/kobo.ts`
  soportando `_geolocation` como array o string con separadores mixtos (espacios/comas/punto y coma).

### Ajuste posterior (misma fecha)
- Se detecto que un ancho fijo alto evitaba graficos vacios pero generaba desbordes en cards de 2 y 3 columnas.
- Se recalibraron topes de ancho por vista:
  - Overview y Comparative: tope bajo para evitar overflow en layouts multicolumna.
  - Facilities: tope mayor para graficos de detalle.
- Resultado: se mantienen graficos visibles y sin desbordar pantalla.

### Validacion
- `npm run lint`: OK
- `npm run build`: OK
- Validacion visual automatizada con captura de pantalla: los graficos ya se dibujan correctamente.
- Verificacion API de geodatos: `geoCoverage` y `locations` con valores esperados (ej. 25 registros para UID de prueba).

### Brechas funcionales pendientes (frente al documento)
- `Score` avanzado con pesos expertos (`expert weight`) aun no implementado.
- `Antibiotic Use` y `Water Sources` en Overview no estan como seccion dedicada (quedaron fuera en la iteracion actual).
- Recomendaciones por pregunta en Facilities son genericas; falta catalogo final oficial por pregunta/subcategoria.
- Mapeo real de productor -> su establecimiento aun requiere integracion con autenticacion/autorizacion.
