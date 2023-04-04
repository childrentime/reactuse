import { useEffect } from "react";
import { isBrowser } from "./utils/is";
import useStorage from "./createStorage";

export interface UseDarkOptions {
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
   * isomorphic default value
   * @default false
   */
  defaultValue?: boolean;
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
  /**
   * name dark  apply to element
   */
  classNameDark: string;
  /**
   * name light  apply to element
   */
  classNameLight: string;
}
export default function useDarkMode(options: UseDarkOptions) {
  const {
    selector = "html",
    attribute = "class",
    classNameDark = "",
    classNameLight = "",
    storageKey = "reactuses-color-scheme",
    storage = () => (isBrowser ? localStorage : undefined),
    defaultValue = false,
  } = options;

  const value = (): boolean => {
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  };

  const [dark, setDark] = useStorage<boolean>(
    storageKey,
    defaultValue,
    storage,
    {
      csrData: value,
    },
  );

  useEffect(() => {
    const element = window?.document.querySelector(selector);
    if (!element) {
      return;
    }
    if (attribute === "class") {
      dark && classNameDark && element.classList.add(classNameDark);
      !dark && classNameLight && element.classList.add(classNameLight);
    }
    else {
      dark && classNameDark && element.setAttribute(attribute, classNameDark);
      !dark
        && classNameLight
        && element.setAttribute(attribute, classNameLight);
    }

    return () => {
      if (!element) {
        return;
      }
      if (attribute === "class") {
        dark && classNameDark && element.classList.remove(classNameDark);
        !dark && classNameLight && element.classList.remove(classNameLight);
      }
      else {
        dark && classNameDark && element.removeAttribute(attribute);
        !dark && classNameLight && element.removeAttribute(attribute);
      }
    };
  }, [attribute, classNameDark, classNameLight, dark, selector]);

  return [dark, () => setDark(dark => !dark), setDark] as const;
}
