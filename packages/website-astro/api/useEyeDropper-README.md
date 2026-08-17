### useEyeDropper

#### Returns
`readonly [boolean, (options?: UseEyeDropperOpenOptions | undefined) => Promise<UseEyeDropperOpenReturnType>]`: A tuple with the following elements:
- Whether the browser supports this feature.
- A function to open eye dropper.

#### Arguments


### UseEyeDropperOpenOptions

|Property|Description|Type|DefaultValue|
|---|---|---|---|
|signal|abort signal|AbortSignal |`-`|

### UseEyeDropperOpenReturnType

|Property|Description|Type|DefaultValue|
|---|---|---|---|
|sRGBHex|rgb color value|string  **(Required)**|`-`|