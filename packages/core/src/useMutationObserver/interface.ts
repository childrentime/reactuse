import type { RefObject } from "react";

/**
 * @title UseMutationObserver
 * @returns 停止函数
 * @returns_en stop listenering function
 */
export type UseMutationObserver = (
  /**
   * @zh 回调
   * @en callback
   */
  callback: MutationCallback,
  /**
   * @zh dom元素
   * @en dom对象
   */
  target: RefObject<Element>,
  /**
   * @zh 传递给 `MutationObserver` 的参数
   * @en options passed to `MutationObserver`
   */
  options?: MutationObserverInit
) => () => void;
