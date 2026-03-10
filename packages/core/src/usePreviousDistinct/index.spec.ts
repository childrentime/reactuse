import { renderHook } from '@testing-library/react';
import { usePreviousDistinct } from '.';

describe('usePreviousDistinct', () => {
  it('should return undefined initially', () => {
    const { result } = renderHook(() => usePreviousDistinct(0));
    expect(result.current).toBeUndefined();
  });

  it('should return previous distinct value', () => {
    const { result, rerender } = renderHook(({ value }) => usePreviousDistinct(value), {
      initialProps: { value: 0 },
    });
    expect(result.current).toBeUndefined();

    rerender({ value: 1 });
    expect(result.current).toBe(0);

    rerender({ value: 1 }); // same value
    expect(result.current).toBe(0); // should not update

    rerender({ value: 2 });
    expect(result.current).toBe(1);
  });

  it('should accept custom compare', () => {
    const compare = (prev: { id: number } | undefined, next: { id: number }) =>
      prev?.id === next.id;

    const { result, rerender } = renderHook(
      ({ value }) => usePreviousDistinct(value, compare),
      { initialProps: { value: { id: 1 } } },
    );

    rerender({ value: { id: 1 } }); // same id
    expect(result.current).toBeUndefined();

    rerender({ value: { id: 2 } }); // different id
    expect(result.current).toEqual({ id: 1 });
  });
});
