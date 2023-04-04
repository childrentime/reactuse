import { useMemo } from "react";
import { debounce } from "lodash";
import { isDev, isFunction } from "./utils/is";
import useLatest from "./useLatest";
import useUnmount from "./useUnmount";
import type { DebounceSettings } from "./utils/external";

export default function useDebounceFn<T extends (...args: any) => any>(
  fn: T,
  wait?: number,
  options?: DebounceSettings,
) {
  if (isDev) {
    if (!isFunction(fn)) {
      console.error(
        `useDebounceFn expected parameter is a function, got ${typeof fn}`,
      );
    }
  }

  const fnRef = useLatest(fn);

  const debounced = useMemo(
    () =>
      debounce(
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
    debounced.cancel();
  });

  return {
    run: debounced,
    cancel: debounced.cancel,
    flush: debounced.flush,
  };
}
