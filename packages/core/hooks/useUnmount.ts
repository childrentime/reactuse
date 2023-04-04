import { useEffect } from "react";
import useLatest from "./useLatest";
import { isDev, isFunction } from "./utils/is";

export default function useUnmount(fn: () => void) {
  if (isDev) {
    if (!isFunction(fn)) {
      console.error(
        `useUnmount expected parameter is a function, got ${typeof fn}`,
      );
    }
  }

  const fnRef = useLatest(fn);

  useEffect(
    () => () => {
      fnRef.current();
    },
    [fnRef],
  );
}
