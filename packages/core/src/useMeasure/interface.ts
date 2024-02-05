import type { RefObject } from "react";

/**
 * @title useMeasure
 * @returns [DOMRect值,停止监听函数]
 * @returns_en [DOMRect, stop listening function]
 */
export type UseMeasure = (
  /**
   * @zh dom对象
   * @en dom element
   */
  target: RefObject<Element>,
  /**
   * @zh 可选参数
   * @en optional params
   */
  options?: ResizeObserverOptions
) => readonly [UseMeasureRect, () => void];

/**
 * @title UseMeasureRect
 */
export type UseMeasureRect = Omit<DOMRectReadOnly, "toJSON">;
