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

/**
 * @title UseElementBoundingReturn
 */
export interface UseElementBoundingReturn {
  /**
   * @en Height of the element
   * @zh 元素的高度
   */
  readonly height: number;

  /**
   * @en Bottom position of the element
   * @zh 元素的底部位置
   */
  readonly bottom: number;

  /**
   * @en Left position of the element
   * @zh 元素的左侧位置
   */
  readonly left: number;

  /**
   * @en Right position of the element
   * @zh 元素的右侧位置
   */
  readonly right: number;

  /**
   * @en Top position of the element
   * @zh 元素的顶部位置
   */
  readonly top: number;

  /**
   * @en Width of the element
   * @zh 元素的宽度
   */
  readonly width: number;

  /**
   * @en X position of the element
   * @zh 元素的 X 位置
   */
  readonly x: number;

  /**
   * @en Y position of the element
   * @zh 元素的 Y 位置
   */
  readonly y: number;

  /**
   * @en Manual update
   * @zh 手动更新
   */
  readonly update: () => void;
}
