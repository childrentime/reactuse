### UseFetchEventSourceStatus

#### Type

`export type UseFetchEventSourceStatus = 'CONNECTING' | 'CONNECTED' | 'DISCONNECTED'`


### UseFetchEventSourceAutoReconnectOptions

|参数名|描述|类型|默认值|
|---|---|---|---|
|retries|重试次数，如果是函数，会调用来判断是否重试|number \| (() => boolean) |`-`|
|delay|重连前的延迟时间（毫秒）|number |`-`|
|onFailed|重连失败时的回调|() => void |`-`|

### UseFetchEventSourceOptions

|参数名|描述|类型|默认值|
|---|---|---|---|
|method|HTTP 请求方法|string |`-`|
|headers|请求头|Record&lt;string, string&gt; |`-`|
|body|POST 请求的请求体|any |`-`|
|withCredentials|使用凭证|boolean |`-`|
|immediate|立即打开连接，默认打开|boolean |`-`|
|autoReconnect|连接断开时自动重连|[UseFetchEventSourceAutoReconnectOptions](#UseFetchEventSourceAutoReconnectOptions) |`-`|
|onOpen|连接打开时的回调|() => void |`-`|
|onMessage|接收到消息时的回调|(event: [UseFetchEventSourceMessage](#UseFetchEventSourceMessage)) => void |`-`|
|onError|发生错误时的回调，返回数字表示多少毫秒后重试|(error: Error) => number \| void \| null \| undefined |`-`|
|onClose|连接关闭时的回调|() => void |`-`|

### UseFetchEventSourceMessage

|参数名|描述|类型|默认值|
|---|---|---|---|
|id|事件 ID|string \| null  **(必填)**|`-`|
|event|事件类型|string \| null  **(必填)**|`-`|
|data|事件数据|string  **(必填)**|`-`|

### UseFetchEventSourceReturn

|参数名|描述|类型|默认值|
|---|---|---|---|
|data|接收到的数据|string \| null  **(必填)**|`-`|
|error|发生的错误|Error \| null  **(必填)**|`-`|
|status|连接的状态|[UseFetchEventSourceStatus](#UseFetchEventSourceStatus)  **(必填)**|`-`|
|lastEventId|最后的事件 ID|string \| null  **(必填)**|`-`|
|event|事件名|string \| null  **(必填)**|`-`|
|close|关闭连接|() => void  **(必填)**|`-`|
|open|打开连接|() => void  **(必填)**|`-`|

### UseFetchEventSource

#### Returns
`UseFetchEventSourceReturn`

#### Arguments
|参数名|描述|类型|默认值|
|---|---|---|---|
|url|服务器发送事件的 URL|string \| URL  **(必填)**|-|
|options|EventSource 选项|[UseFetchEventSourceOptions](#UseFetchEventSourceOptions) \| undefined |-|