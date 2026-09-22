### useSessionStorage

#### Returns
`readonly [T | null, React.Dispatch<React.SetStateAction<T | null>>]`: 包含以下元素的元組：
- sessionStorage 的當前值。
- 更新 sessionStorage 值的函數。

#### Arguments
|參數名|描述|類型|預設值|
|---|---|---|---|
|key|鍵值|string  **(必填)**|-|
|defaultValue|預設值|T \| undefined |-|
|options|可選參數|[UseSessionStorageOptions](#usesessionstorageoptions)&lt;T&gt; \| undefined |-|

### UseSessionStorageOptions

|參數名|描述|類型|預設值|
|---|---|---|---|
|serializer|自定義數據序列化|[UseSessionStorageSerializer](#usesessionstorageserializer)&lt;T&gt; |`-`|
|onError|錯誤回調|(error: unknown) => void |``console.error``|
|effectStorageValue|首次掛載時沒有數據時設置到 storage, 已棄用|T \| (() => T) |`-`|
|mountStorageValue|首次掛載時沒有數據時設置到 storage|T \| (() => T) |`-`|
|listenToStorageChanges|監聽 storage 變化|boolean |``true``|

### UseSessionStorageSerializer

|參數名|描述|類型|預設值|
|---|---|---|---|
|read|自定義數據讀取|(raw: string) => T  **(必填)**|`-`|
|write|自定義數據寫入|(value: T) => string  **(必填)**|`-`|