import { useTimeoutFn } from "../useTimeoutFn";
import type { UseTimeoutFnOptions } from "../useTimeoutFn/interface";
import { useUpdate } from "../useUpdate";
import type { UseTimeout } from "./interface";

export const useTimeout: UseTimeout = (ms = 0, options: UseTimeoutFnOptions = {}) => {
  const update = useUpdate();

  return useTimeoutFn(update, ms, options);
};
