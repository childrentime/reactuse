### UseDarkOptions

|Property|Description|Type|DefaultValue|
|---|---|---|---|
|selector|CSS Selector for the target element applying to|string |`'html'`|
|attribute|HTML attribute applying the target element|string |`'class'`|
|defaultValue|default value|boolean |`false`|
|storageKey|Key to persist the data into localStorage/sessionStorage.|string |`'reactuses-color-scheme'`|
|storage|Storage object, can be localStorage or sessionStorage|() => Storage |``localStorage``|
|classNameDark|name dark apply to element|string  **(Required)**|`-`|
|classNameLight|name light apply to element|string  **(Required)**|`-`|

### useDarkMode

#### Returns
`readonly [boolean, () => void, React.Dispatch<React.SetStateAction<boolean>>]`: 包含以下元素的元组：
- 黑暗状态的当前值。
- 切换黑暗状态的功能。
- 更新黑暗状态的功能。

#### Arguments
|Argument|Description|Type|DefaultValue|
|---|---|---|---|
|options|-|[UseDarkOptions](#UseDarkOptions)  **(Required)**|-|