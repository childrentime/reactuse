import type { RefObject } from "react";

/**
 * @title useDoubleClick
 */
export type UseDoubleClick = (props: UseDoubleClickProps) => void;

/**
 * @title UseDoubleClickProps
 */
export interface UseDoubleClickProps {
  /**
   * @zh dom对象
   * @en dom element
   */
  target: RefObject<Element>;

  /**
   * @zh 延迟时间（毫秒）
   * @en latency time (milliseconds)
   */
  latency?: number | undefined;

  /**
   * @zh 单击事件处理函数
   * @en single click event handler
   */
  onSingleClick?: ((e?: MouseEvent | TouchEvent) => void) | undefined;

  /**
   * @zh 双击事件处理函数
   * @en double click event handler
   */
  onDoubleClick?: ((e?: MouseEvent | TouchEvent) => void) | undefined;
}
