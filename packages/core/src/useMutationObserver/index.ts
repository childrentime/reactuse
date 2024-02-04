import type { RefObject } from "react";
import { useCallback, useRef } from "react";
import { useLatest } from "../useLatest";
import { defaultOptions } from "../utils/defaults";
import { useDeepCompareEffect } from "..";
import type { UseMutationObserver } from "./interface";

export const useMutationObserver: UseMutationObserver = (
  callback: MutationCallback,
  target: RefObject<Element>,
  options: MutationObserverInit = defaultOptions,
): (() => void) => {
  const callbackRef = useLatest(callback);
  const observerRef = useRef<MutationObserver>();

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
    observerRef.current = new MutationObserver(callbackRef.current);

    observerRef.current.observe(element, options);
    return stop;
  }, [options]);

  return stop;
};
