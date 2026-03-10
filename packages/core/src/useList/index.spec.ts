import { act, renderHook } from '@testing-library/react';
import { useList } from '.';

describe('useList', () => {
  it('should initialize with values', () => {
    const { result } = renderHook(() => useList([1, 2, 3]));
    expect(result.current[0]).toEqual([1, 2, 3]);
  });

  it('should push items', () => {
    const { result } = renderHook(() => useList([1]));
    act(() => result.current[1].push(2, 3));
    expect(result.current[0]).toEqual([1, 2, 3]);
  });

  it('should remove at index', () => {
    const { result } = renderHook(() => useList([1, 2, 3]));
    act(() => result.current[1].removeAt(1));
    expect(result.current[0]).toEqual([1, 3]);
  });

  it('should insert at index', () => {
    const { result } = renderHook(() => useList([1, 3]));
    act(() => result.current[1].insertAt(1, 2));
    expect(result.current[0]).toEqual([1, 2, 3]);
  });

  it('should clear', () => {
    const { result } = renderHook(() => useList([1, 2, 3]));
    act(() => result.current[1].clear());
    expect(result.current[0]).toEqual([]);
  });

  it('should reset', () => {
    const { result } = renderHook(() => useList([1, 2, 3]));
    act(() => result.current[1].push(4));
    act(() => result.current[1].reset());
    expect(result.current[0]).toEqual([1, 2, 3]);
  });

  it('should sort', () => {
    const { result } = renderHook(() => useList([3, 1, 2]));
    act(() => result.current[1].sort((a, b) => a - b));
    expect(result.current[0]).toEqual([1, 2, 3]);
  });
});
