### useRafFn

#### Returns
`readonly [() => void, () => void, () => boolean]`: 包含以下元素的元組：
- 停止函數。
- 開始函數。
- 函數是否在執行中。

#### Arguments
|參數名|描述|類型|預設值|
|---|---|---|---|
|callback|回调|FrameRequestCallback  **(必填)**|-|
|initiallyActive|立即执行|boolean \| undefined |-|