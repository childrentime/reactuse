import { useCallback } from "react";
import { isBrowser } from "./utils/is";
import useStorage from "./createStorage";
import usePreferredDark from "./usePreferredDark";

export interface UseDarkOptions<T> {
  /**
   * CSS Selector for the target element applying to
   *
   * @default 'html'
   */
  selector?: string;

  /**
   * HTML attribute applying the target element
   *
   * @default 'class'
   */
  attribute?: string;
  /**
   * The initial value write the target element, defaultValue follow system prefer color
   * must be set in SSR
   * @default 'light | dark'
   */
  initialValue?: T;
  /**
   * Key to persist the data into localStorage/sessionStorage.
   *
   * @default 'reactuses-color-scheme'
   */
  storageKey?: string;
  /**
   * Storage object, can be localStorage or sessionStorage
   *
   * @default localStorage
   */
  storage?: () => Storage;
}
export default function useDarkMode<T extends string | "light" | "dark">(
  options: UseDarkOptions<T> = {}
) {
  const {
    selector = "html",
    attribute = "class",
    initialValue,
    storageKey = "reactuses-color-scheme",
    storage = () => (isBrowser ? localStorage : undefined),
  } = options;

  const prefersDarkMode = usePreferredDark(false);
  const value = initialValue
    ? initialValue
    : prefersDarkMode
    ? "dark"
    : "light";

  const [dark, setDark] = useStorage<T>(storageKey, value as T, storage);

  const wrappedSetDark = useCallback(
    (latestDark: T) => {
      const element = window?.document.querySelector(selector);
      if (!element) {
        return;
      }
      if (attribute === "class") {
        latestDark && element.classList.add(latestDark);
        dark && element.classList.remove(dark);
      } else {
        latestDark && element.setAttribute(attribute, latestDark);
        dark && element.removeAttribute(attribute);
      }
      setDark(latestDark);
    },
    [attribute, dark, selector, setDark]
  );

  return [dark, wrappedSetDark] as const;
}
