import type { RefObject } from "react";
import { getTargetElement } from "../utils/domTarget";
import { useEventListener } from "../useEventListener";
import useRafState from "../useRafState";
import type { CursorState, UseMouse } from "./interface";

const initState: CursorState = {
  screenX: Number.NaN,
  screenY: Number.NaN,
  clientX: Number.NaN,
  clientY: Number.NaN,
  pageX: Number.NaN,
  pageY: Number.NaN,
  elementX: Number.NaN,
  elementY: Number.NaN,
  elementH: Number.NaN,
  elementW: Number.NaN,
  elementPosX: Number.NaN,
  elementPosY: Number.NaN,
};

export const useMouse: UseMouse = (target?: RefObject<Element>): CursorState => {
  const [state, setState] = useRafState(initState);

  useEventListener(
    "mousemove",
    (event: MouseEvent) => {
      const { screenX, screenY, clientX, clientY, pageX, pageY } = event;
      const newState = {
        screenX,
        screenY,
        clientX,
        clientY,
        pageX,
        pageY,
        elementX: Number.NaN,
        elementY: Number.NaN,
        elementH: Number.NaN,
        elementW: Number.NaN,
        elementPosX: Number.NaN,
        elementPosY: Number.NaN,
      };
      const targetElement = getTargetElement(target);
      if (targetElement) {
        const { left, top, width, height }
          = targetElement.getBoundingClientRect();
        newState.elementPosX = left + window.pageXOffset;
        newState.elementPosY = top + window.pageYOffset;
        newState.elementX = pageX - newState.elementPosX;
        newState.elementY = pageY - newState.elementPosY;
        newState.elementW = width;
        newState.elementH = height;
      }
      setState(newState);
    },
    () => document,
  );

  return state;
};
