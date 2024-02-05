import { useCallback, useRef } from "react";
import type { Fn } from "../utils/types";
import { isDev, isFunction } from "../utils/is";
import { useIsomorphicLayoutEffect } from "../useIsomorphicLayoutEffect";
import type { UseEvent } from "./interface";

type PickFunction<T extends Fn> = (
  this: ThisParameterType<T>,
  ...args: Parameters<T>
) => ReturnType<T>;

/**
 * keep function reference immutable
 */
export const useEvent: UseEvent = <T extends Fn>(fn: T) => {
  if (isDev) {
    if (!isFunction(fn)) {
      console.error(
        `useEvent expected parameter is a function, got ${typeof fn}`,
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
};
