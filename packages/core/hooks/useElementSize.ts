import { useState } from "react";
import { BasicTarget } from "../utils/domTarget";
import useResizeObserver from "./useResizeObserver";

export default function useElementSize(
  target: BasicTarget,
  options: ResizeObserverOptions = {}
): readonly [number, number] {
  const { box = "content-box" } = options;

  const [width, setWidth] = useState<number>(0);
  const [height, setHeight] = useState<number>(0);

  useResizeObserver(
    target,
    ([entry]) => {
      const boxSize =
        box === "border-box"
          ? entry.borderBoxSize
          : box === "content-box"
          ? entry.contentBoxSize
          : entry.devicePixelContentBoxSize;

      if (boxSize) {
        setWidth(boxSize.reduce((acc, { inlineSize }) => acc + inlineSize, 0));
        setHeight(boxSize.reduce((acc, { blockSize }) => acc + blockSize, 0));
      } else {
        // fallback
        setWidth(entry.contentRect.width);
        setHeight(entry.contentRect.height);
      }
    },
    options
  );

  return [width, height] as const;
}
