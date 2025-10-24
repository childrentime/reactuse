### UseDarkOptions

|参数名|描述|类型|默认值|
|---|---|---|---|
|selector|适用于目标元素的 CSS 选择器|string |`'html'`|
|attribute|应用到目标元素的 html 属性|string |`'class'`|
|defaultValue|默认值|boolean |`false`|
|storageKey|将数据持久保存到 localStorage/sessionStorage 的键值|string |`'reactuses-color-scheme'`|
|storage|存储对象，可以是localStorage或sessionStorage|() => Storage |``localStorage``|
|classNameDark|应用到目标元素上黑色类名称|string  **(必填)**|`-`|
|classNameLight|应用到目标元素上的亮色类名称|string  **(必填)**|`-`|

### useDarkMode

#### Returns
`readonly [boolean | null, () => void, React.Dispatch<React.SetStateAction<boolean | null>>]`: 包含以下元素的元組：
- 黑暗狀態的當前值。
- 切換黑暗狀態的功能。
- 更新黑暗狀態的功能。

#### Arguments
|参数名|描述|类型|默认值|
|---|---|---|---|
|options|-|[UseDarkOptions](#UseDarkOptions)  **(必填)**|-|