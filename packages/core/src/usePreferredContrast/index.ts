import { isBrowser } from "../utils/is";
import useMediaQuery from "../useMediaQuery";

export type Contrast = "more" | "less" | "custom" | "no-preference";
export default function usePreferredContrast(
  defaultState?: Contrast,
): Contrast {
  const isMore = useMediaQuery("(prefexrs-contrast: more)", false);
  const isLess = useMediaQuery("(prefers-contrast: less)", false);
  const isCustom = useMediaQuery("(prefers-contrast: custom)", false);

  if (!isBrowser && defaultState) {
    return defaultState;
  }

  return isMore
    ? "more"
    : isLess
      ? "less"
      : isCustom
        ? "custom"
        : "no-preference";
}
