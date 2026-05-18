# Critical Fixes Corrections

Corrección de hydration mismatch y ECharts colors.

---

## TASK-01: Fix hydration mismatch in ThemeToggle
Priority: P0
Files:
- src/components/theme/ThemeToggle.tsx (edit)
Depends on: none
Acceptance:
- No hay errores de hydration mismatch relacionados con ThemeToggle
- El icono no cambia entre servidor y cliente durante hidratación
- El icono correcto se muestra después de montar el componente
- El dropdown de selección de tema funciona correctamente
Implementation notes:
- Añadir estado `mounted` con useEffect
- Mostrar icono neutral (Monitor) o Sun por defecto cuando !mounted
- Solo calcular CurrentIcon cuando mounted es true
- Ejemplo:
```tsx
const [mounted, setMounted] = useState(false);
useEffect(() => setMounted(true), []);

if (!mounted) {
  return (
    <Button variant="ghost" size="sm" className="..." aria-label={t("toggle")}>
      <Monitor className="h-4 w-4" /> {/* Icono neutral */}
    </Button>
  );
}
// Resto del componente con CurrentIcon calculado
```

---

## TASK-02: Create useChartColors hook for ECharts
Priority: P0
Files:
- src/components/dashboard/comparative.tsx (edit)
- Opcional: src/hooks/useChartColors.ts (create)
Depends on: none
Acceptance:
- ECharts heatmap no muestra errores de "illegal color"
- Las celdas del heatmap muestran colores correctos (no negro)
- Los textos del heatmap son legibles en light y dark mode
- Las líneas de grid del heatmap usan colores apropiados
Implementation notes:
- Crear hook useChartColors que devuelva colores hex basados en resolvedTheme
- Reemplazar todas las CSS variables en buildHeatmapOption:
  - `var(--color-text-primary)` → '#1e293b' (light) / '#f1f5f9' (dark)
  - `var(--color-border-subtle)` → '#e2e8e5' (light) / '#334155' (dark)
  - `var(--color-raised)` → '#ffffff' (light) / '#334155' (dark)
- Colores para heatmap:
  - Compliant: '#34d399' (green-400) / '#10b981' (green-500)
  - Non-compliant: '#f87171' (red-400) / '#ef4444' (red-500)
- Usar el hook en comparative.tsx y pasar colores a buildHeatmapOption

---

## TASK-03: Check other ECharts usage for color issues
Priority: P1
Files:
- src/components/dashboard/comparative.tsx (verify complete file)
Depends on: TASK-02
Acceptance:
- Todas las instancias de ECharts en comparative.tsx usan colores hex válidos
- No hay CSS variables ('var(--*') en opciones de ECharts
- Revisar buildHeatmapOption y cualquier otra función que configure ECharts
Implementation notes:
- Buscar todas las ocurrencias de ECharts configuration
- Verificar que no se pasan CSS variables como colores
- Revisar: title.textStyle.color, tooltip.backgroundColor, tooltip.borderColor, tooltip.textStyle.color, axis colors, visualMap colors

---

## Summary

| Task | Priority | Description |
|------|----------|-------------|
| TASK-01 | P0 | Fix hydration mismatch in ThemeToggle |
| TASK-02 | P0 | Create useChartColors hook for ECharts |
| TASK-03 | P1 | Check other ECharts usage for color issues |

## Notes
- TASK-01 es P0 porque el hydration error afecta el funcionamiento básico
- TASK-02 es P0 porque las gráficas en negro son un bug crítico visible
- TASK-03 es P1 para asegurar que no hay otros ECharts rotos
