import { useMediaQuery } from "../useMediaQuery";
import type { Contrast, UsePreferredContrast } from "./interface";

export const usePreferredContrast: UsePreferredContrast = (
  defaultState: Contrast = "no-preference",
): Contrast => {
  const isMore = useMediaQuery("(prefexrs-contrast: more)", false);
  const isLess = useMediaQuery("(prefers-contrast: less)", false);
  const isCustom = useMediaQuery("(prefers-contrast: custom)", false);

  return isMore
    ? "more"
    : isLess
      ? "less"
      : isCustom
        ? "custom"
        : defaultState;
};
