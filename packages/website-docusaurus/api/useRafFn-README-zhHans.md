### useRafFn

#### Returns
`readonly [() => void, () => void, () => boolean]`: 包含以下元素的元组：
- 停止函数。
- 开始函数。
- 函数是否在执行中。

#### Arguments
|参数名|描述|类型|默认值|
|---|---|---|---|
|callback|回调|FrameRequestCallback  **(必填)**|-|
|initiallyActive|立即执行|boolean \| undefined |-|