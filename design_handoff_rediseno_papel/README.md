# Handoff: Rediseño "Papel" — Sistema de finanzas personales

## Overview
Rediseño completo del sistema de finanzas personales (dashboard oscuro actual con sidebar y logo de pulpo) hacia una dirección **clara, tipo libreta contable**: fondo papel cálido, tipografía serif editorial para títulos, monospace para todos los valores numéricos, y navegación superior en lugar de sidebar. Corresponde a la opción **1b "Papel"** de la exploración de diseño.

Objetivos del rediseño (pedidos por el dueño del producto):
- Eliminar la oscuridad del tema actual.
- Frontend más simple, funcional y legible.
- Simplificar el menú: agrupar secciones poco usadas.
- Mantener ARS como moneda principal con equivalencia USD.

## About the Design Files
Los archivos incluidos son **referencias de diseño creadas en HTML** — prototipos que muestran el look & feel e intención de comportamiento. **No son código de producción para copiar directamente.** La tarea es **recrear este diseño dentro del entorno del sistema existente** (su framework, componentes y patrones actuales), reutilizando la lógica de datos que ya funciona (movimientos, vencimientos, resúmenes, filtros día/semana/mes) y reemplazando la capa visual.

- `reference-papel.html` — referencia visual estática del dashboard en el tema Papel (abrir en navegador).
- `datos-ejemplo.html` — el reporte HTML original del sistema actual (julio 2026); contiene el **modelo de datos real** en el bloque `const DATA = {...}` y la lógica de filtros/render que debe preservarse funcionalmente.

## Fidelity
**High-fidelity (hifi).** Colores, tipografía, espaciados y jerarquía son finales. Recrear con precisión usando los componentes del codebase existente. Las pantallas secundarias (Movimientos, Vencimientos, Objetivos, Inversiones, Ajustes) siguen el mismo sistema de tokens y patrones descritos acá, extrapolando del dashboard.

## Mapa de migración (sistema actual → rediseño)
La navegación actual tiene 9+ ítems. Se consolida en 6:

| Actual | Nuevo |
|---|---|
| Dashboard | **Inicio** |
| Transacciones | **Movimientos** |
| Pagos Pendientes | **Vencimientos** (con badge de cantidad pendiente) |
| Objetivos | **Objetivos** |
| CEDEARs + Cotización Dólar + Monedas | **Inversiones** (una sección con tabs internos) |
| Categorías + Uso de Lucy/IA + Reportar/Bugs + config de widgets | **Ajustes** |

Notas:
- El modal "Configurar Dashboard" (toggles de widgets, proveedor de IA, modo de balance mensual/acumulado) se mueve a **Ajustes**, mismo contenido, restyled con los tokens de abajo.
- El logo pulpo se reemplaza por identidad tipográfica: wordmark **"Cuentas."** en Fraunces 700, con el punto final en `#b35a42`. (Si se quiere conservar el pulpo, va monocromo en `#b35a42` a la izquierda del wordmark.)
- El FAB verde flotante desaparece; la acción primaria es el botón **"+ Nuevo"** fijo en la barra superior.

## Screens / Views

### 1. Barra de navegación superior (global, todas las pantallas)
- **Layout**: barra horizontal full-width, `padding: 14px 34px`, fondo `#faf7ef`, borde inferior `1px solid #ddd5c2`. Flex, `gap: 26px`, ítems centrados verticalmente.
- **Wordmark**: "Cuentas." — Fraunces 700, 20px, `#20242c`; el punto en `#b35a42`.
- **Ítems de nav** (Work Sans 13.5px): pills `padding: 7px 14px; border-radius: 999px`.
  - Activo: fondo `#20242c`, texto `#f4f0e6`, weight 600.
  - Inactivo: sin fondo, texto `#5d6470`. Hover: fondo `rgba(0,0,0,.05)`.
  - "Vencimientos" lleva badge contador: IBM Plex Mono 10px, fondo `#e9c46a`, texto `#20242c`, `border-radius: 999px; padding: 1px 6px`, weight 600. Se muestra solo si hay pendientes.
