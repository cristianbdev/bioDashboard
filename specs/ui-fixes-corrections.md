# UI Fixes Corrections

Corrección de problemas visuales identificados en la auditoría.

---

## TASK-01: Fix z-index sidebar vs header
Priority: P0
Files:
- src/components/layout/admin-sidebar.tsx (edit)
- src/components/layout/app-header.tsx (edit)
Depends on: none
Acceptance:
- Header usa `z-50` en lugar de `z-40`
- Sidebar desktop usa `md:z-30` en lugar de `md:z-40`
- Mobile drawer mantiene `z-[60]` y backdrop `z-[55]`
- Al hacer scroll en desktop, el header permanece por encima del sidebar
- El mobile drawer sigue apareciendo por encima de todo
Implementation notes:
- En app-header.tsx: cambiar `z-40` a `z-50` en el header
- En admin-sidebar.tsx: cambiar `md:z-40` a `md:z-30` en el aside desktop
- Verificar que no hay otros elementos con z-index conflictivo

---

## TASK-02: Fix chart rendering in overview.tsx
Priority: P0
Files:
- src/components/dashboard/overview.tsx (edit)
Depends on: none
Acceptance:
- Verificar función `sectionColor(score)` devuelve colores válidos (var(--color-*))
- Verificar `DonutChart` renderiza slices visibles con colores de CHART_PALETTE
- Añadir `initialDimension` al ResponsiveContainer del DonutChart para evitar colapso SSR
- Las barras verticales de secciones deben mostrar colores dinámicos según score
- El tooltip de gráficas debe mostrarse correctamente
Implementation notes:
- Buscar función sectionColor (alrededor de línea 369) y verificar que usa CSS variables
- DonutChart usa ResponsiveContainer sin initialDimension - añadir initialDimension={{ width: 500, height: 300 }}
- Verificar que CHART_PALETTE usa "var(--color-chart-N)" strings

---

## TASK-03: Redesign responsive header for mobile
Priority: P0
Files:
- src/components/layout/app-header.tsx (edit)
- src/messages/en.json (edit - añadir key "navigation.more")
- src/messages/es.json (edit - añadir key "navigation.more")
- src/messages/no.json (edit - añadir key "navigation.more")
Depends on: none
Acceptance:
- **xs (< 400px):** Solo logo + user/auth + hamburger (si aplica)
- **sm (400-640px):** Añadir badge de rol
- **md (640-768px):** Añadir refresh button
- **lg (768-1024px):** Añadir selector de idioma
- **xl (> 1024px):** Añadir fecha de actualización
- En breakpoints menores a lg, theme toggle e idioma van a un menú "más" (tres puntos)
- El menú overflow debe usar DropdownMenu de shadcn
- Ningún elemento debe wrappear o desbordar el header
Implementation notes:
- Crear un componente interno `HeaderActionsMenu` que contenga: ThemeToggle, Language selector
- En mobile (menor a lg), ocultar theme toggle e idioma individualmente y mostrar un botón "más" (MoreHorizontal icon)
- El menú desplegable debe contener los elementos ocultos
- Añadir traducción "navigation.more" a todos los archivos de i18n

---

## TASK-04: Fix RiskCard header background
Priority: P1
Files:
- src/components/dashboard/facilities.tsx (edit)
Depends on: none
Acceptance:
- El CardHeader del RiskCard usa `bg-transparent` o `bg-[var(--color-raised)]` en lugar de `bg-[var(--color-surface-base)]`
- El título del RiskCard es legible en modo claro y oscuro
- El icono del RiskCard mantiene su fondo circular con borde
- No hay cambio visual disruptivo en el resto de la card
Implementation notes:
- Buscar función RiskCard (línea 630 aprox)
- Cambiar: `<CardHeader className="pb-3 bg-[var(--color-surface-base)] rounded-t-xl">`
- A: `<CardHeader className="pb-3 bg-transparent rounded-t-xl">` (o bg-[var(--color-raised)])
- Verificar que el icono contenedor mantiene su fondo: `<div className="p-2 bg-[var(--color-raised)] rounded-lg...">`

---

## TASK-05: Improve chart color contrast in dark mode
Priority: P1
Files:
- src/app/globals.css (edit)
Depends on: none
Acceptance:
- `--color-chart-1` cambia de `#14b8a6` a `#2dd4bf` (teal-400, más brillante)
- `--color-chart-2` cambia de `#60a5fa` a `#93c5fd` (blue-300)
- `--color-chart-3` cambia de `#fbbf24` a `#fcd34d` (amber-300)
- Los colores restantes (chart-4 a chart-8) mantienen buen contraste o se ajustan si es necesario
- Las gráficas en modo oscuro son claramente distinguibles
- No hay cambios en los tokens de modo claro
Implementation notes:
- Editar bloque `.dark` en globals.css
- Buscar sección "Chart palette - Dark mode"
- Ajustar valores hex a versiones más brillantes (incrementar luminosidad ~10-15%)
- Chart-4 (purple): `#a78bfa` → `#c4b5fd`
- Chart-5 (cyan): `#22d3ee` → `#67e8f9`
- Chart-6 (red): `#f87171` → `#fca5a5`
- Chart-7 (green): `#34d399` → `#6ee7b7`

---

## Summary

| Task | Priority | Description |
|------|----------|-------------|
| TASK-01 | P0 | Fix z-index sidebar vs header |
| TASK-02 | P0 | Fix chart rendering in overview |
| TASK-03 | P0 | Redesign responsive header for mobile |
| TASK-04 | P1 | Fix RiskCard header background |
| TASK-05 | P1 | Improve chart colors in dark mode |

## Notes
- TASK-01 y TASK-02 son P0 porque afectan funcionalidad básica
- TASK-03 es P0 porque el header roto en móvil es crítico para UX
- TASK-04 y TASK-05 son P1 porque son mejoras visuales importantes pero no bloqueantes
