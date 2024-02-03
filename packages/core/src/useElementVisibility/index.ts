import type { RefObject } from "react";
import { useCallback, useState } from "react";
import useIntersectionObserver from "../useIntersectionObserver";
import { defaultOptions } from "../utils/defaults";
import type { UseElementVisibility } from "./interface";

export const useElementVisibility: UseElementVisibility = (
  target: RefObject<HTMLElement | SVGElement>,
  options: IntersectionObserverInit = defaultOptions,
) => {
  const [visible, setVisible] = useState(false);

  const callback: IntersectionObserverCallback = useCallback((entries) => {
    const rect = entries[0].boundingClientRect;
    setVisible(
      rect.top
        <= (window.innerHeight || document.documentElement.clientHeight)
        && rect.left
          <= (window.innerWidth || document.documentElement.clientWidth)
        && rect.bottom >= 0
        && rect.right >= 0,
    );
  }, []);
  const stop = useIntersectionObserver(target, callback, options);

  return [visible, stop] as const;
};
