/**
 * @title useNetwork
 */
export type UseNetwork = () => IUseNetworkState

/**
 * @title IUseNetworkState
 */
export interface IUseNetworkState {
  /**
   * @en Whether browser connected to the network or not.
   * @zh 浏览器是否连接网络
   * @zh-Hant 瀏覽器是否連接網路
   * @ru подключен ли браузер к сети
   */
  online: boolean | undefined
  /**
   * @en Previous value of `online` property. Helps to identify if browser
   * just connected or lost connection.
   * @zh `online` 属性的先前值。 帮助识别浏览器是否
   * 刚刚连接或失去连接。
   * @zh-Hant `online` 屬性的先前值。 幫助識別瀏覽器是否
   * 剛剛連接或失去連接。
   * @ru Предыдущее значение свойства `online`. Помогает определить, только ли браузер подключился или потерял соединение.
   */
  previous: boolean | undefined
  /**
   * @en The {Date} object pointing to the moment when state change occurred.
   * @zh {Date} 对象指向状态更改发生的时刻。
   * @ru Объект {Date}, указывающий на момент изменения состояния.
   */
  since: Date | undefined
  /**
   * @en Effective bandwidth estimate in megabits per second, rounded to the
   * nearest multiple of 25 kilobits per seconds.
   * @zh 有效带宽估计（以兆位每秒为单位），四舍五入到
   * 25 kbps 的最接近倍数。
   * @ru Оценка эффективной пропускной способности в мегабитах в секунду, округленная до ближайшего кратного 25 килобит в секунду.
   */
  downlink: INetworkInformation['downlink'] | undefined
  /**
   * @en Maximum downlink speed, in megabits per second (Mbps), for the
   * underlying connection technology
   * @zh 最大下行链路速度，以兆比特每秒 (Mbps) 为单位
   * @ru Максимальная скорость загрузки в мегабитах в секунду (Мбит/с) для базовой технологии подключения
   */
  downlinkMax: INetworkInformation['downlinkMax'] | undefined
  /**
   * @en Effective type of the connection meaning one of 'slow-2g', '2g', '3g', or '4g'.
   * This value is determined using a combination of recently observed round-trip time
   * and downlink values.
   * @zh 连接的有效类型，表示"slow-2g"、"2g"、"3g"或"4g"之一。
   * 该值是根据最近观察到的往返时间和和下行链路值的组合确定的
   * @ru Эффективный тип соединения, означающий один из 'slow-2g', '2g', '3g' или '4g'. Это значение определяется на основе комбинации недавно наблюдаемого времени приема-передачи и значений загрузки.
   */
  effectiveType: INetworkInformation['effectiveType'] | undefined
  /**
   * @en Estimated effective round-trip time of the current connection, rounded
   * to the nearest multiple of 25 milliseconds
   * @zh 当前连接的估计有效往返时间，四舍五入
   * 精确到 25 毫秒的最接近倍数
   * @ru Оценочное эффективное время приема-передачи текущего соединения, округленное до ближайшего кратного 25 миллисекунд
   */
  rtt: INetworkInformation['rtt'] | undefined
  /**
   * @en {true} if the user has set a reduced data usage option on the user agent.
   * @zh 如果用户在用户代理上设置了减少数据使用选项，则为 {true}。
   * @ru {true}, если пользователь установил параметр уменьшения использования данных в пользовательском агенте.
   */
  saveData: INetworkInformation['saveData'] | undefined
  /**
   * @en The type of connection a device is using to communicate with the network.
   * It will be one of the following values:
   *  - bluetooth
   *  - cellular
   *  - ethernet
   *  - none
   *  - wifi
   *  - wimax
   *  - other
   *  - unknown
   * @zh 设备用于与网络通信的连接类型。
   * 它将是以下值之一：
   *  - 蓝牙
   * - 蜂窝网络
   * - 以太网
   *  - 没有任何
   *  - 无线上网
   * - 无线麦克斯
   *  - 其他
   * - 未知
   * @ru Тип соединения, которое устройство использует для связи с сетью. Это будет одно из следующих значений: bluetooth, cellular, ethernet, none, wifi, wimax, other, unknown
   */
  type: INetworkInformation['type'] | undefined
}

export interface INetworkInformation extends EventTarget {
  readonly downlink: number
  readonly downlinkMax: number
  readonly effectiveType: 'slow-2g' | '2g' | '3g' | '4g'
  readonly rtt: number
  readonly saveData: boolean
  readonly type:
    | 'bluetooth'
    | 'cellular'
    | 'ethernet'
    | 'none'
    | 'wifi'
    | 'wimax'
    | 'other'
    | 'unknown'

  onChange: (event: Event) => void
}
