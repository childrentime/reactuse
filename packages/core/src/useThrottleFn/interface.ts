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
 */
export type UseThrottleFn = <T extends (...args: any) => any>(
  /**
   * @zh 要节流的函数
   * @en Throttle function
   */
  fn: T,
  /**
   * @zh 间隔时间
   * @en wait time
   */
  wait?: number,
  /**
   * @zh 传递给 `lodash.throttle` 的属性
   * @en options passed to `lodash.throttle`
   */
  options?: ThrottleSettings
) => {
  run: DebouncedFunc<(...args_0: Parameters<T>) => ReturnType<T>>
  cancel: () => void
  flush
}
