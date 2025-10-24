### useCycleList

#### Returns
`readonly [T, (i?: number | undefined) => void, (i?: number | undefined) => void]`: 包含以下元素的元組：
- 陣列中當前的索引對象值
- 設定索引為前一個的函數
- 設定索引為後一個的函數

#### Arguments
|參數名|描述|類型|預設值|
|---|---|---|---|
|list|循环数组|T[]  **(必填)**|-|
|i|数组索引|number \| undefined |-|