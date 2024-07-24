### UseBroadcastChannelOptions

|参数名|描述|类型|默认值|
|---|---|---|---|
|name|频道名称|string  **(必填)**|`-`|

### UseBroadcastChannel

#### Returns
`UseBroadcastChannelReturn<D, P>`

#### Arguments
|参数名|描述|类型|默认值|
|---|---|---|---|
|options|选项|[UseBroadcastChannelOptions](#UseBroadcastChannelOptions)  **(必填)**|-|

### UseBroadcastChannelReturn

|参数名|描述|类型|默认值|
|---|---|---|---|
|isSupported|是否支持|boolean  **(必填)**|`-`|
|channel|频道|BroadcastChannel \| undefined  **(必填)**|`-`|
|data|数据|D \| undefined  **(必填)**|`-`|
|post|发送数据|(data: P) => void  **(必填)**|`-`|
|close|关闭|() => void  **(必填)**|`-`|
|error|错误|Event \| null  **(必填)**|`-`|
|isClosed|是否关闭|boolean  **(必填)**|`-`|
|timeStamp|时间戳|number  **(必填)**|`-`|