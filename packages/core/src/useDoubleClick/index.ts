import { useCallback } from "react";
import useEventListener from "../useEventListener";
import type { BasicTarget } from "../utils/domTarget";
import { useLatestElement } from "../utils/domTarget";

export default function useDoubleClick({
  target,
  latency = 300,
  onSingleClick = () => {},
  onDoubleClick = () => {},
}: {
  target: BasicTarget;
  latency?: number;
  onSingleClick?: (e?: MouseEvent | TouchEvent) => void;
  onDoubleClick?: (e?: MouseEvent | TouchEvent) => void;
}) {
  const element = useLatestElement(target);

  const handle = useCallback(
    (
      onSingleClick: (e?: MouseEvent | TouchEvent) => void,
      onDoubleClick: (e?: MouseEvent | TouchEvent) => void,
    ) => {
      let count = 0;
      return (e: MouseEvent | TouchEvent) => {
        // prevent ios double click slide
        if (e.type === "touchend") {
          e.stopPropagation();
          e.preventDefault();
        }

        count += 1;
        setTimeout(() => {
          if (count === 1) {
            onSingleClick(e);
          }
          else if (count === 2) {
            onDoubleClick(e);
          }
          count = 0;
        }, latency);
      };
    },
    [latency],
  );

  const handleClick = handle(onSingleClick, onDoubleClick);

  const handleTouchEnd = handle(onSingleClick, onDoubleClick);

  useEventListener("click", handleClick, element);
  useEventListener("touchend", handleTouchEnd, element, { passive: false });
}
