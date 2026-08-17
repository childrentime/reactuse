### UseDarkOptions

|Property|Description|Type|DefaultValue|
|---|---|---|---|
|selector|CSS Selector for the target element applying to|string |`'html'`|
|attribute|HTML attribute applying the target element|string |`'class'`|
|defaultValue|default value|boolean |`false`|
|storageKey|Key to persist the data into localStorage/sessionStorage.|string |`'reactuses-color-scheme'`|
|storage|Storage object, can be localStorage or sessionStorage|() => Storage |``localStorage``|
|classNameDark|name dark apply to element|string  **(Required)**|`-`|
|classNameLight|name light apply to element|string  **(Required)**|`-`|

### useDarkMode

#### Returns
`readonly [boolean | null, () => void, React.Dispatch<React.SetStateAction<boolean | null>>]`: A tuple with the following elements:
- The current value of the dark state.
- A function to toggle the dark state.
-  A function to update the dark state.

#### Arguments
|Argument|Description|Type|DefaultValue|
|---|---|---|---|
|options|-|[UseDarkOptions](#usedarkoptions)  **(Required)**|-|