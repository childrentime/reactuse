import type { RefObject } from 'react'

/**
 * @title useInterval
 */
export type UseInterval = (
  /**
   * @zh 回调
   * @zh-Hant 回調
   * @en callback
   */
  callback: () => void,
  /**
   * @zh 时间，如果为 `null` 的话则停止计时器
   * @zh-Hant 時間，如果為 `null` 的話則停止計時器
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
   * @zh 是否在定时器启动时（挂载以及每次 `delay` 变化时）立即执行一次回调。`delay` 为 `null`（暂停）时不会执行。
   * @zh-Hant 是否在計時器啟動時（掛載以及每次 `delay` 變化時）立即執行一次回呼。`delay` 為 `null`（暫停）時不會執行。
   * @en Whether to run the callback once immediately when the interval starts (on mount and on every `delay` change). Not run while `delay` is `null` (paused).
   */
  immediate?: boolean
  /**
   * @zh 是否改为手动控制：不再根据 `delay` 自动启动，而是通过返回的 `resume()` / `pause()` 启停。卸载时仍会自动清除。
   * @zh-Hant 是否改為手動控制：不再根據 `delay` 自動啟動，而是透過回傳的 `resume()` / `pause()` 啟停。卸載時仍會自動清除。
   * @en Whether to control the interval manually with the returned `resume()` / `pause()` instead of starting it automatically from `delay`. It is still cleared on unmount.
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
