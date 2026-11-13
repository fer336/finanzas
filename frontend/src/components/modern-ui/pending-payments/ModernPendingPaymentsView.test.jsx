import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ModernPendingPaymentsView from './ModernPendingPaymentsView';

const FROZEN_NOW = new Date(2026, 6, 15, 12, 0, 0);
let pendingPaymentsData = [];
let isMobile = false;
let amountsVisible = true;

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
    formatAmount: (value, options = {}) => {
      if (!amountsVisible) return '****';
      return `${options.currency === false ? '' : '$'}${Number(value).toLocaleString('es-AR')}`;
    },
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
    amountsVisible = true;
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it.each([false, true])('groups local-date boundaries without treating arrears or paid as overdue (mobile=%s)', (mobile) => {
    renderView([
      { ...createPaymentBase(), id: 'today', nombre: 'Hoy', fechavencimiento: '2026-07-15' },
      { ...createPaymentBase(), id: 'six', nombre: 'Día seis', fechavencimiento: '2026-07-21' },
      { ...createPaymentBase(), id: 'seven', nombre: 'Día siete', fechavencimiento: '2026-07-22' },
      { ...createPaymentBase(), id: 'overdue', nombre: 'Ayer', fechavencimiento: '2026-07-14' },
      { ...createPaymentBase(), id: 'arrears', nombre: 'Segunda fecha hoy', fechavencimiento: '2026-07-14', segunda_fecha_vencimiento: '2026-07-15' },
      { ...createPaymentBase(), id: 'paid', nombre: 'Ya pagado', fechavencimiento: '2026-07-14', estado: 'pagado' },
    ], mobile);
    fireEvent.change(screen.getByLabelText(/filtrar vencimientos por estado/i), { target: { value: 'all' } });
    const groupOf = (name) => screen.getByText(name).closest('[data-urgency-group]').dataset.urgencyGroup;
    expect(groupOf('Hoy')).toBe('Próximos 7 días');
    expect(groupOf('Día seis')).toBe('Próximos 7 días');
    expect(groupOf('Día siete')).toBe('Más adelante');
    expect(groupOf('Ayer')).toBe('Vencidos');
    expect(groupOf('Segunda fecha hoy')).toBe('En mora');
    expect(groupOf('Ya pagado')).toBe('Pagados');
  });

  it.each([false, true])('keeps detail read-only and payment preparation deliberate (mobile=%s)', (mobile) => {
    pendingPaymentsData = [createPaymentBase()];
    isMobile = mobile;
    const onMarcarPagado = vi.fn();
    render(<ModernPendingPaymentsView onMarcarPagado={onMarcarPagado} />);
    fireEvent.click(screen.getByRole('button', { name: 'Ver detalle de Seguro del auto' }));
    const dialog = screen.getByRole('dialog', { name: 'Detalle del vencimiento' });
    expect(within(dialog).getByText('Póliza mensual')).toBeInTheDocument();
    expect(onMarcarPagado).not.toHaveBeenCalled();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Registrar pago' }));
    expect(onMarcarPagado).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ id: 'pending-payment-1', monto: 1200 }));
  });

  it('retains pagination before grouping and resets the page when searching', () => {
    renderView(Array.from({ length: 21 }, (_, index) => ({ ...createPaymentBase(), id: String(index), nombre: `Servicio ${index}` })));
    expect(screen.queryByText('Servicio 20')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Página siguiente' }));
    expect(screen.getByText('Servicio 20')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Buscar vencimientos'), { target: { value: 'Servicio 0' } });
    expect(screen.getByText('Servicio 0')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Página siguiente' })).not.toBeInTheDocument();
  });

  it('groups across a local month boundary in accumulated mode', () => {
    vi.setSystemTime(new Date(2026, 6, 30, 23, 30));
    renderView([
      { ...createPaymentBase(), id: 'six', nombre: 'Dentro del rango', fechavencimiento: '2026-08-05' },
      { ...createPaymentBase(), id: 'seven', nombre: 'Fuera del rango', fechavencimiento: '2026-08-06' },
    ]);
    fireEvent.click(screen.getByRole('button', { name: 'Acumulado' }));
    expect(screen.getByText('Dentro del rango').closest('[data-urgency-group]')).toHaveAttribute('data-urgency-group', 'Próximos 7 días');
    expect(screen.getByText('Fuera del rango').closest('[data-urgency-group]')).toHaveAttribute('data-urgency-group', 'Más adelante');
  });

  it('does not sum different currencies into an ARS amount', () => {
    renderView([
      { ...createPaymentBase(), id: 'ars', monto: 1000 },
      { ...createPaymentBase(), id: 'usd', moneda: 'USD', monto: 50 },
    ]);
    expect(screen.getAllByText('$1.000 · USD 50')).toHaveLength(2);
    expect(screen.queryByText('$1.050')).not.toBeInTheDocument();
  });

  it('honors amount privacy in summaries, rows and read-only detail', () => {
    amountsVisible = false;
    renderView(createPaymentBase());
    fireEvent.click(screen.getByRole('button', { name: 'Ver detalle de Seguro del auto' }));
    expect(within(screen.getByRole('dialog')).getByText('****')).toBeInTheDocument();
    expect(screen.queryByText(/1[.,]?200/)).not.toBeInTheDocument();
  });

  it('retains month filtering and supports aliases and unknown dates in accumulated mode', () => {
    renderView([
      { Id: 'alias', Nombre: 'Alias agosto', Monto: 45, FechaVencimiento: '2026-08-01', Estado: 'pendiente' },
      { ...createPaymentBase(), id: 'unknown', nombre: 'Sin fecha', fechavencimiento: null },
    ]);
    expect(screen.queryByText('Alias agosto')).not.toBeInTheDocument();
    expect(screen.queryByText('Sin fecha')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Acumulado' }));
    expect(screen.getByText('Alias agosto').closest('[data-urgency-group]')).toHaveAttribute('data-urgency-group', 'Más adelante');
    expect(screen.getByText('Sin fecha').closest('[data-urgency-group]')).toHaveAttribute('data-urgency-group', 'Fecha a confirmar');
  });

  it('never offers registration from an already paid detail', () => {
    renderView({ ...createPaymentBase(), estado: 'pagado' });
    fireEvent.change(screen.getByLabelText(/filtrar vencimientos por estado/i), { target: { value: 'pagado' } });
    fireEvent.click(screen.getByRole('button', { name: 'Ver detalle de Seguro del auto' }));
    expect(within(screen.getByRole('dialog')).queryByRole('button', { name: 'Registrar pago' })).not.toBeInTheDocument();
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
