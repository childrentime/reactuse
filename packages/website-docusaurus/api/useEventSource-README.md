### UseEventSourceOptions

|Property|Description|Type|DefaultValue|
|---|---|---|---|
|immediate|immediately open the connection, enabled by default|boolean |`-`|
|autoReconnect|Automatically reconnect when the connection is disconnected|[UseEventSourceAutoReconnectOptions](#UseEventSourceAutoReconnectOptions) |`-`|

### UseEventSourceAutoReconnectOptions

|Property|Description|Type|DefaultValue|
|---|---|---|---|
|retries|The number of retries, if it is a function, it will be called to determine whether to retry|number \| (() => boolean) |`-`|
|delay|The delay time before reconnecting|number |`-`|
|onFailed|Callback when reconnection fails|() => void |`-`|

### UseEventSourceReturn

|Property|Description|Type|DefaultValue|
|---|---|---|---|
|eventSourceRef|EventSource instance|React.MutableRefObject&lt;EventSource \| null&gt;  **(Required)**|`-`|
|data|The data received|string \| null  **(Required)**|`-`|
|error|The error occurred|Event \| null  **(Required)**|`-`|
|status|The status of the connection|[EventSourceStatus](#EventSourceStatus)  **(Required)**|`-`|
|lastEventId|The last event ID|string \| null  **(Required)**|`-`|
|event|The event name|string \| null  **(Required)**|`-`|
|close|Close the connection|() => void  **(Required)**|`-`|
|open|Open the connection|() => void  **(Required)**|`-`|

### EventSourceStatus

```js
export type EventSourceStatus = "CONNECTING" | "CONNECTED" | "DISCONNECTED";
```