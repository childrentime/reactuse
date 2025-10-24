### useBoolean

#### Returns
`{ readonly value: boolean; readonly setValue: (value: boolean) => void; readonly setTrue: () => void; readonly setFalse: () => void; readonly toggle: () => void; }`: 包含以下屬性的物件：
- value: 當前的布林值。
- setValue: 直接設定布林值的函數。
- setTrue: 將值設定為 true 的函數。
- setFalse: 將值設定為 false 的函數。
- toggle: 切換布林值的函數。

#### Arguments
|参数名|描述|类型|默认值|
|---|---|---|---|
|initialValue|初始值，默认为 false|boolean \| undefined |-|