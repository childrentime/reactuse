import { defaultWindow } from "./utils/browser";
import type { BasicTarget } from "./utils/domTarget";
import { useLatestElement } from "./utils/domTarget";
import useEventListener from "./useEventListener";
import useLatest from "./useLatest";

type EventType = MouseEvent | TouchEvent;
export default function useClickOutSide(
  target: BasicTarget,
  handler: (evt: EventType) => void,
): void {
  const savedHandler = useLatest(handler);
  const element = useLatestElement(target);

  const listener = (event: EventType) => {
    if (!element.current) {
      return;
    }

    const elements = event.composedPath();
    if (
      element.current === event.target
      || elements.includes(element.current)
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
