### useCycleList

#### Returns
`readonly [T, (i?: number) => void, (i?: number) => void]`: 包含以下元素的元组：
- 数组中当前的索引对象值
- 设置索引为前一个的函数
- 设置索引为后一个的函数

#### Arguments
|Argument|Description|Type|DefaultValue|
|---|---|---|---|
|list|cycle array|T[]  **(Required)**|-|
|i|array index|number |-|