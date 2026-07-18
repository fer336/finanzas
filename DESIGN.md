# Design

Theme: "Kanagawa Violet". El modo oscuro usa Kanagawa Violet Dark y el modo claro usa una variante Kanagawa Violet Light. Ambos comparten los mismos roles semánticos, jerarquía, recursos ornamentales y comportamiento.

## Color Palette

### Kanagawa Violet Light

- Página: `#f7f3ea`
- Fondo profundo: `#ece4d6`
- Superficie / card: `#fbf8f0`
- Superficie elevada / inputs: `#f1eadf`
- Superficie violeta: `#e8dfef`
- Texto principal: `#40384d`
- Texto secundario: `#5c5063`
- Texto tenue: `#6f6074` (AA over elevated light surfaces)
- Borde: `#cfc2b8`
- Primario / navegación: `#574582`
- Primario hover / active: `#685496` / `#604b8b` (active keeps small cream text above AA contrast)
- Ingresos: `#4e913f`; success control background: `#315c2d` with cream text for AA contrast
- Gastos: `#d33e48`; destructive control background: `#822d33` with cream text for AA contrast
- Información / resultado positivo: `#506da8`
- Pendiente / warning: fondo `#efe1ba`, texto `#6b572f`
- Violeta auxiliar: `#957fb8`

### Kanagawa Violet Dark

- Fondo profundo: `#030411`
- Página: `#050717`
- Fondo alternativo: `#090b1b`
- Superficie / card: `#0d0d1f`
- Superficie elevada / inputs: `#111124`
- Superficie violeta: `#191727`
- Texto principal: `#f0e6e0`
- Texto secundario: `#c9b9bd`
- Texto tenue: `#9a8ca0` (AA over `#191727` violet surfaces)
- Borde: `#393550`
- Borde fuerte: `#4f4c6a`
- Primario / navegación: `#574582`
- Primario hover / active: `#685496` / `#604b8b` (active keeps small cream text above AA contrast)
- Ingresos: `#4e913f`; success control background: `#315c2d` with cream text for AA contrast
- Gastos: `#d33e48`; destructive control background: `#822d33` with cream text for AA contrast
- Información / resultado positivo: `#7e9cd8`
- Pendiente / warning: fondo `#3f3544`, texto `#e6c384`
- Violeta auxiliar: `#957fb8`

La variante Violet usa fondos azul-negro, superficies violetas profundas, texto crema rosado y acentos semánticos de alto contraste. Sin blanco puro ni negro puro. Los grabados japoneses se usan como ornamentación de baja opacidad, siempre detrás de los datos.

### Category colors

- Comida: `#e9444f`
- Educación / cursos: `#e9a52b`
- Servicios: `#4e913f`
- Educación / deporte: `#347ac1`
- Transporte / combustible: `#32a7b7`
- Varias: `#a75bc4`
- Otros: `#e06a35`
- Cuidado / limpieza: `#c9b9ad`
- Deudas / finanzas: `#8a6a4a`
- Salud: `#d27e99`

## Typography

- **Cormorant Garamond** (400/600/700) — títulos, meses y cifras destacadas.
- **Inter** con fallback **Manrope** (400/500/600) — cuerpo, navegación y texto de interfaz.
- **JetBrains Mono** (400/500/600) — fechas, períodos, montos, tags, badges y etiquetas técnicas.
- Line-height base: 1.45. Montos con separador de miles `Intl.NumberFormat('es-AR')` y signo explícito `+`/`−`.

## Spacing & Layout

- Base: 4px.
- Padding de cards: 16–20px. Gaps de grid: 12–16px. Padding de página: `28px 34px`.
- `max-width` de contenido: 1100px.
- Nav superior: `padding: 14px 34px`, `gap: 26px`.

## Radius

- 6px: inputs/botones.
- 8px: cards.
- 10px: paneles grandes.
- 999px: pills/badges/barras.

