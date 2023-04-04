import { useMemo } from "react";
import { throttle } from "lodash";
import { isDev, isFunction } from "./utils/is";
import useLatest from "./useLatest";
import useUnmount from "./useUnmount";
import type { ThrottleSettings } from "./utils/external";

export default function useThrottleFn<T extends (...args: any) => any>(
  fn: T,
  wait?: number,
  options?: ThrottleSettings,
) {
  if (isDev) {
    if (!isFunction(fn)) {
      console.error(
        `useThrottleFn expected parameter is a function, got ${typeof fn}`,
      );
    }
  }

  const fnRef = useLatest(fn);

  const throttled = useMemo(
    () =>
      throttle(
        (...args: [...Parameters<T>]): ReturnType<T> => {
          return fnRef.current(...args);
        },
        wait,
        options,
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  useUnmount(() => {
    throttled.cancel();
  });

  return {
    run: throttled,
    cancel: throttled.cancel,
    flush: throttled.flush,
  };
}
