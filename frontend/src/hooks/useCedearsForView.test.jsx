import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useCedearsForView } from './useCedearsForView';

const getAllCedears = vi.fn();

vi.mock('../services/yfinanceService', () => ({
  default: { getAllCedears: (...args) => getAllCedears(...args) },
}));

describe('useCedearsForView', () => {
  beforeEach(() => {
    getAllCedears.mockReset();
    getAllCedears.mockResolvedValue([{ ticker: 'AAPL' }]);
  });

  it('does not call Yahoo CEDEARs on the dashboard', () => {
    const { result } = renderHook(() => useCedearsForView('dashboard'));
    expect(getAllCedears).not.toHaveBeenCalled();
    expect(result.current.cedears).toEqual([]);
  });

  it.each(['cedears', 'inversiones'])('loads CEDEARs once when the %s view opens', async (view) => {
    const { result, rerender } = renderHook(({ v }) => useCedearsForView(v), { initialProps: { v: 'dashboard' } });
    rerender({ v: view });
    await waitFor(() => expect(result.current.cedears).toEqual([{ ticker: 'AAPL' }]));
    expect(getAllCedears).toHaveBeenCalledExactlyOnceWith(30);

    rerender({ v: 'dashboard' });
    rerender({ v: view });
    expect(getAllCedears).toHaveBeenCalledOnce();
  });

  it('refresh fetches again and replaces the data', async () => {
    const { result } = renderHook(() => useCedearsForView('cedears'));
    await waitFor(() => expect(result.current.cedears).toHaveLength(1));
    getAllCedears.mockResolvedValueOnce([{ ticker: 'AAPL' }, { ticker: 'KO' }]);
    await act(() => result.current.refresh());
    expect(result.current.cedears).toHaveLength(2);
    expect(getAllCedears).toHaveBeenCalledTimes(2);
  });

  it('keeps an empty list when the request fails', async () => {
    getAllCedears.mockRejectedValueOnce(new Error('Yahoo down'));
    const { result } = renderHook(() => useCedearsForView('cedears'));
    await waitFor(() => expect(getAllCedears).toHaveBeenCalledOnce());
    expect(result.current.cedears).toEqual([]);
  });
});
