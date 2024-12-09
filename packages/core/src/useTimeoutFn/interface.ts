import type { Stoppable } from '../utils/types'

/**
 * @title useTimeoutFn
 * @returns 包含以下元素的元组：
 * - 是否等待定时器执行。
 * - 设置定时器。
 * - 取消定时器。
 * @returns_en A tuple with the following elements:
 * - Whether to wait for the timer to execute.
 * - Set timer.
 * - Cancel timer.
 */
export type UseTimeoutFn = (
  /**
   * @zh 回调
   * @en callback
   */
  cb: (...args: unknown[]) => any,
  /**
   * @zh 间隔时间
   * @en wait time
   */
  interval: number,
  /**
   * @zh 可选参数
   * @en optional param
   */
  options?: UseTimeoutFnOptions
) => Stoppable

/**
 * @title UseTimeoutFnOptions
 */
export interface UseTimeoutFnOptions {
  /**
   * @en Start the timer immediate after calling this function
   * @zh 立即设置定时器
   * @defaultValue true
   */
  immediate?: boolean
}
