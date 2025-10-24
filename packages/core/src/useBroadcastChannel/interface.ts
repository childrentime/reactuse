/**
 * @title UseBroadcastChannelOptions
 */
export interface UseBroadcastChannelOptions {
  /**
   * @zh 频道名称
   * @zh-Hant 頻道名稱
   * @en channel name
   */
  name: string
}

/**
 * @title UseBroadcastChannel
 */
export type UseBroadcastChannel = <D, P>(
  /**
   * @zh 选项
   * @zh-Hant 選項
   * @en options
   */
  options: UseBroadcastChannelOptions
) => UseBroadcastChannelReturn<D, P>

/**
 * @title UseBroadcastChannelReturn
 */
export interface UseBroadcastChannelReturn<D, P> {
  /**
   * @zh 是否支持
   * @zh-Hant 是否支援
   * @en is supported
   */
  readonly isSupported: boolean

  /**
   * @zh 频道
   * @zh-Hant 頻道
   * @en channel
   */
  readonly channel: BroadcastChannel | undefined

  /**
   * @zh 数据
   * @zh-Hant 資料
   * @en data
   */
  readonly data: D | undefined

  /**
   * @zh 发送数据
   * @zh-Hant 發送資料
   * @en post data
   */
  readonly post: (data: P) => void

  /**
   * @zh 关闭
   * @zh-Hant 關閉
   * @en close
   */
  readonly close: () => void

  /**
   * @zh 错误
   * @zh-Hant 錯誤
   * @en error
   */
  readonly error: Event | null

  /**
   * @zh 是否关闭
   * @zh-Hant 是否關閉
   * @en is closed
   */
  readonly isClosed: boolean

  /**
   * @zh 时间戳
   * @zh-Hant 時間戳
   * @en timestamp
   */
  readonly timeStamp: number
}
