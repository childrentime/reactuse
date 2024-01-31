import { useCallback, useEffect, useState } from "react";
import Cookies from "js-cookie";
import { isBrowser, isFunction, isString } from "../utils/is";
import { defaultOptions } from "../utils/defaults";
import type { UseCookieState, UseCookieType } from "./interface";

const getInitialState = (key: string, defaultValue?: string) => {
  // Prevent a React hydration mismatch when a default value is provided.
  if (defaultValue !== undefined) {
    return defaultValue;
  }

  if (isBrowser) {
    return Cookies.get(key);
  }

  if (process.env.NODE_ENV !== "production") {
    console.warn(
      "`useCookie` When server side rendering, defaultValue should be defined to prevent a hydration mismatches.",
    );
  }

  return "";
};

export const useCookie: UseCookieType = (
  key: string,
  options: Cookies.CookieAttributes = defaultOptions,
  defaultValue?: string,
) => {
  const [cookieValue, setCookieValue] = useState<UseCookieState>(
    getInitialState(key, defaultValue),
  );

  useEffect(() => {
    const getStoredValue = () => {
      const raw = Cookies.get(key);
      if (raw !== undefined && raw !== null) {
        return raw;
      }
      else {
        if (defaultValue === undefined) {
          Cookies.remove(key);
        }
        else {
          Cookies.set(key, defaultValue, options);
        }
        return defaultValue;
      }
    };

    setCookieValue(getStoredValue());
  }, [defaultValue, key, options]);

  const updateCookie = useCallback(
    (
      newValue: UseCookieState | ((prevState: UseCookieState) => UseCookieState),
    ) => {
      const value = isFunction(newValue) ? newValue(cookieValue) : newValue;

      if (value === undefined) {
        Cookies.remove(key);
      }
      else {
        Cookies.set(key, value, options);
      }

      setCookieValue(value);
    },
    [key, cookieValue, options],
  );

  const refreshCookie = useCallback(() => {
    const cookieValue = Cookies.get(key);

    if (isString(cookieValue)) {
      setCookieValue(cookieValue);
    }
  }, [key]);

  return [cookieValue, updateCookie, refreshCookie] as const;
};
