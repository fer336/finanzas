/**
 * Tests for Custom Hooks
 */
import { renderHook, act, waitFor } from '@testing-library/react';
import { useDebounce, useApiCache } from '../hooks';

describe('useDebounce', () => {
  jest.useFakeTimers();

  test('should debounce value changes', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 500 } }
    );

    expect(result.current).toBe('initial');

    // Change value
    rerender({ value: 'updated', delay: 500 });

    // Value should not change immediately
    expect(result.current).toBe('initial');

    // Fast-forward time
    act(() => {
      jest.advanceTimersByTime(500);
    });

    // Value should update after delay
    expect(result.current).toBe('updated');
  });

  test('should reset timer on rapid changes', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 500 } }
    );

    // Rapid changes
    rerender({ value: 'value1', delay: 500 });
    act(() => jest.advanceTimersByTime(200));
    
    rerender({ value: 'value2', delay: 500 });
    act(() => jest.advanceTimersByTime(200));
    
    rerender({ value: 'final', delay: 500 });

    // Should still be initial
    expect(result.current).toBe('initial');

    // Fast-forward full delay
    act(() => {
      jest.advanceTimersByTime(500);
    });

    // Should be the final value
    expect(result.current).toBe('final');
  });

  jest.useRealTimers();
});

describe('useApiCache', () => {
  test('should fetch data on mount', async () => {
    const mockApi = jest.fn().mockResolvedValue({ data: 'test' });

    const { result } = renderHook(() =>
      useApiCache(mockApi, [], { enabled: true })
    );

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual({ data: 'test' });
    expect(mockApi).toHaveBeenCalledTimes(1);
  });

  test('should use cached data on second call', async () => {
    const mockApi = jest.fn().mockResolvedValue({ data: 'test' });

    const { result: result1 } = renderHook(() =>
      useApiCache(mockApi, [], { cacheKey: 'test-key' })
    );

    await waitFor(() => {
      expect(result1.current.loading).toBe(false);
    });

    // Second hook with same cache key
    const { result: result2 } = renderHook(() =>
      useApiCache(mockApi, [], { cacheKey: 'test-key' })
    );

    await waitFor(() => {
      expect(result2.current.loading).toBe(false);
    });

    // Should use cached data
    expect(result2.current.data).toEqual({ data: 'test' });
    expect(result2.current.isFromCache).toBe(true);
    expect(mockApi).toHaveBeenCalledTimes(1); // Only called once
  });

  test('should refresh data when requested', async () => {
    const mockApi = jest.fn().mockResolvedValue({ data: 'test' });

    const { result } = renderHook(() =>
      useApiCache(mockApi, [], { cacheKey: 'refresh-test' })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockApi).toHaveBeenCalledTimes(1);

    // Refresh
    act(() => {
      result.current.refresh();
    });

    await waitFor(() => {
      expect(mockApi).toHaveBeenCalledTimes(2);
    });
  });

  test('should handle API errors', async () => {
    const mockApi = jest.fn().mockRejectedValue(new Error('API Error'));

    const { result } = renderHook(() =>
      useApiCache(mockApi, [], { cacheKey: 'error-test' })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('API Error');
    expect(result.current.data).toBeNull();
  });
});

