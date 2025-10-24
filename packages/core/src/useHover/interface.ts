import type { BasicTarget } from '../utils/domTarget'

/**
 * @title useHover
 */
export type UseHover = <T extends Element = HTMLDivElement>(
  /**
   * @zh dom对象
   * @zh-Hant dom對象
   * @en dom element
   */
  target: BasicTarget<T>
) => boolean