- **Derecha** (`margin-left: auto`): campo Buscar (fondo `#fff`, borde `1px solid #ddd5c2`, radius 6px, `padding: 7px 12px`, placeholder IBM Plex Mono 12px `#8a8677`) + botón primario **"+ Nuevo"** (fondo `#5a7d52`, texto `#faf7ef`, weight 600, 13px, radius 6px, `padding: 8px 15px`). Hover botón: `#4f7047`.

### 2. Inicio (dashboard)
- **Contenedor**: `max-width: 1100px; margin: 0 auto; padding: 28px 34px`. Fondo de página `#f4f0e6`.
- **Cabecera de período**: flex space-between, alineado a baseline inferior, `padding-bottom: 18px`, separador `border-bottom: 3px double #cfc6ae`, `margin-bottom: 22px`.
  - Eyebrow: "PERÍODO 2026-07" — IBM Plex Mono 11px, `letter-spacing: .16em`, uppercase, `#3d5a80`.
  - Título: "Julio 2026" — Fraunces 700, 42px, line-height 1, `#20242c`.
  - Veredicto (texto generado por el sistema): Work Sans 13.5px, `#5d6470`, `max-width: 58ch`, `margin-top: 8px`.
  - **Sello de saldo** (derecha): card `background: #faf7ef; border: 1px solid #ddd5c2; border-radius: 8px; padding: 12px 18px`, texto alineado a la derecha. Label "SALDO ESTIMADO" IBM Plex Mono 10px uppercase `#8a8677`; valor IBM Plex Mono 600 24px `#20242c`; debajo equivalencia "≈ USD n" IBM Plex Mono 11px `#8a8677`. El USD se calcula con la cotización vigente del sistema.
- **KPIs**: grid 3 columnas, `gap: 14px`, `margin-bottom: 20px`. Cada card: fondo `#faf7ef`, borde `1px solid #ddd5c2`, radius 8px, `padding: 16px 18px`, y **borde superior de 3px** como codificación de color:
  - Ingresos → `border-top: 3px solid #5a7d52`, valor en `#476442`.
  - Gastos → `border-top: 3px solid #b35a42`, valor en `#a04a34`.
  - Resultado del mes → `border-top: 3px solid #3d5a80`; valor en `#476442` si ≥ 0, `#a04a34` si < 0.
  - Estructura interna: label 11px uppercase `letter-spacing: .06em` `#8a8677`; valor IBM Plex Mono 600 24px `margin-top: 6px`; subtexto Work Sans 12px `#8a8677` (ej. "22 movimientos", "gastos 136% de ingresos").
- **Grid principal**: `grid-template-columns: 1.5fr 1fr; gap: 16px`.
  - **Panel Movimientos recientes** (izq): card estándar (`#faf7ef`, borde `#ddd5c2`, radius 8px, `padding: 18px 20px`). Título Fraunces 600 17px. Filas en grid `52px 1fr auto`, `gap: 9px 14px`; separador entre filas `border-top: 1px dashed #ddd5c2`. Fecha IBM Plex Mono 11.5px `#8a8677` (formato MM-DD); descripción Work Sans 13.5px; tag de categoría inline IBM Plex Mono 10px uppercase (color según tipo); monto IBM Plex Mono 600, alineado derecha, `− $ n` en `#a04a34` para gastos, `+ $ n` en `#476442` para ingresos. Muestra 5, con link "ver todos" a Movimientos.
  - **Columna derecha**: dos cards apiladas (`gap: 16px`):
    - **Gastos por categoría**: barra apilada horizontal única (14px alto, radius 999px, segmentos proporcionales) + leyenda en grid `1fr auto` con swatches 9×9px radius 2px y porcentajes IBM Plex Mono 12.5px `#5d6470`. Paleta de categorías en orden: `#b35a42`, `#e9c46a`, `#5a7d52`, `#3d5a80`, `#8a6fa0`, `#9aa2ad` (repetir con variaciones de lightness si hay más de 6).
    - **Aviso Vencimientos**: card destacada `background: #fdf6e3; border: 1px solid #e0c98a`, radius 8px, `padding: 16px 20px`. Título Fraunces 600 15px + total IBM Plex Mono 600 12px `#8a6a1f` a la derecha. Debajo, resumen 12.5px `#5d6470` con el vencimiento más próximo en `<strong>`. Toda la card es link a Vencimientos.

