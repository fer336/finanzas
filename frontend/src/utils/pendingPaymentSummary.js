import { isPagoPaid } from './pendingPaymentStatus';

export function getUnpaidPayments(payments = []) {
  return (Array.isArray(payments) ? payments : []).filter((p) => !isPagoPaid(p));
}

// Totals are never mixed across currencies.
export function sumByCurrency(payments = []) {
  return payments.reduce((totals, p) => {
    const moneda = p.moneda || p.Moneda || 'ARS';
    const monto = parseFloat(p.monto || p.Monto || 0);
    totals[moneda] = (totals[moneda] || 0) + monto;
    return totals;
  }, {});
}

export function formatCurrencyTotals(totals, formatAmount) {
  const entries = Object.entries(totals);
  if (entries.length === 0) return formatAmount(0, { decimals: 0 });
  return entries
    .map(([moneda, monto]) => (moneda === 'ARS'
      ? formatAmount(monto, { decimals: 0 })
      : `${moneda} ${formatAmount(monto, { decimals: 0, currency: false })}`))
    .join(' · ');
}
