import { act, renderHook } from '@testing-library/react';
import { useMouseWheel } from '.';

describe('useMouseWheel', () => {
  it('should track mouse wheel', () => {
    const { result } = renderHook(() => useMouseWheel());
    expect(result.current).toBe(0);

    act(() => {
      window.dispatchEvent(new WheelEvent('wheel', { deltaY: 100 }));
    });
    expect(result.current).toBe(100);
  });
});
