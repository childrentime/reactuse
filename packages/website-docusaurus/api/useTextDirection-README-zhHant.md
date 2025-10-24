### useTextDirection

#### Returns
`readonly [UseTextDirectionValue, (value: UseTextDirectionValue) => void]`: 包含以下元素的元組：
- 文字方向。
- 更新文字方向值的函數。

#### Arguments
|參數名|描述|類型|預設值|
|---|---|---|---|
|options|可选参数|[UseTextDirectionOptions](#UseTextDirectionOptions) \| undefined |-|

### UseTextDirectionOptions

|參數名|描述|類型|預設值|
|---|---|---|---|
|selector|适用于目标元素的 CSS 选择器|string |`'html'`|
|initialValue|初始值|[UseTextDirectionValue](#UseTextDirectionValue) |`'ltr'`|

### UseTextDirectionValue

#### Type

`export type UseTextDirectionValue = 'ltr' | 'rtl' | 'auto'`
