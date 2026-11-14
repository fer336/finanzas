import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useDashboardHomeData } from './useDashboardHomeData';

const formatAmount = (value) => `$${value}`;
vi.mock('../../../contexts/AmountVisibilityContext', () => ({
  useAmountVisibility: () => ({ formatAmount }),
}));

const transactions = [
  { id: 1, tipo: 'ingreso', monto_ars: 1000, fecha_transaccion: '2026-07-05' },
  { id: 2, tipo: 'gasto', monto_ars: 400, fecha_transaccion: '2026-07-10', categoria: 'Comida' },
];
const pendingPayments = [];
const prestamos = [];
const dollarQuotes = [];

describe('useDashboardHomeData memoization', () => {
  it('returns the same derived data on a re-render with unchanged inputs', () => {
    const props = { transactions, pendingPayments, prestamos, dollarQuotes, mes: '2026-07' };
    const { result, rerender } = renderHook((p) => useDashboardHomeData(p), { initialProps: props });
    const first = result.current;

    rerender({ ...props });

    expect(result.current).toBe(first);
    expect(first.resultadoMes).toBe(600);
  });

  it('recomputes when the selected month changes', () => {
    const props = { transactions, pendingPayments, prestamos, dollarQuotes, mes: '2026-07' };
    const { result, rerender } = renderHook((p) => useDashboardHomeData(p), { initialProps: props });

    rerender({ ...props, mes: '2026-08' });

    expect(result.current.resultadoMes).toBe(0);
    expect(result.current.tituloMes).toMatch(/2026/);
  });
});
