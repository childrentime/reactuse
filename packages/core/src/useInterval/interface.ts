import type { RefObject } from 'react'

/**
 * @title useInterval
 */
export type UseInterval = (
  /**
   * @zh 回调
   * @en callback
   */
  callback: () => void,
  /**
   * @zh 时间，如果为 `null` 的话则停止计时器
   * @en Time, if `null` then stop the timer
   */
  delay?: number | null,
  /**
   * @zh 可选参数
   * @en optional params
   */
  options?: UseIntervalOptions
) => Pausable

/**
 * @title UseIntervalOptions
 */
export interface UseIntervalOptions {
  /**
   * @zh 是否立即执行。
   * @en Whether to execute immediately.
   */
  immediate?: boolean
  /**
   * @zh 是否控制执行。
   * @en Whether to control execution.
   */
  controls?: boolean
}

/**
 * @title Pausable
 */
export interface Pausable {
  /**
   * @en A ref indicate whether a pausable instance is active
   * @zh 一个 ref，指示一个 pausable 实例是否处于激活状态
   */
  isActive: RefObject<boolean>

  /**
   * @en Temporary pause the effect from executing
   * @zh 暂时暂停执行效果
   */
  pause: () => void

  /**
   * @en Resume the effects
   * @zh 恢复效果
   */
  resume: () => void
}
