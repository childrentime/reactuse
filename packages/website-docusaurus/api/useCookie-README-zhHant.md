### useCookie

#### Returns
`readonly [UseCookieState, (newValue: UseCookieState | ((prevState: UseCookieState) => UseCookieState)) => void, () => void]`: 包含以下元素的元組：
- cookie 的當前值。
- 更新 cookie 值的函數。
- 刷新 cookie 值的函數，以防其他事件更改它。

#### Arguments
|參數名|描述|類型|預設值|
|---|---|---|---|
|key|键值|string  **(必填)**|-|
|options|透传给 `js-cookie` 的参数|any |-|
|defaultValue|默认值，ssr必须传递|string \| undefined |-|

### useCookieState

#### Type

`export type UseCookieState = string | undefined`
