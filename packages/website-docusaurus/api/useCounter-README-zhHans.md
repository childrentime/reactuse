### useCounter

#### Returns
`readonly [number, (newState: number | ((prev: number) => number) | (() => number)) => void, (delta?: number | undefined) => void, (delta?: number | undefined) => void, () => void]`: 包含以下元素的元組：
- 計數器的當前值。
- 設定計數器狀態的函數。它可以接受數字或返回數字的函數。
- 遞增計數器的函數。它可以選擇接受一個數字來增加計數器，預設為 1。
- 遞減計數器的函數。它可以選擇接受一個數字來減少計數器，預設為 1。
- 將計數器重設為其初始值的函數。

#### Arguments
|参数名|描述|类型|默认值|
|---|---|---|---|
|initialValue|初始值，可以为数字或者一个初始化的函数|number \| (() => number) \| undefined |`0`|
|max|最大值。不提供则无上限|number \| null \| undefined |-|
|min|最小值。不提供则无下限|number \| null \| undefined |-|