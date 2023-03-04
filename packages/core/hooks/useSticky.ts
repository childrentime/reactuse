import { BasicTarget, getTargetElement } from "./utils/domTarget";
import React, { useEffect, useState } from "react";
import useThrottleFn from "./useThrottleFn";
import { getScrollParent } from "./utils/scroll";

export interface UseStickyParams {
  targetElement: BasicTarget<HTMLElement>;
  scrollElement?: BasicTarget<HTMLElement>;
  /** axis of scroll */
  axis?: "x" | "y";
  /** cover height or width */
  nav: number;
}

const useSticky = ({
  targetElement,
  scrollElement,
  axis = "y",
  nav = 0,
}: UseStickyParams): [
  boolean,
  React.Dispatch<React.SetStateAction<boolean>>
] => {
  const [isSticky, setSticky] = useState<boolean>(false);
  const element = getTargetElement(targetElement);
  const scrollParent =
    getTargetElement(scrollElement) || getScrollParent(axis, element);
  const { run: scrollHandler } = useThrottleFn(() => {
    if (!element) {
      return;
    }
    const rect = element.getBoundingClientRect();
    if (axis === "y") {
      setSticky(rect?.top <= nav);
    } else {
      setSticky(rect?.left <= nav);
    }
  }, 50);

  useEffect(() => {
    if (!element || !scrollParent) {
      return;
    }

    scrollParent.addEventListener("scroll", scrollHandler);
    scrollHandler();
    return () => {
      scrollParent.removeEventListener("scroll", scrollHandler);
    };
  }, [axis, element, scrollHandler, scrollParent]);
  return [isSticky, setSticky];
};

export default useSticky;
