import { describe, expect, it } from 'vitest';
import {
  buildDocumentUrlPolicy,
  getDocumentFileType,
  normalizeDocumentPreviewUrl,
} from './documentPreviewUrl';

const productionPolicy = buildDocumentUrlPolicy({
  env: { MODE: 'production', DEV: false, VITE_BACKEND_URL: 'https://finanzas.qeva.xyz' },
  locationObject: { origin: 'https://finanzas.qeva.xyz', hostname: 'finanzas.qeva.xyz' },
});

const localPolicy = buildDocumentUrlPolicy({
  env: { MODE: 'development', DEV: true, VITE_BACKEND_URL: 'http://localhost:8000' },
  locationObject: { origin: 'http://localhost:3000', hostname: 'localhost' },
});

describe('normalizeDocumentPreviewUrl', () => {
  it('accepts production app, backend, and MinIO document origins', () => {
    expect(normalizeDocumentPreviewUrl('/api/files/invoice.pdf', productionPolicy)).toMatchObject({
      isValid: true,
      href: '/api/files/invoice.pdf',
      fileType: 'pdf',
    });

    expect(normalizeDocumentPreviewUrl('https://finanzas.qeva.xyz/api/files/invoice.pdf', productionPolicy)).toMatchObject({
      isValid: true,
      origin: 'https://finanzas.qeva.xyz',
    });

    expect(normalizeDocumentPreviewUrl('https://s3.qeva.xyz/facturas/invoice.webp', productionPolicy)).toMatchObject({
      isValid: true,
      origin: 'https://s3.qeva.xyz',
      fileType: 'image',
    });
  });

  it('rejects unsafe protocols, credentialed URLs, malformed values, and unexpected origins', () => {
    expect(normalizeDocumentPreviewUrl('javascript:alert(1)', productionPolicy)).toMatchObject({ isValid: false, reason: 'unsafe-protocol' });
    expect(normalizeDocumentPreviewUrl('data:text/html,boom', productionPolicy)).toMatchObject({ isValid: false, reason: 'unsafe-protocol' });
    expect(normalizeDocumentPreviewUrl('https://user:pass@s3.qeva.xyz/facturas/invoice.pdf', productionPolicy)).toMatchObject({ isValid: false, reason: 'credentials-not-allowed' });
    expect(normalizeDocumentPreviewUrl('not a url', productionPolicy)).toMatchObject({ isValid: false, reason: 'malformed' });
    expect(normalizeDocumentPreviewUrl('https://evil.example/invoice.pdf', productionPolicy)).toMatchObject({ isValid: false, reason: 'origin-not-allowed' });
  });

  it('allows local http URLs only during local development', () => {
    expect(normalizeDocumentPreviewUrl('http://localhost:8000/api/files/invoice.pdf', localPolicy)).toMatchObject({
      isValid: true,
      origin: 'http://localhost:8000',
    });

    expect(normalizeDocumentPreviewUrl('http://localhost:8000/api/files/invoice.pdf', productionPolicy)).toMatchObject({
      isValid: false,
      reason: 'http-only-local-dev',
    });
  });
});

describe('getDocumentFileType', () => {
  it('detects embeddable document types', () => {
    expect(getDocumentFileType('https://s3.qeva.xyz/facturas/invoice.pdf')).toBe('pdf');
    expect(getDocumentFileType('https://s3.qeva.xyz/facturas/receipt.png?download=1')).toBe('image');
    expect(getDocumentFileType('https://s3.qeva.xyz/facturas/archive.zip')).toBe('unsupported');
  });
});
