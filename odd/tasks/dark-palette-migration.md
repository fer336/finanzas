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
- [x] T3 S1-S4: audit grep (no dark-painting raw color left in live files), tests, build, and an independent verifier because Risk item 6 applies (no test catches a visual regression).

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
- L7: the independent verifier reported 3 blockers.
  - B1: light text on lime, amber or coral fills in 5 sites, because gradient fills were missed and ConfirmModal splits text and fill across literals.
  - B2: the codemod rewrote CurrencyModal gradient values that are persisted to the backend (high-risk item 3).
  - B3: the guard did not check contrast.
  Advisories: blue and pink collapse to lime, `#625f55` maps inconsistently, the focus ring is weak, and SVG `var()` needs a visual check.
- L8: one correction batch.
  - B1: on-fill foreground set at the 5 sites. ConfirmModal text moved into each button variant, and its icon tiles moved to variables.
  - B2: the persisted strings were restored exactly and marked `dark-palette-ignore`.
  - B3: the guard now flags light text on a solid dark fill. The fixture was RED before the rule and GREEN after, and the guard caught 4 of the 5 live sites.
  Suite 194/194 and build OK.
- L9: the verifier's recheck at 121622e found B1, B2 and B3 RESOLVED. Guard probes on a gradient site and on the ConfirmModal map entry both fail as expected. Suite 194/194.
- L10 (2026-11-14): native review START stopped with lens_context_budget_exceeded (1751 lines); no authority was created. User: "dejala asi". The migration is left without native review, covered by the independent verifier and the guard test. Delivery follows ordinary repository policy.
