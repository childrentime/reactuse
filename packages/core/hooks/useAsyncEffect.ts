import useMountedState from "./useMountedState";
import { DependencyList, useEffect } from "react";
import { noop } from "./utils/is";

export default function useAsyncEffect<T extends void>(
  effect: () => Promise<T> | T,
  cleanup: typeof effect = <any>noop,
  deps?: DependencyList
) {
  const mounted = useMountedState();
  useEffect(() => {
    const execute = async () => {
      if (!mounted()) {
        return;
      }
      await effect();
    };

    execute();

    return () => {
      cleanup();
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
