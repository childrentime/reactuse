import type { RefObject } from "react";
import { useCallback, useState } from "react";
import { useEventListener } from "../useEventListener";

export const useHover = <T extends Element = HTMLDivElement>(
  target: RefObject<T>,
) => {
  const [hovered, setHovered] = useState(false);

  const onMouseEnter = useCallback(() => setHovered(true), []);
  const onMouseLeave = useCallback(() => setHovered(false), []);

  useEventListener("mouseenter", onMouseEnter, target);
  useEventListener("mouseleave", onMouseLeave, target);

  return hovered;
};
