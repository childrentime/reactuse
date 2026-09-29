### UseBroadcastChannelOptions

|參數名|描述|類型|預設值|
|---|---|---|---|
|name|頻道名稱|string  **(必填)**|`-`|

### UseBroadcastChannel

#### Returns
`UseBroadcastChannelReturn<D, P>`

#### Arguments
|參數名|描述|類型|預設值|
|---|---|---|---|
|options|選項|[UseBroadcastChannelOptions](#usebroadcastchanneloptions)  **(必填)**|-|

### UseBroadcastChannelReturn

|參數名|描述|類型|預設值|
|---|---|---|---|
|isSupported|是否支援|boolean  **(必填)**|`-`|
|channel|頻道|BroadcastChannel \| undefined  **(必填)**|`-`|
|data|資料|D \| undefined  **(必填)**|`-`|
|post|發送資料|(data: P) => void  **(必填)**|`-`|
|close|關閉|() => void  **(必填)**|`-`|
|error|錯誤|Event \| null  **(必填)**|`-`|
|isClosed|是否關閉|boolean  **(必填)**|`-`|
|timeStamp|時間戳|number  **(必填)**|`-`|