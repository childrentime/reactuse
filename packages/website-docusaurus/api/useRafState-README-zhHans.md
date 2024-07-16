### useRafState

#### Returns
`readonly [S, React.Dispatch<React.SetStateAction<S>>]`: 包含以下元素的元组：
- state 的当前值。
- 在 `requestAnimationFrame` 中更新 state 值的函数。

#### Arguments
|参数名|描述|类型|默认值|
|---|---|---|---|
|initialState|状态值|S \| (() => S)  **(必填)**|-|