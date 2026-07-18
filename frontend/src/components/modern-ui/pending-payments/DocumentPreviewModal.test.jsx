import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import DocumentPreviewModal from './DocumentPreviewModal';

afterEach(() => {
  cleanup();
});

describe('DocumentPreviewModal', () => {
  it('renders a sandboxed PDF preview for allowed document URLs', () => {
    render(
      <DocumentPreviewModal
        isOpen
        onClose={vi.fn()}
        documentUrl="https://s3.qeva.xyz/facturas/invoice.pdf"
        title="Factura"
      />
    );

    const frame = screen.getByTitle('invoice.pdf');
    expect(frame).toHaveAttribute('sandbox', 'allow-same-origin allow-downloads allow-popups');
    expect(frame).toHaveAttribute('src', 'https://s3.qeva.xyz/facturas/invoice.pdf');
    expect(screen.getByRole('link', { name: /abrir en nueva pestaña/i })).toHaveAttribute('href', 'https://s3.qeva.xyz/facturas/invoice.pdf');
  });

  it('blocks invalid document URLs without exposing an external-open link', () => {
    render(
      <DocumentPreviewModal
        isOpen
        onClose={vi.fn()}
        documentUrl="javascript:alert(1)"
        title="Factura"
      />
    );

    expect(screen.getByText(/no es seguro/i)).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /abrir/i })).not.toBeInTheDocument();
    expect(screen.queryByTitle('javascript:alert(1)')).not.toBeInTheDocument();
  });

  it('closes on Escape and restores the document body overflow', () => {
    const onClose = vi.fn();
    const { unmount } = render(
      <DocumentPreviewModal
        isOpen
        onClose={onClose}
        documentUrl="https://s3.qeva.xyz/facturas/invoice.pdf"
        title="Factura"
      />
    );

    expect(document.body.style.overflow).toBe('hidden');
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
    unmount();
    expect(document.body.style.overflow).toBe('');
  });
});
