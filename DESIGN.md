# Design

Theme: "Kanagawa". El modo oscuro usa Kanagawa Wave y el modo claro usa Kanagawa Lotus. Ambos comparten los mismos roles semánticos, jerarquía y comportamiento.

## Color Palette

### Kanagawa Lotus (light)

- Página: `#f2ecbc`
- Superficie / card: `#e5ddb0`
- Superficie elevada / inputs: `#dcd5ac`
- Hover: `#e4d794`
- Texto principal: `#545464`
- Texto secundario: `#43436c`
- Texto tenue: `#625f55`
- Borde: `#c8bf91`
- Primario / ingresos: `#526a3a`
- Gastos / error: `#b83245`
- Información: `#4d699b`
- Pendiente / warning: fondo `#f9d791`, texto `#6b572f`
- Violeta auxiliar: `#624c83`

### Kanagawa Wave (dark)

- Página: `#1f1f28`
- Superficie / card: `#181820`
- Superficie elevada / inputs: `#2a2a37`
- Hover: `#363646`
- Texto principal: `#dcd7ba`
- Texto secundario: `#c8c093`
- Texto tenue: `#727169`
- Borde: `#363646`
- Primario / ingresos: `#98bb6c`
- Gastos / error: `#e46876`
- Información: `#7e9cd8`
- Pendiente / warning: fondo `#49443c`, texto `#e6c384`
- Violeta auxiliar: `#957fb8`

Los valores base provienen de la paleta oficial de `rebelot/kanagawa.nvim`. Los tonos funcionales de Lotus se oscurecen ligeramente cuando es necesario para mantener contraste AA. Sin gradientes, glassmorphism ni glow decorativo. La profundidad se consigue con capas de superficie y bordes.

## Typography

- **Fraunces** (Google Fonts, opsz 9..144, pesos 400/600/700) — títulos y wordmark. Escala: 42px (título de período), 20px (wordmark), 17px (títulos de card), 15px (títulos menores).
- **Work Sans** (400/500/600) — cuerpo y UI. Escala: 13.5px (base), 13px (botones/nav), 12.5px (leyendas), 12px (subtextos), 11px (labels uppercase).
- **IBM Plex Mono** (400/500/600) — TODOS los valores numéricos, fechas, tags, badges, eyebrows. Escala: 24px (KPIs), 12–13px (tablas), 10–11px (tags/labels).
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
- **Botón primario**: fondo `primary`, texto `primary-foreground`, weight 600, radius 6px, padding `8px 15px`.
- **Botón secundario**: borde `border`, fondo `secondary`.
- **KPI card**: fondo `card`, borde `border`, radius 8px, `border-top: 3px solid` según el tipo de dato; label 11px uppercase, valor mono 600 24px.
- **Tabla**: header mono 10.5px uppercase con `letter-spacing: .08em`; filas `padding: 10px 14px`, separador sutil y hover de superficie.
- **Pill de tipo/estado** (ingreso/gasto, pendiente/pagado): outline, mono 10.5px uppercase, radius 999px, padding `3px 8px`.
- **Switch**: track 36×20px radius 999px, off `muted`, on `primary`, thumb `secondary` 16px.
- **Barra de progreso**: 8px alto, track `muted`, fill `primary`, radius 999px.
- **Modal**: fondo `popover`, overlay oscuro translúcido, radius 12px.
- **Estado vacío**: texto itálico 13.5px `muted-foreground`, nunca área en blanco.
- **Skeleton loading**: fondo `muted` animado, radius del componente que reemplaza.

## Motion

- Transiciones cortas: `background .15s, color .15s` en hover/estado activo. Nada de layout animation, nada de bounce/elastic.

## Responsive

- Breakpoint: 860px (ligeramente distinto al `md:768px` de Tailwind ya usado en el proyecto — usar el breakpoint existente del proyecto, 768px, para consistencia técnica).
- Grids colapsan a 1 columna. Nav superior colapsa a wordmark + menú. Tablas → cards apiladas (ya existe el patrón `isMobile` en el proyecto).

## Sources of truth

Este archivo (`DESIGN.md`) y `frontend/src/index.css` son las fuentes de verdad del tema Kanagawa.
