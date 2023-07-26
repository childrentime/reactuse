import { defaultWindow } from "../utils/browser";
import type { BasicTarget } from "../utils/domTarget";
import { getTargetElement } from "../utils/domTarget";
import useEventListener from "../useEventListener";
import useLatest from "../useLatest";

type EventType = MouseEvent | TouchEvent;

const listerOptions = {
  passive: true,
};
export default function useClickOutside(
  target: BasicTarget,
  handler: (evt: EventType) => void,
): void {
  const savedHandler = useLatest(handler);

  const listener = (event: EventType) => {
    const element = getTargetElement(target);
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
}
