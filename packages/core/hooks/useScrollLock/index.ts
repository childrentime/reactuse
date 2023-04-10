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
    if (element.current) {
      initialOverflowRef.current = element.current.style.overflow;
      if (locked) {
        element.current.style.overflow = "hidden";
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locked, element.current]);

  const lock = useEvent(() => {
    if (!element.current || locked) {
      return;
    }
    if (isIOS) {
      element.current.addEventListener("touchmove", preventDefault, {
        passive: false,
      });
    }
    setLocked(true);
  });

  const unlock = useEvent(() => {
    if (!element.current || !locked) {
      return;
    }
    if (isIOS) {
      element.current.removeEventListener("touchmove", preventDefault);
    }
    element.current.style.overflow = initialOverflowRef.current;
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
