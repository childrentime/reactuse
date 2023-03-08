import { BasicTarget, useLatestElement } from "./utils/domTarget";
import useLatest from "./useLatest";
import useDeepCompareEffect from "./useDeepCompareEffect";
import { useCallback, useRef } from "react";

export default function useMutationObserver(
  callback: MutationCallback,
  target: BasicTarget,
  options: MutationObserverInit = {}
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
    if (!element.current) {
      return;
    }
    observerRef.current = new MutationObserver(callbackRef.current);

    observerRef.current.observe(element.current, options);
    return stop;
  }, [options, element]);

  return stop;
}
