### useSessionStorage

#### Returns
`readonly [T | null, React.Dispatch<React.SetStateAction<T | null>>]`: 包含以下元素的元组：
- sessionStorage 的当前值。
- 更新 sessionStorage 值的函数。

#### Arguments
|参数名|描述|类型|默认值|
|---|---|---|---|
|key|键值|string  **(必填)**|-|
|defaultValue|默认值|T \| undefined |-|
|options|可选参数|[UseSessionStorageOptions](#UseSessionStorageOptions)&lt;T&gt; \| undefined |-|

### UseSessionStorageOptions

|参数名|描述|类型|默认值|
|---|---|---|---|
|serializer|自定义数据序列化|[UseSessionStorageSerializer](#UseSessionStorageSerializer)&lt;T&gt; |`-`|
|onError|错误回调|(error: unknown) => void |``console.error``|
|effectStorageValue|首次挂载时没有数据时设置到 storage, 已弃用|T \| (() => T) |`-`|
|mountStorageValue|首次挂载时没有数据时设置到 storage|T \| (() => T) |`-`|
|listenToStorageChanges|监听 storage 变化|boolean |``true``|

### UseSessionStorageSerializer

|参数名|描述|类型|默认值|
|---|---|---|---|
|read|自定义数据读取|(raw: string) => T  **(必填)**|`-`|
|write|自定义数据写入|(value: T) => string  **(必填)**|`-`|