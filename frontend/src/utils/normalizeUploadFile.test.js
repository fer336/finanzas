import { describe, expect, it, vi, beforeEach } from 'vitest';

const heic2anyMock = vi.fn();

vi.mock('heic2any', () => ({
  default: (...args) => heic2anyMock(...args),
}));

const {
  ALLOWED_UPLOAD_TYPES,
  isHeicFile,
  isAllowedUploadType,
  normalizeUploadFile,
} = await import('./normalizeUploadFile');

const makeFile = (name, type, content = 'x') =>
  new File([content], name, { type });

describe('normalizeUploadFile', () => {
  beforeEach(() => {
    heic2anyMock.mockReset();
  });

  describe('isHeicFile', () => {
    it('detects image/heic mime type', () => {
      expect(isHeicFile(makeFile('foto.heic', 'image/heic'))).toBe(true);
    });

    it('detects image/heif mime type case-insensitively', () => {
      expect(isHeicFile(makeFile('foto.HEIF', 'IMAGE/HEIF'))).toBe(true);
    });

    it('detects .heic extension when type is empty', () => {
      expect(isHeicFile(makeFile('IMG_1234.HEIC', ''))).toBe(true);
    });

    it('detects .heif extension when type is empty', () => {
      expect(isHeicFile(makeFile('foto.heif', ''))).toBe(true);
    });

    it('returns false for a regular jpeg', () => {
      expect(isHeicFile(makeFile('foto.jpg', 'image/jpeg'))).toBe(false);
    });
  });

  describe('normalizeUploadFile', () => {
    it('converts an image/heic file to a .jpg image/jpeg file', async () => {
      const convertedBlob = new Blob(['converted'], { type: 'image/jpeg' });
      heic2anyMock.mockResolvedValue(convertedBlob);

      const input = makeFile('IMG_1234.heic', 'image/heic');
      const result = await normalizeUploadFile(input);

      expect(heic2anyMock).toHaveBeenCalledWith(
        expect.objectContaining({ blob: input, toType: 'image/jpeg', quality: 0.9 }),
      );
      expect(result).toBeInstanceOf(File);
      expect(result.name).toBe('IMG_1234.jpg');
      expect(result.type).toBe('image/jpeg');
    });

    it('takes the first blob when heic2any returns an array', async () => {
      const first = new Blob(['first'], { type: 'image/jpeg' });
      const second = new Blob(['second'], { type: 'image/jpeg' });
      heic2anyMock.mockResolvedValue([first, second]);

      const input = makeFile('foto.heic', 'image/heic');
      const result = await normalizeUploadFile(input);

      expect(result.name).toBe('foto.jpg');
      expect(result.type).toBe('image/jpeg');
      expect(result.size).toBe(first.size);
    });

    it('converts a file with empty type and .HEIC extension', async () => {
      const convertedBlob = new Blob(['converted'], { type: 'image/jpeg' });
      heic2anyMock.mockResolvedValue(convertedBlob);

      const input = makeFile('camera.HEIC', '');
      const result = await normalizeUploadFile(input);

      expect(result.name).toBe('camera.jpg');
      expect(result.type).toBe('image/jpeg');
    });

    it('passes a jpeg file through unchanged', async () => {
      const input = makeFile('foto.jpg', 'image/jpeg');
      const result = await normalizeUploadFile(input);

      expect(result).toBe(input);
      expect(heic2anyMock).not.toHaveBeenCalled();
    });

    it('infers type from extension when type is empty (png)', async () => {
      const input = makeFile('captura.png', '');
      const result = await normalizeUploadFile(input);

      expect(result).not.toBe(input);
      expect(result.name).toBe('captura.png');
      expect(result.type).toBe('image/png');
    });

    it('throws a clear error when conversion fails', async () => {
      heic2anyMock.mockRejectedValue(new Error('boom'));

      const input = makeFile('roto.heic', 'image/heic');

      await expect(normalizeUploadFile(input)).rejects.toThrow(
        /No se pudo convertir la foto HEIC/,
      );
    });
  });

  describe('isAllowedUploadType', () => {
    it('lists the backend-aligned allowed types', () => {
      expect(ALLOWED_UPLOAD_TYPES).toEqual([
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/gif',
        'application/pdf',
      ]);
    });

    it('allows every type in ALLOWED_UPLOAD_TYPES', () => {
      for (const type of ALLOWED_UPLOAD_TYPES) {
        expect(isAllowedUploadType(makeFile('a', type))).toBe(true);
      }
    });

    it('treats image/jpg as allowed for backwards compat', () => {
      expect(isAllowedUploadType(makeFile('a.jpg', 'image/jpg'))).toBe(true);
    });

    it('rejects an unsupported type', () => {
      expect(isAllowedUploadType(makeFile('a.exe', 'application/x-msdownload'))).toBe(false);
    });
  });
});
