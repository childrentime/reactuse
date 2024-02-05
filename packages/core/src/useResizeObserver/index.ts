import type { RefObject } from "react";
import { useCallback, useRef } from "react";
import { useLatest } from "../useLatest";
import { defaultOptions } from "../utils/defaults";
import { useDeepCompareEffect } from "../useDeepCompareEffect";

export const useResizeObserver = (
  target: RefObject<Element>,
  callback: ResizeObserverCallback,
  options: ResizeObserverOptions = defaultOptions,
): () => void => {
  const savedCallback = useLatest(callback);
  const observerRef = useRef<ResizeObserver>();

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
    observerRef.current = new ResizeObserver(savedCallback.current);
    observerRef.current.observe(element, options);

    return stop;
  }, [savedCallback, stop, target, options]);

  return stop;
};
