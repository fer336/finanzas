# Dark palette migration

Objective: every live screen renders the green-black palette in dark mode. Branch `feat/due-dates-dynamic-categories`; delivery `ask-on-risk`; tests with Vitest (`cd frontend && npx vitest run`).
Method: a scripted codemod rewrites only `dark:` color utilities in live files, followed by a contrast pass and an audit grep.

## Specs

- S1: "si migra todos los colores". Every color utility in a live file (reachable from `src/main.jsx`) that paints in dark mode resolves to a palette token, not to a raw hex value or a Tailwind palette color.
- S2: Palette (verbatim):
  | Uso en la interfaz | Color | HEX |
  |---|---|---|
  | Fondo principal | Negro verdoso | `#101211` |
  | Paneles y controles | Gris verde oscuro | `#181B18` |
  | Tarjetas de configuración | Verde casi negro | `#151814` |
  | Bordes y divisores | Gris oliva | `#2D332C` |
  | Texto principal | Blanco cálido | `#EEF1E8` |
  | Texto secundario | Gris salvia | `#8D9689` |
  | Botones y acentos | Verde lima | **`#C7F57A`** |
  | Fondo del visualizador | Negro profundo | `#030704` |
  | Grabación activa | Coral | `#FF766D` |
- S3 (assumption, carried over from the approved due-dates plan): the light theme is unchanged. Only `dark:` variants are added or replaced.
- S4 (assumption): text on a lime, coral or amber fill uses the dark foreground `#101211`, so it stays readable.
- Out of scope (assumption): 32 files that `src/main.jsx` never imports (941 color usages). Chart series hues in inline JS, which need distinct colors to tell series apart.

## Tasks

- [x] T1 S1-S3: codemod over the live files, mapping each color to a dark token by role (neutral lightness, or hue family). Route inline. 1,193 rewrites in 41 files.
- [x] T2 S4: contrast pass for text on fills (inside the codemod), plus inline chrome moved to CSS variables (page ink, market chart, muted icon). Data colors kept. Route inline.
- [ ] T3 S1-S4: audit grep (no dark-painting raw color left in live files), tests, build, and an independent verifier because Risk item 6 applies (no test catches a visual regression).

## Log

- L1 (2026-11-14) user: "si migra todos los colores"
- L2: inventory over 45 live files with about 1,808 color usages:
  - 515 are `dark:` hex classes, using only 17 distinct values.
  - 406 are plain hex classes that paint in both themes.
  - 1,355 are Tailwind palette classes that paint in both themes.
  - 32 unreachable files are excluded.
- L3: due-dates work unit committed as 3ef84a5. Native review was granted and approved, and its authority was burned. Advisories R3-month-view-first-due-only and R3-category-key-all-collision are noted as follow-ups.
- L4: codemod v1 was reverted. It duplicated existing token `dark:` siblings and read the light parchment neutrals (#c8bf91, #e4d794) as amber. v2 adds overrides for old Kanagawa and parchment values, skips translucent neutral overlays, and detects any existing `dark:` sibling.
- L5: guard test `src/theme/darkPaletteGuard.test.js`. It is RED on the base copy (violations found) and GREEN after. Suite 194/194, build OK, lint shows the same 22 warnings as the base.
- L6: light differential (base vs change with `dark:` classes stripped). The only differences are inline colors moved to variables whose light values equal the old ones.
