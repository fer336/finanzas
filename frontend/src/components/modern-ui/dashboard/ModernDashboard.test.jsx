import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ModernDashboard from './ModernDashboard';
import { AmountVisibilityProvider, useAmountVisibility } from '../../../contexts/AmountVisibilityContext';

vi.mock('../../../hooks/use-mobile', () => ({ useIsMobile: () => false }));
vi.mock('../../../hooks/useFinancialData', () => ({
  useBalanceNeto: vi.fn(() => ({ data: { balance_neto: 9000, balance_disponible: 8000, apartado_objetivos: 1000 } })),
}));
import { useBalanceNeto } from '../../../hooks/useFinancialData';

const now = new Date();
const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
const transactions = [
  { id: 1, tipo: 'ingreso', monto: 1000, descripcion: 'Sueldo', categoria: 'Trabajo', fecha: `${month}-02T12:00:00` },
  { id: 2, tipo: 'gasto', monto: 250, descripcion: 'Compra', categoria: 'Comida', fecha: `${month}-01T12:00:00` },
];
function PrivacyControl() {
  const { toggleAmountVisibility } = useAmountVisibility();
  return <button onClick={toggleAmountVisibility}>Privacidad</button>;
}
function setup(props = {}) {
  return render(<AmountVisibilityProvider><PrivacyControl /><ModernDashboard transactions={transactions} dollarQuotes={[{ casa: 'blue', venta: 2 }]} {...props} /></AmountVisibilityProvider>);
}
afterEach(() => { cleanup(); vi.clearAllMocks(); localStorage.clear(); });

describe('ModernDashboard', () => {
  it('prioriza el balance mensual real y revela el seguimiento sin perder sus controles', () => {
    setup();
    const summary = screen.getByRole('region', { name: 'Resumen financiero del período' });
    expect(within(summary).getByText('Balance del período')).toBeInTheDocument();
    expect(within(summary).getByText(/750/)).toBeInTheDocument();
    expect(within(summary).getByText(/No es saldo bancario/)).toBeInTheDocument();
    const disclosure = screen.getByText('Más seguimiento');
    expect(disclosure.closest('details')).not.toHaveAttribute('open');
    fireEvent.click(disclosure);
    expect(disclosure.closest('details')).toHaveAttribute('open');
    fireEvent.click(screen.getByRole('button', { name: 'Acumulado' }));
    expect(screen.getByText('Balance acumulado disponible')).toBeInTheDocument();
    expect(screen.getByText(/8\.000/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Ingresos', exact: true }));
    expect(screen.getByRole('heading', { name: 'Ingresos por categoría' })).toBeInTheDocument();
    expect(screen.getByText('Trabajo')).toBeInTheDocument();
  });

  it('conserva navegación, selector mensual y acción de creación', () => {
    const onNavigate = vi.fn();
    const onNewTransaction = vi.fn();
    setup({ onNavigate, onNewTransaction });
    fireEvent.click(screen.getByRole('button', { name: /Nuevo movimiento/ }));
    expect(onNewTransaction).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByRole('button', { name: /Ver movimientos/ }));
    expect(onNavigate).toHaveBeenLastCalledWith('transactions-full');
    fireEvent.click(screen.getByRole('button', { name: /próximos vencimientos/i }));
    expect(onNavigate).toHaveBeenLastCalledWith('pending-payments-full');
    expect(localStorage.getItem('vencimientos_section')).toBe('vencimientos');
    fireEvent.click(screen.getByText('Más seguimiento'));
    fireEvent.click(screen.getByRole('button', { name: /préstamos/i }));
    expect(localStorage.getItem('vencimientos_section')).toBe('prestamos');
    expect(screen.getByRole('button', { name: 'Mes siguiente' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Mes anterior' }));
    expect(useBalanceNeto).toHaveBeenLastCalledWith(expect.not.stringMatching(month));
    expect(screen.getByText('Sin movimientos en esta vista.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Hoy' }));
    expect(useBalanceNeto).toHaveBeenLastCalledWith(month);
    expect(screen.getByText('Sueldo')).toBeInTheDocument();
  });

  it('oculta todos los importes, incluso equivalentes USD y seguimiento', () => {
    setup();
    fireEvent.click(screen.getByText('Privacidad'));
    fireEvent.click(screen.getByText('Más seguimiento'));
    fireEvent.click(screen.getByRole('button', { name: 'Acumulado' }));
    expect(screen.queryByText(/4\.000/)).not.toBeInTheDocument();
    expect(screen.queryByText(/8\.000/)).not.toBeInTheDocument();
    expect(screen.queryByText(/750/)).not.toBeInTheDocument();
    expect(screen.getAllByText(/\*\*\*\*/).length).toBeGreaterThan(3);
  });

  it('conserva importes negativos, pagos activos, préstamos y evolución con datos reales', () => {
    const future = new Date(now.getFullYear(), now.getMonth() + 1, 10);
    const dueDate = `${future.getFullYear()}-${String(future.getMonth() + 1).padStart(2, '0')}-10`;
    setup({
      transactions: [{ id: 3, tipo: 'gasto', monto: 1200, descripcion: 'Alquiler', fecha: `${month}-01T12:00:00` }],
      pendingPayments: [
        { id: 1, nombre: 'Electricidad', monto: 300, fecha_vencimiento: dueDate, estado: 'pendiente' },
        { id: 2, nombre: 'Pago completado', monto: 999, fecha_vencimiento: dueDate, estado: 'pagado' },
      ],
      prestamos: [{ id: 1, nombre_fuente: 'Préstamo familiar', monto_prestado: 400, monto_a_devolver: 450, estado: 'pendiente', fecha_vencimiento: dueDate }],
    });
    const summary = screen.getByRole('region', { name: 'Resumen financiero del período' });
    const balance = within(summary).getByRole('heading', { name: 'Balance del período' }).parentElement;
    expect(within(balance).getByText(/−.*1\.200/)).toBeInTheDocument();
    expect(screen.getByText('Electricidad')).toBeInTheDocument();
    expect(screen.queryByText('Pago completado')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /próximos vencimientos/i })).toHaveTextContent('(1)');
    fireEvent.click(screen.getByText('Más seguimiento'));
    const evolution = screen.getByRole('table', { name: 'Ingresos y gastos registrados por mes' });
    expect(within(evolution).getByText(/1\.200/)).toBeInTheDocument();
    expect(within(evolution).getAllByRole('row')).toHaveLength(7);
    expect(screen.getByText(/Préstamo familiar/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Mes anterior' }));
    fireEvent.click(screen.getByRole('button', { name: 'Mes siguiente' }));
    expect(useBalanceNeto).toHaveBeenLastCalledWith(month);
  });

  it('mantiene estados vacíos y de carga sin acciones engañosas', () => {
    const { rerender } = setup({ transactions: [] });
    expect(screen.getByText('Sin movimientos en esta vista.')).toBeInTheDocument();
    expect(screen.getByText('Sin vencimientos pendientes.')).toBeInTheDocument();
    rerender(<AmountVisibilityProvider><ModernDashboard loading /></AmountVisibilityProvider>);
    expect(screen.queryByRole('button', { name: /Nuevo movimiento/ })).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveAccessibleName('Cargando resumen');
  });
});
