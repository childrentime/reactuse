/* eslint-disable react-hooks/exhaustive-deps */
import { useCallback, useState } from "react";
import Cookies from "js-cookie";
import { isFunction, isString } from "../utils/is";

export type CookieState = string | undefined;
export interface CookieOptions extends Cookies.CookieAttributes {
  defaultValue?: CookieState | (() => CookieState);
}

export default function useCookie(key: string, options: CookieOptions = {}) {
  const [cookieValue, setCookieValue] = useState<CookieState>(() => {
    const cookieValue = Cookies.get(key);

    if (isString(cookieValue))
      return cookieValue;

    if (isFunction(options.defaultValue)) {
      return options.defaultValue();
    }

    return options.defaultValue;
  });

  const updateCookie = useCallback((
    newValue: CookieState | ((prevState: CookieState) => CookieState),
    newOptions: Cookies.CookieAttributes = {},
  ) => {
    const { defaultValue, ...rest } = { ...options, ...newOptions };
    const value = isFunction(newValue) ? newValue(cookieValue) : newValue;

    setCookieValue(value);

    if (value === undefined) {
      Cookies.remove(key);
    }
    else {
      Cookies.set(key, value, rest);
    }
  }, [key, cookieValue]);

  const refreshCookie = useCallback(() => {
    const cookieValue = Cookies.get(key);

    if (isString(cookieValue))
      setCookieValue(cookieValue);
  }, [key]);

  return Object.freeze([
    cookieValue,
    updateCookie,
    refreshCookie,
  ] as const);
}
