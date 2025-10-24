### useDraggable

#### Returns
`readonly [number, number, boolean, React.Dispatch<React.SetStateAction<Position>>]`: A tuple with the following elements:
- x
- y
- Whether the element is being dragged
set the element position

#### Arguments
|Argument|Description|Type|DefaultValue|
|---|---|---|---|
|target|dom element|[BasicTarget](#basictarget)&lt;HTMLElement \| SVGElement&gt;  **(Required)**|-|
|options|optional params|[UseDraggableOptions](#usedraggableoptions) \| undefined |-|

### UseDraggableOptions

|Property|Description|Type|DefaultValue|
|---|---|---|---|
|exact|Only start the dragging when click on the element directly|boolean |`false`|
|preventDefault|Prevent events defaults|boolean |`false`|
|stopPropagation|Prevent events propagation|boolean |`false`|
|draggingElement|Element to attach `pointermove` and `pointerup` events to.|[BasicTarget](#basictarget)&lt;HTMLElement \| SVGElement&gt; |`window`|
|containerElement|Element for calculating bounds (If not set, it will use the event's target).|[BasicTarget](#basictarget)&lt;HTMLElement \| SVGAElement&gt; |`undefined`|
|handle|Handle that triggers the drag event|RefObject&lt;HTMLElement \| SVGElement&gt; |`target`|
|pointerTypes|Pointer types that listen to.|[PointerType](#pointertype)[] |`['mouse', 'touch', 'pen']`|
|initialValue|Initial position of the element.|[Position](#position) |`{ x: 0, y: 0 }`|
|onStart|Callback when the dragging starts. Return `false` to prevent dragging.|(position: [Position](#position), event: PointerEvent) => void \| false |`-`|
|onMove|Callback during dragging.|(position: [Position](#position), event: PointerEvent) => void |`-`|
|onEnd|Callback when dragging end.|(position: [Position](#position), event: PointerEvent) => void |`-`|

### BasicTarget

```js
export type BasicTarget<T extends TargetType = Element> = (() => TargetValue<T>) | TargetValue<T> | MutableRefObject<TargetValue<T>>;
```

### TargetValue

```js
type TargetValue<T> = T | undefined | null;
```

### TargetType

```js
type TargetType = HTMLElement | Element | Window | Document | EventTarget;
```

### PointerType

```js
export type PointerType = 'mouse' | 'touch' | 'pen';
```

### Position

```js
export interface Position {
  x: number;
  y: number;
}
```