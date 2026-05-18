# Dark Mode Implementation

Implementation of dark mode for the Kobolotbox biosecurity dashboard using next-themes with light/dark/system modes, localStorage persistence, and theme-aware charts.

## Requirements Confirmed
- **Library**: next-themes
- **Modes**: light / dark / system (3 modes with OS auto-detection)
- **Persistence**: localStorage
- **Toggle Location**: Main header (app-header.tsx)
- **Map**: Auto-switch to dark map style when theme is dark
- **Charts**: Adapt colors for visibility in both themes
- **i18n**: Add "System" translation to all locales

---

## TASK-01: Install and configure next-themes
Priority: P0
Files: 
- package.json (edit)
- src/components/theme/ThemeProvider.tsx (create)
- src/app/layout.tsx (edit)
Depends on: none
Acceptance: 
- `next-themes` installed via package manager
- `src/components/theme/ThemeProvider.tsx` created with NextThemesProvider wrapper
- Provider configured for class-based theming with attribute="class"
- Provider supports light/dark/system modes with enableSystem=true
- Provider uses localStorage with storageKey="theme"
- `src/app/layout.tsx` wraps children with ThemeProvider
- Existing `suppressHydrationWarning` on html and body elements preserved
- No hydration mismatches on initial render

---

## TASK-02: Create theme toggle component
Priority: P0
Files: 
- src/components/theme/ThemeToggle.tsx (create)
- src/components/theme/useTheme.ts (create - re-export from next-themes)
Depends on: TASK-01
Acceptance:
- Component uses `useTheme` hook from next-themes
- Toggle supports 3 modes: light, dark, system
- Uses existing `src/components/ui/dropdown-menu.tsx` for mode selection
- Uses existing `src/components/ui/button.tsx` as trigger
- Displays current mode with appropriate icon (Sun for light, Moon for dark, Monitor for system)
- Accessible with proper aria-labels and keyboard navigation
- Uses i18n translations for mode labels (theme.light, theme.dark, theme.system)
- Responsive design works on desktop and mobile

---

## TASK-03: Add toggle to main header
Priority: P0
Files: src/components/layout/app-header.tsx (edit)
Depends on: TASK-02
Acceptance:
- ThemeToggle component imported and rendered in header
- Toggle positioned alongside existing controls (locale switcher, refresh, auth)
- Visible and accessible on both desktop and mobile viewports
- Header background uses theme-aware tokens instead of hardcoded bg-white
- No visual regression in existing header functionality
- Toggle is available to all user roles (admin, producer, public)

---

## TASK-04: Add i18n translations for system mode
Priority: P0
Files: 
- src/messages/en.json (edit)
- src/messages/es.json (edit)
- src/messages/no.json (edit)
Depends on: none
Acceptance:
- `theme.system` key added to all three locale files
- English: "System"
- Spanish: "Sistema"  
- Norwegian: "System"
- Key placed in existing `theme` namespace alongside `theme.light` and `theme.dark`
- No breaking changes to existing translation keys

---

## TASK-05: Complete CSS dark tokens in globals.css
Priority: P0
Files: src/app/globals.css (edit)
Depends on: none
Acceptance:
- All custom semantic tokens have dark variants inside `.dark` block:
  - `--color-surface-base`
  - `--color-surface-elevated`
  - `--color-raised`
  - `--color-text-primary`
  - `--color-text-secondary`
  - `--color-text-muted`
  - `--color-border-subtle`
  - `--color-border-default`
  - `--color-brand`
  - Chart-specific tokens (`--chart-*`)
- Utility classes updated for dark mode:
  - `.card-flat` uses theme-aware backgrounds
  - `.text-dashboard-title` contrasts properly in dark
  - `.info-tooltip .info-bubble` adapts to dark surfaces
  - `.maplibregl-popup-content` uses dark-friendly colors
  - `.maplibregl-ctrl-group button` visible in dark mode
- No hardcoded white/black colors in shared utility classes
- CSS custom-variant `dark (&:is(.dark *))` works correctly

---

## TASK-06: Update chart colors for dark mode
Priority: P1
Files: 
- src/components/charts/chart-card.tsx (edit)
- src/lib/kobo.ts (edit)
- src/components/dashboard/comparative.tsx (edit)
- src/components/dashboard/facilities.tsx (edit)
- src/components/dashboard/overview.tsx (edit)
- src/components/dashboard/cards.tsx (edit)
Depends on: TASK-01, TASK-05
Acceptance:
- Charts detect active theme via `useTheme` or CSS variable approach
- Tooltip surfaces (chart-card.tsx) use theme-aware backgrounds instead of hardcoded white
- ECharts in comparative.tsx use contrasting colors for:
  - Title text
  - Axis labels and gridlines
  - Heatmap color scale (visible in both themes)
