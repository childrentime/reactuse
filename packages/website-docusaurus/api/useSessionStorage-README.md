### useSessionStorage

#### Returns
`readonly [T | null, React.Dispatch<React.SetStateAction<T | null>>]`: A tuple with the following elements:
- The current value of the sessionStorage.
- A function to update the value of the sessionStorage.

#### Arguments
|Argument|Description|Type|DefaultValue|
|---|---|---|---|
|key|key|string  **(Required)**|-|
|defaultValue|default value|T \| undefined |-|
|options|optional params|[UseSessionStorageOptions](#UseSessionStorageOptions)&lt;T&gt; \| undefined |-|

### UseSessionStorageOptions

|Property|Description|Type|DefaultValue|
|---|---|---|---|
|serializer|Custom data serialization|[UseSessionStorageSerializer](#UseSessionStorageSerializer)&lt;T&gt; |`-`|
|onError|On error callback|(error: unknown) => void |``console.error``|
|effectStorageValue|set to storage when storage doesn't has data in effect, fallback to `defaultValue`|T \| (() => T) |`-`|

### UseSessionStorageSerializer

|Property|Description|Type|DefaultValue|
|---|---|---|---|
|read|Custom data read|(raw: string) => T  **(Required)**|`-`|
|write|Custom data write|(value: T) => string  **(Required)**|`-`|