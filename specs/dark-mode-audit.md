# Auditoría Dark Mode - Problemas Encontrados

## Fecha: 2025-01-21

---

## 🚨 Problemas Críticos (P0)

### 1. Colores Hardcodeados en page.tsx
**Archivo:** `src/app/[locale]/dashboard/page.tsx`

| Línea | Problema | Solución |
|-------|----------|----------|
| 203 | `bg-[#F5F7F6]` | `bg-[var(--color-surface-base)]` |
| 277 | `hover:border-[#0F766E]/30` | `hover:border-[var(--color-brand)]/30` |
| 280 | `border-[#E2E8E5]` | `border-[var(--color-border-subtle)]` |
| 280 | `bg-[#F5F7F6]` | `bg-[var(--color-surface-base)]` |
| 281 | `text-[#5E7A8A]` | `text-[var(--color-text-secondary)]` |
| 284 | `text-[#1F2A2A]` | `text-[var(--color-text-primary)]` |
| 285 | `text-[#6B7C72]` | `text-[var(--color-text-secondary)]` |
| 294 | `border-[#E2E8E5]` | `border-[var(--color-border-subtle)]` |
| 294 | `bg-white` | `bg-[var(--color-raised)]` |
| 294 | `text-[#1F2A2A]` | `text-[var(--color-text-primary)]` |
| 298 | `bg-[#0F766E]` | `bg-[var(--color-brand)]` |
| 301 | `border-[#E2E8E5]` | `border-[var(--color-border-subtle)]` |
| 301 | `bg-white` | `bg-[var(--color-raised)]` |
| 301 | `text-[#1F2A2A]` | `text-[var(--color-text-primary)]` |
| 308 | `text-[#6B7C72]` | `text-[var(--color-text-secondary)]` |

### 2. Colores Hardcodeados en facilities.tsx
**Archivo:** `src/components/dashboard/facilities.tsx`

| Línea | Problema | Solución |
|-------|----------|----------|
| 182 | `text-[#1F2A2A]` | `text-[var(--color-text-primary)]` |
| 186 | `text-[#BE123C]` | `text-[var(--color-danger)]` |
| 193 | `text-[#B7791F]` | `text-[var(--color-warning)]` |
| 200 | `text-[#15803D]` | `text-[var(--color-success)]` (ya existe) |
| 208 | `text-[#1F2A2A]` | `text-[var(--color-text-primary)]` |
| 210 | `hover:border-[#0F766E]/30` | `hover:border-[var(--color-brand)]/30` |
| 221 | `hover:border-[#0F766E]/30` | `hover:border-[var(--color-brand)]/30` |
| 517 | `bg-[#0F766E]` | `bg-[var(--color-brand)]` |
| 789 | `bg-white` | `bg-[var(--color-raised)]` |

---

## ⚠️ Problemas Importantes (P1)

### 3. bg-white en SelectTriggers (comparative.tsx)
**Archivo:** `src/components/dashboard/comparative.tsx`

Múltiples instancias de `bg-white` en SelectTrigger que deben ser `bg-[var(--color-raised)]`:
- Líneas: 267, 283, 299, 315, 331, 414, 430, 446, 462, 478, 560, 576, 592, 608, 624

### 4. bg-white en admin-layout.tsx
**Archivo:** `src/components/dashboard/layouts/admin-layout.tsx`

| Línea | Problema | Solución |
|-------|----------|----------|
| 129 | `bg-white` | `bg-[var(--color-raised)]` |
| 144 | `bg-white` | `bg-[var(--color-raised)]` |
| 168 | `bg-white` | `bg-[var(--color-raised)]` |
| 189 | `bg-white` | `bg-[var(--color-raised)]` |
| 203 | `bg-white` | `bg-[var(--color-raised)]` |
| 217 | `bg-white` | `bg-[var(--color-raised)]` |

### 5. bg-white en producer-layout.tsx
**Archivo:** `src/components/dashboard/layouts/producer-layout.tsx`

| Línea | Problema | Solución |
|-------|----------|----------|
| 42 | `bg-white` | `bg-[var(--color-raised)]` |

### 6. bg-white en overview.tsx
**Archivo:** `src/components/dashboard/overview.tsx`

| Línea | Problema | Solución |
|-------|----------|----------|
| 289 | `bg-white` | `bg-[var(--color-raised)]` |
| 417 | `bg-white` | `bg-[var(--color-raised)]` |

### 7. bg-white en footer.tsx
**Archivo:** `src/components/footer.tsx`

| Línea | Problema | Solución |
|-------|----------|----------|
| 11 | `bg-white` | `bg-[var(--color-raised)]` |

### 8. bg-white en floating-filters y desktop-floating-filter
**Archivos:** 
- `src/components/dashboard/floating-filters.tsx` (línea 76)
- `src/components/dashboard/desktop-floating-filter.tsx` (línea 104)

---

## 📝 Problemas Menores (P2)

### 9. comparative.tsx - Badge circular
**Archivo:** `src/components/dashboard/comparative.tsx`
- Línea 248: `bg-white` para badge circular

### 10. Verificar methodology.tsx y user-management.tsx
Estos archivos pueden tener colores hardcodeados residuales.

---

## ✅ Implementaciones Correctas (No requieren cambios)

1. **ThemeProvider.tsx** - Correctamente configurado
2. **ThemeToggle.tsx** - Correctamente implementado
3. **globals.css** - Tokens dark completos
4. **app-header.tsx** - Usa tokens correctamente
5. **bottom-sheet.tsx** - Usa tokens correctamente
6. **MapLibreFacilitiesMap.tsx** - Ya detecta tema y cambia estilo
7. **chart-card.tsx** - Tooltip usa `var(--color-raised)`

---

## 🔧 Acciones Requeridas

1. **Crear spec de corrección** con tasks para cada archivo problemático
2. **Priorizar page.tsx** - Es el layout principal
3. **Convertir todos los bg-white** a tokens semánticos
4. **Revisar methodology.tsx y user-management.tsx** para colores residuales
5. **Validar visualmente** después de las correcciones