- Recharts across dashboard use:
  - Light text on dark backgrounds
  - Dark text on light backgrounds
  - Proper gridline contrast
- kobo.ts chart color generation considers theme for complianceMix and other visualizations
- Chart labels and legends readable in both light and dark modes
- No color collisions between chart fills and background

---

## TASK-07: Update map for dark mode
Priority: P1
Files: 
- src/components/dashboard/MapLibreFacilitiesMap.tsx (edit)
- src/app/globals.css (edit - map UI overrides)
Depends on: TASK-01, TASK-05
Acceptance:
- Map automatically switches to `MAP_STYLES.dark` when app theme is dark
- Map uses `MAP_STYLES.liberty` (or light style) when app theme is light
- Manual style toggle (if exists) can override or coexist with theme-driven selection
- Map UI elements adapted for dark mode:
  - Popup backgrounds use theme-aware surfaces
  - Popup text uses theme-aware text colors
  - Control buttons visible on dark backgrounds
  - Legend containers contrast properly
  - Close buttons visible and accessible
- Map markers and clusters remain visible in dark map style
- No visual regressions in map interactions (zoom, pan, popup)

---

## TASK-08: Audit and fix component hardcoded colors
Priority: P1
Files:
- src/app/[locale]/dashboard/page.tsx (edit)
- src/components/layout/app-header.tsx (edit)
- src/components/footer.tsx (edit)
- src/components/layout/bottom-sheet.tsx (edit)
- src/components/layout/admin-sidebar.tsx (edit)
- src/components/dashboard/layouts/admin-layout.tsx (edit)
- src/components/dashboard/layouts/producer-layout.tsx (edit)
- src/components/dashboard/info-title.tsx (edit)
- src/components/dashboard/methodology.tsx (edit)
- src/components/dashboard/user-management.tsx (edit)
- src/components/dashboard/floating-filters.tsx (edit)
- src/components/dashboard/desktop-floating-filter.tsx (edit)
Depends on: TASK-05
Acceptance:
- No hardcoded `bg-white` in major layout components
- No hardcoded `bg-[#F5F7F6]` or similar hex backgrounds
- No hardcoded `text-slate-900`, `text-slate-700` without dark variants
- All surfaces use semantic tokens: `--color-surface-*`
- All text uses semantic tokens: `--color-text-*`
- All borders use semantic tokens: `--color-border-*`
- Focus rings and interactive states work in dark mode
- Admin, producer, and public layouts all render correctly in dark mode
- Mobile bottom sheet adapts to dark surfaces
- Sidebar navigation items visible and accessible in dark mode

---

## TASK-09: Validation checklist
Priority: P2
Files: none
Depends on: TASK-01 through TASK-08
Acceptance:
- [ ] Theme persists in localStorage across page reloads
- [ ] Theme persists when navigating between locales
- [ ] System mode auto-detects OS preference and updates live
- [ ] No hydration mismatch warnings in console
- [ ] No white flash on initial page load (respects stored theme)
- [ ] Toggle visible and functional in header on desktop
- [ ] Toggle visible and functional in header on mobile
- [ ] All three modes (light/dark/system) switch correctly
- [ ] Charts readable with proper contrast in light mode
- [ ] Charts readable with proper contrast in dark mode
- [ ] Map switches to appropriate style for each theme
- [ ] Map popups and controls visible in both themes
- [ ] Translations display correctly in all locales (en, es, no)
- [ ] Admin layout renders correctly in dark mode
- [ ] Producer layout renders correctly in dark mode
- [ ] Public layout renders correctly in dark mode
- [ ] No visual regressions in existing functionality
- [ ] Accessibility: toggle keyboard-navigable, proper aria labels

---

## Summary

| Task | Priority | Description |
|------|----------|-------------|
| TASK-01 | P0 | Install and configure next-themes |
| TASK-02 | P0 | Create theme toggle component |
| TASK-03 | P0 | Add toggle to main header |
| TASK-04 | P0 | Add i18n translations for system mode |
| TASK-05 | P0 | Complete CSS dark tokens in globals.css |
| TASK-06 | P1 | Update chart colors for dark mode |
| TASK-07 | P1 | Update map for dark mode |
| TASK-08 | P1 | Audit and fix component hardcoded colors |
| TASK-09 | P2 | Validation checklist |

## Notes
- Storage key: `theme` (default from next-themes)
- Attribute: `class` (applies .dark to html element)
- Default theme: `system` (respects OS preference)
- System detection: enabled with `enableSystem: true`
