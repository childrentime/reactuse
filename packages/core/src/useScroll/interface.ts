import type { BasicTarget } from '../utils/domTarget'

/**
 * @title useScroll
 * @returns 包含以下元素的元组：
 * - x 值。
 * - y 值。
 * - 是否在滚动。
 * - 到达边界状态。
 * - 滚动方向
 * @returns_en A tuple with the following elements:
 * - The x value.
 * - The y value.
 * - Whether it is scrolling.
 * - Boundary arrival status.
 * - Scroll direction.
 * @returns_zh-Hant 包含以下元素的元組：
 * - x 值。
 * - y 值。
 * - 是否在滚動。
 * - 到達邊界狀態。
 * - 滚動方向
 */
export type UseScroll = (
  /**
   * @zh dom元素
   * @zh-Hant dom元素
   * @en dom elment
   */
  target: BasicTarget<Element> | Window | Document,
  /**
   * @zh 可选参数
   * @zh-Hant 可選參數
   * @en optional params
   */
  options?: UseScrollOptions
) => readonly [
  number,
  number,
  boolean,
  UseScrollArrivedState,
  UseScrollDirection,
]

/**
 * @title UseScrollOptions
 */
export interface UseScrollOptions {
  /**
   * @en Throttle time for scroll event, it's disabled by default.
   * @zh 滚动事件的节流时间，默认关闭。
   * @zh-Hant 滚動事件的節流時間，預設關閉。
   * @defaultValue 0
   */
  throttle?: number

  /**
   * @en The check time when scrolling ends.
   * This configuration will be setting to (throttle + idle) when the `throttle` is configured.
   * @zh 滚动结束时的检查时间。
   * 当配置 `throttle` 时，此配置将设置为 (throttle +idle)。
   * @zh-Hant 滚動結束時的檢查時間。
   * 當配置 `throttle` 時，此配置將設置為 (throttle +idle)。
   * @default 200
   */
  idle?: number

  /**
   * @en Offset arrived states by x pixels
   * @zh 将到达状态偏移 x 像素
   * @zh-Hant 將到達狀態偏移 x 像素
   */
  offset?: UseScrollOffset

  /**
   * @en Trigger it when scrolling.
   * @zh 滚动的回调
   * @zh-Hant 滚動的回調
   */
  onScroll?: (e: Event) => void

  /**
   * @en Trigger it when scrolling ends.
   * @zh 滚动结束的回调
   * @zh-Hant 滚動結束的回調
   */
  onStop?: (e: Event) => void

  /**
   * @en Listener options for scroll event.
   * @zh 滚动事件参数
   * @zh-Hant 滚動事件參數
   * @defaultValue {capture: false, passive: true}
   */
  eventListenerOptions?: boolean | AddEventListenerOptions
}

export interface UseScrollOffset {
  left?: number
  right?: number
  top?: number
  bottom?: number
}

/**
 * @title UseScrollArrivedState
 */
export interface UseScrollArrivedState {
  /**
   * @en arrived left
   * @zh 到达左边
   * @zh-Hant 到達左邊
   */
  left: boolean
  /**
   * @en arrived right
   * @zh 到达右边
   * @zh-Hant 到達右邊
   */
  right: boolean
  /**
   * @en arrived top
   * @zh 到达顶部
   * @zh-Hant 到達頂部
   */
  top: boolean
  /**
   * @en arrived bottom
   * @zh 到达底部
   * @zh-Hant 到達底部
   */
  bottom: boolean
}

/**
 * @title UseScrollDirection
 */
export interface UseScrollDirection {
  /**
   * @en scroll left
   * @zh 向左滚动
   * @zh-Hant 向左滚動
   */
  left: boolean
  /**
   * @en scroll right
   * @zh 向右滚动
   * @zh-Hant 向右滚動
   */
  right: boolean
  /**
   * @en scroll top
   * @zh 向上滚动
   * @zh-Hant 向上滚動
   */
  top: boolean
  /**
   * @en scroll bottom
   * @zh 向下滚动
   * @zh-Hant 向下滚動
   */
  bottom: boolean
}
