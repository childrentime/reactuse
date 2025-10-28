import type { BasicTarget } from '../utils/domTarget'

/**
 * @title useMeasure
 * @returns [DOMRect值,停止监听函数]
 * @returns_en [DOMRect, stop listening function]
 * @returns_zh-Hant [DOMRect值,停止監聽函數]
 * @returns_ru [значение DOMRect, функция остановки прослушивания]
 */
export type UseMeasure = (
  /**
   * @zh dom对象
   * @zh-Hant dom對象
   * @ru dom элемент
   * @en dom element
   */
  target: BasicTarget<Element>,
  /**
   * @zh 可选参数
   * @zh-Hant 可選參數
   * @ru опциональные параметры
   * @en optional params
   */
  options?: ResizeObserverOptions
) => readonly [UseMeasureRect, () => void]

/**
 * @title UseMeasureRect
 */
export type UseMeasureRect = Omit<DOMRectReadOnly, 'toJSON'>
