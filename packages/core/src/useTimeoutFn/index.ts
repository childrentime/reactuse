import { useEffect, useRef, useState } from "react";
import type { Stoppable } from "../utils/types";
import useLatest from "../useLatest";
import useEvent from "../useEvent";
import { defaultOptions } from "../utils/defaults";

export interface UseTimeoutFnOptions {
  /**
   * Start the timer immediate after calling this function
   *
   * @default false
   */
  immediate?: boolean;
}
/**
 * Wrapper for `setTimeout` with controls.
 *
 * @param cb
 * @param interval
 * @param options
 */
export default function useTimeoutFn(
  cb: (...args: unknown[]) => any,
  interval: number,
  options: UseTimeoutFnOptions = defaultOptions,
): Stoppable {
  const { immediate = true } = options;
  const [pending, setPending] = useState(false);
  const savedCallback = useLatest(cb);

  const timer = useRef<ReturnType<typeof setTimeout>>();

  const stop = useEvent(() => {
    // will still be true when component unmount
    setPending(false);
    if (timer.current) {
      clearTimeout(timer.current);
    }
  });

  const start = useEvent((...args: unknown[]) => {
    if (timer) {
      clearTimeout(timer.current);
    }
    timer.current = setTimeout(() => {
      setPending(false);
      savedCallback.current(...args);
    }, interval);
    setPending(true);
  });

  useEffect(() => {
    if (immediate) {
      start();
    }

    return stop;
  }, [stop, immediate, interval, start]);

  return [pending, start, stop];
}
