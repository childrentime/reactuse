import type { BasicTarget } from "../utils/domTarget";

/**
 * @title useIntersectionObserver
 * @returns 停止监听函数
 * @returns_en stop listening function
 */
export type UseIntersectionObserver = (
  /**
   * @zh dom元素
   * @en dom element
   */
  target: BasicTarget<Element>,
  /**
   * @zh 回调
   * @en callback
   */
  callback: IntersectionObserverCallback,
  /**
   * @zh 传递给 `IntersectionObserver` 的参数
   * @en options passed to `IntersectionObserver`
   */
  options?: IntersectionObserverInit
) => () => void;
