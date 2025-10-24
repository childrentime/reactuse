### useTimeout

#### Returns
`Stoppable`: 包含以下元素的元組：
- 是否等待定時器執行。
- 設定定時器。
- 取消定時器。

#### Arguments
|参数名|描述|类型|默认值|
|---|---|---|---|
|ms|间隔时间|number \| undefined |-|
|options|-|[UseTimeoutOptions](#UseTimeoutOptions) \| undefined |-|

### UseTimeoutOptions

|参数名|描述|类型|默认值|
|---|---|---|---|
|immediate|立即设置定时器|boolean |`true`|