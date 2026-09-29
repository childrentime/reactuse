### useTextDirection

#### Returns
`readonly [UseTextDirectionValue, (value: UseTextDirectionValue) => void]`: 包含以下元素的元組：
- 文字方向。
- 更新文字方向值的函數。

#### Arguments
|參數名|描述|類型|預設值|
|---|---|---|---|
|options|可選參數|[UseTextDirectionOptions](#usetextdirectionoptions) \| undefined |-|

### UseTextDirectionOptions

|參數名|描述|類型|預設值|
|---|---|---|---|
|selector|適用於目標元素的 CSS 選擇器|string |`'html'`|
|initialValue|兜底方向，目標元素沒有 `dir` 屬性時使用|[UseTextDirectionValue](#usetextdirectionvalue) |`'ltr'`|

### UseTextDirectionValue

#### Type

`export type UseTextDirectionValue = 'ltr' | 'rtl' | 'auto'`
