# Vencimientos: consulta y registro deliberado

T4 · S2, S3, S4 · Referencia visual: `design/finance-workflows-proposal/02-due-dates.html`.

## Lectura de urgencia

- Desktop conserva la tabla; mobile conserva tarjetas y controles táctiles de 44 px.
- El resumen incluye total pendiente, vencidos y próximos siete días. Respeta período y búsqueda, y cuenta solo vencimientos sin pagar. Los importes se separan por moneda, sin conversión implícita, y usan la preferencia de privacidad.
- “Próximos 7 días” incluye hoy y los seis días locales siguientes. El rango real aparece en pantalla; no significa semana calendario.
- Los encabezados identifican Vencidos, En mora, Próximos 7 días, Más adelante o Fecha a confirmar. Se añaden sobre tramos consecutivos de la página existente: no se reordena, repagina ni oculta ningún registro adicional. Pueden repetirse encabezados para preservar el orden cronológico.
- En mora no se convierte en vencido: la segunda fecha y el estado pagado siguen las reglas de `pendingPaymentStatus.js`. Una fecha desconocida no se presenta como futura.
- La lista muestra solo vencimientos sin pagar (pendientes, en mora y vencidos); los pagados no se listan. No hay filtro de estado ni selector de mes: la única opción es «Todos los vencimientos» (por defecto, cualquier mes) o «Vencimientos del mes» (mes calendario actual, según la primera fecha). Se mantienen búsqueda, orden, veinte registros por página, pestaña de préstamos y callbacks CRUD existentes.

## Consulta y pago

“Ver detalle” abre una consulta de descripción, importe, moneda, fechas, categoría y estado. No llama al registro de pago. “Registrar pago” prepara el formulario existente mediante el callback del contenedor; todavía no modifica datos.

El formulario mantiene importe del vencimiento (no editable, como antes), fecha, categoría, método, notas y comprobante opcional. “Revisar registro” valida fecha con el helper local, categoría/método disponibles, identidad, importe positivo finito y estado sin pagar. La revisión muestra los valores elegidos, incluidos centavos, y permite volver a editar. Solo “Confirmar registro” sube el comprobante y llama a `onConfirm` con el mismo payload anterior. No envía dinero ni realiza un débito.

Errores de subida o registro se anuncian sin éxito ficticio. Durante preparación/subida/guardado se bloquean acciones duplicadas y cierre. Los diálogos reutilizan Radix, foco contenido y restauración de foco, con superficies semánticas Kanagawa claro/oscuro; no hay CSS compartido nuevo.

## Contratos preservados y hallazgos

1. `ModernMissionControl.handleMarkPendingPaymentAsPaid` solo abre el formulario; la mutación real está en `handleConfirmPendingPayment`. No fue necesario cambiar el contenedor ni endpoints.
2. El payload sigue conteniendo `item_id`, `monto`, `moneda`, `fecha_pago`, `categoria_id`, `metodo_pago_id`, `notas` y `comprobante`.
3. La normalización HEIC y la subida multipart a `/api/files/upload?prefix=comprobantes` permanecen; la normalización y seguridad de las vistas previas documentales tampoco cambian.
4. El formateador global utiliza ARS por defecto. Para otras monedas y la revisión se utiliza `currency: false` y un código explícito, sin cambiar ese helper compartido.
5. Las skills referenciadas por `frontend/AGENTS.md` fueron reportadas como ausentes por la exploración del padre. El diseño Kanagawa aprobado prevalece sobre sus sugerencias antiguas de glassmorphism.

## Verificación y límites

RED: 13 fallos esperados por agrupación/detalle/revisión ausentes; 21 pruebas previas pasaron. GREEN inicial: 34 pruebas; triangulación: 40 pruebas en los tres archivos requeridos, incluyendo límites locales y de mes, estado pagado/mora, privacidad/monedas, filtros/paginación, URL seguras, payload exacto y rechazo de subida/registro.

No se realizó prueba visual en navegador, ni se instalaron navegadores. La suite completa y build corresponden al seam T5 del padre. El slice supera las 400 líneas orientativas al incluir los dos componentes, pruebas de mutación/recibos y esta documentación; no se comprimió código para reducirlo. Solo estos cinco archivos forman la unidad reversible; no se modificaron helpers de negocio, diseño, tracking ni archivos de otros escritores.

## Tipos de pago

No todo vencimiento es una factura: también hay colegio y comedor, actividades (gimnasia), seguros y otros. El tipo se guarda en la columna existente `tipo` (texto libre, sin migración) con los valores `servicio`, `colegio`, `actividad`, `seguro` y `otro`. `frontend/src/utils/pendingPaymentTypes.js` define etiquetas y la lectura retrocompatible: `factura` se muestra como Servicio o factura; `alquiler`, vacío o desconocido como Otro.

- El formulario pregunta “¿Qué tipo de pago es?” con las cinco opciones; el valor por defecto es Servicio o factura.
- La vista de Vencimientos ya no filtra por tipo ni muestra el tipo en las filas. Los chips se arman con las categorías presentes en la lista sin pagar (`frontend/src/utils/pendingPaymentCategories.js`): Todos más un chip por categoría con su contador, ordenados por cantidad. Cada vencimiento cae en el chip de la categoría que muestra su fila; sin categoría va a «Sin categoría». Si la categoría elegida deja de aparecer, la selección vuelve a Todos.
