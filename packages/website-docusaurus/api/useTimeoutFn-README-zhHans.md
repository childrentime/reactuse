### useTimeoutFn

#### Returns
`Stoppable`: 包含以下元素的元組：
- 是否等待定時器執行。
- 設置定時器。
- 取消定時器。

#### Arguments
|参数名|描述|类型|默认值|
|---|---|---|---|
|cb|回调|(...args: unknown[]) => any  **(必填)**|-|
|interval|间隔时间|number  **(必填)**|-|
|options|可选参数|[UseTimeoutFnOptions](#UseTimeoutFnOptions) \| undefined |-|

### UseTimeoutFnOptions

|参数名|描述|类型|默认值|
|---|---|---|---|
|immediate|立即设置定时器|boolean |`true`|