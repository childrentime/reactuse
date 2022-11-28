import { useRef, useCallback } from "react";
import { Fn } from "./utils/types";
import { isDev, isFunction } from "./utils/is";
import useIsomorphicLayoutEffect from "./useIsomorphicLayoutEffect";

type PickFunction<T extends Fn> = (
  this: ThisParameterType<T>,
  ...args: Parameters<T>
) => ReturnType<T>;

export default function useEvent<T extends Fn>(fn: T) {
  if (isDev) {
    if (!isFunction(fn)) {
      console.error(
        `useEvent expected parameter is a function, got ${typeof fn}`
      );
    }
  }

  const handlerRef = useRef(fn);
  useIsomorphicLayoutEffect(() => {
    handlerRef.current = fn;
  }, [fn]);
  return useCallback<PickFunction<T>>((...args) => {
    const fn = handlerRef.current;
    return fn(...args);
  }, []) as T;
}
