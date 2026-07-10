# Design

Theme: "Papel" — dashboard editorial claro tipo libreta contable. Reemplaza el tema oscuro actual.

## Color Palette

Fondos:
- Página: `#f4f0e6`
- Superficie / card: `#faf7ef`
- Superficie elevada / inputs: `#ffffff`
- Destacado dorado (avisos): `#fdf6e3`

Bordes:
- Estándar: `#ddd5c2`
- Sutil / dashed: `#e7e0cf`
- Doble regla de cabecera: `#cfc6ae`
- Dorado: `#e0c98a`

Texto:
- Principal: `#20242c`
- Secundario: `#5d6470`
- Terciario / labels: `#8a8677`

Acentos:
- Verde (ingresos / primario): `#5a7d52` · texto verde `#476442` · hover botón `#4f7047`
- Arcilla (gastos): `#b35a42` · texto rojo `#a04a34`
- Azul (info / período): `#3d5a80`
- Dorado (pendiente): `#e9c46a` · texto dorado `#8a6a1f`
- Violeta (aux, categorías extra): `#8a6fa0`
- Gris (aux, categorías extra): `#9aa2ad`
- Nav activa / botones oscuros: fondo `#20242c`, texto `#f4f0e6`

Sin gradientes, sin glassmorphism. Sombras: ninguna — la profundidad se logra solo con bordes y contraste de fondo.

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

- **Nav pills**: activo fondo `#20242c` texto `#f4f0e6` weight 600; inactivo transparente texto `#5d6470`, hover `rgba(0,0,0,.05)`.
- **Badge contador** (ej. Vencimientos): IBM Plex Mono 10px, fondo `#e9c46a`, texto `#20242c`, radius 999px, padding `1px 6px`.
- **Botón primario**: fondo `#5a7d52`, texto `#faf7ef`, weight 600, radius 6px, padding `8px 15px`, hover `#4f7047`.
- **Botón secundario**: borde `#ddd5c2`, fondo `#fff`.
- **KPI card**: fondo `#faf7ef`, borde `#ddd5c2`, radius 8px, `border-top: 3px solid` (color según tipo de dato), label 11px uppercase `#8a8677`, valor mono 600 24px, subtexto 12px `#8a8677`.
- **Tabla**: header mono 10.5px uppercase `letter-spacing: .08em` `#8a8677`, `border-bottom: 2px solid #ddd5c2`; filas `padding: 10px 14px`, separador `1px solid #e7e0cf`, hover `#f0ead9`.
- **Pill de tipo/estado** (ingreso/gasto, pendiente/pagado): outline, mono 10.5px uppercase, radius 999px, padding `3px 8px`.
- **Switch**: track 36×20px radius 999px, off `#d8d6cf`, on `#5a7d52`, thumb blanco 16px.
- **Barra de progreso**: 8px alto, track `#e7e0cf`, fill `#5a7d52`, radius 999px.
- **Modal**: fondo `#faf7ef`, overlay `rgba(32,36,44,.4)`, radius 12px.
- **Estado vacío**: texto itálico 13.5px `#8a8677`, nunca área en blanco.
- **Skeleton loading**: fondo `#e7e0cf` animado, radius del componente que reemplaza.

## Motion

- Transiciones cortas: `background .15s, color .15s` en hover/estado activo. Nada de layout animation, nada de bounce/elastic.

## Responsive

- Breakpoint: 860px (ligeramente distinto al `md:768px` de Tailwind ya usado en el proyecto — usar el breakpoint existente del proyecto, 768px, para consistencia técnica).
- Grids colapsan a 1 columna. Nav superior colapsa a wordmark + menú. Tablas → cards apiladas (ya existe el patrón `isMobile` en el proyecto).

## Sources of truth

Tokens tomados literalmente de `design_handoff_rediseno_papel/README.md` y `reference-papel.html`. Lógica de datos y filtros de referencia en `design_handoff_rediseno_papel/datos-ejemplo.html`.
