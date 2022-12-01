import { useCallback, useState } from "react";
import useEventListener from "./useEventListener";

export default function useActiveElement<T extends Element>(): T | null {
  const [active, setActive] = useState<T | null>(null);

  const listener = useCallback(() => {
    setActive(window?.document.activeElement as T);
  }, []);
  useEventListener("blur", listener, () => window, true);
  useEventListener("focus", listener, () => window, true);

  return active;
}
