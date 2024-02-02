import type { RefObject } from "react";
import { useState } from "react";
import useResizeObserver from "../useResizeObserver";
import { defaultOptions } from "../utils/defaults";
import type { UseElementSize } from "./interface";

export const useElementSize: UseElementSize = (
  target: RefObject<Element>,
  options: ResizeObserverOptions = defaultOptions,
): readonly [number, number] => {
  const { box = "content-box" } = options;

  const [width, setWidth] = useState<number>(0);
  const [height, setHeight] = useState<number>(0);

  useResizeObserver(
    target,
    ([entry]) => {
      const boxSize
        = box === "border-box"
          ? entry.borderBoxSize
          : box === "content-box"
            ? entry.contentBoxSize
            : entry.devicePixelContentBoxSize;

      if (boxSize) {
        setWidth(boxSize.reduce((acc, { inlineSize }) => acc + inlineSize, 0));
        setHeight(boxSize.reduce((acc, { blockSize }) => acc + blockSize, 0));
      }
      else {
        // fallback
        setWidth(entry.contentRect.width);
        setHeight(entry.contentRect.height);
      }
    },
    options,
  );

  return [width, height] as const;
};
