### useDraggable

#### Returns
`readonly [number, number, boolean]`

#### Arguments
|Argument|Description|Type|DefaultValue|
|---|---|---|---|
|target|dom element|React.RefObject&lt;HTMLElement \| SVGElement&gt;  **(Required)**|-|
|options|optional params|[UseDraggableOptions](#UseDraggableOptions) |-|

### UseDraggableOptions

|Property|Description|Type|DefaultValue|
|---|---|---|---|
|exact|Only start the dragging when click on the element directly|boolean |`false`|
|preventDefault|Prevent events defaults|boolean |`false`|
|stopPropagation|Prevent events propagation|boolean |`false`|
|draggingElement|Element to attach `pointermove` and `pointerup` events to.|RefObject&lt;HTMLElement \| SVGElement \| Window \| Document&gt; |`window`|
|handle|Handle that triggers the drag event|RefObject&lt;HTMLElement \| SVGElement&gt; |`target`|
|pointerTypes|Pointer types that listen to.|[PointerType](#PointerType)[] |`['mouse', 'touch', 'pen']`|
|initialValue|Initial position of the element.|[Position](#Position) |`{ x: 0, y: 0 }`|
|onStart|Callback when the dragging starts. Return `false` to prevent dragging.|(position: [Position](#Position), event: PointerEvent) => void \| false |`-`|
|onMove|Callback during dragging.|(position: [Position](#Position), event: PointerEvent) => void |`-`|
|onEnd|Callback when dragging end.|(position: [Position](#Position), event: PointerEvent) => void |`-`|

### PointerType

```js
export type PointerType = "mouse" | "touch" | "pen";
```

### Position

```js
export interface Position {
  x: number;
  y: number;
}
```