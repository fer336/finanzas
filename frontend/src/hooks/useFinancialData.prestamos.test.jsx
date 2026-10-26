import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const { getAll } = vi.hoisted(() => ({ getAll: vi.fn() }));
vi.mock('../services/api', () => ({ default: { prestamosApi: { getAll } } }));

import { usePrestamos } from './useFinancialData';

const wrapper = ({ children }) => (
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    {children}
  </QueryClientProvider>
);

afterEach(() => {
  vi.clearAllMocks();
});

describe('usePrestamos', () => {
  it('keys server filters independently and retains pagination metadata', async () => {
    getAll.mockImplementation(async ({ estado, search }) => ({
      list: [{ id: estado }],
      pageInfo: { totalRows: search ? 1 : 2, isLastPage: true },
    }));
    const { result, rerender } = renderHook(
      ({ filters }) => usePrestamos(filters),
      { wrapper, initialProps: { filters: { estado: 'pendiente', limit: 10, offset: 0 } } },
    );

    await waitFor(() => expect(result.current.data).toEqual({
      list: [{ id: 'pendiente' }], pageInfo: { totalRows: 2, isLastPage: true },
    }));
    rerender({ filters: { estado: 'pagado', search: 'archivo', limit: 10, offset: 0 } });

    await waitFor(() => expect(result.current.data?.list).toEqual([{ id: 'pagado' }]));
    expect(getAll).toHaveBeenCalledWith({ estado: 'pendiente', limit: 10, offset: 0 });
    expect(getAll).toHaveBeenCalledWith({ estado: 'pagado', search: 'archivo', limit: 10, offset: 0 });
  });
});
