import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import StitchPendingPaymentModal from './StitchPendingPaymentModal';

const basePayment = {
  id: 'pending-payment-1',
  Nombre: 'Seguro del auto',
  Monto: 1200,
  Fechavencimiento: '2026-07-20',
  Estado: 'pendiente',
};

const renderModal = (payment, onSave = vi.fn()) => render(
  <StitchPendingPaymentModal
    isOpen
    onClose={vi.fn()}
    onSave={onSave}
    payment={payment}
    categories={[]}
    paymentMethods={[]}
  />,
);

describe('StitchPendingPaymentModal document initial state', () => {
  afterEach(cleanup);

  it('previews a valid JSON-wrapped invoice URL without exposing the wrapper string as a raw URL', () => {
    renderModal({
      ...basePayment,
      url_pdf: JSON.stringify({ data: { file_url: 'https://s3.qeva.xyz/facturas/invoice.pdf' } }),
    });

    expect(screen.getByTitle('Factura')).toHaveAttribute('src', 'https://s3.qeva.xyz/facturas/invoice.pdf');
    expect(screen.queryByText(/no es seguro/i)).not.toBeInTheDocument();
  });

  it('keeps invoice and payment receipt fields semantically distinct', () => {
    renderModal({
      ...basePayment,
      url_pdf: 'https://evil.example/invoice.pdf',
      comprobante: 'https://s3.qeva.xyz/facturas/comprobantes/receipt.pdf',
    });

    const invoiceSection = screen.getByText('Factura original').closest('.space-y-3');
    const receiptSection = screen.getByText('Comprobante de pago').closest('.space-y-3');

    expect(within(invoiceSection).getByText(/no es seguro/i)).toBeInTheDocument();
    expect(within(receiptSection).getByTitle('Comprobante')).toHaveAttribute(
      'src',
      'https://s3.qeva.xyz/facturas/comprobantes/receipt.pdf',
    );
  });

  it('loads second due date aliases', () => {
    renderModal({
      ...basePayment,
      SegundaFechaVencimiento: '2026-07-25',
    });

    expect(screen.getByLabelText('Segundo vencimiento')).toHaveValue('2026-07-25');
  });

  it('saves canonical second due date', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    renderModal({
      ...basePayment,
      segunda_fecha_vencimiento: '2026-07-25',
    }, onSave);

    fireEvent.change(screen.getByLabelText('Segundo vencimiento'), { target: { value: '2026-07-30' } });
    fireEvent.click(screen.getByRole('button', { name: /guardar cambios/i }));

    await waitFor(() => expect(onSave).toHaveBeenCalled());
    expect(onSave.mock.calls[0][0]).toMatchObject({ segunda_fecha_vencimiento: '2026-07-30' });
  });

  it('clears second due date with explicit null when empty', async () => {
    const onClearSave = vi.fn().mockResolvedValue(undefined);
    renderModal({
      ...basePayment,
      segunda_fecha_vencimiento: '2026-07-25',
    }, onClearSave);

    fireEvent.change(screen.getByLabelText('Segundo vencimiento'), { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: /guardar cambios/i }));

    await waitFor(() => expect(onClearSave).toHaveBeenCalled());
    expect(onClearSave.mock.calls[0][0]).toMatchObject({ segunda_fecha_vencimiento: null });
  });

  it('blocks submit when second due date is not after first due date', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    renderModal(basePayment, onSave);

    fireEvent.change(screen.getByLabelText('Segundo vencimiento'), { target: { value: '2026-07-20' } });

    expect(screen.getByRole('alert')).toHaveTextContent(/posterior al primer vencimiento/i);
    expect(screen.getByRole('button', { name: /guardar cambios/i })).toBeDisabled();
    expect(onSave).not.toHaveBeenCalled();
  });
});
