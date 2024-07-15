import type { BasicTarget } from '../utils/domTarget'

/**
 * @title useElementVisibility
 * @returns 包含以下元素的元组：
 * - 当前元素是否可见。
 * - 停止监听函数。
 * @returns_en A tuple with the following elements:
 * - is the current element visible.
 * - stop observer listening function.
 */
export type UseElementVisibility = (
/**
 * @zh dom对象
 * @en dom element
 */
  target: BasicTarget<HTMLElement | SVGElement>,
/**
 * @zh 传递给 `intersectionObserver` 的选项
 * @en options passed to `intersectionObserver`
 */
  options?: IntersectionObserverInit
) => readonly [boolean, () => void]
