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

  it.each([
    ['canonical S3 URL', 'https://s3.qeva.xyz/facturas/invoice.webp', 'https://s3.qeva.xyz/facturas/invoice.webp'],
    ['canonical S3 URL with presigned query', 'https://s3.qeva.xyz/facturas/invoice.pdf?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Signature=abc123', 'https://s3.qeva.xyz/facturas/invoice.pdf?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Signature=abc123'],
    ['missing scheme', 's3.qeva.xyz/facturas/comprobantes/invoice.pdf', 'https://s3.qeva.xyz/facturas/comprobantes/invoice.pdf'],
    ['protocol-relative URL', '//s3.qeva.xyz/facturas/comprobantes/invoice.png?download=1', 'https://s3.qeva.xyz/facturas/comprobantes/invoice.png?download=1'],
    ['absolute bucket path', '/facturas/comprobantes/invoice.pdf', 'https://s3.qeva.xyz/facturas/comprobantes/invoice.pdf'],
    ['bare bucket path', 'facturas/comprobantes/invoice.webp', 'https://s3.qeva.xyz/facturas/comprobantes/invoice.webp'],
    ['presigned query with signature padding', 'https://s3.qeva.xyz/facturas/invoice.pdf?X-Amz-Signature=abc==', 'https://s3.qeva.xyz/facturas/invoice.pdf?X-Amz-Signature=abc=='],
    ['presigned query with token padding', 'https://s3.qeva.xyz/facturas/invoice.pdf?token=abc=def==', 'https://s3.qeva.xyz/facturas/invoice.pdf?token=abc=def=='],
  ])('canonicalizes legitimate historical S3 form: %s', (_label, input, expectedHref) => {
    expect(normalizeDocumentPreviewUrl(input, productionPolicy)).toMatchObject({
      isValid: true,
      href: expectedHref,
      absoluteUrl: expectedHref,
      origin: 'https://s3.qeva.xyz',
    });
  });

  it('rejects unsafe protocols, credentialed URLs, malformed values, and unexpected origins', () => {
    expect(normalizeDocumentPreviewUrl('javascript:alert(1)', productionPolicy)).toMatchObject({ isValid: false, reason: 'unsafe-protocol' });
    expect(normalizeDocumentPreviewUrl('data:text/html,boom', productionPolicy)).toMatchObject({ isValid: false, reason: 'unsafe-protocol' });
    expect(normalizeDocumentPreviewUrl('https://user:pass@s3.qeva.xyz/facturas/invoice.pdf', productionPolicy)).toMatchObject({ isValid: false, reason: 'credentials-not-allowed' });
    expect(normalizeDocumentPreviewUrl('not a url', productionPolicy)).toMatchObject({ isValid: false, reason: 'malformed' });
    expect(normalizeDocumentPreviewUrl('https://evil.example/invoice.pdf', productionPolicy)).toMatchObject({ isValid: false, reason: 'origin-not-allowed' });
  });

  it.each([
    ['lookalike host with explicit scheme', 'https://s3.qeva.xyz.evil.com/facturas/invoice.pdf', 'origin-not-allowed'],
    ['lookalike host without scheme', 's3.qeva.xyz.evil.com/facturas/invoice.pdf', 'malformed'],
    ['wrong S3 bucket path', 'https://s3.qeva.xyz/other/invoice.pdf', 'legacy-s3-format-unrecognized'],
    ['S3 URL with credentials', 'https://user:pass@s3.qeva.xyz/facturas/invoice.pdf', 'credentials-not-allowed'],
    ['S3 URL with explicit port', 'https://s3.qeva.xyz:443/facturas/invoice.pdf', 'port-not-allowed'],
    ['protocol-relative S3 URL with explicit port', '//s3.qeva.xyz:443/facturas/invoice.pdf', 'port-not-allowed'],
    ['raw traversal', 'https://s3.qeva.xyz/facturas/../invoice.pdf', 'unsafe-s3-path'],
    ['encoded traversal', 'https://s3.qeva.xyz/facturas/%2e%2e/invoice.pdf', 'unsafe-s3-path'],
    ['encoded slash traversal', 'https://s3.qeva.xyz/facturas/safe%2F..%2Finvoice.pdf', 'unsafe-s3-path'],
    ['backslash path', 'https://s3.qeva.xyz/facturas/comprobantes\\invoice.pdf', 'unsafe-s3-path'],
    ['encoded backslash path', 'https://s3.qeva.xyz/facturas/comprobantes%5Cinvoice.pdf', 'unsafe-s3-path'],
    ['encoded control character in query', 'https://s3.qeva.xyz/facturas/invoice.pdf?download=%0A', 'unsafe-s3-query'],
    ['encoded control after extra equals in query', 'https://s3.qeva.xyz/facturas/invoice.pdf?download=a=%0A', 'unsafe-s3-query'],
    ['encoded backslash after multiple equals in query', 'https://s3.qeva.xyz/facturas/invoice.pdf?token=a=b=%5C', 'unsafe-s3-query'],
    ['encoded traversal after multiple equals in query', 'https://s3.qeva.xyz/facturas/invoice.pdf?token=a=b=%2e%2e', 'unsafe-s3-query'],
    ['malformed percent encoding in query', 'https://s3.qeva.xyz/facturas/invoice.pdf?token=abc%ZZ', 'malformed'],
    ['empty object path', 'https://s3.qeva.xyz/facturas/', 'legacy-s3-object-missing'],
    ['http S3 URL', 'http://s3.qeva.xyz/facturas/invoice.pdf', 'http-only-local-dev'],
  ])('rejects unsafe or ambiguous historical S3 form: %s', (_label, input, reason) => {
    expect(normalizeDocumentPreviewUrl(input, productionPolicy)).toMatchObject({
      isValid: false,
      reason,
    });
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
