import { useCallback, useRef } from "react";
import { useLatest } from "../useLatest";
import { defaultOptions } from "../utils/defaults";
import { useDeepCompareEffect } from "../useDeepCompareEffect";
import { getTargetElement } from "../utils/domTarget";
import type { UseIntersectionObserver } from "./interface";

export const useIntersectionObserver: UseIntersectionObserver = (
  target,
  callback: IntersectionObserverCallback,
  options: IntersectionObserverInit = defaultOptions,
): () => void => {
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
      options,
    );
    observerRef.current.observe(element);

    return stop;
  }, [options]);

  return stop;
};
