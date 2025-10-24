import type { MutableRefObject } from 'react'

/**
 * @title useLatest
 * @returns ref 对象
 * @returns_en ref object
 * @returns_zh-Hant ref 對象
 */
export type UseLatest = <T>(
  /**
   * @zh 追踪值
   * @zh-Hant 追蹤值
   * @en tracked value
   */
  value: T
) => MutableRefObject<T>
