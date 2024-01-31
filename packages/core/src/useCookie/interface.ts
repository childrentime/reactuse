import type Cookies from "js-cookie";

export type UseCookieState = string | undefined;

/**
 * @title useCookie
 */
export type UseCookieType = (
  /**
   * @zh 键值
   * @en key
   */
  key: string,
  /**
   * @zh 透传给 `js-cookie` 的参数
   * @en option pass to `js-cookie`
   */
  options?: Cookies.CookieAttributes,
  /**
   * @zh 默认值，ssr必须传递
   * @en defaultValue, must be required in ssr
   */
  defaultValue?: string
) => readonly [
  UseCookieState,
  (
    newValue: UseCookieState | ((prevState: UseCookieState) => UseCookieState)
  ) => void,
  () => void,
];
