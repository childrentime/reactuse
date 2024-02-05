import type { Stoppable } from "../utils/types";

/**
 * @title useTimeout
 * @returns 包含以下元素的元组：
 * - 是否等待定时器执行。
 * - 设置定时器。
 * - 取消定时器。
 * @returns_en A tuple with the following elements:
 * - Whether to wait for the timer to execute.
 * - Set timer.
 * - Cancel timer.
 */
export type UseTimeout = (
  /**
   * @zh 间隔时间
   * @en wait time
   */
  ms?: number
  /**
   * @zh 可选参数
   * @en optional param
   */,
  options?: UseTimeoutOptions
) => Stoppable;

/**
 * @title UseTimeoutOptions
 */
export interface UseTimeoutOptions {
  /**
   * @en Start the timer immediate after calling this function
   * @zh 立即设置定时器
   * @defaultValue false
   */
  immediate?: boolean;
}
