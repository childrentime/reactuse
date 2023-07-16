import { useCallback, useRef } from "react";
import type { BasicTarget } from "../utils/domTarget";
import { useLatestElement } from "../utils/domTarget";
import useLatest from "../useLatest";
import useDeepCompareEffect from "../useDeepCompareEffect";

export default function useResizeObserver(
  target: BasicTarget,
  callback: ResizeObserverCallback,
  options: ResizeObserverOptions = {},
): () => void {
  const savedCallback = useLatest(callback);
  const observerRef = useRef<ResizeObserver>();
  const element = useLatestElement(target);

  const stop = useCallback(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }
  }, []);
  useDeepCompareEffect(() => {
    if (!element) {
      return;
    }
    observerRef.current = new ResizeObserver(savedCallback.current);
    observerRef.current.observe(element, options);

    return stop;
  }, [options, element]);

  return stop;
}
