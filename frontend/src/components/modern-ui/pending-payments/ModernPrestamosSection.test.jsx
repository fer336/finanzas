import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ModernPrestamosSection from './ModernPrestamosSection';

let prestamosData = [];
let isMobile = false;

vi.mock('../../../hooks/useFinancialData', () => ({
  QUERY_KEYS: { prestamos: 'prestamos' },
  usePrestamos: () => ({ data: prestamosData, isLoading: false, error: null }),
}));

vi.mock('../../../hooks/useRefresh', () => ({
  useRefresh: () => ({ refresh: vi.fn(), isRefreshing: false }),
}));

vi.mock('../../../hooks/use-mobile', () => ({
  useIsMobile: () => isMobile,
}));

vi.mock('../../../contexts/AmountVisibilityContext', () => ({
  useAmountVisibility: () => ({
    formatAmount: (value) => `$${Number(value).toLocaleString('es-AR')}`,
  }),
}));

const createLoan = (overrides = {}) => ({
  id: 'loan-1',
  nombre_fuente: 'Ana',
  monto_prestado: 1000,
  monto_a_devolver: 1200,
  fecha_vencimiento: '2026-07-20',
  estado: 'pendiente',
  ...overrides,
});

const renderSection = (loans, mobile = false) => {
  prestamosData = loans;
  isMobile = mobile;
  return render(<ModernPrestamosSection />);
};

afterEach(() => {
  cleanup();
  prestamosData = [];
  isMobile = false;
});

describe('ModernPrestamosSection T1 interactions', () => {
  it('opens a safe receipt preview from a valid loan receipt', () => {
    renderSection([createLoan({ comprobante: 'https://s3.qeva.xyz/facturas/receipts/ana.pdf' })]);

    fireEvent.click(screen.getByRole('button', { name: 'Ver documento de Ana' }));

    expect(screen.getByRole('dialog', { name: /documento de ana/i })).toBeInTheDocument();
    expect(screen.getByTitle('ana.pdf')).toHaveAttribute('src', 'https://s3.qeva.xyz/facturas/receipts/ana.pdf');
  });

  it('keeps the document slot non-interactive for an invalid loan receipt', () => {
    renderSection([createLoan({ comprobante: 'javascript:alert(1)' })]);

    expect(screen.queryByRole('button', { name: 'Ver documento de Ana' })).not.toBeInTheDocument();
    expect(screen.getByTestId('payment-row-actions').children[0]).toHaveAttribute('aria-hidden', 'true');
  });

  it('omits Marcar pagado for paid loans', () => {
    renderSection([createLoan({ estado: 'pagado' })]);

    expect(screen.queryByRole('button', { name: /marcar pagado/i })).not.toBeInTheDocument();
  });

  it('uses cards instead of the table on mobile while preserving the loan array data', () => {
    renderSection([createLoan()], true);

    expect(screen.getByTestId('loan-card-loan-1')).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(screen.getByText('Ana')).toBeInTheDocument();
  });
});
