import type { RefObject } from 'react'

/**
 * @title useInterval
 */
export type UseInterval = (
  /**
   * @zh 回调
   * @zh-Hant 回調
   * @ru обратный вызов
   * @en callback
   */
  callback: () => void,
  /**
   * @zh 时间，如果为 `null` 的话则停止计时器
   * @zh-Hant 時間，如果為 `null` 的話則停止計時器
   * @ru время, если `null`, то таймер останавливается
   * @en Time, if `null` then stop the timer
   */
  delay?: number | null,
  /**
   * @zh 可选参数
   * @ru опциональные параметры
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
   * @ru выполнять ли немедленно.
   * @en Whether to execute immediately.
   */
  immediate?: boolean
  /**
   * @zh 是否控制执行。
   * @ru контролировать ли выполнение.
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
   * @ru ref, указывающий, активен ли экземпляр pausable
   */
  isActive: RefObject<boolean>

  /**
   * @en Temporary pause the effect from executing
   * @zh 暂时暂停执行效果
   * @ru временно приостановить выполнение эффекта
   */
  pause: () => void

  /**
   * @en Resume the effects
   * @zh 恢复效果
   * @ru возобновить выполнение эффектов
   */
  resume: () => void
}
