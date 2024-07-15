### UseEventSourceOptions

| 参数名        | 描述                   | 类型                                                                      | 默认值 |
| ------------- | ---------------------- | ------------------------------------------------------------------------- | ------ |
| immediate     | 立即打开连接, 默认打开 | boolean                                                                   | `-`    |
| autoReconnect | 连接断开时自动重连     | [UseEventSourceAutoReconnectOptions](#UseEventSourceAutoReconnectOptions) | `-`    |

### UseEventSourceAutoReconnectOptions

| 参数名   | 描述                                       | 类型                      | 默认值 |
| -------- | ------------------------------------------ | ------------------------- | ------ |
| retries  | 重试次数，如果是函数，会调用来判断是否重试 | number \| (() => boolean) | `-`    |
| delay    | 重连前的延迟时间                           | number                    | `-`    |
| onFailed | 重连失败时的回调                           | () => void                | `-`    |

### UseEventSourceReturn

| 参数名         | 描述             | 类型                                                         | 默认值 |
| -------------- | ---------------- | ------------------------------------------------------------ | ------ |
| eventSourceRef | EventSource 实例 | React.MutableRefObject&lt;EventSource \| null&gt; **(必填)** | `-`    |
| data           | 接收到的数据     | string \| null **(必填)**                                    | `-`    |
| error          | 发生的错误       | Event \| null **(必填)**                                     | `-`    |
| status         | 连接的状态       | [EventSourceStatus](#EventSourceStatus) **(必填)**           | `-`    |
| lastEventId    | 最后的事件 ID    | string \| null **(必填)**                                    | `-`    |
| event          | 事件名           | string \| null **(必填)**                                    | `-`    |
| close          | 关闭连接         | () => void **(必填)**                                        | `-`    |
| open           | 打开连接         | () => void **(必填)**                                        | `-`    |

### EventSourceStatus

```js
export type EventSourceStatus = 'CONNECTING' | 'CONNECTED' | 'DISCONNECTED'
```
