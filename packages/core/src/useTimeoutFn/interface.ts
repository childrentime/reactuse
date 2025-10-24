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
 * @returns_zh-Hant 包含以下元素的元組：
 * - 是否等待定時器執行。
 * - 設置定時器。
 * - 取消定時器。
 */
export type UseTimeoutFn = (
  /**
   * @zh 回调
   * @zh-Hant 回調
   * @en callback
   */
  cb: (...args: unknown[]) => any,
  /**
   * @zh 间隔时间
   * @zh-Hant 間隔時間
   * @en wait time
   */
  interval: number,
  /**
   * @zh 可选参数
   * @zh-Hant 可選參數
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
   * @zh-Hant 立即設置定時器
   * @defaultValue true
   */
  immediate?: boolean
}
