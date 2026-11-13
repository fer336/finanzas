# Kanagawa Violet: design proposal system

Extracted from existing sources, not a new palette. Scope: standalone HTML design proposals only. Production files are unchanged.

## Colors

Source: `frontend/src/index.css`, `:root` and `.dark`. Alias values below are resolved to their existing literal colors.

| Token | Light | Dark | Role |
| --- | --- | --- | --- |
| `--background` | `#f7f3ea` | `#050717` | Page |
| `--surface` | `#fbf8f0` | `#0d0d1f` | Panel |
| `--surface-elevated` | `#f1eadf` | `#111124` | Inputs and hover |
| `--surface-violet` | `#e8dfef` | `#191727` | Selected surface |
| `--text-primary` | `#40384d` | `#f0e6e0` | Main text |
| `--text-secondary` | `#5c5063` | `#c9b9bd` | Secondary text |
| `--text-muted` | `#6f6074` | `#9a8ca0` | Supporting text |
| `--primary` | `#574582` | `#574582` | Primary action |
| `--primary-foreground` | `#f0e6e0` | `#f0e6e0` | Text on primary |
| `--primary-hover` | `#685496` | `#685496` | Primary hover |
| `--border` | `#cfc2b8` | `#393550` | Dividers and controls |
| `--ring` | `#957fb8` | `#957fb8` | Focus ring |
| `--success` | `#315c2d` | `#315c2d` | Success text |
| `--destructive` | `#822d33` | `#822d33` | Error text |
| `--accent` | `#efe1ba` | `#3f3544` | Warning surface |
| `--accent-foreground` | `#6b572f` | `#e6c384` | Warning text |

## Typography

Source: `frontend/tailwind.config.js`, fontFamily; `frontend/src/index.css`, body. The source declares Inter / Manrope, Cormorant Garamond and JetBrains Mono with system fallbacks. Standalone boards use only the existing `system-ui, sans-serif` and `ui-monospace, monospace` fallbacks, without downloads. Main UI and figures use system sans, tabular numerals on amounts. Source line-height: 1.45. Proposal hierarchy: 28px page title, 20px section heading, 16px body, 14px supporting text. These sizes are proposal layout choices, not claimed existing tokens.

## Spacing and layout

Source: `DESIGN.md`, Spacing & Layout. Base 4px; panel padding 16–20px; gaps 12–16px; page padding 28px 34px; content maximum 1100px. Proposals use this scale with larger 24/32px section separation. Breakpoint 768px from the Responsive guidance in `DESIGN.md`.

## Radius

Source: `frontend/tailwind.config.js`, borderRadius. Controls 6px, cards 8px, larger panels 10px. Source `DESIGN.md` allows 999px for pills.

## Shadows

Source: `frontend/tailwind.config.js`, boxShadow. glow, glow-lg and glass are all `none`. Boards use no decorative shadow.

## Component rules

1. Primary action: primary background, primary-foreground text, 6px radius. Secondary control: elevated surface, text-primary, border. Minimum proposed touch target 44px.
2. Panel: surface, 1px border, 10px radius, no nested decorative cards.
3. Table/list: tabular numerals, right-aligned amount, visible type labels, row dividers. Desktop table becomes a compact list at 768px.
4. Form: persistent label, field-level error text, summary with live announcement; preserve input after validation. Advanced options use native details.
5. Status: accent + accent-foreground for pending, success/destructive for meaningful text, never color alone.
6. Navigation: current page indicated with text and aria-current. Only implemented demo destinations are links; other planned areas are labelled, not fake buttons.
7. Focus: ring with visible outline. Native form controls and semantic landmarks. Reduced-motion disables transitions.
8. Amounts: explicit ARS, es-AR separators, signs and type labels. Balance means income minus expenses in the selected period, not account availability.

Sources: `DESIGN.md`, `PRODUCT.md`, `frontend/src/index.css`, `frontend/tailwind.config.js`.

## Source discrepancy

`frontend/src/themes/main-theme.css` defines an older neutral/emerald HSL theme. It is intentionally not merged with the active Kanagawa values: `DESIGN.md` identifies itself and `frontend/src/index.css` as sources of truth. No source files were changed.

## Inventory and limitations

16 semantic color roles × 2 modes, 2 system fallback font stacks, 4px spacing base, 4 radius values, 3 existing shadow aliases (all none), 8 component rules. This is a source-derived system, not a proposed starter. Layout and interaction changes are the proposal. No browser contrast or viewport test has been performed yet.
