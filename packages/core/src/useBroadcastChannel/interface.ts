/**
 * @title UseBroadcastChannelOptions
 */
export interface UseBroadcastChannelOptions {
  /**
   * @zh 频道名称
   * @zh-Hant 頻道名稱
   * @ru название канала
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
   * @ru параметры
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
   * @ru поддерживается ли
   * @en is supported
   */
  readonly isSupported: boolean

  /**
   * @zh 频道
   * @zh-Hant 頻道
   * @ru канал
   * @en channel
   */
  readonly channel: BroadcastChannel | undefined

  /**
   * @zh 数据
   * @zh-Hant 資料
   * @ru данные
   * @en data
   */
  readonly data: D | undefined

  /**
   * @zh 发送数据
   * @zh-Hant 發送資料
   * @ru отправить данные
   * @en post data
   */
  readonly post: (data: P) => void

  /**
   * @zh 关闭
   * @zh-Hant 關閉
   * @ru закрыть
   * @en close
   */
  readonly close: () => void

  /**
   * @zh 错误
   * @zh-Hant 錯誤
   * @ru ошибка
   * @en error
   */
  readonly error: Event | null

  /**
   * @zh 是否关闭
   * @zh-Hant 是否關閉
   * @ru закрыт ли
   * @en is closed
   */
  readonly isClosed: boolean

  /**
   * @zh 时间戳
   * @zh-Hant 時間戳
   * @ru временная метка
   * @en timestamp
   */
  readonly timeStamp: number
}
