import { useCallback, useEffect, useRef } from "react";
import ResizeObserver from "resize-observer-polyfill";
import type { BasicTarget } from "../utils/domTarget";
import { useLatestElement } from "../utils/domTarget";
import useLatest from "../useLatest";
import { defaultOptions } from "../utils/defaults";

export default function useResizeObserver(
  target: BasicTarget,
  callback: ResizeObserverCallback,
  options: ResizeObserverOptions = defaultOptions,
): () => void {
  const savedCallback = useLatest(callback);
  const observerRef = useRef<ResizeObserver>();
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
    observerRef.current = new ResizeObserver(savedCallback.current);
    observerRef.current.observe(element, options);

    return stop;
  }, [options, element]);

  return stop;
}
