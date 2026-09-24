/**
 * Normalizes files selected for upload before they reach the backend.
 *
 * Samsung/Android devices with "high efficiency pictures" enabled produce
 * HEIC/HEIF photos, which most browsers (other than Safari) cannot render
 * and which the backend does not accept. This module detects HEIC/HEIF
 * files (including the empty-`file.type` case some Android browsers report)
 * and converts them to JPEG client-side via a lazily-loaded `heic2any`.
 *
 * @module normalizeUploadFile
 */

/**
 * Upload types the backend accepts (backend/app/routers/files.py allows
 * .jpg .jpeg .png .pdf .webp .gif extensions).
 */
export const ALLOWED_UPLOAD_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
];

const EXTENSION_TO_TYPE = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
  pdf: 'application/pdf',
};

const HEIC_EXTENSION_PATTERN = /\.(heic|heif)$/i;

const getExtension = (fileName = '') => {
  const match = /\.([a-z0-9]+)$/i.exec(fileName || '');
  return match ? match[1].toLowerCase() : '';
};

/**
 * True when the file is a HEIC/HEIF photo: either the browser reports an
 * `image/heic`/`image/heif` MIME type, or the type is empty (common on
 * Android) but the filename ends with `.heic`/`.heif`.
 *
 * @param {File} file
 * @returns {boolean}
 */
export function isHeicFile(file) {
  if (!file) return false;
  const type = (file.type || '').toLowerCase();
  if (type === 'image/heic' || type === 'image/heif') return true;
  if (!type && HEIC_EXTENSION_PATTERN.test(file.name || '')) return true;
  return false;
}

/**
 * True when the file's MIME type is one the backend accepts
 * (treats `image/jpg` as allowed for backwards compatibility).
 *
 * @param {File} file
 * @returns {boolean}
 */
export function isAllowedUploadType(file) {
  if (!file) return false;
  if (file.type === 'image/jpg') return true;
  return ALLOWED_UPLOAD_TYPES.includes(file.type);
}

/**
 * Normalizes a file for upload:
 * - HEIC/HEIF files are converted to JPEG in the browser via `heic2any`
 *   (lazy-loaded only when needed) and renamed to `<basename>.jpg`.
 * - Files with an empty `file.type` (but not HEIC) get their type inferred
 *   from the extension.
 * - Everything else is returned unchanged.
 *
 * @param {File} file
 * @returns {Promise<File>}
 * @throws {Error} with a Spanish, user-facing message if HEIC conversion fails.
 */
export async function normalizeUploadFile(file) {
  if (isHeicFile(file)) {
    let heic2any;
    try {
      ({ default: heic2any } = await import('heic2any'));
    } catch {
      throw new Error('No se pudo convertir la foto HEIC. Probá con JPG o PNG.');
    }

    let converted;
    try {
      converted = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.9 });
    } catch {
      throw new Error('No se pudo convertir la foto HEIC. Probá con JPG o PNG.');
    }

    const blob = Array.isArray(converted) ? converted[0] : converted;
    if (!blob) {
      throw new Error('No se pudo convertir la foto HEIC. Probá con JPG o PNG.');
    }

    const baseName = (file.name || 'foto').replace(HEIC_EXTENSION_PATTERN, '');
    return new File([blob], `${baseName}.jpg`, {
      type: 'image/jpeg',
      lastModified: file.lastModified || Date.now(),
    });
  }

  if (!file.type) {
    const extension = getExtension(file.name);
    const inferredType = EXTENSION_TO_TYPE[extension];
    if (inferredType) {
      return new File([file], file.name, {
        type: inferredType,
        lastModified: file.lastModified || Date.now(),
      });
    }
  }

  return file;
}
