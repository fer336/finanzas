import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import TransactionDetailPanel from './TransactionDetailPanel';
import { AmountVisibilityProvider, useAmountVisibility } from '../../../contexts/AmountVisibilityContext';

function VisibilityControl() {
  const { toggleAmountVisibility } = useAmountVisibility();
  return <button onClick={toggleAmountVisibility}>Alternar privacidad</button>;
}

const transaction = { id: 41, descripcion: 'Consulta médica', tipo: 'gasto', monto: 1250, moneda: 'ARS' };
const mount = (overrides = {}) => render(
  <AmountVisibilityProvider>
    <VisibilityControl />
    <TransactionDetailPanel transaction={transaction} categoryName="Salud" displayDate="12/6/2026" onClose={vi.fn()} {...overrides} />
  </AmountVisibilityProvider>
);

afterEach(cleanup);

describe('TransactionDetailPanel', () => {
  it('shows supplied data and delegates actions with the original record', () => {
    const onEdit = vi.fn(), onDelete = vi.fn(), onClose = vi.fn();
    mount({ onEdit, onDelete, onClose });
    expect(screen.getByRole('dialog', { name: 'Detalle del movimiento' })).toBeInTheDocument();
    expect(screen.getByText('Consulta médica')).toBeInTheDocument();
    expect(screen.getByText('Salud')).toBeInTheDocument();
    expect(screen.getByText('12/6/2026')).toBeInTheDocument();
    expect(screen.getByText(/1.250/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Editar movimiento' }));
    expect(onEdit).toHaveBeenCalledWith(transaction);
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar movimiento…' }));
    expect(onDelete).toHaveBeenCalledWith(transaction);
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it.each([
    ['original USD amount', { monto: 12.5, monto_ars: 15000, moneda: 'USD' }, 'USD', '12,50'],
    ['explicit zero', { monto: 0, monto_ars: 15000, moneda: 'USD' }, 'USD', '0,00'],
    ['ARS fallback amount', { monto: null, monto_ars: 15000, moneda: 'USD' }, 'ARS', '15.000,00'],
    ['missing currency', { monto: 12.5, moneda: undefined }, 'ARS', '12,50'],
  ])('labels the %s without conversion or losing zero', (_name, fields, currency, amount) => {
    mount({ transaction: { ...transaction, ...fields } });
    expect(screen.getByText(`Gasto · ${currency}`)).toBeInTheDocument();
    expect(screen.getByText(`− ${currency} ${amount}`)).toBeInTheDocument();
  });

  it('supports Escape dismissal without invoking mutations', () => {
    const onClose = vi.fn(), onEdit = vi.fn(), onDelete = vi.fn();
    mount({ onClose, onEdit, onDelete });
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    expect(onClose).toHaveBeenCalledOnce();
    expect(onEdit).not.toHaveBeenCalled();
    expect(onDelete).not.toHaveBeenCalled();
  });

  it('rejects unsafe receipts and previews only normalized documents', () => {
    const onPreview = vi.fn();
    const { unmount } = mount({ transaction: { ...transaction, comprobante: 'javascript:alert(1)' }, onPreview });
    expect(screen.queryByRole('button', { name: 'Ver comprobante' })).not.toBeInTheDocument();
    unmount();
    mount({ transaction: { ...transaction, comprobante: 'https://s3.qeva.xyz/facturas/salud.pdf' }, onPreview });
    fireEvent.click(screen.getByRole('button', { name: 'Ver comprobante' }));
    expect(onPreview).toHaveBeenCalledWith('https://s3.qeva.xyz/facturas/salud.pdf');
  });

  it('respects amount privacy in the detail without exposing raw amounts elsewhere', () => {
    mount({ transaction: { ...transaction, moneda: 'USD' } });
    // The provider is shared with the list; change it before reopening detail in production.
    // fireEvent exercises the same context update while the focus-trapped panel is mounted.
    fireEvent.click(screen.getByText('Alternar privacidad', { selector: 'button' }));
    expect(screen.queryByText(/1.250/)).not.toBeInTheDocument();
    expect(screen.getByText('− USD ****')).toBeInTheDocument();
  });

  it('uses fullscreen mobile structure and never invents missing fields', () => {
    mount({ transaction: { ...transaction, monto: 0 }, isMobile: true });
    expect(screen.getByRole('dialog')).toHaveClass('w-full');
    expect(screen.getByText('No informado')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Editar movimiento' })).not.toBeInTheDocument();
  });
});
