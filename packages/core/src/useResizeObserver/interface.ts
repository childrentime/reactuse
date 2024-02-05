import type { RefObject } from "react";

/**
 * @title useResizeObserver
 */
export type UseResizeObserver = (
  /**
   * @zh dom元素
   * @en dom element
   */
  target: RefObject<Element>,
  /**
   * @zh 回调
   * @en callback
   */
  callback: ResizeObserverCallback,
/**
   * @zh `resizeObserver` 参数
   * @en options passed to `resizeObserver`
   */
  options?: ResizeObserverOptions
) => () => void;
