import type { Fn } from '../utils/types'

/**
 * @title useEvent
 */
export type UseEvent = <T extends Fn>(
  /**
   * @zh 函数
   * @en function
   */
  fn: T
) => T
