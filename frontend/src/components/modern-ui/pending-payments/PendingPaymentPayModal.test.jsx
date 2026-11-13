import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import PendingPaymentPayModal from './PendingPaymentPayModal';

vi.mock('../../../contexts/AmountVisibilityContext', () => ({
  useAmountVisibility: () => ({ formatAmount: (value) => `$${value}` }),
}));
vi.mock('../../../utils/normalizeUploadFile', () => ({
  normalizeUploadFile: vi.fn(async (file) => file),
  isAllowedUploadType: (file) => file.type === 'application/pdf',
}));
const payment = { id: 'p1', nombre: 'Internet', monto: 1200, moneda: 'ARS', estado: 'pendiente' };
const setup = (overrides = {}) => {
  const onConfirm = vi.fn().mockResolvedValue(undefined);
  render(<PendingPaymentPayModal isOpen payment={payment}
    categories={[{ id: 'c1', nombre: 'Servicios' }]}
    paymentMethods={[{ id: 'm1', nombre: 'Transferencia' }]}
    onClose={vi.fn()} onConfirm={onConfirm} {...overrides} />);
  return onConfirm;
};
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe('deliberate pending payment registration', () => {
  it('reviews validated fields before sending the unchanged payload', async () => {
    const onConfirm = setup();
    fireEvent.change(screen.getByLabelText('Fecha de pago'), { target: { value: '2026-07-15' } });
    fireEvent.click(screen.getByRole('button', { name: 'Revisar registro' }));
    expect(onConfirm).not.toHaveBeenCalled();
    expect(screen.getByText(/Se registrará un pago/)).toBeInTheDocument();
    expect(screen.getByText(/Transferencia · Servicios/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar registro' }));
    await waitFor(() => expect(onConfirm).toHaveBeenCalledExactlyOnceWith({
      item_id: 'p1', monto: 1200, moneda: 'ARS', fecha_pago: '2026-07-15',
      categoria_id: 'c1', metodo_pago_id: 'm1', notas: 'Pago de Internet', comprobante: null,
    }));
  });

  it('allows returning to the form without registration', () => {
    const onConfirm = setup();
    fireEvent.click(screen.getByRole('button', { name: 'Revisar registro' }));
    fireEvent.click(screen.getByRole('button', { name: 'Volver a editar' }));
    expect(screen.getByLabelText('Fecha de pago')).toBeInTheDocument();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it.each([
    { categories: [] },
    { paymentMethods: [] },
    { payment: { ...payment, estado: 'pagado' } },
    { payment: { ...payment, monto: 0 } },
  ])('rejects invalid or already paid records before confirmation: %j', (overrides) => {
    const onConfirm = setup(overrides);
    fireEvent.click(screen.getByRole('button', { name: 'Revisar registro' }));
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Confirmar registro' })).not.toBeInTheDocument();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('rejects an empty date without any mutation', () => {
    const onConfirm = setup();
    fireEvent.change(screen.getByLabelText('Fecha de pago'), { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: 'Revisar registro' }));
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('uploads the normalized receipt only after confirmation and preserves its URL', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ data: { file_url: 'https://s3.qeva.xyz/receipt.pdf' } }) });
    vi.stubGlobal('fetch', fetchMock);
    const onConfirm = setup();
    fireEvent.change(screen.getByLabelText('Seleccionar archivo'), { target: { files: [new File(['receipt'], 'receipt.pdf', { type: 'application/pdf' })] } });
    await screen.findByText('receipt.pdf');
    fireEvent.click(screen.getByRole('button', { name: 'Revisar registro' }));
    expect(fetchMock).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar registro' }));
    await waitFor(() => expect(onConfirm).toHaveBeenCalledWith(expect.objectContaining({ comprobante: 'https://s3.qeva.xyz/receipt.pdf' })));
    expect(fetchMock).toHaveBeenCalledWith('http://localhost:8000/api/files/upload?prefix=comprobantes', expect.objectContaining({ method: 'POST', body: expect.any(FormData) }));
  });

  it('retains the review and reports a rejected registration without a success claim', async () => {
    const onConfirm = vi.fn().mockRejectedValue(new Error('Registro rechazado'));
    setup({ onConfirm });
    fireEvent.click(screen.getByRole('button', { name: 'Revisar registro' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar registro' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Registro rechazado');
    expect(screen.getByRole('button', { name: 'Volver a editar' })).toBeEnabled();
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('does not register when the receipt upload is rejected', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, json: async () => ({ detail: 'Upload rechazado' }) }));
    const onConfirm = setup();
    fireEvent.change(screen.getByLabelText('Seleccionar archivo'), { target: { files: [new File(['receipt'], 'receipt.pdf', { type: 'application/pdf' })] } });
    await screen.findByText('receipt.pdf');
    fireEvent.click(screen.getByRole('button', { name: 'Revisar registro' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar registro' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Upload rechazado');
    expect(onConfirm).not.toHaveBeenCalled();
  });
});
