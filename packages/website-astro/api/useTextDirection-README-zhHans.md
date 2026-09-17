### useTextDirection

#### Returns
`readonly [UseTextDirectionValue, (value: UseTextDirectionValue) => void]`: 包含以下元素的元组：
- 文字方向。
- 更新文字方向值的函数。

#### Arguments
|参数名|描述|类型|默认值|
|---|---|---|---|
|options|可选参数|[UseTextDirectionOptions](#usetextdirectionoptions) \| undefined |-|

### UseTextDirectionOptions

|参数名|描述|类型|默认值|
|---|---|---|---|
|selector|适用于目标元素的 CSS 选择器|string |`'html'`|
|initialValue|兜底方向，目标元素没有 `dir` 属性时使用|[UseTextDirectionValue](#usetextdirectionvalue) |`'ltr'`|

### UseTextDirectionValue

#### Type

`export type UseTextDirectionValue = 'ltr' | 'rtl' | 'auto'`