### 3. Movimientos
Misma cabecera de período + toggle de rango **Día / Semana / Mes** (pills: contenedor `border: 1px solid #ddd5c2; border-radius: 999px; padding: 3px; background: #faf7ef`; pill activa fondo `#3d5a80` texto `#faf7ef` weight 600; inactivas IBM Plex Mono 12px `#5d6470`), navegación de período ‹ hoy ›, filtros por tipo y categoría (selects con el estilo del campo Buscar), y tabla completa:
- Header de tabla: IBM Plex Mono 10.5px uppercase `letter-spacing: .08em` `#8a8677`, `border-bottom: 2px solid #ddd5c2`.
- Filas: `padding: 10px 14px`, separador `1px solid #e7e0cf`, hover `background: #f0ead9`.
- Columnas: Fecha (mono 12px) / Descripción / Tipo·Categoría (pill outline: mono 10.5px uppercase, `border: 1px solid`, radius 999px, `padding: 3px 8px`; ingreso borde+texto `#476442`, gasto `#a04a34`) / Monto (mono 600, derecha) / Acciones (editar/eliminar, iconos 16px `#8a8677`, visibles on-hover).
- KPIs del rango filtrado arriba de la tabla (mismas cards que Inicio).
- Acciones de la pantalla actual que se conservan: **Actualizar, Importar, + Nueva** — como botones secundarios (borde `#ddd5c2`, fondo `#fff`) salvo "+ Nueva" que usa el estilo primario verde.
- En mobile (<860px) las filas colapsan a cards apiladas (ver patrón en `datos-ejemplo.html`).

### 4. Vencimientos
Tabla igual a Movimientos con columnas Vence / Descripción / Categoría / Monto / Estado. Pills de estado: pendiente en dorado (`#8a6a1f` texto, borde `#e0c98a`), pagado en verde. Fechas "a confirmar" en itálica `#8a8677`. Total pendiente como KPI dorado arriba. Acción por fila: "marcar pagado".

### 5. Objetivos
Grid de cards de objetivo (card estándar): nombre Fraunces 600 17px, monto objetivo/actual IBM Plex Mono, barra de progreso (8px, track `#e7e0cf`, fill `#5a7d52`, radius 999px), fecha meta mono 11px. Estado vacío: mensaje itálico `#8a8677` "Sin objetivos activos" + botón secundario "Crear objetivo".

### 6. Inversiones
Una pantalla con **tabs internos** (mismo componente toggle de pills): CEDEARs · Dólar · Monedas. Cada tab conserva la funcionalidad actual del sistema, restyled: tablas con el patrón de Movimientos, valores mono, verde/rojo `#476442`/`#a04a34` para variaciones.

### 7. Ajustes
Lista vertical de secciones (cards estándar): Widgets del dashboard (los toggles actuales), Modo de balance (Mensual/Acumulado — componente toggle), Proveedor de IA, Categorías (CRUD), Reportar problema. Toggles tipo switch: track 36×20px radius 999px, off `#d8d6cf`, on `#5a7d52`, thumb blanco 16px.

## Interactions & Behavior
- **Navegación**: los 6 ítems de la barra superior cambian de vista; el ítem activo usa la pill oscura. Sin sidebar.
- **Toggle Día/Semana/Mes**: filtra KPIs, gráficos y tablas (lógica ya existente en `datos-ejemplo.html`: día = fecha de hoy; semana = lunes→hoy; mes = mes en curso). Transición de la pill activa: `background .15s, color .15s`.
- **Hover**: filas de tabla `#f0ead9`; nav pills `rgba(0,0,0,.05)`; botón primario oscurece a `#4f7047`; links `#3d5a80` → subrayado.
- **"+ Nuevo"**: abre el formulario/modal existente de nueva transacción, restyled (modal fondo `#faf7ef`, overlay `rgba(32,36,44,.4)`, radius 12px).
- **Estados vacíos**: texto itálico 13.5px `#8a8677` (ej. "Sin movimientos en esta vista.") — nunca un área en blanco.
- **Balance negativo**: el valor de Resultado cambia a `#a04a34` y el subtexto explica el ratio gastos/ingresos ("gastos 136% de ingresos").
- **Loading**: skeletons con fondo `#e7e0cf` animado, radius del componente que reemplazan.
- **Responsive** (<860px): grids colapsan a 1 columna; nav superior colapsa a wordmark + menú; tablas → cards apiladas.
- **Sin componentes React pesados nuevos**: el dueño pidió explícitamente un frontend liviano; preferir HTML/CSS del design system del codebase, gráficos en SVG simple (como en `datos-ejemplo.html`), sin librerías de charts pesadas.

