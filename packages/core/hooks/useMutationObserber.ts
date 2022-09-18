import { BasicTarget, getTargetElement } from "../utils/domTarget";
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
    observerRef.current = new MutationObserver(callbackRef.current);

    observerRef.current.observe(element, options);
    return stop;
  }, [options]);

  return stop;
}
