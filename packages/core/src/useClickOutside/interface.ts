import type { RefObject } from "react";

/**
 * @title useClickOutside
 */
export type UseClickOutsideType = (
  /**
   * @zh dom对象
   * @en dom element
   */
  target: RefObject<Element>,
  /**
   * @zh 监听函数
   * @en listener fucntion
   */
  handler: (evt: EventType) => void) => void;

export type EventType = MouseEvent | TouchEvent;
