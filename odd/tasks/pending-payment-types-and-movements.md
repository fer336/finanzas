# Pending payment types + Movimientos "Pagos pendientes" tab
Branch: `feat/pending-payment-types` from `origin/main` (7f63bdf). Delivery: single branch, no PR/push/release until the user asks. Runner: frontend Vitest (`npm test -- --reporter=dot`), ESLint (`npm run lint`), Vite (`npm run build`), all from `frontend/`.

## Specs

- S1: User request verbatim: "ahora me gustaria que uses /design para rediseñar "Movimientos" "Vencimientos" me gustaria que movimientos se entienda bien y que se pueda agregar una opcion que sea, PAGOS PENDIENTES, porque pasa que no siempre son pagos de facturas, puede haber algun pago de otra cosa como gimnasia de mi hija, o pago de seguro, pago de comedor me explico".
- S2: Approval verbatim: "me gusta implementalo". Accepted design: Claude artifact https://claude.ai/artifact/JNui7SVUKjRqXaPHowojNW (boards Main = Movimientos, Vencimientos, MovimientosMovil, NuevoPago). Implement in the existing React stack with real data and existing tokens, not fixture data.
- S3: Payment type. `PagoPendiente.tipo` is free text (`String(50)`), no migration. Types stored as slugs: `servicio`, `colegio`, `actividad`, `seguro`, `otro`. Legacy values (`factura`, `alquiler`, unknown/empty) map to Servicios/Otros for display. Labels: "Servicio o factura", "Colegio y comedor", "Actividad", "Seguro", "Otro". The new-payment form says it need not be an invoice.
- S4: Vencimientos: type filter chips (Todos, Servicios, Colegio y comedor, Actividades, Seguros, Otros) with counts, combinable with the existing status/month/search filters; type chip shown on each row.
- S5: Movimientos: tabs Todos / Ingresos / Gastos / Pagos pendientes (with counts); a "Por pagar" summary entry that opens the pending tab; the pending tab lists unpaid payments grouped Vencidos / Esta semana / Más adelante with "Registrar pago" reusing the existing pay flow, plus link to Vencimientos.
- S6: Preserve existing APIs, callbacks, CRUD, currencies, amount visibility, receipts, loans and status/date helpers. No backend change, no new dependencies.

## Tasks

- T1 [S3,S4] pending; route: inline; surface: new `frontend/src/utils/pendingPaymentTypes.js` + test, StitchPendingPaymentModal type selector + test.
- T2 [S4] pending; route: inline; surface: ModernPendingPaymentsView type chips/row chip + test.
- T3 [S5] pending; route: inline; surface: ModernTransactionsView tabs + pending tab + test, MissionControl wiring.
- T4 [S1-S6] pending; route: inline; full suite, lint, build, docs (`docs/ux-due-dates.md`, `docs/ux-transactions.md`).

## Log

- L1 (2026-11-13): "ahora me gustaria que uses /design para rediseñar "Movimientos" "Vencimientos" me gustaria que movimientos se entienda bien y que se pueda agregar una opcion que sea, PAGOS PENDIENTES, porque pasa que no siempre son pagos de facturas, puede haber algun pago de otra cosa como gimnasia de mi hija, o pago de seguro, pago de comedor me explico"
- L2 (2026-11-13): "me gusta implementalo"
- Route: all tasks inline (no independent units with disjoint surfaces needing parallel writers; shared files).
