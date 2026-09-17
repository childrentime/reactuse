### useTextDirection

#### Returns
`readonly [UseTextDirectionValue, (value: UseTextDirectionValue) => void]`: A tuple with the following elements:
- The current value of the text direction.
- A function to update the value of the text direction.

#### Arguments
|Argument|Description|Type|DefaultValue|
|---|---|---|---|
|options|optional params|[UseTextDirectionOptions](#usetextdirectionoptions) \| undefined |-|

### UseTextDirectionOptions

|Property|Description|Type|DefaultValue|
|---|---|---|---|
|selector|CSS Selector for the target element applying to|string |`'html'`|
|initialValue|Fallback direction, used when the target element has no `dir` attribute|[UseTextDirectionValue](#usetextdirectionvalue) |`'ltr'`|

### UseTextDirectionValue

#### Type

`export type UseTextDirectionValue = 'ltr' | 'rtl' | 'auto'`
