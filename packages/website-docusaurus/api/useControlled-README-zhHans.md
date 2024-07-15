### useControlledState

#### Returns

`[T, (value: T) => void]`: 包含以下元素的元组：

- 当前值。
- 更新当前值的函数。

#### Arguments

| 参数名       | 描述           | 类型                                          | 默认值 |
| ------------ | -------------- | --------------------------------------------- | ------ |
| value        | 受控值         | T \| undefined **(必填)**                     | -      |
| defaultValue | 默认值         | T **(必填)**                                  | -      |
| onChange     | 值改变时的回调 | ((v: T, ...args: any[]) => void) \| undefined | -      |
