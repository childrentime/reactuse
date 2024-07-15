import type { BasicTarget } from '../utils/domTarget'

/**
 * @title useFocus
 * @returns 包含以下元素的元组：
 * - 元素是否聚焦。
 * - 更新聚焦状态。
 * @returns_en A tuple with the following elements:
 * -  whether the element focus.
 * - A function to update focus state.
 */
export type UseFocus = (
  /**
   * @zh dom对象
   * @en dom element
   */
  target: BasicTarget<HTMLElement | SVGElement>,
  /**
   * @zh 默认值
   * @en defaultValue
   * @defaultValue false
   */
  initialValue?: boolean
) => readonly [boolean, (value: boolean) => void]
