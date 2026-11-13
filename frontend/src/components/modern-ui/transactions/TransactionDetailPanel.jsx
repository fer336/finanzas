import PropTypes from 'prop-types';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '../../ui/sheet';
import { Button } from '../../ui/button';
import { useAmountVisibility } from '../../../contexts/AmountVisibilityContext';
import { normalizeDocumentPreviewUrl } from '../../../utils/documentPreviewUrl';

/** Read-only context; mutations still belong to the existing shared workflows. */
export default function TransactionDetailPanel({
  transaction, categoryName, displayDate, isMobile = false,
  onClose, onEdit, onDelete, onPreview, returnFocusRef,
}) {
  const { formatAmount } = useAmountVisibility();
  const description = transaction.descripcion || transaction.Descripcion || 'Sin descripción';
  const income = transaction.tipo === 'ingreso';
  const amount = Math.abs(transaction.monto ?? transaction.monto_ars ?? 0);
  const currency = transaction.monto != null ? (transaction.moneda || 'ARS') : 'ARS';
  const receipt = normalizeDocumentPreviewUrl(
    transaction.archivo_adjunto || transaction.ArchivoAdjunto
      || transaction.comprobante || transaction.Comprobante || ''
  );
  const method = transaction.metodo_pago_nombre || transaction.MetodosPago?.nombre
    || transaction.metodo_pago?.nombre
    || (typeof transaction.metodo_pago === 'string' ? transaction.metodo_pago : '')
    || 'No informado';

  const invoke = (callback) => {
    onClose();
    callback(transaction);
  };

  return (
    <Sheet open onOpenChange={(open) => { if (!open) onClose(); }}>
      <SheetContent
        side="right"
        className={`${isMobile ? 'w-full max-w-none sm:max-w-none' : 'w-full sm:max-w-[480px]'} overflow-y-auto bg-card p-5 shadow-none motion-reduce:animate-none motion-reduce:transition-none data-[state=open]:duration-150 data-[state=closed]:duration-150`}
        onCloseAutoFocus={(event) => {
          // There is no Radix Trigger: restore the actual row's detail control.
          // A mutation opens another modal, so never steal its focus on handoff.
          event.preventDefault();
          if (returnFocusRef?.current?.isConnected && !document.querySelector('[role="dialog"]')) {
            returnFocusRef.current.focus();
          }
        }}
      >
        <SheetHeader className="pr-8 text-left">
          <SheetTitle>Detalle del movimiento</SheetTitle>
          <SheetDescription>Consultá el registro sin perder los filtros ni tu lugar en la lista.</SheetDescription>
        </SheetHeader>
        <p className="mt-6 text-sm text-muted-foreground">{income ? 'Ingreso' : 'Gasto'} · {currency}</p>
        <p className="mt-2 font-mono text-3xl font-semibold tabular-nums">
          {income ? '+' : '−'} {currency} {formatAmount(amount, { currency: false })}
        </p>
        <h3 className="mt-6 break-words text-lg font-semibold">{description}</h3>
        <dl className="mt-4 divide-y divide-border text-sm">
          {[
            ['Fecha', displayDate], ['Categoría', categoryName], ['Método de pago', method],
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between gap-4 py-4">
              <dt className="text-muted-foreground">{label}</dt>
              <dd className="min-w-0 break-words text-right">{value}</dd>
            </div>
          ))}
        </dl>
        {receipt.isValid && onPreview && (
          <Button type="button" variant="outline" className="mt-4 min-h-11" onClick={() => onPreview(receipt.rawUrl)}>
            Ver comprobante
          </Button>
        )}
        <footer className="mt-6 flex flex-wrap gap-3 border-t border-border pt-5">
          {onEdit && <Button type="button" className="min-h-11 hover:bg-primary/90" onClick={() => invoke(onEdit)}>Editar movimiento</Button>}
          {onDelete && (
            <Button type="button" variant="outline" className="min-h-11 text-destructive" onClick={() => invoke(onDelete)}>
              Eliminar movimiento…
            </Button>
          )}
        </footer>
        {onDelete && <p className="mt-3 text-sm text-muted-foreground">Eliminar abre la confirmación existente antes de borrar el movimiento.</p>}
      </SheetContent>
    </Sheet>
  );
}

TransactionDetailPanel.propTypes = {
  transaction: PropTypes.object.isRequired,
  categoryName: PropTypes.string.isRequired,
  displayDate: PropTypes.string.isRequired,
  isMobile: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  onPreview: PropTypes.func,
  returnFocusRef: PropTypes.shape({ current: PropTypes.object }),
};
