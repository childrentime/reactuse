import { useCallback, useEffect, useState } from "react";
import Cookies from "js-cookie";
import { isFunction, isString } from "../utils/is";
import { defaultOptions } from "../utils/defaults";

export type UseCookieState = string | undefined;

export default function useCookie(
  key: string,
  options: Cookies.CookieAttributes = defaultOptions,
  defaultValue?: string | (() => string),
  csrData?: UseCookieState | (() => UseCookieState),
) {
  const [cookieValue, setCookieValue] = useState<UseCookieState>(defaultValue);

  useEffect(() => {
    const data = csrData
      ? isFunction(csrData)
        ? csrData()
        : csrData
      : isFunction(defaultValue)
        ? defaultValue()
        : defaultValue;

    const getStoredValue = () => {
      const raw = Cookies.get(key);
      if (raw !== undefined && raw !== null) {
        return raw;
      }
      else {
        if (data === undefined) {
          Cookies.remove(key);
        }
        else {
          Cookies.set(key, data, options);
        }
        return data;
      }
    };

    setCookieValue(getStoredValue());
  }, [csrData, defaultValue, key, options]);

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
}
