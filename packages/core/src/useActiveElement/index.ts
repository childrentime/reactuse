import { useCallback, useState } from "react";
import useEventListener from "../useEventListener";
import type { UseActiveElementType } from "./interface";

export const useActiveElement: UseActiveElementType = <T extends Element>(): T | null => {
  const [active, setActive] = useState<T | null>(null);

  const listener = useCallback(() => {
    setActive(window?.document.activeElement as T);
  }, []);
  useEventListener("blur", listener, () => window, true);
  useEventListener("focus", listener, () => window, true);

  return active;
};
