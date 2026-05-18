# Auditoría UI - Problemas Identificados

## Fecha: 2026-04-21

---

## 🚨 Problema 1: Sidebar se monta sobre el header (Desktop)

**Archivo:** `src/components/layout/admin-sidebar.tsx` y `src/components/layout/app-header.tsx`

**Problema:** Al hacer scroll, el sidebar (z-40) compite con el header (z-40) y aparece encima.

**Causa:** Ambos tienen z-40. El header debería tener z-index mayor que el sidebar.

**Solución:** 
- Header: `z-50` (debe estar por encima de todo)
- Sidebar desktop: `z-30` (debe estar debajo del header)
- Sidebar mobile drawer: `z-[60]` (correcto, es modal)

---

## 🚨 Problema 2: Gráficas no se muestran bien

**Archivo:** `src/components/dashboard/overview.tsx`

**Análisis:** Las gráficas parecen tener configuración correcta de CSS variables, pero puede haber problemas con:
1. Colores de las celdas dinámicas no aplicándose
2. ResponsiveContainer no midiendo correctamente

**Hallazgo específico:**
- Línea 369: Las celdas usan `sectionColor(entry.score)` - necesito verificar esta función
- Línea 630: DonutChart usa CHART_PALETTE con CSS variables

**Solución:** Verificar que las funciones de color devuelven valores correctos y que los charts tienen dimensiones apropiadas.

---

## 🚨 Problema 3: Header en móvil saturado

**Archivo:** `src/components/layout/app-header.tsx`

**Elementos actuales en móvil (sm:):**
1. Logo + título + badge
2. Idioma (select)
3. Refresh button
4. Theme toggle
5. Sign in / User button
6. Hamburger menu (admin/producer)

**Problema:** Todo esto no cabe en pantallas pequeñas.

**Solución estratégica:**
- **xs (muy pequeño):** Solo logo + user/auth + hamburguesa
- **sm:** Añadir badge de rol
- **md:** Añadir refresh
- **lg:** Añadir idioma y fecha
- **xl:** Todo visible

Reorganizar con un menú "más opciones" en móvil que contenga: refresh, idioma, theme toggle.

---

## 🚨 Problema 4: Cards de Risk and Suggestions

**Archivo:** `src/components/dashboard/facilities.tsx` (línea 630+ función RiskCard)

**Problema identificado:**
```tsx
<CardHeader className="pb-3 bg-[var(--color-surface-base)] rounded-t-xl">
```

El CardHeader tiene `bg-[var(--color-surface-base)]` que puede hacer que el título no contraste bien con el fondo de la card (`card-flat` usa `var(--color-raised)`).

**Solución:**
Cambiar a:
```tsx
<CardHeader className="pb-3 bg-transparent rounded-t-xl">
```
O usar `bg-[var(--color-raised)]` para consistencia.

---

## 🚨 Problema 5: Colores de gráficas en modo oscuro

**Archivo:** `src/app/globals.css` (tokens de chart)

**Tokens actuales en modo oscuro:**
```css
--color-chart-1: #14b8a6;  /* teal-500 */
--color-chart-2: #60a5fa;  /* blue-400 */
--color-chart-3: #fbbf24;  /* amber-400 */
```

**Problema:** Estos colores pueden no tener suficiente contraste contra el fondo oscuro `#0f172a`.

**Solución:**
Ajustar colores para modo oscuro a versiones más brillantes:
```css
--color-chart-1: #2dd4bf;  /* teal-400 - más brillante */
--color-chart-2: #93c5fd;  /* blue-300 */
--color-chart-3: #fcd34d;  /* amber-300 */
```

---

## 📋 Lista de tareas para planner

1. **TASK-01:** Fix z-index sidebar vs header
2. **TASK-02:** Revisar y fixear gráficas en overview (colores y dimensiones)
3. **TASK-03:** Rediseñar header responsive para móvil
4. **TASK-04:** Fix RiskCard header background
5. **TASK-05:** Mejorar contraste de colores de gráficas en modo oscuro
