import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { afterEach, expect, it, vi } from 'vitest';
import MobileDashboardHome from './MobileDashboardHome';
import { AmountVisibilityProvider } from '../../../contexts/AmountVisibilityContext';

vi.mock('../../../hooks/useFinancialData', () => ({ useBalanceNeto: () => ({ data: {} }) }));
afterEach(cleanup);

it('ofrece el mismo resumen y seguimiento accesible en móvil, conservando las rutas', () => {
  const onNavigate = vi.fn();
  const onNewTransaction = vi.fn();
  render(<AmountVisibilityProvider><MobileDashboardHome onNavigate={onNavigate} onNewTransaction={onNewTransaction} /></AmountVisibilityProvider>);
  expect(screen.getByRole('region', { name: 'Resumen financiero del período' })).toBeInTheDocument();
  expect(screen.getByText('Balance del período')).toBeInTheDocument();
  const disclosure = screen.getByText('Más seguimiento');
  expect(disclosure.closest('details')).not.toHaveAttribute('open');
  fireEvent.click(disclosure);
  expect(disclosure.closest('details')).toHaveAttribute('open');
  fireEvent.click(screen.getByRole('button', { name: 'Ingresos', exact: true }));
  expect(screen.getByText('Sin ingresos en esta vista.')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /Nuevo movimiento/ }));
  expect(onNewTransaction).toHaveBeenCalledOnce();
  fireEvent.click(screen.getByRole('button', { name: /Ver movimientos/ }));
  expect(onNavigate).toHaveBeenLastCalledWith('transactions-full');
  fireEvent.click(screen.getByRole('button', { name: /próximos vencimientos/i }));
  expect(onNavigate).toHaveBeenLastCalledWith('pending-payments-full');
});
