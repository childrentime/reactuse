### useCountdown

#### Returns
`readonly [string, string, string]`: 包含以下元素的元组：
- 小时。
- 分钟。
- 秒数。

#### Arguments
|参数名|描述|类型|默认值|
|---|---|---|---|
|time|时间差|number  **(必填)**|-|
|format|时间格式化函数|((num: number) => [string, string, string]) \| undefined |`HH MM SS`|
|callback|倒计时结束的回调函数|(() => void) \| undefined |-|