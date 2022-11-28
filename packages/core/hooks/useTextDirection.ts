import { useState } from "react";
import { isBrowser } from "./utils/is";

export type UseTextDirectionValue = "ltr" | "rtl" | "auto";
export interface UseTextDirectionOptions {
  /**
   * CSS Selector for the target element applying to
   *
   * @default 'html'
   */
  selector?: string;
  /**
   * Initial value
   *
   * @default 'ltr'
   */
  initialValue?: UseTextDirectionValue;
}
export default function useTextDirection(
  options: UseTextDirectionOptions = {}
) {
  const { selector = "html", initialValue = "ltr" } = options;
  const getValue = () => {
    if (isBrowser) {
      return (
        (document
          ?.querySelector(selector)
          ?.getAttribute("dir") as UseTextDirectionValue) ?? initialValue
      );
    } else {
      return initialValue;
    }
  };
  const [value, setValue] = useState<UseTextDirectionValue>(getValue());

  const set = (value: UseTextDirectionValue) => {
    if (!isBrowser) {
      return;
    }
    if (value !== null) {
      document.querySelector(selector)?.setAttribute("dir", value);
    } else {
      document.querySelector(selector)?.removeAttribute("dir");
    }
    setValue(value);
  };

  return [value, set] as const;
}
