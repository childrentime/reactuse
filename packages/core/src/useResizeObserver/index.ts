import type { RefObject } from "react";
import { useCallback, useEffect, useRef } from "react";
import ResizeObserver from "resize-observer-polyfill";
import { useLatest } from "../useLatest";

export const useResizeObserver = (
  target: RefObject<Element>,
  callback: ResizeObserverCallback,
): () => void => {
  const savedCallback = useLatest(callback);
  const observerRef = useRef<ResizeObserver>();

  const stop = useCallback(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }
  }, []);
  useEffect(() => {
    const element = target.current;
    if (!element) {
      return;
    }
    observerRef.current = new ResizeObserver(savedCallback.current);
    observerRef.current.observe(element);

    return stop;
  }, [savedCallback, stop, target]);

  return stop;
};
