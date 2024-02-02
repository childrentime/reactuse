import type { RefObject } from "react";
import { defaultWindow } from "../utils/browser";
import useEventListener from "../useEventListener";
import useLatest from "../useLatest";
import type { EventType, UseClickOutside } from "./interface";

const listerOptions = {
  passive: true,
};

export const useClickOutside: UseClickOutside = (
  target: RefObject<Element>,
  handler: (evt: EventType) => void,
): void => {
  const savedHandler = useLatest(handler);

  const listener = (event: EventType) => {
    const element = target.current;
    if (!element) {
      return;
    }

    const elements = event.composedPath();
    if (element === event.target || elements.includes(element)) {
      return;
    }

    savedHandler.current(event);
  };

  useEventListener("mousedown", listener, defaultWindow, listerOptions);
  useEventListener("touchstart", listener, defaultWindow, listerOptions);
};
