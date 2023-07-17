import { useEffect, useRef, useState } from "react";
import type { BasicTarget } from "../utils/domTarget";
import { useLatestElement } from "../utils/domTarget";
import { isIOS } from "../utils/is";
import useEvent from "../useEvent";

function preventDefault(rawEvent: TouchEvent): boolean {
  const e = rawEvent || window.event;
  // Do not prevent if the event has more than one touch (usually meaning this is a multi touch gesture like pinch to zoom).
  if (e.touches.length > 1) {
    return true;
  }

  if (e.preventDefault) {
    e.preventDefault();
  }

  return false;
}

export default function useScrollLock(
  target: BasicTarget<HTMLElement>,
  initialState = false,
): readonly [boolean, (flag: boolean) => void] {
  const [locked, setLocked] = useState(initialState);

  const initialOverflowRef = useRef<CSSStyleDeclaration["overflow"]>("scroll");
  const element = useLatestElement(target);

  useEffect(() => {
    if (element) {
      initialOverflowRef.current = element.style.overflow;
      if (locked) {
        element.style.overflow = "hidden";
      }
    }
  }, [locked, element]);

  const lock = useEvent(() => {
    if (!element || locked) {
      return;
    }
    if (isIOS) {
      element.addEventListener("touchmove", preventDefault, {
        passive: false,
      });
    }
    setLocked(true);
  });

  const unlock = useEvent(() => {
    if (!element || !locked) {
      return;
    }
    if (isIOS) {
      element.removeEventListener("touchmove", preventDefault);
    }
    element.style.overflow = initialOverflowRef.current;
    setLocked(false);
  });

  const set = useEvent((flag: boolean) => {
    if (flag) {
      lock();
    }
    else {
      unlock();
    }
  });

  return [locked, set] as const;
}
