import { useEffect, useState } from "react";
import useEventListener from "../useEventListener";

export default function useWindowsFocus(
  defauleValue: boolean = false
): boolean {
  const [focused, setFocused] = useState(defauleValue);

  useEffect(() => {
    setFocused(window.document.hasFocus());
  }, []);

  useEventListener("blur", () => {
    setFocused(false);
  });

  useEventListener("focus", () => {
    setFocused(true);
  });

  return focused;
}
