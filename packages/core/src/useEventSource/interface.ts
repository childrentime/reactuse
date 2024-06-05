export type EventSourceStatus = "CONNECTING" | "CONNECTED" | "DISCONNECTED";

/**
 * @title UseEventSourceOptions
 */
export interface UseEventSourceOptions extends EventSourceInit {
  /**
   * @en immediately open the connection, enabled by default
   * @zh 立即打开连接, 默认打开
   */
  immediate?: boolean;
  /**
   * @en Automatically reconnect when the connection is disconnected
   * @zh 连接断开时自动重连
   */
  autoReconnect?: UseEventSourceAutoReconnectOptions;
}

/**
 * @title UseEventSourceAutoReconnectOptions
 */
export interface UseEventSourceAutoReconnectOptions {
  /**
   * @en The number of retries, if it is a function, it will be called to determine whether to retry
   * @zh 重试次数，如果是函数，会调用来判断是否重试
   */
  retries?: number | (() => boolean);
  /**
   * @en The delay time before reconnecting
   * @zh 重连前的延迟时间
   */
  delay?: number;
  /**
   * @en Callback when reconnection fails
   * @zh 重连失败时的回调
   */
  onFailed?: () => void;
}

export type UseEventSource = <Events extends string[]>(
  /**
   * @en The URL of the server-sent event
   * @zh 服务器发送事件的 URL
   */
  url: string | URL,
  /**
   * @en The event name to listen to
   * @zh 要监听的事件名
   */
  events?: Events,
  /**
   * @en EventSource options
   * @zh EventSource 选项
   */
  options?: UseEventSourceOptions
) => UseEventSourceReturn;

/**
 * @title UseEventSourceReturn
 */
export interface UseEventSourceReturn {
  /**
   * @en EventSource instance
   * @zh EventSource 实例
   */
  eventSourceRef: React.MutableRefObject<EventSource | null>;
  /**
   * @en The data received
   * @zh 接收到的数据
   */
  data: string | null;
  /**
   * @en The error occurred
   * @zh 发生的错误
   */
  error: Event | null;
  /**
   * @en The status of the connection
   * @zh 连接的状态
   */
  status: EventSourceStatus;
  /**
   * @en The last event ID
   * @zh 最后的事件 ID
   */
  lastEventId: string | null;
  /**
   * @en The event name
   * @zh 事件名
   */
  event: string | null;
  /**
   * @zh 关闭连接
   * @en Close the connection
   */
  close: () => void;
  /**
   * @zh 打开连接
   *  @en Open the connection
   */
  open: () => void;
}
