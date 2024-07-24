### UseBroadcastChannelOptions

|Property|Description|Type|DefaultValue|
|---|---|---|---|
|name|channel name|string  **(Required)**|`-`|

### UseBroadcastChannel

#### Returns
`UseBroadcastChannelReturn<D, P>`

#### Arguments
|Argument|Description|Type|DefaultValue|
|---|---|---|---|
|options|options|[UseBroadcastChannelOptions](#UseBroadcastChannelOptions)  **(Required)**|-|

### UseBroadcastChannelReturn

|Property|Description|Type|DefaultValue|
|---|---|---|---|
|isSupported|is supported|boolean  **(Required)**|`-`|
|channel|channel|BroadcastChannel \| undefined  **(Required)**|`-`|
|data|data|D \| undefined  **(Required)**|`-`|
|post|post data|(data: P) => void  **(Required)**|`-`|
|close|close|() => void  **(Required)**|`-`|
|error|error|Event \| null  **(Required)**|`-`|
|isClosed|is closed|boolean  **(Required)**|`-`|
|timeStamp|timestamp|number  **(Required)**|`-`|