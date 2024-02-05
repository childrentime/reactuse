import type { RefObject } from "react";
import { useState } from "react";
import { useEventListener } from "../useEventListener";
import { useMount } from "../useMount";
import { getTargetElement } from "../utils/domTarget";
import type { UseFocus } from "./interface";

export const useFocus: UseFocus = (
  target: RefObject<HTMLElement | SVGElement>,
  initialValue = false,
) => {
  const [focus, innerSetFocus] = useState(initialValue);

  useEventListener("focus", () => innerSetFocus(true), target);
  useEventListener("blur", () => innerSetFocus(false), target);

  const setFocus = (value: boolean) => {
    const element = getTargetElement(target);
    if (!element) {
      return;
    }
    if (!value) {
      element.blur();
    }
    else if (value) {
      element.focus();
    }
  };

  useMount(() => {
    setFocus(focus);
  });

  return [focus, setFocus] as const;
};
