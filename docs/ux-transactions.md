# Movimientos y detalle contextual

## Consultar sin perder el lugar

Movimientos usa los registros recibidos por `ModernTransactionsView`, sin datos de demostración ni nuevas consultas. La búsqueda por descripción o categoría y el período siguen visibles. **Más filtros** revela tipo, categoría y orden (fecha reciente o importe absoluto descendente). Los filtros de búsqueda, tipo y categoría aparecen como chips individuales que se pueden quitar sin restablecer los demás.

Desktop mantiene una tabla con importes alineados y acciones visibles; mobile conserva la lista. La descripción de cada movimiento es un botón accesible que abre **Detalle del movimiento**. La lista permanece montada: cerrar el panel conserva búsqueda, filtros, orden, meses seleccionados y página. El foco vuelve al botón de detalle mediante el ciclo de cierre de Radix. Si una eliminación reduce las páginas disponibles, la página visible se limita al último resultado disponible.

## Acciones existentes, sin reglas financieras nuevas

- Editar desde el detalle cierra el panel y llama `onEditTransaction` con el registro original. El formulario compartido sigue perteneciendo al controlador existente.
- Eliminar desde el detalle cierra el panel y llama `onDeleteTransaction`. Este callback abre la confirmación existente en `ModernMissionControl`; no se elimina directamente ni se agrega una segunda confirmación.
- Crear, importar, exportar y actualizar mantienen sus callbacks sin cambiar parámetros ni alcance. La exportación continúa siendo responsabilidad del controlador, no una nueva exportación local de resultados filtrados.
- Los comprobantes pasan por `normalizeDocumentPreviewUrl` tanto en las filas como en el detalle. Abrir un comprobante desde el detalle cierra ese panel antes de abrir `DocumentPreviewModal`, evitando dos trampas de foco simultáneas.
- El detalle usa `useAmountVisibility` con `formatAmount(..., { currency: false })` para conservar privacidad y separadores. Muestra el importe original `monto` con el código `moneda` (ARS si falta); solo si `monto` es nulo o ausente usa `monto_ars`, etiquetado ARS. El cero original se conserva mediante fallback nulo, sin sustituirlo por otro importe. Se mantienen valor absoluto y signo por tipo. No se agregan conversiones de moneda ni cálculos financieros, ni se cambian los importes de la lista existente.

## Contratos conservados

Se mantienen mensual/acumulado, selección múltiple de meses del año actual (nunca vacía), rango día/semana/mes, navegación de meses, preferencias locales y evento `headerScope:changed`. Día significa hoy; semana significa lunes de esta semana hasta hoy, dentro del período seleccionado. Las fechas siguen parseándose localmente y admiten los nombres de campos anteriores; las categorías mantienen sus variantes de texto y objeto. Los totales y la paginación siguen trabajando sobre el resultado filtrado.

El panel usa las instalaciones Radix de `ui/sheet`: nombre y descripción accesibles, bloqueo del scroll, trampa de foco y cierre con Escape. Se presenta al lateral en desktop y a pantalla completa en mobile, con tokens Kanagawa y sin cambios al CSS compartido.

## Verificación y límites

Las pruebas enfocadas cubren chips, búsqueda/tipo/categoría, ambos órdenes, selección anual de meses, rangos temporales, campos alternativos, callbacks, estado retenido, foco al cerrar, privacidad de importes y seguridad/preview de comprobantes en desktop y mobile. Las comprobaciones de estructura no sustituyen una inspección visual en navegador ni una auditoría de contraste.

T2 cubre S1 y S2 en movimientos/detalle y preserva los límites de S3. Para S4, comportamiento, pruebas y esta guía forman una sola unidad de revisión; no se realizan commits desde el escritor delegado. La extensión del archivo preexistente se conserva para evitar una refactorización ajena a esta unidad. Las skills antiguas referenciadas por `frontend/AGENTS.md` no están disponibles en `skills/`; prevalece el sistema Kanagawa aprobado de `DESIGN.md` y `design/system.md`.

## Pestañas y pagos pendientes

Movimientos suma pestañas Todos, Ingresos, Gastos y Pagos pendientes, con contadores. Los tres primeros reutilizan el filtro de tipo existente (el selector de “Más filtros” sigue sincronizado); sus contadores respetan período, búsqueda y categoría. “Pagos pendientes” (`PendingPaymentsTab`) lista solo los pagos sin pagar que recibe por la prop `pendingPayments`, agrupados como en Vencimientos (Vencidos, En mora, Próximos 7 días, Más adelante, Fecha a confirmar), con su tipo, el total por moneda sin mezclar divisas y el botón “Registrar pago”, que llama a `onPayPending` y reutiliza el flujo de pago existente. “Administrar en Vencimientos” llama a `onGoToDueDates`. Una tarjeta “Por pagar” en la lista abre la misma pestaña. `ModernMissionControl` conecta ambos callbacks; no hay cambios de backend ni de API.

Sin inspección visual en navegador: la verificación fue por pruebas de comportamiento, lint y build.
