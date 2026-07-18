import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, expect, it } from 'vitest';
import FileUpload from './FileUpload';

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
