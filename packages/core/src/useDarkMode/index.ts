import { useEffect } from "react";
import { isBrowser } from "../utils/is";
import useStorage from "../createStorage";
import type { UseDarkMode, UseDarkOptions } from "./interface";

export const useDarkMode: UseDarkMode = (options: UseDarkOptions) => {
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
      effectStorageValue: value,
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
};
