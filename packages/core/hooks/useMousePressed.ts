import { useCallback, useState } from "react";
import { BasicTarget, getTargetElement } from "./utils/domTarget";
import { IHookStateInitAction } from "./utils/hookState";
import useEventListener from "./useEventListener";
import useMount from "./useMount";

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

export default function useMousePressed(
  target?: BasicTarget,
  options: MousePressedOptions = {}
): readonly [boolean, MouseSourceType] {
  const { touch = true, drag = true, initialValue = false } = options;

  const [pressed, setPressed] = useState(initialValue);
  const [sourceType, setSourceType] = useState<MouseSourceType>(null);

  const onPressed = useCallback(
    (srcType: MouseSourceType) => () => {
      setPressed(true);
      setSourceType(srcType);
    },
    []
  );
  const onReleased = useCallback(() => {
    setPressed(false);
    setSourceType(null);
  }, []);

  useEventListener("mousedown", onPressed("mouse"), target, { passive: true });
  useEventListener("mouseleave", onReleased, () => window, { passive: true });
  useEventListener("mouseup", onReleased, () => window, { passive: true });

  useMount(() => {
    const element = getTargetElement(target);
    if (drag) {
      element?.addEventListener("dragstart", onPressed("mouse"), {
        passive: true,
      });
      element?.addEventListener("drop", onReleased, {
        passive: true,
      });
      element?.addEventListener("dragend", onReleased, {
        passive: true,
      });
    }

    if (touch) {
      element?.addEventListener("touchstart", onPressed("touch"), {
        passive: true,
      });
      element?.addEventListener("touchend", onReleased, {
        passive: true,
      });
      element?.addEventListener("touchcancel", onReleased, {
        passive: true,
      });
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
  });

  return [pressed, sourceType] as const;
}
