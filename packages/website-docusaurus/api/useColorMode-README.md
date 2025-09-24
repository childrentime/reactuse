### UseColorModeOptions

|Property|Description|Type|DefaultValue|
|---|---|---|---|
|selector|CSS Selector for the target element applying to|string |`'html'`|
|attribute|HTML attribute applying the target element|string |`'class'`|
|modes|Available color modes|T[]  **(Required)**|`-`|
|defaultValue|Default color mode|T |`-`|
|storageKey|Key to persist the data into localStorage/sessionStorage.|string |`'reactuses-color-mode'`|
|storage|Storage object, can be localStorage or sessionStorage|() => Storage \| undefined |``localStorage``|
|initialValueDetector|Function to get initial color mode from system preference|() => T |`-`|
|modeClassNames|Mapping of color modes to their corresponding class names or attribute values|Partial&lt;Record&lt;T, string&gt;&gt; |`-`|

### useColorMode

#### Returns
`readonly [T | null, React.Dispatch<React.SetStateAction<T | null>>, () => void]`: A tuple with the following elements:
- The current color mode value.
- A function to set the color mode.
- A function to cycle through available modes.

#### Arguments
|Argument|Description|Type|DefaultValue|
|---|---|---|---|
|options|-|[UseColorModeOptions](#UseColorModeOptions)&lt;T&gt;  **(Required)**|-|