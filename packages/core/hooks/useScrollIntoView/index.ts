import { useEffect, useRef } from "react";
import useEvent from "../useEvent";
import useEventListener from "../useEventListener";
import useReducedMotion from "../useReducedMotion";
import type { BasicTarget } from "../utils/domTarget";
import {
  getTargetElement,
  useLatestElement,
} from "../utils/domTarget";
import {
  getScrollParent,
  getScrollStart,
  setScrollParam,
} from "../utils/scroll";
import { easeInOutQuad } from "./ease-in-out-quad";
import { getRelativePosition } from "./get-relative-position";

export interface ScrollIntoViewAnimation {
  /** target element alignment relatively to parent based on current axis */
  alignment?: "start" | "end" | "center";
}

export interface ScrollIntoViewParams {
  /** callback fired after scroll */
  onScrollFinish?: () => void;

  /** duration of scroll in milliseconds */
  duration?: number;

  /** axis of scroll */
  axis?: "x" | "y";

  /** custom mathematical easing function */
  easing?: (t: number) => number;

  /** additional distance between nearest edge and element */
  offset?: number;

  /** indicator if animation may be interrupted by user scrolling */
  cancelable?: boolean;

  /** prevents content jumping in scrolling lists with multiple targets */
  isList?: boolean;
  targetElement: BasicTarget<HTMLElement>;
  scrollElement?: BasicTarget<HTMLElement>;
}

export default function useScrollIntoView({
  duration = 1250,
  axis = "y",
  onScrollFinish,
  easing = easeInOutQuad,
  offset = 0,
  cancelable = true,
  isList = false,
  targetElement,
  scrollElement,
}: ScrollIntoViewParams) {
  const frameID = useRef(0);
  const startTime = useRef(0);
  const shouldStop = useRef(false);

  const reducedMotion = useReducedMotion(false);

  const cancel = (): void => {
    if (frameID.current) {
      cancelAnimationFrame(frameID.current);
    }
  };

  const element = useLatestElement(targetElement);

  const scrollIntoView = useEvent(
    ({ alignment = "start" }: ScrollIntoViewAnimation = {}) => {
      const parent
        = getTargetElement(scrollElement)
        || getScrollParent(axis, element.current);
      shouldStop.current = false;

      if (frameID.current) {
        cancel();
      }

      const start = getScrollStart({ parent, axis }) ?? 0;
      const change
        = getRelativePosition({
          parent,
          target: element.current,
          axis,
          alignment,
          offset,
          isList,
        }) - (parent ? 0 : start);

      const animateScroll = () => {
        if (startTime.current === 0) {
          startTime.current = performance.now();
        }

        const now = performance.now();
        const elapsed = now - startTime.current;

        // easing timing progress
        const t = reducedMotion || duration === 0 ? 1 : elapsed / duration;

        const distance = start + change * easing(t);

        setScrollParam({
          parent,
          axis,
          distance,
        });

        if (!shouldStop.current && t < 1) {
          frameID.current = requestAnimationFrame(animateScroll);
        }
        else {
          typeof onScrollFinish === "function" && onScrollFinish();
          startTime.current = 0;
          frameID.current = 0;
          cancel();
        }
      };
      animateScroll();
    },
  );

  const handleStop = () => {
    if (cancelable) {
      shouldStop.current = true;
    }
  };

  useEventListener("wheel", handleStop, null, { passive: true });
  useEventListener("touchmove", handleStop, null, { passive: true });

  useEffect(() => cancel, []);

  return {
    scrollIntoView,
    cancel,
  };
}
