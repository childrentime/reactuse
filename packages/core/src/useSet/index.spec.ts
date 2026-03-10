import { act, renderHook } from '@testing-library/react';
import { useSet } from '.';

describe('useSet', () => {
  it('should initialize with values', () => {
    const { result } = renderHook(() => useSet([1, 2, 3]));
    const [set] = result.current;
    expect(set.size).toBe(3);
    expect(set.has(1)).toBe(true);
  });

  it('should initialize empty', () => {
    const { result } = renderHook(() => useSet<number>());
    const [set] = result.current;
    expect(set.size).toBe(0);
  });

  it('should add values', () => {
    const { result } = renderHook(() => useSet<number>());
    act(() => result.current[1].add(1));
    expect(result.current[0].has(1)).toBe(true);
  });

  it('should remove values', () => {
    const { result } = renderHook(() => useSet([1, 2, 3]));
    act(() => result.current[1].remove(2));
    expect(result.current[0].has(2)).toBe(false);
    expect(result.current[0].size).toBe(2);
  });

  it('should toggle values', () => {
    const { result } = renderHook(() => useSet([1, 2]));
    act(() => result.current[1].toggle(2));
    expect(result.current[0].has(2)).toBe(false);
    act(() => result.current[1].toggle(3));
    expect(result.current[0].has(3)).toBe(true);
  });

  it('should clear', () => {
    const { result } = renderHook(() => useSet([1, 2, 3]));
    act(() => result.current[1].clear());
    expect(result.current[0].size).toBe(0);
  });

  it('should reset', () => {
    const { result } = renderHook(() => useSet([1, 2, 3]));
    act(() => result.current[1].add(4));
    act(() => result.current[1].reset());
    expect(result.current[0].size).toBe(3);
    expect(result.current[0].has(4)).toBe(false);
  });
});
