import { useEffect } from "react";
import useLatest from "./useLatest";

export default function useInterval(
  callback: () => void,
  delay?: number | null,
  options?: {
    immediate?: boolean;
  }
): void {
  const immediate = options?.immediate;
  const savedCallback = useLatest(callback);

  useEffect(() => {
    if (immediate) {
      savedCallback.current();
    }
    if (delay !== null) {
      const interval = setInterval(() => savedCallback.current(), delay || 0);
      return () => clearInterval(interval);
    }

    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [delay, immediate]);
}
