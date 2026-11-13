import '@testing-library/jest-dom/vitest';
import { act, fireEvent, render, screen, waitFor, cleanup } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ModernTransactionForm from './ModernTransactionForm';
import api from '../services/api';

vi.mock('../services/api', () => ({ default: {
  transaccionesApi: { create: vi.fn(), update: vi.fn() },
  categoriasApi: { getAll: vi.fn(), create: vi.fn() },
  metodosPagoApi: { getAll: vi.fn() }, objetivosApi: { getActive: vi.fn() },
  monedasApi: { getAll: vi.fn() }, pagosPendientesApi: { create: vi.fn() },
} }));
vi.mock('../services/dolarService', () => ({
  default: { getAllCotizaciones: vi.fn().mockResolvedValue([]), convertirUsdToArs: vi.fn() },
  TIPOS_DOLAR: { blue: { id: 'blue', nombre: 'Blue' } },
}));
vi.mock('./FileUpload/FileUpload', () => ({ default: ({ onFileUploaded, onFileRemoved, currentFileUrl, prefix, maxSizeMB }) => (
  <div>
    <span>{currentFileUrl}</span>
    <button onClick={() => onFileUploaded({ url: '/uploads/receipt.pdf' })}>Adjuntar {prefix} {maxSizeMB}</button>
    <button onClick={onFileRemoved}>Quitar adjunto</button>
  </div>
) }));

const change = (label, value) => fireEvent.change(screen.getByLabelText(label), { target: { value } });
const save = () => fireEvent.click(screen.getByRole('button', { name: /^(Registrar|Guardar cambios)$/ }));
const advanced = () => screen.getByText(/Más opciones/).closest('details');
const payload = {
  descripcion: 'Alquiler', monto: 125, moneda: 'ARS', monto_ars: 125,
  fecha_transaccion: '2026-01-31', tipo: 'ingreso', notas: '', categoria_id: null,
  metodo_pago_id: null, objetivo_id: null, es_aporte_objetivo: true,
  es_credito: false, tasa_cambio: 1, archivo_adjunto: '',
};
async function open(props = {}) {
  const callbacks = { onClose: vi.fn(), onSuccess: vi.fn() };
  render(<ModernTransactionForm isOpen {...callbacks} {...props} />);
  await screen.findByRole('option', { name: 'ARS' });
  return callbacks;
}
function fill() {
  change('Descripción', ' Alquiler ');
  change('Monto', '125');
  change('Fecha', '2026-01-31');
}

