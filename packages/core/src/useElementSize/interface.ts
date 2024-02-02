import type { RefObject } from "react";

/**
 * @title useElementSize
 * @returns {en} A tuple with the following elements:
 * - width
 * - height
 * @returns {zh} 包含以下元素的元组：
 * - 元素宽度。
 * - 元素高度。
 */

export type UseElementSize = (
  /**
   * @zh dom对象
   * @en dom element
   */
  target: RefObject<Element>,
  /**
   * @zh `resizeObserver` 参数
   * @en options passed to `resizeObserver`
   */
  options?: ResizeObserverOptions
) => readonly [number, number];
