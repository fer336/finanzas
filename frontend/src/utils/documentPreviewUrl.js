const IMAGE_EXTENSION_PATTERN = /\.(jpe?g|png|webp|gif|bmp|svg)(\?.*)?$/i;
const PDF_EXTENSION_PATTERN = /\.pdf(\?.*)?$/i;
const SAFE_PROTOCOLS = new Set(['http:', 'https:']);
const REJECTED_PROTOCOLS = new Set(['javascript:', 'data:', 'blob:', 'file:']);
const KNOWN_S3_ORIGIN = 'https://s3.qeva.xyz';
const KNOWN_S3_HOSTNAME = 's3.qeva.xyz';
const KNOWN_S3_BUCKET_PREFIX = '/facturas/';

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

const hasControlCharacters = (value = '') => {
  for (let index = 0; index < value.length; index += 1) {
    const codePoint = value.charCodeAt(index);
    if (codePoint <= 31 || codePoint === 127) return true;
  }

  return false;
};

const splitUrlPath = (value = '') => value.split(/[?#]/, 1)[0];

const getRawPathFromAbsoluteCandidate = (candidate = '') => {
  const withoutScheme = candidate.replace(/^https:\/\//i, '');
  const slashIndex = withoutScheme.indexOf('/');
  return slashIndex >= 0 ? splitUrlPath(withoutScheme.slice(slashIndex)) : '';
};

const validateKnownS3RawPath = (rawPath = '') => {
  if (!rawPath.startsWith(KNOWN_S3_BUCKET_PREFIX)) {
    return 'legacy-s3-format-unrecognized';
  }

  if (rawPath === KNOWN_S3_BUCKET_PREFIX) {
    return 'legacy-s3-object-missing';
  }

  if (rawPath.includes('\\') || hasControlCharacters(rawPath)) {
    return 'unsafe-s3-path';
  }

  const objectSegments = rawPath.slice(KNOWN_S3_BUCKET_PREFIX.length).split('/');
  if (objectSegments.some((segment) => !segment)) {
    return 'unsafe-s3-path';
  }

  try {
    for (const segment of objectSegments) {
      const decodedSegment = decodeURIComponent(segment);
      if (
        decodedSegment === '.'
        || decodedSegment === '..'
        || decodedSegment.includes('/')
        || decodedSegment.includes('\\')
        || hasControlCharacters(decodedSegment)
      ) {
        return 'unsafe-s3-path';
      }
    }
  } catch {
    return 'malformed';
  }

  return '';
};

const validateKnownS3Search = (search = '') => {
  if (!search) return '';
  if (search.includes('\\') || hasControlCharacters(search)) return 'unsafe-s3-query';

  try {
    const queryParts = search.slice(1).split('&');
    for (const queryPart of queryParts) {
      const equalsIndex = queryPart.indexOf('=');
      const name = equalsIndex >= 0 ? queryPart.slice(0, equalsIndex) : queryPart;
      const value = equalsIndex >= 0 ? queryPart.slice(equalsIndex + 1) : '';
      const decodedName = decodeURIComponent(name.replace(/\+/g, '%20'));
      const decodedValue = decodeURIComponent(value.replace(/\+/g, '%20'));
      if (
        decodedName.includes('\\')
        || decodedValue.includes('\\')
        || decodedName.includes('..')
        || decodedValue.includes('..')
        || hasControlCharacters(decodedName)
        || hasControlCharacters(decodedValue)
      ) {
        return 'unsafe-s3-query';
      }
    }
  } catch {
    return 'malformed';
  }

  return '';
};

const buildKnownS3CanonicalCandidate = (input = '') => {
  if (/^https:\/\//i.test(input)) {
    try {
      const parsed = new URL(input);
      return parsed.hostname.toLowerCase() === KNOWN_S3_HOSTNAME ? input : '';
    } catch {
      return '';
    }
  }
  if (/^\/\/s3\.qeva\.xyz(?::\d+)?\/facturas\//i.test(input)) return `https:${input}`;
  if (input.startsWith('/facturas/')) return `${KNOWN_S3_ORIGIN}${input}`;
  if (input.startsWith('facturas/')) return `${KNOWN_S3_ORIGIN}/${input}`;
  if (/^s3\.qeva\.xyz(?::\d+)?\/facturas\//i.test(input)) return `https://${input}`;
  return '';
};

const normalizeKnownS3DocumentUrl = (input = '') => {
  const candidate = buildKnownS3CanonicalCandidate(input);

  if (!candidate) {
    return { matched: false };
  }

  if (candidate.includes('\\') || hasControlCharacters(candidate)) {
    return {
      matched: true,
      result: { isValid: false, reason: 'unsafe-s3-path', rawUrl: input },
    };
  }

  let parsed;
  try {
    parsed = new URL(candidate);
  } catch {
    return {
      matched: true,
      result: { isValid: false, reason: 'malformed', rawUrl: input },
    };
  }

  if (/^https:\/\/(?:[^/@]+@)?s3\.qeva\.xyz:\d+/i.test(candidate)) {
    return {
      matched: true,
      result: { isValid: false, reason: 'port-not-allowed', rawUrl: input },
    };
  }

  if (parsed.protocol !== 'https:' || parsed.hostname.toLowerCase() !== KNOWN_S3_HOSTNAME) {
    return {
      matched: true,
      result: { isValid: false, reason: 'legacy-s3-format-unrecognized', rawUrl: input },
    };
  }

  if (parsed.username || parsed.password) {
    return {
      matched: true,
      result: { isValid: false, reason: 'credentials-not-allowed', rawUrl: input },
    };
  }

  if (parsed.port) {
    return {
      matched: true,
      result: { isValid: false, reason: 'port-not-allowed', rawUrl: input },
    };
  }

  const rawPath = getRawPathFromAbsoluteCandidate(candidate);
  const pathError = validateKnownS3RawPath(rawPath);
  if (pathError) {
    return {
      matched: true,
      result: { isValid: false, reason: pathError, rawUrl: input },
    };
  }

  const searchError = validateKnownS3Search(parsed.search);
  if (searchError) {
    return {
      matched: true,
      result: { isValid: false, reason: searchError, rawUrl: input },
    };
  }

  const href = `${KNOWN_S3_ORIGIN}${parsed.pathname}${parsed.search}`;
  const fileType = getDocumentFileType(href);

  return {
    matched: true,
    result: {
      isValid: true,
      rawUrl: input,
      href,
      absoluteUrl: href,
      origin: KNOWN_S3_ORIGIN,
      fileType,
      canEmbed: fileType === 'pdf' || fileType === 'image',
      canOpenExternal: true,
      documentName: getDocumentName(href),
    },
  };
};

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
  addOrigin(allowedOrigins, KNOWN_S3_ORIGIN);

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

  const knownS3Url = normalizeKnownS3DocumentUrl(input);
  if (knownS3Url.matched) {
    return knownS3Url.result;
  }

  if (input.includes('\\') || hasControlCharacters(input)) {
    return { isValid: false, reason: 'malformed', rawUrl: input };
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
