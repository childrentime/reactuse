### useCookie

#### Returns
`readonly [string, (newValue: string | ((prevState: string) => string)) => void, () => void]`

#### Arguments
|Argument|Description|Type|DefaultValue|
|---|---|---|---|
|key|key|string  **(Required)**|-|
|options|option pass to `js-cookie`|any |-|
|defaultValue|defaultValue, must be required in ssr|string |-|