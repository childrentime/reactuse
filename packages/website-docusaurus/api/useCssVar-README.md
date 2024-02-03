### useCssVar

#### Returns
`readonly [string, (v: string) => void]`: A tuple with the following elements:
- The current value of the css var.
- A function to update the value of the css var.

#### Arguments
|Argument|Description|Type|DefaultValue|
|---|---|---|---|
|prop|prop, eg: --color|string  **(Required)**|-|
|target|dom element|React.RefObject&lt;T&gt;  **(Required)**|-|
|defaultValue|default value|string \| undefined |-|
|options|options|[UseCssVarOptions](#UseCssVarOptions) \| undefined |-|

### UseCssVarOptions

|Property|Description|Type|DefaultValue|
|---|---|---|---|
|observe|Use MutationObserver to monitor variable changes|boolean |`false`|