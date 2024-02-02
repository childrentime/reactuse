### useCookie

#### Returns
`readonly [string, (newValue: string | ((prevState: string) => string)) => void, () => void]`: A tuple with the following elements:
- The current value of the cookie.
- A function to update the value of the cookie.
- A function to refresh the value of the cookie, incase other events change it.

#### Arguments
|参数名|描述|类型|默认值|
|---|---|---|---|
|key|键值|string  **(必填)**|-|
|options|透传给 `js-cookie` 的参数|any |-|
|defaultValue|默认值，ssr必须传递|string |-|