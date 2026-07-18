import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ModernTransactionsView from './ModernTransactionsView';

vi.mock('../../../hooks/useRefresh', () => ({
  useRefresh: () => ({ refresh: vi.fn(), isRefreshing: false }),
}));

vi.mock('../../../hooks/useFinancialData', () => ({
  QUERY_KEYS: { transactions: 'transactions', dashboardStats: 'dashboardStats' },
}));

vi.mock('../../../hooks/use-mobile', () => ({
  useIsMobile: vi.fn(() => false),
}));

vi.mock('../../../contexts/AmountVisibilityContext', () => ({
  useAmountVisibility: () => ({
    isAmountVisible: true,
    toggleAmountVisibility: vi.fn(),
    formatAmount: (value) => `$${Number(value).toLocaleString('es-AR')}`,
  }),
}));

const transactionBase = {
  id: 1,
  fecha: new Date().toISOString().slice(0, 10),
  descripcion: 'Seguro del auto',
  tipo: 'gasto',
  monto: 1200,
  categoria: 'Auto',
};

describe('ModernTransactionsView document actions', () => {
  beforeEach(() => {
    const store = new Map();
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key) => store.get(key) || null),
      setItem: vi.fn((key, value) => store.set(key, String(value))),
      removeItem: vi.fn((key) => store.delete(key)),
      clear: vi.fn(() => store.clear()),
    });
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('does not render the receipt preview action for unsafe URLs', () => {
    render(<ModernTransactionsView transactions={[{ ...transactionBase, comprobante: 'javascript:alert(1)' }]} />);

    expect(screen.queryByRole('button', { name: /ver comprobante/i })).not.toBeInTheDocument();
  });

  it('opens the shared preview modal for allowed receipt URLs', () => {
    render(<ModernTransactionsView transactions={[{ ...transactionBase, comprobante: 'https://s3.qeva.xyz/facturas/seguro.pdf' }]} />);

    fireEvent.click(screen.getByRole('button', { name: /ver comprobante/i }));

    expect(screen.getByRole('dialog', { name: /vista previa del comprobante/i })).toBeInTheDocument();
    expect(screen.getByTitle('seguro.pdf')).toHaveAttribute('src', 'https://s3.qeva.xyz/facturas/seguro.pdf');
  });
});
