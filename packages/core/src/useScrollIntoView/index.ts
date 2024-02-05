import { useEffect, useRef } from "react";
import { useEventListener } from "../useEventListener";
import { useReducedMotion } from "../useReducedMotion";
import { defaultOptions } from "../utils/defaults";
import type { BasicTarget } from "../utils/domTarget";
import { getTargetElement } from "../utils/domTarget";
import {
  getScrollParent,
  getScrollStart,
  setScrollParam,
} from "../utils/scroll";
import { easeInOutQuad } from "./ease-in-out-quad";
import { getRelativePosition } from "./get-relative-position";
import type { UseScrollIntoView, UseScrollIntoViewAnimation, UseScrollIntoViewParams } from "./interface";

const listenerOptions = { passive: true };

export const useScrollIntoView: UseScrollIntoView = (
  targetElement: BasicTarget<HTMLElement>,
  {
    duration = 1250,
    axis = "y",
    onScrollFinish,
    easing = easeInOutQuad,
    offset = 0,
    cancelable = true,
    isList = false,
  }: UseScrollIntoViewParams = defaultOptions,
  scrollElement?: BasicTarget<HTMLElement>,
) => {
  const frameID = useRef(0);
  const startTime = useRef(0);
  const shouldStop = useRef(false);

  const reducedMotion = useReducedMotion(false);

  const cancel = (): void => {
    if (frameID.current) {
      cancelAnimationFrame(frameID.current);
    }
  };

  const element = getTargetElement(targetElement);

  const scrollIntoView = ({
    alignment = "start",
  }: UseScrollIntoViewAnimation = {}) => {
    const parent
      = getTargetElement(scrollElement) || getScrollParent(axis, element);
    shouldStop.current = false;

    if (frameID.current) {
      cancel();
    }

    const start = getScrollStart({ parent, axis }) ?? 0;
    const change
      = getRelativePosition({
        parent,
        target: element,
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
  };

  const handleStop = () => {
    if (cancelable) {
      shouldStop.current = true;
    }
  };

  useEventListener("wheel", handleStop, null, listenerOptions);
  useEventListener("touchmove", handleStop, null, listenerOptions);

  useEffect(() => cancel, []);

  return {
    scrollIntoView,
    cancel,
  };
};
