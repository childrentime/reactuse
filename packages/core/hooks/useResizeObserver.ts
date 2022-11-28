import { BasicTarget, getTargetElement } from "./utils/domTarget";
import { useCallback, useRef } from "react";
import useLatest from "./useLatest";
import useDeepCompareEffect from "./useDeepCompareEffect";

export default function useResizeObserver(
  target: BasicTarget,
  callback: ResizeObserverCallback,
  options: ResizeObserverOptions = {}
): () => void {
  const savedCallback = useLatest(callback);
  const observerRef = useRef<ResizeObserver>();

  const stop = useCallback(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }
  }, []);
  useDeepCompareEffect(() => {
    const element = getTargetElement(target);
    if (!element) {
      return;
    }
    observerRef.current = new ResizeObserver(savedCallback.current);
    observerRef.current.observe(element, options);

    return stop;
  }, [options]);

  return stop;
}
