import { useCallback, useEffect, useRef } from "react";
import type { BasicTarget } from "../utils/domTarget";
import { useLatestElement } from "../utils/domTarget";
import useLatest from "../useLatest";
import { defaultOptions } from "../utils/defaults";

export default function useIntersectionObserver(
  target: BasicTarget,
  callback: IntersectionObserverCallback,
  options: IntersectionObserverInit = defaultOptions,
): () => void {
  const savedCallback = useLatest(callback);
  const observerRef = useRef<IntersectionObserver>();
  const element = useLatestElement(target);

  const stop = useCallback(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }
  }, []);

  useEffect(() => {
    if (!element) {
      return;
    }

    observerRef.current = new IntersectionObserver(
      savedCallback.current,
      options,
    );
    observerRef.current.observe(element);

    return stop;
  }, [options, element]);

  return stop;
}
