### useLocalStorage

#### Returns
`readonly [T | null, React.Dispatch<React.SetStateAction<T | null>>]`: A tuple with the following elements:
- The current value of the localStorage.
- A function to update the value of the localStorage.

#### Arguments
|Argument|Description|Type|DefaultValue|
|---|---|---|---|
|key|key|string  **(Required)**|-|
|defaultValue|default value|T \| undefined |-|
|options|optional params|[UseLocalStorageOptions](#uselocalstorageoptions)&lt;T&gt; \| undefined |-|

### UseLocalStorageOptions

|Property|Description|Type|DefaultValue|
|---|---|---|---|
|serializer|Custom data serialization|[UseLocalStorageSerializer](#uselocalstorageserializer)&lt;T&gt; |`-`|
|onError|On error callback|(error: unknown) => void |``console.error``|
|effectStorageValue|set to storage when nodata in first mount, deprecated|T \| (() => T) |`-`|
|mountStorageValue|set to storage when nodata in first mount|T \| (() => T) |`-`|
|listenToStorageChanges|listen to storage changes|boolean |``true``|

### UseLocalStorageSerializer

|Property|Description|Type|DefaultValue|
|---|---|---|---|
|read|Custom data read|(raw: string) => T  **(Required)**|`-`|
|write|Custom data write|(value: T) => string  **(Required)**|`-`|