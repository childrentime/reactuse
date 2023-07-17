import { defaultWindow } from "../utils/browser";
import type { BasicTarget } from "../utils/domTarget";
import { useLatestElement } from "../utils/domTarget";
import useEventListener from "../useEventListener";
import useLatest from "../useLatest";

type EventType = MouseEvent | TouchEvent;
export default function useClickOutSide(
  target: BasicTarget,
  handler: (evt: EventType) => void,
): void {
  const savedHandler = useLatest(handler);
  const element = useLatestElement(target);

  const listener = (event: EventType) => {
    if (!element) {
      return;
    }

    const elements = event.composedPath();
    if (
      element === event.target
      || elements.includes(element)
    ) {
      return;
    }

    savedHandler.current(event);
  };

  useEventListener("mousedown", listener, defaultWindow, {
    passive: true,
  });
  useEventListener("touchstart", listener, defaultWindow, {
    passive: true,
  });
}
