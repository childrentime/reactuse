import { useCallback, useRef, useState } from 'react';
import { useMountedState } from '../useMountedState';
import type { UseAsyncFn, UseAsyncFnState } from './interface';

export const useAsyncFn: UseAsyncFn = <T, Args extends any[] = any[]>(
  fn: (...args: Args) => Promise<T>,
  initialState: Partial<UseAsyncFnState<T>> = {},
) => {
  const lastCallId = useRef(0);
  const isMounted = useMountedState();

  const [state, setState] = useState<UseAsyncFnState<T>>({
    loading: initialState.loading ?? false,
    error: initialState.error,
    value: initialState.value,
  });

  const callback = useCallback(
    async (...args: Args): Promise<T | undefined> => {
      const callId = ++lastCallId.current;

      if (!state.loading) {
        setState(prev => ({ ...prev, loading: true }));
      }

      try {
        const value = await fn(...args);
        if (isMounted() && callId === lastCallId.current) {
          setState({ loading: false, error: undefined, value });
        }
        return value;
      } catch (error) {
        if (isMounted() && callId === lastCallId.current) {
          setState({ loading: false, error: error as Error, value: undefined });
        }
        return undefined;
      }
    },
    [fn],
  );

  return [state, callback] as const;
};
