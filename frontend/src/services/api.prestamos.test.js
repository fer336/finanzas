import { afterEach, describe, expect, it, vi } from 'vitest';
import apiServices from './api';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('prestamosApi.getAll', () => {
  it('serializes explicit filters and omits empty values', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: async () => ({ list: [] }),
    });
    vi.stubGlobal('fetch', fetchMock);
    vi.stubGlobal('localStorage', { getItem: () => null });

    await apiServices.prestamosApi.getAll({ limit: 25, offset: 50, estado: 'pagado', search: 'Banco Nación' });
    await apiServices.prestamosApi.getAll({ estado: '', search: '   ' });

    const filteredUrl = new URL(fetchMock.mock.calls[0][0]);
    const emptyUrl = new URL(fetchMock.mock.calls[1][0]);
    expect(Object.fromEntries(filteredUrl.searchParams)).toEqual({
      limit: '25', offset: '50', estado: 'pagado', search: 'Banco Nación',
    });
    expect(Object.fromEntries(emptyUrl.searchParams)).toEqual({ limit: '100', offset: '0' });
  });
});
