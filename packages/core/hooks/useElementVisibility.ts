import { useIntersectionObserver } from "@reactuses/core";
import { useCallback, useState } from "react";
import { BasicTarget } from "./../utils/domTarget";

export default function useElementVisibility(
  target: BasicTarget<HTMLElement | SVGElement>,
  options: IntersectionObserverInit = {}
): readonly [any, () => void] {
  const [visible, setVisible] = useState(false);

  const callback: IntersectionObserverCallback = useCallback((entries) => {
    const rect = entries[0].boundingClientRect;
    setVisible(
      rect.top <=
        (window.innerHeight || document.documentElement.clientHeight) &&
        rect.left <=
          (window.innerWidth || document.documentElement.clientWidth) &&
        rect.bottom >= 0 &&
        rect.right >= 0
    );
  }, []);
  const stop = useIntersectionObserver(target, callback, options);

  return [visible, stop] as const;
}
