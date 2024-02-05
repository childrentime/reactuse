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
  callback: ResizeObserverCallback
) => () => void;
