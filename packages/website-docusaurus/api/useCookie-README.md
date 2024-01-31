### useCookie

#### Returns
`readonly [string, (newValue: string | ((prevState: string) => string)) => void, () => void]`: 包含以下元素的元组：
- cookie 的当前值。
- 更新 cookie 值的函数。
- 刷新 cookie 值的函数，以防其他事件更改它。

#### Arguments
|Argument|Description|Type|DefaultValue|
|---|---|---|---|
|key|key|string  **(Required)**|-|
|options|option pass to `js-cookie`|any |-|
|defaultValue|defaultValue, must be required in ssr|string |-|