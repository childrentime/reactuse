### useCookie

A tuple with the following elements:
- The current value of the cookie.
- A function to update the value of the cookie.
- A function to refresh the value of the cookie, incase other events change it.

#### Returns
`readonly [string, (newValue: string | ((prevState: string) => string)) => void, () => void]`

#### Arguments
|Argument|Description|Type|DefaultValue|
|---|---|---|---|
|key|key|string  **(Required)**|-|
|options|option pass to `js-cookie`|any |-|
|defaultValue|defaultValue, must be required in ssr|string |-|