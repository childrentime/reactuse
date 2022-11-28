import { useCallback, useRef } from "react";
import { BasicTarget, getTargetElement } from "./utils/domTarget";
import useDeepCompareEffect from "./useDeepCompareEffect";
import useLatest from "./useLatest";

export default function useIntersectionObserver(
  target: BasicTarget,
  callback: IntersectionObserverCallback,
  options: IntersectionObserverInit = {}
): () => void {
  const savedCallback = useLatest(callback);
  const observerRef = useRef<IntersectionObserver>();

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

    observerRef.current = new IntersectionObserver(
      savedCallback.current,
      options
    );
    observerRef.current.observe(element);

    return stop;
  }, [options]);

  return stop;
}
