import { useCallback, useState } from "react";
import Cookies from "js-cookie";
import { isFunction, isString } from "../utils/is";
import useDeepCompareEffect from "../useDeepCompareEffect";

export type CookieState = string | undefined;
export interface CookieOptions extends Cookies.CookieAttributes {
  defaultValue?: string | (() => string);
  /**
   * set to storage when nodata in effect, fallback to defaultValue
   */
  csrData?: CookieState | (() => CookieState);
}

export default function useCookie(
  key: string,
  options: CookieOptions = {
    defaultValue: "",
  }
) {
  const { defaultValue, csrData, ...cookieOptions } = options;
  const [cookieValue, setCookieValue] = useState<CookieState>(defaultValue);

  useDeepCompareEffect(() => {
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
      } else {
        if (data === undefined) {
          Cookies.remove(key);
        } else {
          Cookies.set(key, data, cookieOptions);
        }
        return data;
      }
    };

    setCookieValue(getStoredValue());
  }, [csrData, defaultValue, key, cookieOptions]);

  const updateCookie = useCallback(
    (newValue: CookieState | ((prevState: CookieState) => CookieState)) => {
      const value = isFunction(newValue) ? newValue(cookieValue) : newValue;

      if (value === undefined) {
        Cookies.remove(key);
      } else {
        Cookies.set(key, value, cookieOptions);
      }

      setCookieValue(value);
    },
    [key, cookieValue]
  );

  const refreshCookie = useCallback(() => {
    const cookieValue = Cookies.get(key);

    if (isString(cookieValue)) {
      setCookieValue(cookieValue);
    }
  }, [key]);

  return Object.freeze([cookieValue, updateCookie, refreshCookie] as const);
}
