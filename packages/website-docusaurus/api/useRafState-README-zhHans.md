### useRafState

#### Returns
`readonly [S, React.Dispatch<React.SetStateAction<S>>]`: 包含以下元素的元組：
- state 的當前值。
- 在 `requestAnimationFrame` 中更新 state 值的函數。

#### Arguments
|参数名|描述|类型|默认值|
|---|---|---|---|
|initialState|状态值|S \| (() => S)  **(必填)**|-|