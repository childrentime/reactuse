import type { BasicTarget } from '../utils/domTarget'

/**
 * @title useScrollLock
 * @returns 包含以下元素的元组：
 * - 是否锁定。
 * - 更新锁定值的函数。
 * @returns_en A tuple with the following elements:
 * - whether scroll is locked.
 * - A function to update the value of lock state.
 */
export type UseScrollLock = (
  /**
   * @zh dom元素
   * @en dom element
   */
  target: BasicTarget<HTMLElement>,
  /**
   * @zh 默认值
   * @en default value
   * @defaultValue false
   */
  initialState?: boolean
) => readonly [boolean, (flag: boolean) => void]
