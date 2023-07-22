import type React from "react";
import { useEffect, useState } from "react";
import type { BasicTarget } from "../utils/domTarget";
import { getTargetElement, useLatestElement } from "../utils/domTarget";
import useThrottleFn from "../useThrottleFn";
import { getScrollParent } from "../utils/scroll";

export interface UseStickyParams {
  /** axis of scroll */
  axis?: "x" | "y";
  /** cover height or width */
  nav: number;
}

const useSticky = (
  targetElement: BasicTarget<HTMLElement>,
  { axis = "y", nav = 0 }: UseStickyParams,
  scrollElement?: BasicTarget<HTMLElement>,
): [boolean, React.Dispatch<React.SetStateAction<boolean>>] => {
  const [isSticky, setSticky] = useState<boolean>(false);
  const element = useLatestElement(targetElement);

  const { run: scrollHandler } = useThrottleFn(() => {
    if (!element) {
      return;
    }
    const rect = element.getBoundingClientRect();
    if (axis === "y") {
      setSticky(rect?.top <= nav);
    }
    else {
      setSticky(rect?.left <= nav);
    }
  }, 50);

  useEffect(() => {
    const scrollParent
      = getTargetElement(scrollElement) || getScrollParent(axis, element);
    if (!element || !scrollParent) {
      return;
    }

    scrollParent.addEventListener("scroll", scrollHandler);
    scrollHandler();
    return () => {
      scrollParent.removeEventListener("scroll", scrollHandler);
    };
  }, [axis, element, scrollElement, scrollHandler]);
  return [isSticky, setSticky];
};

export default useSticky;
