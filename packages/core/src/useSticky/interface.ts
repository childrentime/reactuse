import type { BasicTarget } from '../utils/domTarget'

/**
 * @title useSticky
 * @returns 包含以下元素的元组：
 * - 当前是否粘滞。
 * - 更新粘滞值的函数。
 * @returns_en A tuple with the following elements:
 * - The current state of sticky.
 * - A function to update the value of sticky.
 * @returns_zh-Hant 包含以下元素的元組：
 * - 當前是否粘滞。
 * - 更新粘滞值的函數。
 */
export type UseSticky = (
  /**
   * @zh dom元素
   * @zh-Hant dom元素
   * @en dom element
   */
  targetElement: BasicTarget<HTMLElement>,
  /**
   * @zh 可选参数
   * @en optional params
   */
  params: UseStickyParams,
  /**
   * @zh 滚动容器
   * @en scroll container
   */
  scrollElement?: BasicTarget<HTMLElement>
) => [boolean, React.Dispatch<React.SetStateAction<boolean>>]

/**
 * @title UseStickyParams
 */
export interface UseStickyParams {
  /**
   * @en axis of scroll
   * @zh 滚动方向
   * @defaultValue y
   */
  axis?: 'x' | 'y'
  /**
   * @en cover height or width
   * @zh 沉浸式高度/宽度
   * @defaultValue 0
   */
  nav: number
}
