import type { DebouncedFunc, ThrottleSettings } from 'lodash'

/**
 * @title useThrottleFn
 * @returns_en A object with the following elements:
 * - run: exec function.
 * - cancel: cancel exec function.
 * - flush:  immediately exec function
 * @returns 具有以下元素的对象:
 * - run：执行函数。
 * - cancel：取消执行函数。
 * - flush: 立即执行函数
 * @returns_zh-Hant 具有以下元素的對象:
 * - run：執行函數。
 * - cancel：取消執行函數。
 * - flush: 立即執行函數
 */
export type UseThrottleFn = <T extends (...args: any) => any>(
  /**
   * @zh 要节流的函数
   * @zh-Hant 要節流的函數
   * @en Throttle function
   */
  fn: T,
  /**
   * @zh 间隔时间
   * @zh-Hant 間隔時間
   * @en wait time
   */
  wait?: number,
  /**
   * @zh 传递给 `lodash.throttle` 的属性
   * @zh-Hant 傳遞給 `lodash.throttle` 的屬性
   * @en options passed to `lodash.throttle`
   */
  options?: ThrottleSettings
) => {
  run: DebouncedFunc<(...args_0: Parameters<T>) => ReturnType<T>>
  cancel: () => void
  flush
}
