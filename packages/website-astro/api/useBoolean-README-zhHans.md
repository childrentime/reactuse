### useBoolean

#### Returns
`{ readonly value: boolean; readonly setValue: (value: boolean) => void; readonly setTrue: () => void; readonly setFalse: () => void; readonly toggle: () => void; }`: 包含以下属性的对象：
- value: 当前的布尔值。
- setValue: 直接设置布尔值的函数。
- setTrue: 将值设置为 true 的函数。
- setFalse: 将值设置为 false 的函数。
- toggle: 切换布尔值的函数。

#### Arguments
|参数名|描述|类型|默认值|
|---|---|---|---|
|initialValue|初始值，默认为 false|boolean \| undefined |-|