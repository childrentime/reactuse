import { BasicTarget, getTargetElement } from "./utils/domTarget";
import { useCallback, useRef } from "react";
import useLatest from "./useLatest";
import useDeepCompareEffect from "./useDeepCompareEffect";

// TODO 当target可变的时候 我们需要跟踪这种变化
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
  }, [options, target]);

  return stop;
}
