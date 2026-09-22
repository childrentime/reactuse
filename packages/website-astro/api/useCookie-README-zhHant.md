### useCookie

#### Returns
`readonly [UseCookieState, (newValue: UseCookieState | ((prevState: UseCookieState) => UseCookieState)) => void, () => void]`: 包含以下元素的元組：
- cookie 的當前值。
- 更新 cookie 值的函數。
- 刷新 cookie 值的函數，以防其他事件更改它。

#### Arguments
|參數名|描述|類型|預設值|
|---|---|---|---|
|key|鍵值|string  **(必填)**|-|
|options|透傳給 `js-cookie` 的參數|any |-|
|defaultValue|預設值，ssr必須傳遞|string \| undefined |-|

### useCookieState

#### Type

`export type UseCookieState = string | undefined`
