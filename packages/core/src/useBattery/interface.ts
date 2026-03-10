/**
 * @title useBattery
 * @returns_en Battery state information
 * @returns_zh 电池状态信息
 * @returns_zh-Hant 電池狀態資訊
 */
export interface UseBatteryState {
  /**
   * @en Whether the Battery API is supported
   * @zh 是否支持 Battery API
   * @zh-Hant 是否支持 Battery API
   */
  isSupported: boolean
  /**
   * @en Whether the battery is currently charging
   * @zh 电池是否正在充电
   * @zh-Hant 電池是否正在充電
   */
  charging: boolean
  /**
   * @en Time in seconds until the battery is fully charged
   * @zh 电池充满电所需的时间（秒）
   * @zh-Hant 電池充滿電所需的時間（秒）
   */
  chargingTime: number
  /**
   * @en Time in seconds until the battery is fully discharged
   * @zh 电池完全放电所需的时间（秒）
   * @zh-Hant 電池完全放電所需的時間（秒）
   */
  dischargingTime: number
  /**
   * @en Battery level from 0 to 1
   * @zh 电池电量，0到1之间
   * @zh-Hant 電池電量，0到1之間
   */
  level: number
}

export type UseBattery = () => UseBatteryState
