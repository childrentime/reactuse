import type { RefObject } from "react";

export type EventType = MouseEvent | TouchEvent;

/**
 * @title useClickOutside
 */
export type useClickOutsideType = (
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
