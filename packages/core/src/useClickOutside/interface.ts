import type { BasicTarget } from "../utils/domTarget";

/**
 * @title useClickOutside
 */
export type UseClickOutside = (
  /**
   * @zh dom对象
   * @en dom element
   */
  target: BasicTarget<Element>,
  /**
   * @zh 监听函数
   * @en listener fucntion
   */
  handler: (evt: EventType) => void,
  /**
   * @zh 监听函数是否生效
   * @en whether the listener fucntion is enabled
   */
  enabled?: boolean
) => void;

export type EventType = MouseEvent | TouchEvent;
