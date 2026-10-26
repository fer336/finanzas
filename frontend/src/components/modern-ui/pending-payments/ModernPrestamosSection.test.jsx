import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ModernPrestamosSection from './ModernPrestamosSection';

let prestamosData = [];
let isMobile = false;
let usePrestamosCalls = [];

vi.mock('../../../hooks/useFinancialData', () => ({
  QUERY_KEYS: { prestamos: 'prestamos' },
  usePrestamos: (filters) => {
    usePrestamosCalls.push(filters);
    const visibleLoans = prestamosData.filter((loan) => {
      const search = filters?.search?.toLowerCase();
      const matchesSearch = !search || [loan.nombre_fuente, loan.notas].some((value) => value?.toLowerCase().includes(search));
      return matchesSearch && (!filters?.estado || loan.estado === filters.estado);
    });
    const offset = filters?.offset || 0;
    const limit = filters?.limit || 25;
    return {
      data: { list: visibleLoans.slice(offset, offset + limit), pageInfo: { totalRows: visibleLoans.length, isFirstPage: offset === 0, isLastPage: offset + limit >= visibleLoans.length } },
      isLoading: false,
      error: null,
    };
  },
}));

vi.mock('../../../hooks/useRefresh', () => ({ useRefresh: () => ({ refresh: vi.fn(), isRefreshing: false }) }));
vi.mock('../../../hooks/use-mobile', () => ({ useIsMobile: () => isMobile }));
vi.mock('../../../contexts/AmountVisibilityContext', () => ({ useAmountVisibility: () => ({ formatAmount: (value) => `$${value}` }) }));

const validReceipt = 'https://s3.qeva.xyz/facturas/comprobantes/prestamo.pdf';
const createLoan = (overrides = {}) => ({
  id: 'loan-1', nombre_fuente: 'Banco Nación', monto_prestado: 100, monto_a_devolver: 120,
  fecha_vencimiento: '2026-08-20', estado: 'pendiente', ...overrides,
});

afterEach(() => {
  cleanup();
  prestamosData = [];
  isMobile = false;
  usePrestamosCalls = [];
  vi.useRealTimers();
});

describe('ModernPrestamosSection actions and receipts', () => {
  it('opens a normalized valid Loan receipt and reserves the action slot for invalid URLs', () => {
    prestamosData = [createLoan({ id: 'valid', nombre_fuente: 'Con recibo', comprobante: validReceipt }), createLoan({ id: 'invalid', nombre_fuente: 'Sin recibo', comprobante: 'javascript:alert(1)' })];
    render(<ModernPrestamosSection />);
    const validActions = within(screen.getByText('Con recibo').closest('tr')).getByLabelText('Acciones de préstamo Con recibo');
    const invalidActions = within(screen.getByText('Sin recibo').closest('tr')).getByLabelText('Acciones de préstamo Sin recibo');
    expect(validActions.children[0].querySelector('button')).not.toBeNull();
    expect(invalidActions.children[0].querySelector('button')).toBeNull();
    fireEvent.click(within(validActions).getByRole('button', { name: 'Ver documento de Con recibo' }));
    expect(screen.getByRole('dialog', { name: /documento de con recibo/i })).toBeInTheDocument();
  });

  it('keeps action controls visible, separates mark-paid, and omits it for paid loans', () => {
    const onMarcarPagado = vi.fn();
    prestamosData = [createLoan({ id: 'pending', nombre_fuente: 'Pendiente' }), createLoan({ id: 'paid', nombre_fuente: 'Pagado', estado: 'pagado' })];
    render(<ModernPrestamosSection onMarcarPagado={onMarcarPagado} />);
    const pendingRow = screen.getByText('Pendiente').closest('tr');
    expect(within(pendingRow).getByRole('button', { name: 'Editar préstamo Pendiente' })).toBeVisible();
    fireEvent.click(within(pendingRow).getByRole('button', { name: /marcar préstamo pendiente como pagado/i }));
    expect(onMarcarPagado).toHaveBeenCalledWith(expect.objectContaining({ id: 'pending' }));
    fireEvent.change(screen.getByLabelText(/filtrar préstamos por estado/i), { target: { value: 'pagado' } });
    expect(screen.getByText('Pagado')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /marcar préstamo pagado como pagado/i })).not.toBeInTheDocument();
  });

  it('renders loan cards with operable actions on mobile', () => {
    isMobile = true;
    prestamosData = [createLoan({ comprobante: validReceipt })];
    render(<ModernPrestamosSection />);
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(screen.getByText('Banco Nación').closest('[data-loan-card]')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Editar préstamo Banco Nación' })).toBeVisible();
  });
});

describe('ModernPrestamosSection server filters', () => {
  it('defaults to Pending, supports Paid and All, and keeps Pending KPIs while browsing history', () => {
    prestamosData = [createLoan({ id: 'pending', nombre_fuente: 'Pendiente', monto_prestado: 100 }), createLoan({ id: 'paid', nombre_fuente: 'Pagado', estado: 'pagado', monto_prestado: 900 })];
    render(<ModernPrestamosSection />);
    expect(screen.getByText('Pendiente')).toBeInTheDocument();
    expect(screen.queryByText('Pagado')).not.toBeInTheDocument();
    expect(usePrestamosCalls).toContainEqual(expect.objectContaining({ estado: 'pendiente' }));
    fireEvent.change(screen.getByLabelText(/filtrar préstamos por estado/i), { target: { value: 'pagado' } });
    expect(screen.getByText('Pagado')).toBeInTheDocument();
    expect(screen.getByText('$100')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/filtrar préstamos por estado/i), { target: { value: 'all' } });
    expect(screen.getByText('Pendiente')).toBeInTheDocument();
    expect(screen.getByText('Pagado')).toBeInTheDocument();
    expect(usePrestamosCalls.at(-1)).not.toHaveProperty('estado');
  });

  it('debounces source and notes search, resets pagination, and provides next and previous pages', () => {
    vi.useFakeTimers();
    prestamosData = Array.from({ length: 26 }, (_, index) => createLoan({ id: `${index}`, nombre_fuente: `Fuente ${index}`, notas: index === 25 ? 'nota buscable' : null }));
    render(<ModernPrestamosSection />);
    fireEvent.click(screen.getByRole('button', { name: /página siguiente/i }));
    expect(usePrestamosCalls.at(-1)).toEqual(expect.objectContaining({ offset: 25 }));
    expect(screen.getByRole('button', { name: /página anterior/i })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/buscar préstamos por fuente y notas/i), { target: { value: 'buscable' } });
    act(() => vi.advanceTimersByTime(400));
    expect(usePrestamosCalls.at(-1)).toEqual(expect.objectContaining({ search: 'buscable', offset: 0 }));
    expect(screen.getByText('Fuente 25')).toBeInTheDocument();
  });
});
