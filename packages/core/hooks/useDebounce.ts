import { useEffect, useState } from "react";
import type { DebounceSettings } from "./utils/external";
import useDebounceFn from "./useDebounceFn";

export default function useDebounce<T>(
  value: T,
  wait?: number,
  options?: DebounceSettings,
) {
  const [debounced, setDebounced] = useState(value);

  const { run } = useDebounceFn(
    () => {
      setDebounced(value);
    },
    wait,
    options,
  );

  useEffect(() => {
    run();
  }, [run, value]);

  return debounced;
}
