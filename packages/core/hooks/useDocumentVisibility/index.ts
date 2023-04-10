import { useState } from "react";
import useEventListener from "../useEventListener";

export default function useDocumentVisibility(): DocumentVisibilityState {
  const [visible, setVisible] = useState<DocumentVisibilityState>(() => {
    if (typeof document === "undefined") {
      return "visible";
    }
    else {
      return document.visibilityState;
    }
  });

  useEventListener(
    "visibilitychange",
    () => {
      setVisible(document.visibilityState);
    },
    () => document,
  );

  return visible;
}
