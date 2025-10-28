import type { FetchEventSourceInit } from '@microsoft/fetch-event-source'

/**
 * @title UseFetchEventSourceStatus
 * @description Connection status of EventSource
 */
export type UseFetchEventSourceStatus = 'CONNECTING' | 'CONNECTED' | 'DISCONNECTED'

/**
 * @title UseFetchEventSourceAutoReconnectOptions
 */
export interface UseFetchEventSourceAutoReconnectOptions {
  /**
   * @en The number of retries, if it is a function, it will be called to determine whether to retry
   * @zh 重试次数，如果是函数，会调用来判断是否重试
   * @zh-Hant 重試次數，如果是函數，會調用來判斷是否重試
   * @ru количество повторных попыток, если это функция, она будет вызвана для определения необходимости повтора
   */
  retries?: number | (() => boolean)

  /**
   * @en The delay time before reconnecting (ms)
   * @zh 重连前的延迟时间（毫秒）
   * @zh-Hant 重連前的延遲時間（毫秒）
   * @ru время задержки перед переподключением (мс)
   */
  delay?: number

  /**
   * @en Callback when reconnection fails
   * @zh 重连失败时的回调
   * @zh-Hant 重連失敗時的回調
   * @ru обратный вызов при неудачном переподключении
   */
  onFailed?: () => void
}

/**
 * @title UseFetchEventSourceOptions
 */
export interface UseFetchEventSourceOptions extends Omit<FetchEventSourceInit, 'signal'> {
  /**
   * @en HTTP method for the request
   * @zh HTTP 请求方法
   * @ru HTTP-метод для запроса
   */
  method?: string

  /**
   * @en Request headers
   * @zh 请求头
   * @ru заголовки запроса
   */
  headers?: Record<string, string>

  /**
   * @en Request body for POST requests
   * @zh POST 请求的请求体
   * @ru тело запроса для POST-запросов
   */
  body?: any

  /**
   * @en Use credentials
   * @zh 使用凭证
   * @ru использовать учетные данные
   */
  withCredentials?: boolean

  /**
   * @en Immediately open the connection, enabled by default
   * @zh 立即打开连接，默认打开
   * @ru немедленно открыть соединение, по умолчанию включено
   */
  immediate?: boolean

  /**
   * @en Automatically reconnect when the connection is disconnected
   * @zh 连接断开时自动重连
   * @ru автоматически переподключаться при разрыве соединения
   */
  autoReconnect?: UseFetchEventSourceAutoReconnectOptions

  /**
   * @en Callback when connection opens
   * @zh 连接打开时的回调
   * @ru обратный вызов при открытии соединения
   */
  onOpen?: () => void

  /**
   * @en Callback when message received
   * @zh 接收到消息时的回调
   * @ru обратный вызов при получении сообщения
   */
  onMessage?: (event: UseFetchEventSourceMessage) => void

  /**
   * @en Callback when error occurs, return number to retry after specified milliseconds
   * @zh 发生错误时的回调，返回数字表示多少毫秒后重试
   * @ru обратный вызов при возникновении ошибки, верните число для повтора через указанные миллисекунды
   */
  onError?: (error: Error) => number | void | null | undefined

  /**
   * @en Callback when connection closes
   * @zh 连接关闭时的回调
   * @ru обратный вызов при закрытии соединения
   */
  onClose?: () => void
}

/**
 * @title UseFetchEventSourceMessage
 */
export interface UseFetchEventSourceMessage {
  /**
   * @en The event ID
   * @zh 事件 ID
   * @ru ID события
   */
  id: string | null

  /**
   * @en The event type
   * @zh 事件类型
   * @ru тип события
   */
  event: string | null

  /**
   * @en The event data
   * @zh 事件数据
   * @ru данные события
   */
  data: string
}

/**
 * @title UseFetchEventSourceReturn
 */
export interface UseFetchEventSourceReturn {
  /**
   * @en The data received
   * @zh 接收到的数据
   * @ru полученные данные
   */
  data: string | null

  /**
   * @en The error occurred
   * @zh 发生的错误
   * @ru произошедшая ошибка
   */
  error: Error | null

  /**
   * @en The status of the connection
   * @zh 连接的状态
   * @ru статус соединения
   */
  status: UseFetchEventSourceStatus

  /**
   * @en The last event ID
   * @zh 最后的事件 ID
   * @ru последний ID события
   */
  lastEventId: string | null

  /**
   * @en The event name
   * @zh 事件名
   * @ru название события
   */
  event: string | null

  /**
   * @en Close the connection
   * @zh 关闭连接
   * @ru закрыть соединение
   */
  close: () => void

  /**
   * @en Open the connection
   * @zh 打开连接
   * @ru открыть соединение
   */
  open: () => void
}

/**
 * @title UseFetchEventSource
 */
export type UseFetchEventSource = (
  /**
   * @en The URL of the server-sent event
   * @zh 服务器发送事件的 URL
   * @ru URL события, отправленного сервером
   */
  url: string | URL,

  /**
   * @en EventSource options
   * @zh EventSource 选项
   * @ru параметры EventSource
   */
  options?: UseFetchEventSourceOptions
) => UseFetchEventSourceReturn
