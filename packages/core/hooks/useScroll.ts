import { useState } from "react";
import type { BasicTarget } from "./utils/domTarget";
import { noop } from "./utils/is";
import useDebounceFn from "./useDebounceFn";
import useEvent from "./useEvent";
import useEventListener from "./useEventListener";
import useThrottleFn from "./useThrottleFn";

export interface UseScrollOptions {
  /**
   * Throttle time for scroll event, it’s disabled by default.
   *
   * @default 0
   */
  throttle?: number;

  /**
   * The check time when scrolling ends.
   * This configuration will be setting to (throttle + idle) when the `throttle` is configured.
   *
   * @default 200
   */
  idle?: number;

  /**
   * Offset arrived states by x pixels
   *
   */
  offset?: {
    left?: number;
    right?: number;
    top?: number;
    bottom?: number;
  };

  /**
   * Trigger it when scrolling.
   *
   */
  onScroll?: (e: Event) => void;

  /**
   * Trigger it when scrolling ends.
   *
   */
  onStop?: (e: Event) => void;

  /**
   * Listener options for scroll event.
   *
   * @default {capture: false, passive: true}
   */
  eventListenerOptions?: boolean | AddEventListenerOptions;
}
/**
 * We have to check if the scroll amount is close enough to some threshold in order to
 * more accurately calculate arrivedState. This is because scrollTop/scrollLeft are non-rounded
 * numbers, while scrollHeight/scrollWidth and clientHeight/clientWidth are rounded.
 * https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollHeight#determine_if_an_element_has_been_totally_scrolled
 */
const ARRIVED_STATE_THRESHOLD_PIXELS = 1;

export default function useScroll(
  target: BasicTarget<HTMLElement | SVGElement | Window | Document>,
  options: UseScrollOptions = {},
): readonly [
    number,
    number,
    boolean,
    {
      left: boolean;
      right: boolean;
      top: boolean;
      bottom: boolean;
    },
    {
      left: boolean;
      right: boolean;
      top: boolean;
      bottom: boolean;
    },
  ] {
  const {
    throttle = 0,
    idle = 200,
    onStop = noop,
    onScroll = noop,
    offset = {
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
    },
    eventListenerOptions = {
      capture: false,
      passive: true,
    },
  } = options;
  const [x, setX] = useState(0);
  const [y, setY] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const [arrivedState, setArrivedState] = useState({
    left: true,
    right: false,
    top: true,
    bottom: false,
  });
  const [directions, setDirections] = useState({
    left: false,
    right: false,
    top: false,
    bottom: false,
  });

  const { run: onScrollEnd } = useDebounceFn((e: Event) => {
    setIsScrolling(false);
    setDirections({ left: false, right: false, top: false, bottom: false });
    onStop(e);
  }, throttle + idle);

  const onScrollHandler = useEvent((e: Event) => {
    const eventTarget = (
      e.target === document ? (e.target as Document).documentElement : e.target
    ) as HTMLElement;
    const scrollLeft = eventTarget.scrollLeft;
    let scrollTop = eventTarget.scrollTop;

    // patch for mobile compatible
    if (e.target === document && !scrollTop)
      scrollTop = document.body.scrollTop;
    setX(scrollLeft);
    setY(scrollTop);
    setDirections({
      left: scrollLeft < x,
      right: scrollLeft > x,
      top: scrollTop < y,
      bottom: scrollTop > y,
    });
    setArrivedState({
      left: scrollLeft <= 0 + (offset.left || 0),
      right:
        scrollLeft + eventTarget.clientWidth
        >= eventTarget.scrollWidth
          - (offset.right || 0)
          - ARRIVED_STATE_THRESHOLD_PIXELS,
      top: scrollTop <= 0 + (offset.top || 0),
      bottom:
        scrollTop + eventTarget.clientHeight
        >= eventTarget.scrollHeight
          - (offset.bottom || 0)
          - ARRIVED_STATE_THRESHOLD_PIXELS,
    });
    setIsScrolling(true);
    onScrollEnd(e);
    onScroll(e);
  });

  const { run: throttleOnScroll } = useThrottleFn(onScrollHandler, throttle);

  useEventListener(
    "scroll",
    throttle ? throttleOnScroll : onScrollHandler,
    target,
    eventListenerOptions,
  );

  return [x, y, isScrolling, arrivedState, directions] as const;
}
