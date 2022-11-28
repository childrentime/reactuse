import { BasicTarget, getTargetElement } from "./utils/domTarget";
import { useEffect, useState } from "react";
import useResizeObserver from "./useResizeObserver";
import useEvent from "./useEvent";

export interface UseElementBoundingOptions {
  /**
   * Reset values to 0 on component unmounted
   *
   * @default true
   */
  reset?: boolean;

  /**
   * Listen to window resize event
   *
   * @default true
   */
  windowResize?: boolean;
  /**
   * Listen to window scroll event
   *
   * @default true
   */
  windowScroll?: boolean;

  /**
   * Immediately call update on component mounted
   *
   * @default true
   */
  immediate?: boolean;
}

export default function useElementBounding(
  target: BasicTarget,
  options: UseElementBoundingOptions = {}
): {
  readonly height: number;
  readonly bottom: number;
  readonly left: number;
  readonly right: number;
  readonly top: number;
  readonly width: number;
  readonly x: number;
  readonly y: number;
  readonly update: () => void;
} {
  const {
    reset = true,
    windowResize = true,
    windowScroll = true,
    immediate = true,
  } = options;

  const [height, setHeight] = useState(0);
  const [bottom, setBottom] = useState(0);
  const [left, setLeft] = useState(0);
  const [right, setRight] = useState(0);
  const [top, setTop] = useState(0);
  const [width, setWidth] = useState(0);
  const [x, setX] = useState(0);
  const [y, setY] = useState(0);

  const update = useEvent(() => {
    const element = getTargetElement(target);

    if (!element) {
      if (reset) {
        setHeight(0);
        setBottom(0);
        setLeft(0);
        setRight(0);
        setTop(0);
        setWidth(0);
        setX(0);
        setY(0);
      }
      return;
    }

    const rect = element.getBoundingClientRect();
    setHeight(rect.height);
    setBottom(rect.bottom);
    setLeft(rect.left);
    setRight(rect.right);
    setTop(rect.top);
    setWidth(rect.width);
    setX(rect.x);
    setY(rect.y);
  });

  useResizeObserver(target, update);

  useEffect(() => {
    if (immediate) {
      update();
    }
  }, [immediate, update]);

  useEffect(() => {
    if (windowScroll) {
      window.addEventListener("scroll", update, { passive: true });
    }
    if (windowResize) {
      window.addEventListener("resize", update, { passive: true });
    }

    return () => {
      if (windowScroll) {
        window.removeEventListener("scroll", update);
      }
      if (windowResize) {
        window.removeEventListener("resize", update);
      }
    };
  }, [update, windowResize, windowScroll]);

  return {
    height,
    bottom,
    left,
    right,
    top,
    width,
    x,
    y,
    update,
  } as const;
}
