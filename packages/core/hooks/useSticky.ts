import {
  BasicTarget,
  getTargetElement,
  useLatestElement,
} from "./utils/domTarget";
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
  const element = useLatestElement(targetElement);

  const { run: scrollHandler } = useThrottleFn(() => {
    if (!element.current) {
      return;
    }
    const rect = element.current.getBoundingClientRect();
    if (axis === "y") {
      setSticky(rect?.top <= nav);
    } else {
      setSticky(rect?.left <= nav);
    }
  }, 50);

  useEffect(() => {
    const scrollParent =
      getTargetElement(scrollElement) || getScrollParent(axis, element.current);
    if (!element.current || !scrollParent) {
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
