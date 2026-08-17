### UseFetchEventSourceStatus

#### Type

`export type UseFetchEventSourceStatus = 'CONNECTING' | 'CONNECTED' | 'DISCONNECTED'`


### UseFetchEventSourceAutoReconnectOptions

|Property|Description|Type|DefaultValue|
|---|---|---|---|
|retries|The number of retries, if it is a function, it will be called to determine whether to retry|number \| (() => boolean) |`-`|
|delay|The delay time before reconnecting (ms)|number |`-`|
|onFailed|Callback when reconnection fails|() => void |`-`|

### UseFetchEventSourceOptions

|Property|Description|Type|DefaultValue|
|---|---|---|---|
|method|HTTP method for the request|string |`-`|
|headers|Request headers|Record&lt;string, string&gt; |`-`|
|body|Request body for POST requests|any |`-`|
|withCredentials|Use credentials|boolean |`-`|
|immediate|Immediately open the connection, enabled by default|boolean |`-`|
|autoReconnect|Automatically reconnect when the connection is disconnected|[UseFetchEventSourceAutoReconnectOptions](#usefetcheventsourceautoreconnectoptions) |`-`|
|onOpen|Callback when connection opens|() => void |`-`|
|onMessage|Callback when message received|(event: [UseFetchEventSourceMessage](#usefetcheventsourcemessage)) => void |`-`|
|onError|Callback when error occurs, return number to retry after specified milliseconds|(error: Error) => number \| void \| null \| undefined |`-`|
|onClose|Callback when connection closes|() => void |`-`|

### UseFetchEventSourceMessage

|Property|Description|Type|DefaultValue|
|---|---|---|---|
|id|The event ID|string \| null  **(Required)**|`-`|
|event|The event type|string \| null  **(Required)**|`-`|
|data|The event data|string  **(Required)**|`-`|

### UseFetchEventSourceReturn

|Property|Description|Type|DefaultValue|
|---|---|---|---|
|data|The data received|string \| null  **(Required)**|`-`|
|error|The error occurred|Error \| null  **(Required)**|`-`|
|status|The status of the connection|[UseFetchEventSourceStatus](#usefetcheventsourcestatus)  **(Required)**|`-`|
|lastEventId|The last event ID|string \| null  **(Required)**|`-`|
|event|The event name|string \| null  **(Required)**|`-`|
|close|Close the connection|() => void  **(Required)**|`-`|
|open|Open the connection|() => void  **(Required)**|`-`|

### UseFetchEventSource

#### Returns
`UseFetchEventSourceReturn`

#### Arguments
|Argument|Description|Type|DefaultValue|
|---|---|---|---|
|url|The URL of the server-sent event|string \| URL  **(Required)**|-|
|options|EventSource options|[UseFetchEventSourceOptions](#usefetcheventsourceoptions) \| undefined |-|