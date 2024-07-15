### useSetState

#### Returns

`readonly [T, (statePartial: Partial<T> | ((currentState: T) => Partial<T>)) => void]`: 包含以下元素的元组：

- state 的当前值。
- 更新 state 值的函数。

#### Arguments

| 参数名       | 描述   | 类型         | 默认值 |
| ------------ | ------ | ------------ | ------ |
| initialState | 初始值 | T **(必填)** | -      |
