import { isBrowser } from "./utils/is";
import useMediaQuery from "./useMediaQuery";

export type ColorScheme = "dark" | "light" | "no-preference";
export default function usePreferredColorScheme(
  defaultState?: ColorScheme,
): ColorScheme {
  const isLight = useMediaQuery("(prefers-color-scheme: light)", false);
  const isDark = useMediaQuery("(prefers-color-scheme: dark)", false);

  if (!isBrowser && defaultState) {
    return defaultState;
  }

  return isDark ? "dark" : isLight ? "light" : "no-preference";
}