beforeEach(() => {
  vi.clearAllMocks();
  api.categoriasApi.getAll.mockResolvedValue({ list: [{ id: 'cat', nombre: 'Hogar' }] });
  api.metodosPagoApi.getAll.mockResolvedValue({ list: [{ id: 'pay', nombre: 'Efectivo' }] });
  api.objetivosApi.getActive.mockResolvedValue([{ id: 'goal', nombre: 'Viaje', porcentaje_completado: 10 }]);
  api.monedasApi.getAll.mockResolvedValue([{ codigo: 'ARS' }, { codigo: 'USD' }]);
  api.transaccionesApi.create.mockResolvedValue({ id: 'created' });
  api.transaccionesApi.update.mockResolvedValue({});
  api.pagosPendientesApi.create.mockResolvedValue({});
  vi.spyOn(window, 'alert').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe('transaction progressive form', () => {
  it('announces required errors, focuses the first field and rejects without side effects', async () => {
    await open();
    expect(advanced().open).toBe(false);
    save();
    expect(await screen.findByRole('alert')).toHaveTextContent('Revisá');
    const description = screen.getByLabelText('Descripción');
    expect(description).toHaveAttribute('aria-invalid', 'true');
    expect(description).toHaveFocus();
    expect(document.getElementById(description.getAttribute('aria-describedby'))).toHaveTextContent('requerida');
    expect(screen.getByLabelText('Monto')).toHaveAttribute('aria-invalid', 'true');
    expect(api.transaccionesApi.create).not.toHaveBeenCalled();
    expect(api.transaccionesApi.update).not.toHaveBeenCalled();
    expect(api.pagosPendientesApi.create).not.toHaveBeenCalled();
    expect(window.alert).not.toHaveBeenCalled();
  });

  it.each(['0', '-10', ''])('retains entered data on rejected amount %s', async (amount) => {
    await open();
    fill();
    change('Monto', amount);
    save();
    expect(await screen.findByRole('alert')).toHaveTextContent('Revisá');
    expect(screen.getByLabelText('Monto')).toHaveFocus();
    expect(screen.getByLabelText('Descripción')).toHaveValue(' Alquiler ');
    expect(api.transaccionesApi.create).not.toHaveBeenCalled();
    expect(api.pagosPendientesApi.create).not.toHaveBeenCalled();
  });

  it('persists the exact income payload and calls existing success/close callbacks', async () => {
    const callbacks = await open();
    fill();
    save();
    await waitFor(() => expect(callbacks.onClose).toHaveBeenCalledOnce());
    expect(api.transaccionesApi.create).toHaveBeenCalledExactlyOnceWith(payload);
    expect(callbacks.onSuccess).toHaveBeenCalledWith({ ...payload, id: 'created' });
    expect(api.pagosPendientesApi.create).not.toHaveBeenCalled();
  });

  it('preserves expense sign, optional fields, attachment and next recurrence payload', async () => {
    await open();
    fill();
    fireEvent.click(screen.getByRole('button', { name: 'Gasto', exact: true }));
    fireEvent.click(screen.getByText(/Más opciones/));
    change('Categoría', 'cat');
    change('Método de pago', 'pay');
    change('Notas', ' Mensual ');
    change('Objetivo de ahorro (opcional)', 'goal');
    fireEvent.click(screen.getByRole('button', { name: 'Uso', exact: true }));
    fireEvent.click(screen.getByLabelText('Marcar como gasto con tarjeta de crédito'));
    fireEvent.click(screen.getByLabelText('Marcar como gasto fijo o recurrente'));
    fireEvent.click(screen.getByRole('button', { name: 'Adjuntar transacciones 10' }));
    save();
    await waitFor(() => expect(api.pagosPendientesApi.create).toHaveBeenCalledOnce());
    expect(api.transaccionesApi.create).toHaveBeenCalledExactlyOnceWith({
      ...payload, tipo: 'gasto', monto: -125, monto_ars: -125, notas: 'Mensual',
      categoria_id: 'cat', metodo_pago_id: 'pay', objetivo_id: 'goal',
      es_aporte_objetivo: false, es_credito: true, archivo_adjunto: '/uploads/receipt.pdf',
    });
    expect(api.pagosPendientesApi.create).toHaveBeenCalledWith({
      nombre: 'Alquiler', monto: 125, moneda: 'ARS', fechavencimiento: '2026-02-28',
      categorias_id: 'cat', notas: 'Generado automáticamente desde el gasto "Alquiler" (2026-01-31)',
      recurrente: true, frecuencia_recurrencia: 'mensual', estado: 'pendiente',
    });
  });

  it('hydrates edit fields, automatically exposes advanced data and never recreates recurrence', async () => {
    await open({ editingTransaction: {
      id: 'edit', descripcion: 'Alquiler', monto: -125, tipo: 'gasto', moneda: 'ARS',
      fecha_transaccion: '2026-01-31', notas: 'Detalle', categoria_id: 'cat',
      metodo_pago_id: 'pay', objetivo_id: 'goal', es_aporte_objetivo: false,
      es_credito: true, archivo_adjunto: '/uploads/receipt.pdf',
    } });
    expect(advanced().open).toBe(true);
    expect(screen.getByLabelText('Monto')).toHaveValue(125);
    expect(screen.getByLabelText('Notas')).toHaveValue('Detalle');
    expect(screen.getByLabelText('Marcar como gasto con tarjeta de crédito')).toBeChecked();
    expect(screen.getByLabelText('Marcar como gasto fijo o recurrente')).not.toBeChecked();
    save();
    await waitFor(() => expect(api.transaccionesApi.update).toHaveBeenCalledOnce());
    expect(api.transaccionesApi.update).toHaveBeenCalledWith('edit', {
      ...payload, tipo: 'gasto', monto: -125, monto_ars: -125, notas: 'Detalle',
      categoria_id: 'cat', metodo_pago_id: 'pay', objetivo_id: 'goal',
      es_aporte_objetivo: false, es_credito: true, archivo_adjunto: '/uploads/receipt.pdf',
    });
    expect(api.transaccionesApi.create).not.toHaveBeenCalled();
    expect(api.pagosPendientesApi.create).not.toHaveBeenCalled();
  });

  it('does not submit when using legacy upload buttons without a button type', async () => {
    await open();
    fill();
    fireEvent.click(screen.getByText(/Más opciones/));
    fireEvent.click(screen.getByRole('button', { name: 'Adjuntar transacciones 10' }));
    expect(api.transaccionesApi.create).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Quitar adjunto' }));
    expect(api.transaccionesApi.create).not.toHaveBeenCalled();
    save();
    await waitFor(() => expect(api.transaccionesApi.create).toHaveBeenCalledWith(payload));
  });

  it('preserves USD selection and quote presentation in the persisted payload', async () => {
    await open();
    fill();
    change('Moneda', 'USD');
    expect(screen.getByText('Conversión USD')).toBeVisible();
    expect(screen.getByLabelText('Tipo de dólar')).toHaveValue('blue');
    save();
    await waitFor(() => expect(api.transaccionesApi.create).toHaveBeenCalledWith({ ...payload, moneda: 'USD' }));
  });

  it('retains category creation errors inline and permits retry without submitting', async () => {
    api.categoriasApi.create.mockRejectedValueOnce(new Error('private server detail'));
    api.categoriasApi.create.mockResolvedValueOnce({ id: 'new', nombre: 'Nueva' });
    await open();
    fill();
    change('Categoría', 'new');
    change('Nueva categoría', 'Nueva');
    fireEvent.click(screen.getByRole('button', { name: 'Guardar', exact: true }));
    await waitFor(() => expect(screen.getByLabelText('Nueva categoría')).toHaveAttribute('aria-invalid', 'true'));
    expect(screen.getByLabelText('Nueva categoría')).toHaveFocus();
    expect(screen.getByLabelText('Nueva categoría')).toHaveValue('Nueva');
    expect(screen.getByRole('alert')).not.toHaveTextContent('private server detail');
    expect(api.transaccionesApi.create).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Guardar', exact: true }));
    await screen.findByRole('option', { name: 'Nueva' });
    expect(screen.getByLabelText('Categoría')).toHaveValue('new');
    save();
    await waitFor(() => expect(api.transaccionesApi.create).toHaveBeenCalledWith({ ...payload, categoria_id: 'new' }));
  });

  it('blocks duplicate submission and retains data after a safe failure, allowing retry', async () => {
    let reject;
    api.transaccionesApi.create.mockReturnValueOnce(new Promise((_, rejectPromise) => { reject = rejectPromise; }));
    await open();
    fill();
    save();
    save();
    expect(api.transaccionesApi.create).toHaveBeenCalledOnce();
    await act(async () => reject(new Error('server detail')));
    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo guardar');
    expect(screen.getByLabelText('Descripción')).toHaveValue(' Alquiler ');
    expect(window.alert).not.toHaveBeenCalled();
    save();
    await waitFor(() => expect(api.transaccionesApi.create).toHaveBeenCalledTimes(2));
  });
});
