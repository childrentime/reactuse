import { useState } from "react";
import useResizeObserver from "../useResizeObserver";
import type { BasicTarget } from "../utils/domTarget";

export type UseMeasureRect = Omit<DOMRectReadOnly, "toJSON">;

const defaultState: UseMeasureRect = {
  x: 0,
  y: 0,
  width: 0,
  height: 0,
  top: 0,
  left: 0,
  bottom: 0,
  right: 0,
};

export default function useMeasure(
  target: BasicTarget,
  options: ResizeObserverOptions = {},
) {
  const [rect, setRect] = useState<UseMeasureRect>(defaultState);

  const stop = useResizeObserver(
    target,
    (entries) => {
      if (entries[0]) {
        const { x, y, width, height, top, left, bottom, right }
          = entries[0].contentRect;
        setRect({ x, y, width, height, top, left, bottom, right });
      }
    },
    options,
  );

  return [rect, stop] as const;
}
