/**
 * @title useWakeLock
 * @returns 包含以下元素的对象：
 * - isSupported：浏览器是否支持 Wake Lock API。
 * - isActive：当前是否持有唤醒锁。
 * - request：请求唤醒锁（页面可见时立即请求，不可见时延迟到可见时请求）。
 * - forceRequest：强制请求唤醒锁，无论页面是否可见。
 * - release：释放唤醒锁。
 * @returns_en An object with the following elements:
 * - isSupported: whether the browser supports the Wake Lock API.
 * - isActive: whether a wake lock is currently held.
 * - request: request a wake lock (immediately if visible, deferred until visible if hidden).
 * - forceRequest: force request a wake lock regardless of visibility.
 * - release: release the wake lock.
 * @returns_zh-Hant 包含以下元素的對象：
 * - isSupported：瀏覽器是否支援 Wake Lock API。
 * - isActive：當前是否持有喚醒鎖。
 * - request：請求喚醒鎖（頁面可見時立即請求，不可見時延遲到可見時請求）。
 * - forceRequest：強制請求喚醒鎖，無論頁面是否可見。
 * - release：釋放喚醒鎖。
 */
export type UseWakeLock = (
  /**
   * @zh 可选参数
   * @zh-Hant 可選參數
   * @en optional params
   */
  options?: UseWakeLockOptions
) => UseWakeLockReturn

/**
 * @title UseWakeLockOptions
 */
export interface UseWakeLockOptions {
  /**
   * @zh 请求成功时的回调
   * @zh-Hant 請求成功時的回調
   * @en callback when wake lock is acquired
   */
  onRequest?: () => void
  /**
   * @zh 释放时的回调
   * @zh-Hant 釋放時的回調
   * @en callback when wake lock is released
   */
  onRelease?: () => void
  /**
   * @zh 发生错误时的回调
   * @zh-Hant 發生錯誤時的回調
   * @en callback when an error occurs
   */
  onError?: (error: Error) => void
}

/**
 * @title UseWakeLockReturn
 */
export interface UseWakeLockReturn {
  /**
   * @zh 浏览器是否支持 Wake Lock API
   * @zh-Hant 瀏覽器是否支援 Wake Lock API
   * @en whether the browser supports the Wake Lock API
   */
  readonly isSupported: boolean
  /**
   * @zh 当前是否持有唤醒锁
   * @zh-Hant 當前是否持有喚醒鎖
   * @en whether a wake lock is currently held
   */
  readonly isActive: boolean
  /**
   * @zh 请求唤醒锁
   * @zh-Hant 請求喚醒鎖
   * @en request a wake lock
   */
  readonly request: () => Promise<void>
  /**
   * @zh 强制请求唤醒锁，无论页面是否可见
   * @zh-Hant 強制請求喚醒鎖，無論頁面是否可見
   * @en force request a wake lock regardless of page visibility
   */
  readonly forceRequest: () => Promise<void>
  /**
   * @zh 释放唤醒锁
   * @zh-Hant 釋放喚醒鎖
   * @en release the wake lock
   */
  readonly release: () => Promise<void>
}
