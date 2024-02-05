import type { MutableRefObject } from "react";

/**
 * @title useLatest
 * @returns ref 对象
 * @returns_en ref object
 */
export type UseLatest = <T>(
  /**
   * @zh 追踪值
   * @en tracked value
   */
  value: T
) => MutableRefObject<T>;
