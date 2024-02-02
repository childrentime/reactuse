import type { RefObject } from "react";

/**
 * @title useElementBounding
 */

export type UseElementBounding = (
  /**
   * @zh 目标元素
   * @en target element
   */
  target: RefObject<Element>,
  /**
   * @zh 可选参数
   * @en optional params
   */
  options?: UseElementBoundingOptions
) => UseElementBoundingReturn;

/**
 * @title UseElementBoundingOptions
 */
export interface UseElementBoundingOptions {
  /**
   * @en Reset values to 0 on component unmounted
   * @zh 将数值重置为0
   * @defaultValue true
   */
  reset?: boolean;

  /**
   * @en Listen to window resize event
   * @zh 是否监听 resize 事件
   * @defaultValue true
   */
  windowResize?: boolean;
  /**
   * @en Listen to window scroll event
   * @zh 是否监听 scroll 事件
   * @defaultValue true
   */
  windowScroll?: boolean;

  /**
   * @en Immediately call update on component mounted
   * @zh 立即更新
   * @default true
   */
  immediate?: boolean;
}

export interface UseElementBoundingReturn {
  readonly height: number;
  readonly bottom: number;
  readonly left: number;
  readonly right: number;
  readonly top: number;
  readonly width: number;
  readonly x: number;
  readonly y: number;
  readonly update: () => void;
}
