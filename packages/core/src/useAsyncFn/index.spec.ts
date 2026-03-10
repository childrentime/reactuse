import { act, renderHook } from '@testing-library/react';
import { useAsyncFn } from '.';

describe('useAsyncFn', () => {
  it('should have initial state', () => {
    const { result } = renderHook(() =>
      useAsyncFn(async () => 'test')
    );
    expect(result.current[0].loading).toBe(false);
    expect(result.current[0].error).toBeUndefined();
    expect(result.current[0].value).toBeUndefined();
  });

  it('should resolve', async () => {
    const { result } = renderHook(() =>
      useAsyncFn(async () => 'hello')
    );

    await act(async () => {
      await result.current[1]();
    });

    expect(result.current[0].loading).toBe(false);
    expect(result.current[0].value).toBe('hello');
  });

  it('should handle errors', async () => {
    const { result } = renderHook(() =>
      useAsyncFn(async () => { throw new Error('fail'); })
    );

    await act(async () => {
      await result.current[1]();
    });

    expect(result.current[0].loading).toBe(false);
    expect(result.current[0].error?.message).toBe('fail');
  });
});
