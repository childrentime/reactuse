import { useCallback } from "react";
import useEventListener from "../useEventListener";
import type { UseDoubleClick, UseDoubleClickProps } from "./interface";

export const useDoubleClick: UseDoubleClick = ({
  target,
  latency = 300,
  onSingleClick = () => {},
  onDoubleClick = () => {},
}: UseDoubleClickProps) => {
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

  useEventListener("click", handleClick, target);
  useEventListener("touchend", handleTouchEnd, target, { passive: false });
};
