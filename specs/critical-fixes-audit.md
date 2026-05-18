# Auditoría - Problemas Críticos Post-Corrección

## Fecha: 2026-04-21

---

## 🚨 Problema 1: Hydration Mismatch en ThemeToggle

**Error:**
```
Hydration failed because the server rendered HTML didn't match the client.
+ className="lucide lucide-moon h-4 w-4"
- className="lucide lucide-sun h-4 w-4"
```

**Causa:**
El `ThemeToggle` usa `resolvedTheme` para determinar qué icono mostrar:
```tsx
const CurrentIcon = THEME_OPTIONS.find(
  (opt) => opt.value === (theme === "system" ? resolvedTheme : theme)
)?.icon || Sun;
```

Durante SSR:
- `theme` es undefined (no hay localStorage en servidor)
- `resolvedTheme` es undefined
- El servidor renderiza `Sun` (default)

Durante hidratación en cliente:
- El tema ya está resuelto (ej: "dark")
- El cliente renderiza `Moon`
- **Mismatch!**

**Solución:**
Usar un approach que evite el mismatch:
1. Mostrar un icono neutral/estático durante SSR e hidratación inicial
2. Solo después de montado (useEffect), cambiar al icono correspondiente
3. O usar suppressHydrationWarning en el icono
4. O usar el approach de next-themes con mounting check

**Implementación recomendada:**
```tsx
const [mounted, setMounted] = useState(false);
useEffect(() => setMounted(true), []);

if (!mounted) {
  // Icono neutral durante SSR/hidratación
  return <Monitor className="h-4 w-4" />;
}

// Icono real después de montar
const CurrentIcon = ...
```

---

## 🚨 Problema 2: ECharts No Soporta CSS Variables

**Error:**
```
[ECharts] 'var(--color-danger)' is an illegal color, fallback to '#000000'
[ECharts] 'var(--color-success)' is an illegal color, fallback to '#000000'
```

**Causa:**
ECharts (biblioteca de gráficas de comparative) no puede interpretar CSS variables como `var(--color-danger)`. Necesita colores hexadecimales o rgb.

**Ubicación:**
`src/components/dashboard/comparative.tsx` - función `buildHeatmapOption`

```tsx
// Esto NO funciona con ECharts
textStyle: { color: "var(--color-text-primary)" }

// Esto SÍ funciona
textStyle: { color: "#f1f5f9" }
```

**Solución:**
Para ECharts necesitamos una estrategia diferente:
1. **Opción A:** Leer el valor computado del CSS en el cliente y pasarlo a ECharts
2. **Opción B:** Usar colores hardcodeados específicos para dark mode en ECharts
3. **Opción C:** Crear un hook useChartColors() que devuelva los colores actuales del tema

**Implementación recomendada (Opción C):**
```tsx
// Hook para obtener colores del tema actual
function useChartColors() {
  const { resolvedTheme } = useTheme();
  
  return useMemo(() => {
    if (resolvedTheme === 'dark') {
      return {
        text: '#f1f5f9',
        background: '#334155',
        danger: '#f87171',
        success: '#34d399',
        warning: '#fbbf24',
        grid: '#334155'
      };
    }
    return {
      text: '#1e293b',
      background: '#ffffff',
      danger: '#ef4444',
      success: '#10b981',
      warning: '#f59e0b',
      grid: '#e2e8e5'
    };
  }, [resolvedTheme]);
}
```

---

## 📝 Problema Menor: MapLibre Sprite

**Error:**
```
Image "circle-11" could not be loaded. Please make sure you have added the image with map.addImage() or a "sprite" property in your style.
```

**Nota:** Este error es de MapLibre y no está relacionado con nuestros cambios de dark mode. Es un warning que ya existía.

---

## 📋 Lista de tareas para planner

1. **TASK-01:** Fix hydration mismatch en ThemeToggle - usar mounted check
2. **TASK-02:** Fix ECharts colors en comparative.tsx - crear useChartColors hook
3. **TASK-03:** Verificar otras gráficas ECharts para mismo problema
