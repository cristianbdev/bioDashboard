# Dark Mode Corrections

Corrección de colores hardcodeados residuales en la implementación de dark mode.

---

## TASK-01: Fix hardcoded colors in page.tsx
Priority: P0
Files: src/app/[locale]/dashboard/page.tsx (edit)
Depends on: none
Acceptance: 
- Línea 203: `bg-[#F5F7F6]` → `bg-[var(--color-surface-base)]`
- Línea 277: `hover:border-[#0F766E]/30` → `hover:border-[var(--color-brand)]/30`
- Línea 280: `border-[#E2E8E5]` → `border-[var(--color-border-subtle)]`
- Línea 280: `bg-[#F5F7F6]` → `bg-[var(--color-surface-base)]`
- Línea 281: `text-[#5E7A8A]` → `text-[var(--color-text-secondary)]`
- Línea 284: `text-[#1F2A2A]` → `text-[var(--color-text-primary)]`
- Línea 285: `text-[#6B7C72]` → `text-[var(--color-text-secondary)]`
- Línea 294: `border-[#E2E8E5]` → `border-[var(--color-border-subtle)]`
- Línea 294: `bg-white` → `bg-[var(--color-raised)]`
- Línea 294: `text-[#1F2A2A]` → `text-[var(--color-text-primary)]`
- Línea 298: `bg-[#0F766E]` → `bg-[var(--color-brand)]`
- Línea 298: `hover:bg-[#0F766E]/90` → `hover:bg-[var(--color-brand)]/90`
- Línea 301: `border-[#E2E8E5]` → `border-[var(--color-border-subtle)]`
- Línea 301: `bg-white` → `bg-[var(--color-raised)]`
- Línea 301: `text-[#1F2A2A]` → `text-[var(--color-text-primary)]`
- Línea 308: `text-[#6B7C72]` → `text-[var(--color-text-secondary)]`

---

## TASK-02: Fix hardcoded colors in facilities.tsx
Priority: P0
Files: src/components/dashboard/facilities.tsx (edit)
Depends on: none
Acceptance:
- Línea 182: `text-[#1F2A2A]` → `text-[var(--color-text-primary)]`
- Línea 186: `text-[#BE123C]` → `text-[var(--color-danger)]`
- Línea 193: `text-[#B7791F]` → `text-[var(--color-warning)]`
- Línea 200: `text-[#15803D]` → `text-[var(--color-success)]`
- Línea 208: `text-[#1F2A2A]` → `text-[var(--color-text-primary)]`
- Línea 210: `hover:border-[#0F766E]/30` → `hover:border-[var(--color-brand)]/30`
- Línea 221: `hover:border-[#0F766E]/30` → `hover:border-[var(--color-brand)]/30`
- Línea 517: `bg-[#0F766E]` → `bg-[var(--color-brand)]`
- Línea 517: `hover:bg-[#0F766E]/90` → `hover:bg-[var(--color-brand)]/90`
- Línea 517: `focus:ring-[#0F766E]/50` → `focus:ring-[var(--color-brand)]/50` (si existe)
- Línea 789: `bg-white` → `bg-[var(--color-raised)]`

---

## TASK-03: Fix bg-white in comparative.tsx
Priority: P1
Files: src/components/dashboard/comparative.tsx (edit)
Depends on: none
Acceptance:
- Línea 248: Badge circular `bg-white` → `bg-[var(--color-raised)]`
- Líneas 267, 283, 299, 315, 331, 414, 430, 446, 462, 478: `bg-white` en SelectTrigger → `bg-[var(--color-raised)]`
- Líneas 560, 576, 592, 608, 624: `bg-white` en SelectTrigger → `bg-[var(--color-raised)]`

---

## TASK-04: Fix bg-white in admin-layout.tsx
Priority: P1
Files: src/components/dashboard/layouts/admin-layout.tsx (edit)
Depends on: none
Acceptance:
- Línea 129: `bg-white` (icon container) → `bg-[var(--color-raised)]`
- Línea 144: `bg-white` (input) → `bg-[var(--color-raised)]`
- Línea 168: `bg-white` (button) → `bg-[var(--color-raised)]`
- Línea 189: `bg-white` (SelectTrigger) → `bg-[var(--color-raised)]`
- Línea 203: `bg-white` (SelectTrigger) → `bg-[var(--color-raised)]`
- Línea 217: `bg-white` (SelectTrigger) → `bg-[var(--color-raised)]`

---

## TASK-05: Fix bg-white in producer-layout.tsx
Priority: P1
Files: src/components/dashboard/layouts/producer-layout.tsx (edit)
Depends on: none
Acceptance:
- Línea 42: `bg-white` (nav container) → `bg-[var(--color-raised)]`

---

## TASK-06: Fix bg-white in overview.tsx
Priority: P1
Files: src/components/dashboard/overview.tsx (edit)
Depends on: none
Acceptance:
- Línea 289: `bg-white` (badge circular) → `bg-[var(--color-raised)]`
- Línea 417: `bg-white` (badge circular) → `bg-[var(--color-raised)]`

---

## TASK-07: Fix bg-white in footer.tsx
Priority: P1
Files: src/components/footer.tsx (edit)
Depends on: none
Acceptance:
- Línea 11: `bg-white` (footer wrapper) → `bg-[var(--color-raised)]`

---

## TASK-08: Fix bg-white in floating-filters.tsx
Priority: P1
Files: src/components/dashboard/floating-filters.tsx (edit)
Depends on: none
Acceptance:
- Línea 76: `bg-white` (active count badge) → `bg-[var(--color-raised)]`

---

## TASK-09: Fix bg-white in desktop-floating-filter.tsx
Priority: P1
Files: src/components/dashboard/desktop-floating-filter.tsx (edit)
Depends on: none
Acceptance:
- Línea 104: `bg-white` (active count badge) → `bg-[var(--color-raised)]`

---

## TASK-10: Verify methodology.tsx and user-management.tsx
Priority: P2
Files: 
- src/components/dashboard/methodology.tsx (verify)
- src/components/dashboard/user-management.tsx (verify)
Depends on: none
Acceptance:
- Buscar cualquier color hardcodeado residual (#XXXXXX, bg-white, text-[#...])
- Si se encuentran problemas, crear TASK adicional o corregir en este task
- Documentar que no se encontraron issues si es el caso

---

## Summary

| Task | Priority | File |
|------|----------|------|
| TASK-01 | P0 | page.tsx - Colores hardcodeados |
| TASK-02 | P0 | facilities.tsx - Colores hardcodeados |
| TASK-03 | P1 | comparative.tsx - bg-white en SelectTriggers |
| TASK-04 | P1 | admin-layout.tsx - bg-white |
| TASK-05 | P1 | producer-layout.tsx - bg-white |
| TASK-06 | P1 | overview.tsx - bg-white badges |
| TASK-07 | P1 | footer.tsx - bg-white |
| TASK-08 | P1 | floating-filters.tsx - bg-white |
| TASK-09 | P1 | desktop-floating-filter.tsx - bg-white |
| TASK-10 | P2 | methodology.tsx, user-management.tsx - Verificación |
