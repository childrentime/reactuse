import type { BasicTarget } from '../utils/domTarget'

/**
 * @title useElementSize
 * @returns_en A tuple with the following elements:
 * - width
 * - height
 * @returns 包含以下元素的元组：
 * - 元素宽度。
 * - 元素高度。
 * @returns_zh-Hant 包含以下元素的元組：
 * - 元素寬度。
 * - 元素高度。
 * @returns_ru Кортеж со следующими элементами:
 * - ширина элемента.
 * - высота элемента.
 */

export type UseElementSize = (
  /**
   * @zh dom对象
   * @zh-Hant dom對象
   * @ru dom элемент
   * @en dom element
   */
  target: BasicTarget<Element>,
  /**
   * @zh `resizeObserver` 参数
   * @ru параметры, передаваемые в `resizeObserver`
   * @en options passed to `resizeObserver`
   */
  options?: ResizeObserverOptions
) => readonly [number, number]