## Components

- **Nav pills**: activo con alto contraste entre `foreground` y `background`; inactivo transparente con hover `card-hover`.
- **Badge contador** (ej. Vencimientos): IBM Plex Mono 10px, fondo `accent`, texto `accent-foreground`, radius 999px, padding `1px 6px`.
- **Botón primario**: fondo `primary`, texto `primary-foreground`, borde `primary-active`, weight 600, radius 12px, padding `8px 15px`, sombra sobria e inset highlight mínimo.
- **Botón secundario**: borde `border`, fondo `secondary`.
- **KPI card**: fondo con `kanagawa-card`, borde `border`, radius 16px, `border-top: 3px solid` según el tipo de dato; label 11px uppercase, valor mono 600 24px. Las tarjetas de ingresos y gastos incluyen ilustraciones decorativas con `alt=""`, `aria-hidden="true"`, `pointer-events: none`, máscara hacia la izquierda y contenido con z-index superior.
- **Tabla**: header mono 10.5px uppercase con `letter-spacing: .08em`; filas `padding: 10px 14px`, separador sutil y hover de superficie.
- **Pill de tipo/estado** (ingreso/gasto, pendiente/pagado): outline, mono 10.5px uppercase, radius 999px, padding `3px 8px`.
- **Switch**: track 36×20px radius 999px, off `muted`, on `primary`, thumb `secondary` 16px.
- **Barra de progreso**: 8px alto, track `muted`, fill `primary`, radius 999px.
- **Modal**: fondo `popover`, overlay oscuro translúcido, radius 12px.
- **Document preview modal**: every factura/comprobante URL sink must use `normalizeDocumentPreviewUrl` before rendering an Eye action, external link, image, or iframe. Allowed origins are the app/backend origins plus `https://s3.qeva.xyz`; unsafe protocols, credentialed URLs, unexpected origins, and non-local `http:` are rejected. PDF iframes stay sandboxed.
- **Estado vacío**: texto itálico 13.5px `muted-foreground`, nunca área en blanco.
- **Skeleton loading**: fondo `muted` animado, radius del componente que reemplaza.

## Motion

- Transiciones cortas de 150–160ms para fondo, color, borde, sombra y `transform: translateY(-1px)` en elementos interactivos. Nada de layout animation, bounce o elastic. Respetar `prefers-reduced-motion`.

## Ornamentation and assets

- Source paths live in `frontend/src/theme/kanagawa-assets.js`.
- Public assets are served from `frontend/public/assets/kanagawa/`.
- Dark dashboard background: `kanagawa-dashboard-background.webp` at opacity `0.44` desktop, `0.30` mobile.
- Light dashboard background: `kanagawa-dashboard-background-light.webp` at opacity `0.72` desktop, `0.50` mobile.
- General backgrounds are fixed, decorative, cover the viewport, stay behind content and preserve wave left plus Fuji lower-right.
- Income card art: `kanagawa-income-pines-transparent.webp`, lower right, 46% width, opacity around `0.38`, masked toward the left.
- Expense card art: `kanagawa-expense-fuji-transparent.webp`, right side, 48% width, opacity around `0.36`, masked toward the left.
- Images never replace text, controls, amounts, semantic colors or chart labels.

## Testing guardrails

- Frontend URL policy and document-preview regressions are covered by Vitest (`npm test`) and must run in CI before lint/build.

## Responsive

- Breakpoint: 860px (ligeramente distinto al `md:768px` de Tailwind ya usado en el proyecto — usar el breakpoint existente del proyecto, 768px, para consistencia técnica).
- Grids colapsan a 1 columna. Nav superior colapsa a wordmark + menú. Tablas → cards apiladas (ya existe el patrón `isMobile` en el proyecto).

## Sources of truth

Este archivo (`DESIGN.md`) y `frontend/src/index.css` son las fuentes de verdad del tema Kanagawa.
