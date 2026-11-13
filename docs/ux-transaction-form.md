# Formulario progresivo de transacciones

## T3 · S1, S3 y S4

`frontend/src/components/ModernTransactionForm.jsx` mantiene el formulario real compartido y su interfaz `isOpen`, `onClose`, `onSuccess`, `editingTransaction`. No modifica el contrato de edición de movimientos.

- Primero: tipo, descripción, monto/moneda, fecha, categoría y método de pago. Descripción y monto conservan sus reglas originales; no se agregan requisitos de fecha, categoría o método.
- «Más opciones» usa `details` nativo para notas, objetivo/aporte/uso, crédito, recurrencia y comprobantes. Se abre al editar datos avanzados existentes. Cerrarlo no borra valores ni excluye campos del payload.
- La conversión USD permanece junto a moneda/monto, con el mismo servicio, campos y cálculo existentes. No se redefine el significado financiero de los importes ni `tasa_cambio`.
- La validación reemplaza `alert` por mensajes asociados mediante `aria-describedby`, `aria-invalid`, resumen vivo y foco en el primer error. Los errores de guardado o creación de categoría conservan los valores y ofrecen reintento sin exponer detalles internos del servidor.
- El bloqueo síncrono por referencia evita envíos duplicados mientras está pendiente la mutación. Guardar queda habilitado para poder explicar los campos faltantes.
- La altura acotada, el contenido desplazable y el pie no desplazable mantienen Guardar/Cancelar disponibles. En móvil se reduce el padding y ambos botones comparten el ancho. Se usan tokens Kanagawa activos; no hay estilos globales ni dependencias nuevas.

## Persistencia conservada

Se reutilizan hidratación, `transaccionesApi.create/update`, signos ingreso/gasto, campos opcionales, callbacks y creación del próximo vencimiento. Editar no reactiva recurrencia. La creación rápida de categorías mantiene su payload anterior. `FileUpload` conserva `prefix="transacciones"`, límite de 10 MB y callbacks. Una envoltura cancela solamente la acción nativa de envío de sus botones sin `type`, sin impedir los manejadores de subida/quitar. Los enlaces de comprobantes siguen pasando por `normalizeDocumentPreviewUrl`.

## Evidencia y límites

Las pruebas renderizan el formulario público con API simulada: campos requeridos, montos vacíos/cero/negativos, ausencia de mutaciones al rechazar, payload completo de ingreso/gasto/edición, hidratación avanzada, recurrencia mensual de fin de mes, adjuntos, moneda USD, errores/reintento de categoría, errores/reintento de guardado y bloqueo de duplicados.

```sh
cd frontend && npm test -- src/components/ModernTransactionForm.test.jsx --reporter=dot
cd frontend && npx --no-install eslint src/components/ModernTransactionForm.jsx src/components/ModernTransactionForm.test.jsx
```

No se verificaron navegador, teclado virtual, contraste medido ni persistencia contra servidor real. La subida se simula en este unit test; no constituye prueba de sus endpoints. La suite completa y build quedan a cargo de integración. Las skills históricas referidas por `frontend/AGENTS.md` fueron reportadas no disponibles por el explorador; la dirección aprobada reemplaza su antigua indicación de glassmorphism.

### Límites previos conservados

El formulario existente no ofrece una entrada visible para `montoUsd`, aunque conserva el efecto de conversión; el payload USD continúa usando `amount` en `monto`/`monto_ars` y `tasa_cambio: 1`. La creación rápida de categoría consulta `formData.transactionType` en lugar del estado `transactionType`. No se corrigen esas reglas dentro de esta unidad de presentación; requieren revisión funcional separada.
