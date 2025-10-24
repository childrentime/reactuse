### useCounter

#### Returns
`readonly [number, (newState: number | ((prev: number) => number) | (() => number)) => void, (delta?: number | undefined) => void, (delta?: number | undefined) => void, () => void]`: 包含以下元素的元组：
- 计数器的当前值。
- 设置计数器状态的函数。 它可以接受数字或返回数字的函数。
- 递增计数器的函数。 它可以选择接受一个数字来增加计数器，默认为 1。
- 递减计数器的函数。 它可以选择接受一个数字来减少计数器，默认为 1。
- 将计数器重置为其初始值的函数。

#### Arguments
|参数名|描述|类型|默认值|
|---|---|---|---|
|initialValue|初始值，可以为数字或者一个初始化的函数|number \| (() => number) \| undefined |`0`|
|max|最大值。不提供则无上限|number \| null \| undefined |-|
|min|最小值。不提供则无下限|number \| null \| undefined |-|