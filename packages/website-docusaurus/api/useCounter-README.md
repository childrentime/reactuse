### useCounter

#### Returns
`readonly [number, (newState: number | ((prev: number) => number) | (() => number)) => void, (delta?: number) => void, (delta?: number) => void, () => void]`: 包含以下元素的元组：
- 计数器的当前值。
- 设置计数器状态的函数。 它可以接受数字或返回数字的函数。
- 递增计数器的函数。 它可以选择接受一个数字来增加计数器，默认为 1。
- 递减计数器的函数。 它可以选择接受一个数字来减少计数器，默认为 1。
- 将计数器重置为其初始值的函数。

#### Arguments
|Argument|Description|Type|DefaultValue|
|---|---|---|---|
|initialValue|The initial value of the counter. It can be a number or a function that returns a number. If not provided, the counter will start from 0.|number \| (() => number) |`0`|
|max|The maximum value that the counter can reach. If not provided or null, there is no upper limit.|number |-|
|min|The minimum value that the counter can reach. If not provided or null, there is no lower limit.|number |-|