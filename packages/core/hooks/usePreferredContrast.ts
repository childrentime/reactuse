import { isBrowser } from "../utils/is";
import useMediaQuery from "./useMediaQuery";

export type Contrast = "more" | "less" | "custom" | "no-preference";
export default function usePreferredContrast(
  defaultState?: Contrast
): Contrast {
  const isMore = useMediaQuery("(prefers-contrast: more)");
  const isLess = useMediaQuery("(prefers-contrast: less)");
  const isCustom = useMediaQuery("(prefers-contrast: custom)");

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
