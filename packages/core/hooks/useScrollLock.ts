import { useRef, useState } from "react";
import { BasicTarget, getTargetElement } from "./utils/domTarget";
import { isIOS } from "./utils/is";
import useMount from "./useMount";
import useEvent from "./useEvent";

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
  target: BasicTarget<HTMLElement | SVGElement | Window | Document>,
  initialState = false
): readonly [boolean, (flag: boolean) => void] {
  const [locked, setLocked] = useState(initialState);

  const initialOverflowRef = useRef<CSSStyleDeclaration["overflow"]>("scroll");

  useMount(() => {
    const element = getTargetElement(target) as HTMLElement;
    if (element) {
      initialOverflowRef.current = element.style.overflow;
      if (locked) {
        element.style.overflow = "hidden";
      }
    }
  });

  const lock = useEvent(() => {
    const element = getTargetElement(target) as HTMLElement;
    if (!element || locked) {
      return;
    }
    if (isIOS) {
      element.addEventListener("touchmove", preventDefault, { passive: false });
    }
    element.style.overflow = "hidden";
    setLocked(true);
  });

  const unlock = useEvent(() => {
    const element = getTargetElement(target) as HTMLElement;
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
    } else {
      unlock();
    }
  });

  return [locked, set] as const;
}
