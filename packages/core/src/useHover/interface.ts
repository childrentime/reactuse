import type { RefObject } from "react";

/**
 * @title useHover
 */
export type UseHover = <T extends Element = HTMLDivElement>(
  /**
   * @zh dom对象
   * @en dom element
   */
  target: RefObject<T>
) => boolean;
