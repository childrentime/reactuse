### useCountdown

#### Returns
`readonly [string, string, string]`: 包含以下元素的元組：
- 小時。
- 分鐘。
- 秒數。

#### Arguments
|參數名|描述|類型|預設值|
|---|---|---|---|
|time|時間差|number  **(必填)**|-|
|format|時間格式化函數|((num: number) => [string, string, string]) \| undefined |`HH MM SS`|
|callback|倒計時結束的回調函數|(() => void) \| undefined |-|