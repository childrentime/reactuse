import type { UseTimeoutFnOptions } from "./useTimeoutFn";
import useTimeoutFn from "./useTimeoutFn";
import useUpdate from "./useUpdate";

export default function useTimeout(ms = 0, options: UseTimeoutFnOptions = {}) {
  const update = useUpdate();

  return useTimeoutFn(update, ms, options);
}
