import { useCallback, useRef } from "react";
import type { BasicTarget } from "./utils/domTarget";
import { useLatestElement } from "./utils/domTarget";
import useDeepCompareEffect from "./useDeepCompareEffect";
import useLatest from "./useLatest";

export default function useIntersectionObserver(
  target: BasicTarget,
  callback: IntersectionObserverCallback,
  options: IntersectionObserverInit = {},
): () => void {
  const savedCallback = useLatest(callback);
  const observerRef = useRef<IntersectionObserver>();
  const element = useLatestElement(target);

  const stop = useCallback(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }
  }, []);

  useDeepCompareEffect(() => {
    if (!element.current) {
      return;
    }

    observerRef.current = new IntersectionObserver(
      savedCallback.current,
      options,
    );
    observerRef.current.observe(element.current);

    return stop;
  }, [options, element.current]);

  return stop;
}
