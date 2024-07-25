/**
 * @title UseBroadcastChannelOptions
 */
export interface UseBroadcastChannelOptions {
  /**
   * @zh 频道名称
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
   * @en is supported
   */
  readonly isSupported: boolean

  /**
   * @zh 频道
   * @en channel
   */
  readonly channel: BroadcastChannel | undefined

  /**
   * @zh 数据
   * @en data
   */
  readonly data: D | undefined

  /**
   * @zh 发送数据
   * @en post data
   */
  readonly post: (data: P) => void

  /**
   * @zh 关闭
   * @en close
   */
  readonly close: () => void

  /**
   * @zh 错误
   * @en error
   */
  readonly error: Event | null

  /**
   * @zh 是否关闭
   * @en is closed
   */
  readonly isClosed: boolean

  /**
   * @zh 时间戳
   * @en timestamp
   */
  readonly timeStamp: number
}
