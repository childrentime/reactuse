### useMousePressed

#### Returns
`readonly [boolean, UseMousePressedSourceType]`: A tuple with the following elements:
- whether the mouse is pressed.
- the pressed source type

#### Arguments
|Argument|Description|Type|DefaultValue|
|---|---|---|---|
|target|dom element|React.RefObject&lt;Element&gt; \| undefined |-|
|options|optional params|[UseMousePressedOptions](#UseMousePressedOptions) \| undefined |-|

### UseMousePressedOptions

|Property|Description|Type|DefaultValue|
|---|---|---|---|
|touch|Listen to `touchstart` `touchend` events|boolean |`true`|
|drag|Listen to `dragstart` `drop` and `dragend` events|boolean |`true`|
|initialValue|Initial values|boolean \| (() => boolean) |`false`|

### UseMousePressedSourceType

#### Type

`export type UseMousePressedSourceType = "mouse" | "touch" | null;`
