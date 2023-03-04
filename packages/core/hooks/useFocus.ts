import { useState } from "react";
import useEventListener from "./useEventListener";
import useMount from "./useMount";
import { BasicTarget, getTargetElement } from "./utils/domTarget";

export default function useFocus(
  target: BasicTarget<HTMLElement | SVGElement>,
  initialValue = false
) {
  const [focus, innerSetFocus] = useState(initialValue);

  useEventListener("focus", () => innerSetFocus(true), target);
  useEventListener("blur", () => innerSetFocus(false), target);

  useMount(() => {
    setFocus(focus);
  });

  const setFocus = (value: boolean) => {
    const element = getTargetElement(target);
    if (!element) {
      return;
    }
    if (!value) {
      element.blur();
    } else if (value) {
      element.focus();
    }
  };

  return [focus, setFocus] as const;
}
