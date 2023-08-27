import { useCallback, useState } from "react";
import useEventListener from "../useEventListener";
import { BasicTarget } from "../utils/domTarget";

export default function useHover<T extends HTMLElement = HTMLDivElement>(
  target: BasicTarget<T>
) {
  const [hovered, setHovered] = useState(false);

  const onMouseEnter = useCallback(() => setHovered(true), []);
  const onMouseLeave = useCallback(() => setHovered(false), []);

  useEventListener("mouseenter", onMouseEnter, target);
  useEventListener("mouseleave", onMouseLeave, target);

  return hovered;
}
