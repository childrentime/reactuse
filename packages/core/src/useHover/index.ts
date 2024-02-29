import { useCallback, useState } from "react";
import { useEventListener } from "../useEventListener";
import type { BasicTarget } from "../utils/domTarget";
import type { UseHover } from "./interface";

export const useHover: UseHover = <T extends Element = HTMLDivElement>(
  target: BasicTarget<T>,
) => {
  const [hovered, setHovered] = useState(false);

  const onMouseEnter = useCallback(() => setHovered(true), []);
  const onMouseLeave = useCallback(() => setHovered(false), []);

  useEventListener("mouseenter", onMouseEnter, target);
  useEventListener("mouseleave", onMouseLeave, target);

  return hovered;
};
