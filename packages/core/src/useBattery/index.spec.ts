import { renderHook } from '@testing-library/react';
import { useBattery } from '.';

describe('useBattery', () => {
  it('should return initial state', () => {
    const { result } = renderHook(() => useBattery());
    expect(typeof result.current.isSupported).toBe('boolean');
    expect(typeof result.current.level).toBe('number');
    expect(typeof result.current.charging).toBe('boolean');
  });
});
