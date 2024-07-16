### useTimeout

#### Returns
`Stoppable`: 包含以下元素的元组：
- 是否等待定时器执行。
- 设置定时器。
- 取消定时器。

#### Arguments
|参数名|描述|类型|默认值|
|---|---|---|---|
|ms|间隔时间|number \| undefined |-|
|options|-|[UseTimeoutOptions](#UseTimeoutOptions) \| undefined |-|

### UseTimeoutOptions

|参数名|描述|类型|默认值|
|---|---|---|---|
|immediate|立即设置定时器|boolean |`false`|