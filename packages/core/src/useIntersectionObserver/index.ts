import type { RefObject } from "react";
import { useCallback, useRef } from "react";
import useLatest from "../useLatest";
import { defaultOptions } from "../utils/defaults";
import { useDeepCompareEffect } from "../useDeepCompareEffect";

export const useIntersectionObserver = (
  target: RefObject<Element>,
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
    const element = target.current;
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
