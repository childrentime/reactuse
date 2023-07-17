import { useCallback, useRef } from "react";
import type { BasicTarget } from "../utils/domTarget";
import { useLatestElement } from "../utils/domTarget";
import useLatest from "../useLatest";
import useDeepCompareEffect from "../useDeepCompareEffect";

export default function useMutationObserver(
  callback: MutationCallback,
  target: BasicTarget,
  options: MutationObserverInit = {},
): () => void {
  const callbackRef = useLatest(callback);
  const observerRef = useRef<MutationObserver>();
  const element = useLatestElement(target);

  const stop = useCallback(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }
  }, []);

  useDeepCompareEffect(() => {
    if (!element) {
      return;
    }
    observerRef.current = new MutationObserver(callbackRef.current);

    observerRef.current.observe(element, options);
    return stop;
  }, [options, element]);

  return stop;
}
