import type { MutableRefObject } from "react";
import { useEffect, useRef } from "react";

export default function useLatest<T>(value: T): MutableRefObject<T> {
  const ref = useRef(value);
  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref;
}
