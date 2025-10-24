import type Cookies from 'js-cookie'

/**
 * @title useCookie
 * @returns 包含以下元素的元组：
 * - cookie 的当前值。
 * - 更新 cookie 值的函数。
 * - 刷新 cookie 值的函数，以防其他事件更改它。
 * @returns_en A tuple with the following elements:
 * - The current value of the cookie.
 * - A function to update the value of the cookie.
 * - A function to refresh the value of the cookie, incase other events change it.
 * @returns_zh-Hant 包含以下元素的元組：
 * - cookie 的當前值。
 * - 更新 cookie 值的函數。
 * - 刷新 cookie 值的函數，以防其他事件更改它。
 */
export type UseCookie = (
  /**
   * @zh 键值
   * @zh-Hant 鍵值
   * @en key
   */
  key: string,
  /**
   * @zh 透传给 `js-cookie` 的参数
   * @zh-Hant 透傳給 `js-cookie` 的參數
   * @en option pass to `js-cookie`
   */
  options?: Cookies.CookieAttributes,
  /**
   * @zh 默认值，ssr必须传递
   * @zh-Hant 預設值，ssr必須傳遞
   * @en defaultValue, must be required in ssr
   */
  defaultValue?: string
) => readonly [
  UseCookieState,
  (
    newValue: UseCookieState | ((prevState: UseCookieState) => UseCookieState)
  ) => void,
  () => void,
]

/**
 * @title useCookieState
 */
export type UseCookieState = string | undefined
