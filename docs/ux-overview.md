# Inicio: tu mes, en claro

## Jerarquía del resumen

El inicio usa los datos reales de `useDashboardHomeData` y `useBalanceNeto`, sin cambiar APIs ni cálculos financieros. El balance principal es **ingresos menos gastos del período seleccionado**, no disponibilidad bancaria. Ingresos y gastos conservan sus signos, cantidades de movimientos y formato argentino; el resumen indica ARS explícitamente.

El selector permite retroceder, avanzar hasta el mes actual o volver a **Hoy**. **Nuevo movimiento** conserva `onNewTransaction`; **Ver movimientos** conserva la ruta `transactions-full`. Los vencimientos siguen siendo pendientes globales, no un subconjunto del mes consultado: se muestran el próximo confirmado y el total pendiente. El botón abre `pending-payments-full` con la sección `vencimientos`. Los pagos ya completados siguen excluidos por el hook existente.

## Seguimiento sin ruido

**Más seguimiento** es un `details` nativo, cerrado inicialmente y accesible por teclado. No elimina capacidades:

- **Mensual / Acumulado** mantiene la consulta del balance disponible acumulado, equivalencia USD y apartado en objetivos, separada del balance mensual principal.
- **Gastos / Ingresos** mantiene categorías, porcentajes y dona.
- **Ver préstamos** conserva el mismo destino y selecciona la sección `prestamos`.
- **Evolución mensual** mantiene los seis meses de ingresos y gastos como tabla con barras comparativas y valores legibles, sin depender de un tooltip. El mes en curso se identifica como parcial, sin proyección.

La privacidad procede del contexto existente. También se oculta la equivalencia USD; las barras de evolución no se dibujan mientras los importes están ocultos. Las preferencias locales de consulta se conservan al cerrar y abrir el seguimiento.

## Presentación y accesibilidad

`ModernDashboard` selecciona el espaciado según el breakpoint existente; `MobileDashboardHome` comparte la presentación y los hooks para evitar divergencias. La grilla financiera colapsa a una columna; los movimientos permiten ajuste de texto e importes sin truncarlos. El contenido usa superficies y bordes Kanagawa, sin CSS compartido nuevo, dependencias ni glassmorphism. Los controles tienen área mínima de 44px, foco visible y estados seleccionados anunciados con `aria-pressed`. El estado de carga anuncia “Cargando resumen” y usa skeletons que respetan movimiento reducido.

Ejemplos de interpretación:

- Ingresos de ARS 1.000 y gastos de ARS 250 muestran balance mensual de + ARS 750, aunque el backend informe ARS 8.000 disponibles acumulados.
- Un período con solo un gasto de ARS 1.200 muestra − ARS 1.200; no se reemplaza por el saldo acumulado.
- Sin movimientos o vencimientos se muestran indicaciones explícitas, no paneles vacíos.

## Verificación y límites

Las pruebas de componentes públicos cubren resumen mensual, consulta acumulada, categorías, selector de mes, navegación, creación, privacidad, vencimientos activos, préstamos, evolución, carga y vacíos. La disposición y la semántica se verificaron por lectura de código y Testing Library; no se dispone de navegador ni se afirma fidelidad visual mediante capturas. La integración de navegación y la revisión visual en temas claro/oscuro quedan para el controlador.

Las referencias `skills/react-modern-ui.md`, `skills/modal-system.md`, `skills/recharts-data-viz.md` y `skills/context-api-patterns.md` mencionadas en `frontend/AGENTS.md` no están disponibles en el checkout. Se siguieron `PRODUCT.md`, `DESIGN.md`, `design/system.md` y la propuesta aprobada de inicio; la indicación antigua de glassmorphism no se aplicó.
