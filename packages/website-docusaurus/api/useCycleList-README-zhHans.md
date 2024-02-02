### useCycleList

#### Returns
`readonly [T, (i?: number) => void, (i?: number) => void]`: 包含以下元素的元组：
- 数组中当前的索引对象值
- 设置索引为前一个的函数
- 设置索引为后一个的函数

#### Arguments
|参数名|描述|类型|默认值|
|---|---|---|---|
|list|循环数组|T[]  **(必填)**|-|
|i|数组索引|number |-|