## State Management
Reutilizar el estado existente del sistema. Lo que la UI necesita:
- `periodo` (YYYY-MM) y `hoy` (YYYY-MM-DD); navegación ‹ › de período.
- `range: 'day' | 'week' | 'month'` para el toggle.
- `movimientos[]` `{fecha, tipo, descripcion, categoria, monto}` y `vencimientos[]` `{desc, monto, vence, categoria, pagado}` — mismo esquema que el bloque `DATA` de `datos-ejemplo.html`.
- Derivados: totales de ingresos/gastos/balance, saldo acumulado, agrupación por categoría, total pendiente y próximo vencimiento.
- `cotizacionUSD` para la equivalencia del saldo.
- Config de widgets/IA/modo balance: persiste como hoy, se edita desde Ajustes.

## Design Tokens
Colores (tema Papel):
- Fondos: página `#f4f0e6` · superficie/card `#faf7ef` · superficie elevada/inputs `#ffffff` · destacado dorado `#fdf6e3`.
- Bordes: estándar `#ddd5c2` · sutil/dashed `#e7e0cf` · doble regla de cabecera `#cfc6ae` · dorado `#e0c98a`.
- Texto: principal `#20242c` · secundario `#5d6470` · terciario/labels `#8a8677`.
- Acentos: verde (ingresos/primario) `#5a7d52`, texto verde `#476442` · arcilla (gastos) `#b35a42`, texto rojo `#a04a34` · azul (info/período) `#3d5a80` · dorado (pendiente) `#e9c46a`, texto dorado `#8a6a1f` · violeta (aux) `#8a6fa0` · gris (aux) `#9aa2ad`.
- Nav activa / botones oscuros: `#20242c` con texto `#f4f0e6`.

Tipografía:
- **Fraunces** (Google Fonts, opsz 9..144; 400/600/700) — títulos y nombres de sección. Escala: 42px (título de período), 20px (wordmark), 17px (títulos de card), 15px (títulos menores).
- **Work Sans** (400/500/600) — cuerpo y UI. Escala: 13.5px (base), 13px (botones/nav), 12.5px (leyendas), 12px (subtextos), 11px (labels uppercase).
- **IBM Plex Mono** (400/500/600) — TODOS los valores numéricos, fechas, tags, badges y eyebrows. Escala: 24px (KPIs), 23–27px (destacados), 12–13px (tablas), 10–11px (tags/labels).
- Line-height base: 1.45. Los montos siempre con separador de miles es-AR (`Intl.NumberFormat('es-AR')`) y signo explícito `+` / `−`.

Espaciado: base 4px; padding de cards 16–20px; gaps de grid 12–16px; padding de página 28px 34px; `max-width` de contenido 1100px.
Radios: 6px (inputs/botones), 8px (cards), 10px (paneles grandes), 999px (pills/badges/barras).
Sombras: **ninguna** — la profundidad se logra solo con bordes y contraste de fondos (parte de la estética papel).

## Assets
- Sin imágenes ni íconos externos. El wordmark es tipográfico. Si se conservan íconos en nav/acciones, usar el set de íconos existente del codebase en 16px, color `#8a8677` (inactivo) / `#20242c` (activo).
- Fuentes vía Google Fonts o self-hosted: Fraunces, Work Sans, IBM Plex Mono.

## Files
- `reference-papel.html` — referencia visual del dashboard Papel (estática, abrir en navegador).
- `datos-ejemplo.html` — sistema de reporte actual con datos reales de julio 2026: esquema `DATA`, lógica de filtros día/semana/mes, formato de moneda, charts SVG y patrón responsive de tablas→cards.
