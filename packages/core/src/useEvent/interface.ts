import type { Fn } from '../utils/types'

/**
 * @title useEvent
 */
export type UseEvent = <T extends Fn>(
  /**
   * @zh 函数
   * @zh-Hant 函數
   * @ru функция
   * @en function
   */
  fn: T
) => T
