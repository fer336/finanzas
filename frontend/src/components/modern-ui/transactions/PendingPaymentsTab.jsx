import PropTypes from 'prop-types';
import { Check } from 'lucide-react';
import {
  PENDING_PAYMENT_STATUS,
  compareLocalDateOnly,
  daysUntilLocalDate,
  derivePendingPaymentStatus,
  formatLocalDateDisplay,
  normalizePendingPaymentDueDates,
  parseLocalDateOnly,
} from '../../../utils/pendingPaymentStatus';
import { getPaymentType } from '../../../utils/pendingPaymentTypes';
import { formatCurrencyTotals, getUnpaidPayments, sumByCurrency } from '../../../utils/pendingPaymentSummary';

const GROUP_ORDER = ['Vencidos', 'En mora', 'Próximos 7 días', 'Más adelante', 'Fecha a confirmar'];

const buildRow = (payment) => {
  const { firstDueDate } = normalizePendingPaymentDueDates(payment);
  const status = derivePendingPaymentStatus(payment);
  let group = 'Más adelante';
  if (status === PENDING_PAYMENT_STATUS.OVERDUE) group = 'Vencidos';
  else if (status === PENDING_PAYMENT_STATUS.IN_ARREARS) group = 'En mora';
  else if (!parseLocalDateOnly(firstDueDate)) group = 'Fecha a confirmar';
  else if (daysUntilLocalDate(firstDueDate) <= 6) group = 'Próximos 7 días';

  return {
    raw: payment,
    id: payment.id || payment.Id,
    nombre: payment.nombre || payment.Nombre || 'Sin nombre',
    monto: parseFloat(payment.monto || payment.Monto || 0),
    moneda: payment.moneda || payment.Moneda || 'ARS',
    dueDate: firstDueDate,
    status,
    group,
    tipoInfo: getPaymentType(payment),
  };
};

const describeDue = (row) => {
  if (!parseLocalDateOnly(row.dueDate)) return 'Fecha a confirmar';
  const date = formatLocalDateDisplay(row.dueDate);
  const days = daysUntilLocalDate(row.dueDate);
  if (days < 0) return `Venció el ${date} · hace ${Math.abs(days)} ${Math.abs(days) === 1 ? 'día' : 'días'}`;
  if (days === 0) return `Vence hoy · ${date}`;
  if (days === 1) return `Vence mañana · ${date}`;
  return `Vence el ${date} · en ${days} días`;
};

const toneClassName = (status) => {
  if (status === PENDING_PAYMENT_STATUS.OVERDUE) return 'text-destructive';
  if (status === PENDING_PAYMENT_STATUS.IN_ARREARS) return 'text-warning';
  return 'text-muted-foreground';
};

const PendingPaymentsTab = ({ payments = [], formatAmount, onPay, onGoToDueDates }) => {
  const rows = getUnpaidPayments(payments).map(buildRow);
  const groups = GROUP_ORDER
    .map((title) => ({
      title,
      rows: rows
        .filter((r) => r.group === title)
        .sort((a, b) => compareLocalDateOnly(a.dueDate, b.dueDate)),
    }))
    .filter((g) => g.rows.length > 0);

  const total = formatCurrencyTotals(sumByCurrency(rows), formatAmount);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-primary-soft bg-primary-surface px-4 py-3">
        <p className="min-w-0 flex-1 basis-72 text-sm leading-relaxed text-foreground">
          Acá van <strong>todos los pagos que todavía no hiciste</strong>: facturas, colegio, actividades, seguros, lo que sea.
          Cuando los pagás, pasan a tus movimientos.
        </p>
        {onGoToDueDates && (
          <button
            type="button"
            onClick={onGoToDueDates}
            className="min-h-11 rounded-md px-2 text-sm font-semibold text-primary underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-ring"
          >
            Administrar en Vencimientos →
          </button>
        )}
      </div>

      {rows.length === 0 ? (
        <div className="flex items-center justify-center rounded-md border border-border bg-card py-10">
          <p className="text-[13.5px] italic text-muted-foreground">No tenés pagos pendientes. ¡Todo al día!</p>
        </div>
      ) : (
        <>
          <p role="status" className="text-sm text-muted-foreground">
            Te falta pagar <span className="font-mono font-semibold text-foreground">{total}</span> · {rows.length} {rows.length === 1 ? 'pago' : 'pagos'}
          </p>
          <div className="overflow-hidden rounded-md border border-border bg-card">
            {groups.map((group) => (
              <section key={group.title}>
                <h2 className="border-t border-border bg-secondary px-4 py-2.5 text-sm font-semibold text-foreground first:border-t-0">{group.title}</h2>
                <ul>
                  {group.rows.map((row) => (
                    <li key={row.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border px-4 py-3">
                      <div className="min-w-0 flex-1 basis-52">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[15px] font-semibold text-foreground">{row.nombre}</span>
                          <span className="rounded-full bg-primary-surface px-2.5 py-0.5 text-[11.5px] font-semibold text-foreground">{row.tipoInfo.shortLabel}</span>
                        </div>
                        <p className={`mt-0.5 text-[12.5px] ${toneClassName(row.status)}`}>{describeDue(row)}</p>
                      </div>
                      <span className="font-mono text-[15px] font-semibold text-foreground">
                        {formatCurrencyTotals(sumByCurrency([row]), formatAmount)}
                      </span>
                      {onPay && (
                        <button
                          type="button"
                          onClick={() => onPay(row.raw)}
                          aria-label={`Registrar pago de ${row.nombre}`}
                          className="flex min-h-11 items-center gap-1.5 rounded-md border border-primary bg-card px-3.5 text-[13px] font-semibold text-primary transition-colors hover:bg-primary-surface focus-visible:outline focus-visible:outline-ring"
                        >
                          <Check className="h-4 w-4" aria-hidden="true" />
                          Registrar pago
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

PendingPaymentsTab.propTypes = {
  payments: PropTypes.array,
  formatAmount: PropTypes.func.isRequired,
  onPay: PropTypes.func,
  onGoToDueDates: PropTypes.func,
};

export default PendingPaymentsTab;
