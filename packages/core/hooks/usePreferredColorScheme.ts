import { isBrowser } from "../utils/is";
import useMediaQuery from "./useMediaQuery";

export type ColorScheme = "dark" | "light" | "no-preference";
export default function usePreferredColorScheme(
  defaultState?: ColorScheme
): ColorScheme {
  const isLight = useMediaQuery("(prefers-color-scheme: light)");
  const isDark = useMediaQuery("(prefers-color-scheme: dark)");

  if (!isBrowser && defaultState) {
    return defaultState;
  }

  return isDark ? "dark" : isLight ? "light" : "no-preference";
}
