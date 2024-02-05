### useFocus

#### Returns
`readonly [boolean, (value: boolean) => void]`: A tuple with the following elements:
-  whether the element focus.
- A function to update focus state.

#### Arguments
|Argument|Description|Type|DefaultValue|
|---|---|---|---|
|target|dom element|React.RefObject&lt;HTMLElement \| SVGElement&gt;  **(Required)**|-|
|initialValue|defaultValue|boolean \| undefined |`false`|