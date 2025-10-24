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
|options|optional params|[UseSessionStorageOptions](#usesessionstorageoptions)&lt;T&gt; \| undefined |-|

### UseSessionStorageOptions

|Property|Description|Type|DefaultValue|
|---|---|---|---|
|serializer|Custom data serialization|[UseSessionStorageSerializer](#usesessionstorageserializer)&lt;T&gt; |`-`|
|onError|On error callback|(error: unknown) => void |``console.error``|
|effectStorageValue|set to storage when nodata in first mount, deprecated|T \| (() => T) |`-`|
|mountStorageValue|set to storage when nodata in first mount|T \| (() => T) |`-`|
|listenToStorageChanges|listen to storage changes|boolean |``true``|

### UseSessionStorageSerializer

|Property|Description|Type|DefaultValue|
|---|---|---|---|
|read|Custom data read|(raw: string) => T  **(Required)**|`-`|
|write|Custom data write|(value: T) => string  **(Required)**|`-`|