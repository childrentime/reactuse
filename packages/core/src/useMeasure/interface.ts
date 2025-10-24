import type { BasicTarget } from '../utils/domTarget'

/**
 * @title useMeasure
 * @returns [DOMRect值,停止监听函数]
 * @returns_en [DOMRect, stop listening function]
 * @returns_zh-Hant [DOMRect值,停止監聽函數]
 */
export type UseMeasure = (
  /**
   * @zh dom对象
   * @zh-Hant dom對象
   * @en dom element
   */
  target: BasicTarget<Element>,
  /**
   * @zh 可选参数
   * @zh-Hant 可選參數
   * @en optional params
   */
  options?: ResizeObserverOptions
) => readonly [UseMeasureRect, () => void]

/**
 * @title UseMeasureRect
 */
export type UseMeasureRect = Omit<DOMRectReadOnly, 'toJSON'>
