import { useCallback, useEffect, useState } from "react";
import type { BasicTarget } from "../utils/domTarget";
import { useLatestElement } from "../utils/domTarget";
import type { IHookStateInitAction } from "../utils/hookState";
import useEventListener from "../useEventListener";
import { defaultOptions } from "../utils/defaults";

export interface MousePressedOptions {
  /**
   * Listen to `touchstart` `touchend` events
   *
   * @default true
   */
  touch?: boolean;

  /**
   * Listen to `dragstart` `drop` and `dragend` events
   *
   * @default true
   */
  drag?: boolean;

  /**
   * Initial values
   *
   * @default false
   */
  initialValue?: IHookStateInitAction<boolean>;
}

export type MouseSourceType = "mouse" | "touch" | null;

const listenerOptions = { passive: true };

export default function useMousePressed(
  target?: BasicTarget,
  options: MousePressedOptions = defaultOptions,
): readonly [boolean, MouseSourceType] {
  const { touch = true, drag = true, initialValue = false } = options;

  const [pressed, setPressed] = useState(initialValue);
  const [sourceType, setSourceType] = useState<MouseSourceType>(null);
  const element = useLatestElement(target);

  const onPressed = useCallback(
    (srcType: MouseSourceType) => () => {
      setPressed(true);
      setSourceType(srcType);
    },
    [],
  );
  const onReleased = useCallback(() => {
    setPressed(false);
    setSourceType(null);
  }, []);

  useEventListener("mousedown", onPressed("mouse"), target, listenerOptions);
  useEventListener("mouseleave", onReleased, () => window, listenerOptions);
  useEventListener("mouseup", onReleased, () => window, listenerOptions);

  useEffect(() => {
    if (drag) {
      element?.addEventListener(
        "dragstart",
        onPressed("mouse"),
        listenerOptions,
      );
      element?.addEventListener("drop", onReleased, listenerOptions);
      element?.addEventListener("dragend", onReleased, listenerOptions);
    }

    if (touch) {
      element?.addEventListener(
        "touchstart",
        onPressed("touch"),
        listenerOptions,
      );
      element?.addEventListener("touchend", onReleased, listenerOptions);
      element?.addEventListener("touchcancel", onReleased, listenerOptions);
    }

    return () => {
      if (drag) {
        element?.removeEventListener("dragstart", onPressed("mouse"));
        element?.removeEventListener("drop", onReleased);
        element?.removeEventListener("dragend", onReleased);
      }
      if (touch) {
        element?.removeEventListener("touchstart", onPressed("touch"));
        element?.removeEventListener("touchend", onReleased);
        element?.removeEventListener("touchcancel", onReleased);
      }
    };
  }, [drag, onPressed, onReleased, touch, element]);

  return [pressed, sourceType] as const;
}
