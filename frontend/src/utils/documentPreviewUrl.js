const IMAGE_EXTENSION_PATTERN = /\.(jpe?g|png|webp|gif|bmp|svg)(\?.*)?$/i;
const PDF_EXTENSION_PATTERN = /\.pdf(\?.*)?$/i;
const SAFE_PROTOCOLS = new Set(['http:', 'https:']);
const REJECTED_PROTOCOLS = new Set(['javascript:', 'data:', 'blob:', 'file:']);

const getEnv = () => {
  try {
    return import.meta.env || {};
  } catch {
    return {};
  }
};

export const getDocumentFileType = (url = '') => {
  if (PDF_EXTENSION_PATTERN.test(url)) return 'pdf';
  if (IMAGE_EXTENSION_PATTERN.test(url)) return 'image';
  return 'unsupported';
};

export const getDocumentName = (url = '') => {
  try {
    const parsed = new URL(url, 'https://placeholder.local');
    const pathname = decodeURIComponent(parsed.pathname);
    return pathname.split('/').filter(Boolean).pop() || parsed.hostname || 'documento';
  } catch {
    return url.split('/').filter(Boolean).pop() || 'documento';
  }
};

const isLocalHostname = (hostname = '') => (
  hostname === 'localhost'
  || hostname === '127.0.0.1'
  || hostname === '[::1]'
);

const addOrigin = (origins, value) => {
  if (!value) return;
  try {
    origins.add(new URL(value).origin);
  } catch {
    // Ignore invalid build/runtime configuration values.
  }
};

export const buildDocumentUrlPolicy = ({ env = getEnv(), locationObject } = {}) => {
  const runtimeLocation = locationObject || (typeof window !== 'undefined' ? window.location : undefined);
  const currentOrigin = runtimeLocation?.origin || '';
  const currentHostname = runtimeLocation?.hostname || '';
  const isDevMode = env.MODE === 'development' || env.DEV === true;
  const isLocalDev = isDevMode && isLocalHostname(currentHostname);
  const allowedOrigins = new Set();

  addOrigin(allowedOrigins, currentOrigin);
  addOrigin(allowedOrigins, env.VITE_BACKEND_URL);

  if (isLocalDev) {
    addOrigin(allowedOrigins, env.VITE_DEV_BACKEND_URL || 'http://localhost:8000');
    addOrigin(allowedOrigins, env.VITE_DEV_FRONTEND_URL || 'http://localhost:3000');
  }

  // Backend MinIO uploads construct public URLs as
  // https://{MINIO_ENDPOINT}/{MINIO_BUCKET_NAME}/{object_name}.
  // Repo deployment/secrets point at s3.qeva.xyz/facturas.
  addOrigin(allowedOrigins, 'https://s3.qeva.xyz');

  return {
    allowedOrigins,
    currentOrigin,
    isLocalDev,
  };
};

export const normalizeDocumentPreviewUrl = (rawUrl, policy = buildDocumentUrlPolicy()) => {
  const input = typeof rawUrl === 'string' ? rawUrl.trim() : '';
  if (!input) {
    return { isValid: false, reason: 'empty', rawUrl: input };
  }

  const isRelativeInput = input.startsWith('/') && !input.startsWith('//');
  const hasExplicitProtocol = /^[a-zA-Z][a-zA-Z\d+.-]*:/.test(input);
  if (!isRelativeInput && !hasExplicitProtocol) {
    return { isValid: false, reason: 'malformed', rawUrl: input };
  }

  let parsed;
  try {
    parsed = new URL(input, policy.currentOrigin || 'https://placeholder.local');
  } catch {
    return { isValid: false, reason: 'malformed', rawUrl: input };
  }

  if (REJECTED_PROTOCOLS.has(parsed.protocol) || !SAFE_PROTOCOLS.has(parsed.protocol)) {
    return { isValid: false, reason: 'unsafe-protocol', rawUrl: input };
  }

  if (parsed.username || parsed.password) {
    return { isValid: false, reason: 'credentials-not-allowed', rawUrl: input };
  }

  if (parsed.protocol === 'http:' && !(policy.isLocalDev && isLocalHostname(parsed.hostname))) {
    return { isValid: false, reason: 'http-only-local-dev', rawUrl: input };
  }

  if (!policy.allowedOrigins.has(parsed.origin)) {
    return { isValid: false, reason: 'origin-not-allowed', rawUrl: input };
  }

  const href = isRelativeInput ? `${parsed.pathname}${parsed.search}${parsed.hash}` : parsed.href;
  const fileType = getDocumentFileType(parsed.href);

  return {
    isValid: true,
    rawUrl: input,
    href,
    absoluteUrl: parsed.href,
    origin: parsed.origin,
    fileType,
    canEmbed: fileType === 'pdf' || fileType === 'image',
    canOpenExternal: true,
    documentName: getDocumentName(parsed.href),
  };
};

export const normalizePaymentDocument = (payment, policy) => {
  const candidate = payment?.url_pdf ?? payment?.UrlPdf ?? payment?.comprobante ?? payment?.Comprobante ?? '';
  return normalizeDocumentPreviewUrl(candidate, policy);
};

export { IMAGE_EXTENSION_PATTERN, PDF_EXTENSION_PATTERN };
