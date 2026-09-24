import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import FileUpload from './FileUpload';

afterEach(cleanup);

const heic2anyMock = vi.fn();
vi.mock('heic2any', () => ({
  default: (...args) => heic2anyMock(...args),
}));

describe('FileUpload document URL policy', () => {
  it('gives the upload file input an accessible name inside a focus-visible drop area', () => {
    render(<FileUpload showPreview />);

    const input = screen.getByLabelText(/seleccionar archivo para subir/i);
    expect(input).toHaveAttribute('type', 'file');
    expect(input.parentElement).toHaveClass('focus-within:ring-2');
  });

  it('does not expose href or src sinks for a malicious stored URL', () => {
    render(<FileUpload currentFileUrl="javascript:alert(1)" showPreview />);

    expect(screen.getByText(/no es seguro/i)).toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.queryByAltText(/preview/i)).not.toBeInTheDocument();
  });

  it('renders a validated MinIO image URL as a preview src', () => {
    render(<FileUpload currentFileUrl="https://s3.qeva.xyz/facturas/receipt.webp" showPreview />);

    expect(screen.getByAltText('Preview')).toHaveAttribute('src', 'https://s3.qeva.xyz/facturas/receipt.webp');
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('renders a validated MinIO PDF URL as an external link', () => {
    render(<FileUpload currentFileUrl="https://s3.qeva.xyz/facturas/receipt.pdf" showPreview />);

    const link = screen.getByRole('link', { name: /receipt\.pdf/i });
    expect(link).toHaveAttribute('href', 'https://s3.qeva.xyz/facturas/receipt.pdf');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });
});

describe('FileUpload HEIC conversion', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('converts a selected HEIC file to JPEG and uploads it', async () => {
    heic2anyMock.mockResolvedValue(new Blob(['converted'], { type: 'image/jpeg' }));
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: { file_url: 'https://s3.qeva.xyz/comprobantes/foto.jpg' } }),
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<FileUpload />);

    const heicFile = new File(['heic-bytes'], 'IMG_5678.heic', { type: 'image/heic' });
    const input = screen.getByLabelText(/seleccionar archivo para subir/i);
    fireEvent.change(input, { target: { files: [heicFile] } });

    const uploadButton = await screen.findByRole('button', { name: /subir archivo/i });
    fireEvent.click(uploadButton);

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());

    const uploadedBody = fetchMock.mock.calls[0][1].body;
    const uploadedFile = uploadedBody.get('file');
    expect(uploadedFile.name).toBe('IMG_5678.jpg');
    expect(uploadedFile.type).toBe('image/jpeg');
  });
});
