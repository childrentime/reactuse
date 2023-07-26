import { useEffect, useState } from "react";
import useEventListener from "../useEventListener";
import { isBrowser } from "../utils/is";

const getInitialState = (defaultValue?: DocumentVisibilityState) => {
  // Prevent a React hydration mismatch when a default value is provided.
  if (defaultValue !== undefined) {
    return defaultValue;
  }

  if (isBrowser) {
    return document.visibilityState;
  }

  if (process.env.NODE_ENV !== "production") {
    console.warn(
      "`useDocumentVisibility` When server side rendering, defaultValue should be defined to prevent a hydration mismatches.",
    );
  }

  return "visible";
};

export default function useDocumentVisibility(
  defaultValue?: DocumentVisibilityState,
): DocumentVisibilityState {
  const [visible, setVisible] = useState<DocumentVisibilityState>(
    getInitialState(defaultValue),
  );

  useEventListener(
    "visibilitychange",
    () => {
      setVisible(document.visibilityState);
    },
    () => document,
  );

  useEffect(() => {
    setVisible(document.visibilityState);
  }, [])

  return visible;
}
