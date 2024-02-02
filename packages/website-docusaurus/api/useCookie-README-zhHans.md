### useCookie

包含以下元素的元组：
- cookie 的当前值。
- 更新 cookie 值的函数。
- 刷新 cookie 值的函数，以防其他事件更改它。

#### Returns
`readonly [string, (newValue: string | ((prevState: string) => string)) => void, () => void]`

#### Arguments
|参数名|描述|类型|默认值|
|---|---|---|---|
|key|键值|string  **(必填)**|-|
|options|透传给 `js-cookie` 的参数|any |-|
|defaultValue|默认值，ssr必须传递|string |-|