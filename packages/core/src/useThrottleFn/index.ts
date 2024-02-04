import { useMemo } from "react";
import type { ThrottleSettings } from "lodash-es";
import { throttle } from "lodash-es";
import { isDev, isFunction } from "../utils/is";
import useLatest from "../useLatest";
import useUnmount from "../useUnmount";

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
    [wait, options],
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
