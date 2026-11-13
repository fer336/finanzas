import { cleanup, fireEvent, render, screen, within, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ModernTransactionsView from './ModernTransactionsView';
import { useIsMobile } from '../../../hooks/use-mobile';

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
  fecha: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`,
  descripcion: 'Seguro del auto',
  tipo: 'gasto',
  monto: 1200,
  categoria: 'Auto',
};

describe('ModernTransactionsView document actions', () => {
  beforeEach(() => {
    useIsMobile.mockReturnValue(false);
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

  it('discloses filters, removes individual chips and sorts supplied records', () => {
    const records = [transactionBase, { ...transactionBase, id: 2, descripcion: 'Salario', tipo: 'ingreso', categoria: 'Trabajo', monto: 5000 }];
    render(<ModernTransactionsView transactions={records} />);
    expect(screen.getByText('Más filtros')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Más filtros'));
    fireEvent.change(screen.getByLabelText('Tipo'), { target: { value: 'gasto' } });
    expect(screen.queryByRole('button', { name: 'Ver detalle de Salario' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Quitar filtro Tipo: Gastos' }));
    fireEvent.change(screen.getByLabelText('Ordenar por'), { target: { value: 'amount' } });
    const rows = screen.getAllByRole('row');
    expect(within(rows[1]).getByText('Salario')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Buscar movimientos'), { target: { value: 'auto' } });
    expect(screen.queryByRole('button', { name: 'Ver detalle de Salario' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Quitar filtro Búsqueda: auto' }));
    expect(screen.getByRole('button', { name: 'Ver detalle de Salario' })).toBeInTheDocument();
  });

  it('retains search, sorting and page when closing detail and delegates edit/delete unchanged', async () => {
    const records = Array.from({ length: 16 }, (_, i) => ({ ...transactionBase, id: i + 1, descripcion: `Seguro ${i + 1}` }));
    const onEditTransaction = vi.fn();
    const onDeleteTransaction = vi.fn();
    render(<ModernTransactionsView transactions={records} onEditTransaction={onEditTransaction} onDeleteTransaction={onDeleteTransaction} />);
    fireEvent.change(screen.getByLabelText('Buscar movimientos'), { target: { value: 'Seguro' } });
    fireEvent.click(screen.getByText('Más filtros'));
    fireEvent.change(screen.getByLabelText('Ordenar por'), { target: { value: 'amount' } });
    fireEvent.click(screen.getByRole('button', { name: 'Página siguiente' }));
    const trigger = screen.getByRole('button', { name: 'Ver detalle de Seguro 16' });
    fireEvent.click(trigger);
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar' }));
    expect(screen.getByLabelText('Buscar movimientos')).toHaveValue('Seguro');
    expect(screen.getByLabelText('Ordenar por')).toHaveValue('amount');
    expect(screen.getByText(/Página 2 de 2/)).toBeInTheDocument();
    await waitFor(() => expect(trigger).toHaveFocus());
    fireEvent.click(trigger);
    fireEvent.click(screen.getByRole('button', { name: 'Editar movimiento' }));
    expect(onEditTransaction).toHaveBeenCalledWith(records[15]);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    fireEvent.click(trigger);
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar movimiento…' }));
    expect(onDeleteTransaction).toHaveBeenCalledWith(records[15]);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('preserves period modes, category filtering and header callbacks on mobile', () => {
    useIsMobile.mockReturnValue(true);
    const previous = new Date();
    previous.setDate(1);
    previous.setMonth(previous.getMonth() - 1);
    const older = { ...transactionBase, id: 2, descripcion: 'Anterior', fecha: `${previous.getFullYear()}-${String(previous.getMonth() + 1).padStart(2, '0')}-01` };
    const onNewTransaction = vi.fn(), onBulkUpload = vi.fn(), onExportCSV = vi.fn();
    render(<ModernTransactionsView transactions={[transactionBase, older]} {...{ onNewTransaction, onBulkUpload, onExportCSV }} />);
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Nueva' }));
    fireEvent.click(screen.getByRole('button', { name: 'Importar' }));
    fireEvent.click(screen.getByRole('button', { name: 'Exportar CSV' }));
    expect(onNewTransaction).toHaveBeenCalledOnce();
    expect(onBulkUpload).toHaveBeenCalledOnce();
    expect(onExportCSV).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByRole('button', { name: 'Mes anterior' }));
    expect(screen.getByRole('button', { name: 'Ver detalle de Anterior' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'hoy' }));
    fireEvent.click(screen.getByRole('button', { name: 'Día' }));
    expect(screen.getByRole('button', { name: 'Ver detalle de Seguro del auto' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Semana' }));
    expect(screen.getByRole('button', { name: 'Ver detalle de Seguro del auto' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Mes' }));
    fireEvent.click(screen.getByRole('button', { name: 'Acumulado' }));
    expect(localStorage.getItem('tx_view_mode')).toBe('accumulated');
    fireEvent.click(screen.getByText('Más filtros'));
    fireEvent.change(screen.getByLabelText('Categoría'), { target: { value: 'Auto' } });
    fireEvent.click(screen.getByRole('button', { name: 'Quitar filtro Categoría: Auto' }));
    expect(screen.getByLabelText('Categoría')).toHaveValue('all');
  });

  it('sorts dates locally and retains the category-object and alternate-date contracts', () => {
    const month = transactionBase.fecha.slice(0, 7);
    render(<ModernTransactionsView transactions={[
      { ...transactionBase, fecha: `${month}-01`, descripcion: 'Primero' },
      { ...transactionBase, id: 2, fecha: undefined, FechaTransaccion: `${month}-02T00:00:00`, descripcion: 'Segundo', categoria: { nombre: 'Salud' } },
      { ...transactionBase, id: 3, fecha: 'invalid', descripcion: 'Sin fecha' },
    ]} />);
    expect(within(screen.getAllByRole('row')[1]).getByText('Segundo')).toBeInTheDocument();
    expect(screen.queryByText('Sin fecha')).not.toBeInTheDocument();
    fireEvent.click(screen.getByText('Más filtros'));
    fireEvent.change(screen.getByLabelText('Categoría'), { target: { value: 'Salud' } });
    expect(screen.queryByRole('button', { name: 'Ver detalle de Primero' })).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Buscar movimientos'), { target: { value: 'no existe' } });
    expect(screen.getByText('Sin movimientos en esta vista.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Quitar filtro Búsqueda: no existe' }));
    expect(screen.getByRole('button', { name: 'Ver detalle de Segundo' })).toBeInTheDocument();
  });

  it('preserves accumulated month selection, annual scope and the nonempty selection invariant', () => {
    localStorage.setItem('tx_view_mode', 'accumulated');
    localStorage.setItem('tx_selected_months', '[1]');
    const year = new Date().getFullYear();
    render(<ModernTransactionsView transactions={[
      { ...transactionBase, fecha: `${year}-01-01`, descripcion: 'Enero actual' },
      { ...transactionBase, id: 2, fecha: `${year - 1}-01-01`, descripcion: 'Año pasado' },
      { ...transactionBase, id: 3, fecha: `${year}-12-01`, descripcion: 'Diciembre actual' },
    ]} />);
    expect(screen.queryByText('Año pasado')).not.toBeInTheDocument();
    expect(screen.queryByText('Diciembre actual')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Enero' }));
    fireEvent.click(screen.getByRole('button', { name: 'Ene' }));
    expect(localStorage.getItem('tx_selected_months')).toBe('[1]');
    fireEvent.click(screen.getByRole('button', { name: 'Todos' }));
    expect(screen.getByRole('button', { name: 'Ver detalle de Diciembre actual' })).toBeInTheDocument();
    expect(screen.queryByText('Año pasado')).not.toBeInTheDocument();
  });

  it('hands mobile detail receipt preview to the existing modal', () => {
    useIsMobile.mockReturnValue(true);
    render(<ModernTransactionsView transactions={[{ ...transactionBase, comprobante: 'https://s3.qeva.xyz/facturas/seguro.pdf' }]} />);
    fireEvent.click(screen.getByRole('button', { name: 'Ver detalle de Seguro del auto' }));
    fireEvent.click(screen.getByRole('button', { name: 'Ver comprobante', exact: true }));
    expect(screen.queryByRole('dialog', { name: 'Detalle del movimiento' })).not.toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: /vista previa del comprobante/i })).toBeInTheDocument();
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
