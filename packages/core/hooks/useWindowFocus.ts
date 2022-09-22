import { useState } from "react";
import useEventListener from "./useEventListener";

export default function useWindowsFocus(): boolean {
  const [focused, setFocused] = useState(() => {
    if (!window) {
      return false;
    }
    return window.document.hasFocus();
  });

  useEventListener("blur", () => {
    setFocused(false);
  });

  useEventListener("focus", () => {
    setFocused(true);
  });

  return focused;
}
