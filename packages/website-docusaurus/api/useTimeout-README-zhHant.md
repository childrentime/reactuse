### useTimeout

#### Returns
`Stoppable`: 包含以下元素的元組：
- 是否等待定時器執行。
- 設定定時器。
- 取消定時器。

#### Arguments
|參數名|描述|類型|預設值|
|---|---|---|---|
|ms|间隔时间|number \| undefined |-|
|options|-|[UseTimeoutOptions](#usetimeoutoptions) \| undefined |-|

### UseTimeoutOptions

|參數名|描述|類型|預設值|
|---|---|---|---|
|immediate|立即设置定时器|boolean |`true`|