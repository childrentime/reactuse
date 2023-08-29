import type { BasicTarget } from "../utils/domTarget";
import { getTargetElement } from "../utils/domTarget";
import useEventListener from "../useEventListener";
import useRafState from "../useRafState";

export interface CursorState {
  screenX: number;
  screenY: number;
  clientX: number;
  clientY: number;
  pageX: number;
  pageY: number;
  elementX: number;
  elementY: number;
  elementH: number;
  elementW: number;
  elementPosX: number;
  elementPosY: number;
}

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

export default function useMouse(target?: BasicTarget): CursorState {
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
}
