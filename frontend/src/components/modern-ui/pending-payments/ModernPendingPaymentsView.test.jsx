import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ModernPendingPaymentsView from './ModernPendingPaymentsView';

const FROZEN_NOW = new Date(2026, 6, 15, 12, 0, 0);
let pendingPaymentsData = [];
let isMobile = false;

vi.mock('../../../hooks/useFinancialData', () => ({
  QUERY_KEYS: { pendingPayments: 'pendingPayments' },
  usePendingPayments: () => ({ data: pendingPaymentsData, isLoading: false, error: null }),
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

const currentMonthDate = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');

  return `${year}-${month}-20`;
};

const createPaymentBase = () => ({
  id: 'pending-payment-1',
  nombre: 'Seguro del auto',
  descripcion: 'Póliza mensual',
  monto: 1200,
  moneda: 'ARS',
  fechavencimiento: currentMonthDate(),
  estado: 'pendiente',
});

const renderView = (payment, mobile = false) => {
  pendingPaymentsData = Array.isArray(payment) ? payment : [payment];
  isMobile = mobile;
  return render(<ModernPendingPaymentsView />);
};

describe('ModernPendingPaymentsView document actions', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(FROZEN_NOW);

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
    pendingPaymentsData = [];
    isMobile = false;
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('shows the desktop Eye and opens the valid comprobante when url_pdf is invalid', () => {
    renderView({
      ...createPaymentBase(),
      url_pdf: 'https://evil.example/invoice.pdf',
      comprobante: 'https://s3.qeva.xyz/facturas/comprobantes/receipt.pdf',
    });

    fireEvent.click(screen.getByRole('button', { name: /ver documento de seguro del auto/i }));

    expect(screen.getByRole('dialog', { name: /documento de seguro del auto/i })).toBeInTheDocument();
    expect(screen.getByTitle('receipt.pdf')).toHaveAttribute('src', 'https://s3.qeva.xyz/facturas/comprobantes/receipt.pdf');
  });

  it('shows the mobile Eye action when url_pdf is empty and comprobante is valid', () => {
    renderView({
      ...createPaymentBase(),
      url_pdf: '',
      comprobante: 'https://s3.qeva.xyz/facturas/comprobantes/mobile.pdf',
    }, true);

    fireEvent.click(screen.getByRole('button', { name: /ver documento de seguro del auto/i }));

    expect(screen.getByRole('dialog', { name: /documento de seguro del auto/i })).toBeInTheDocument();
    expect(screen.getByTitle('mobile.pdf')).toHaveAttribute('src', 'https://s3.qeva.xyz/facturas/comprobantes/mobile.pdf');
  });

  it('shows the Eye for urlPdf aliases and JSON upload wrappers', () => {
    renderView({
      ...createPaymentBase(),
      urlPdf: JSON.stringify({ data: { file_url: 'https://s3.qeva.xyz/facturas/wrapped.pdf' } }),
    });

    fireEvent.click(screen.getByRole('button', { name: /ver documento de seguro del auto/i }));

    expect(screen.getByTitle('wrapped.pdf')).toHaveAttribute('src', 'https://s3.qeva.xyz/facturas/wrapped.pdf');
  });

  it('does not show an Eye action when every document candidate is invalid', () => {
    renderView({
      ...createPaymentBase(),
      url_pdf: 'https://evil.example/invoice.pdf',
      comprobante: 'javascript:alert(1)',
    });

    expect(screen.queryByRole('button', { name: /ver documento de seguro del auto/i })).not.toBeInTheDocument();
  });

  it('shows pending total as all unpaid and a separate overdue card', () => {
    renderView([
      { ...createPaymentBase(), id: 'pending', nombre: 'Pendiente', monto: 1000, fechavencimiento: '2026-07-20' },
      { ...createPaymentBase(), id: 'arrears', nombre: 'En mora', monto: 2000, fechavencimiento: '2026-07-10', segunda_fecha_vencimiento: '2026-07-15' },
      { ...createPaymentBase(), id: 'overdue', nombre: 'Vencido', monto: 3000, fechavencimiento: '2026-07-10', segunda_fecha_vencimiento: '2026-07-14' },
      { ...createPaymentBase(), id: 'paid', nombre: 'Pagado', monto: 4000, fechavencimiento: '2026-07-10', estado: 'pagado' },
    ]);

    expect(screen.getByText('Total pendiente')).toBeInTheDocument();
    expect(screen.getByText('$6.000')).toBeInTheDocument();
    expect(screen.getAllByText('Vencidos').length).toBeGreaterThan(0);
    expect(screen.getByText('$3.000')).toBeInTheDocument();
    expect(screen.getByText(/3 sin pagar · 1 en mora/i)).toBeInTheDocument();
  });

  it('filters pending, en mora, vencidos, and paid by derived temporal status', () => {
    renderView([
      { ...createPaymentBase(), id: 'pending', nombre: 'Pendiente activo', fechavencimiento: '2026-07-20' },
      { ...createPaymentBase(), id: 'arrears', nombre: 'Servicio en mora', fechavencimiento: '2026-07-10', segunda_fecha_vencimiento: '2026-07-15' },
      { ...createPaymentBase(), id: 'overdue', nombre: 'Factura vencida', fechavencimiento: '2026-07-10', segunda_fecha_vencimiento: '2026-07-14' },
      { ...createPaymentBase(), id: 'paid', nombre: 'Factura pagada', fechavencimiento: '2026-07-10', estado: 'pagado' },
    ]);

    expect(screen.getByText('Pendiente activo')).toBeInTheDocument();
    expect(screen.queryByText('Servicio en mora')).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/filtrar vencimientos por estado/i), { target: { value: 'en_mora' } });
    expect(screen.getByText('Servicio en mora')).toBeInTheDocument();
    expect(screen.queryByText('Factura vencida')).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/filtrar vencimientos por estado/i), { target: { value: 'vencido' } });
    expect(screen.getByText('Factura vencida')).toBeInTheDocument();
    expect(screen.queryByText('Factura pagada')).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/filtrar vencimientos por estado/i), { target: { value: 'pagado' } });
    expect(screen.getByText('Factura pagada')).toBeInTheDocument();
  });

  it('renders first and second dates with amber arrears and red overdue treatments on desktop', () => {
    renderView([
      { ...createPaymentBase(), id: 'arrears', nombre: 'Servicio en mora', fechavencimiento: '2026-07-10', segunda_fecha_vencimiento: '2026-07-15' },
      { ...createPaymentBase(), id: 'overdue', nombre: 'Factura vencida', fechavencimiento: '2026-07-10', segunda_fecha_vencimiento: '2026-07-14' },
    ]);

    fireEvent.change(screen.getByLabelText(/filtrar vencimientos por estado/i), { target: { value: 'all' } });

    const arrearsRow = screen.getByText('Servicio en mora').closest('tr');
    const overdueRow = screen.getByText('Factura vencida').closest('tr');

    expect(within(arrearsRow).getByText('En mora')).toBeInTheDocument();
    expect(within(arrearsRow).getByText('2° 15/7/2026')).toBeInTheDocument();
    expect(arrearsRow.className).toContain('bg-[#f5ebcf]');

    expect(within(overdueRow).getByText('Vencido')).toBeInTheDocument();
    expect(within(overdueRow).getByText('2° 14/7/2026')).toBeInTheDocument();
    expect(overdueRow.className).toContain('bg-[#f9e1e3]');
  });

  it('renders mobile red overdue and amber arrears card treatments', () => {
    renderView([
      { ...createPaymentBase(), id: 'arrears', nombre: 'Servicio en mora', fechavencimiento: '2026-07-10', segunda_fecha_vencimiento: '2026-07-15' },
      { ...createPaymentBase(), id: 'overdue', nombre: 'Factura vencida', fechavencimiento: '2026-07-10', segunda_fecha_vencimiento: '2026-07-14' },
    ], true);

    fireEvent.change(screen.getByLabelText(/filtrar vencimientos por estado/i), { target: { value: 'all' } });

    expect(screen.getByText('Servicio en mora').closest('.rounded-md').className).toContain('bg-[#f5ebcf]');
    expect(screen.getByText('Factura vencida').closest('.rounded-md').className).toContain('bg-[#f9e1e3]');
  });
});
