import { useEventListener, useLatest } from "@reactuses/core";
import { BasicTarget, getTargetElement } from "./../utils/domTarget";

type EventType = MouseEvent | TouchEvent;
export default function useClickOutSide(
  target: BasicTarget,
  handler: (evt: EventType) => void
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

  useEventListener("mousedown", listener, window, {
    passive: true,
  });
  useEventListener("touchstart", listener, window, {
    passive: true,
  });
}
