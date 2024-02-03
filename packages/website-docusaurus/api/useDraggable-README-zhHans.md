### useDraggable

#### Returns
`readonly [number, number, boolean]`: 包含以下元素的元组：
- x
- y
- 元素是否在拖动中

#### Arguments
|参数名|描述|类型|默认值|
|---|---|---|---|
|target|dom对象|React.RefObject&lt;HTMLElement \| SVGElement&gt;  **(必填)**|-|
|options|可选参数|[UseDraggableOptions](#UseDraggableOptions) \| undefined |-|

### UseDraggableOptions

|参数名|描述|类型|默认值|
|---|---|---|---|
|exact|仅当直接单击元素时才开始拖动|boolean |`false`|
|preventDefault|阻止默认事件|boolean |`false`|
|stopPropagation|阻止事件冒泡|boolean |`false`|
|draggingElement|将“pointermove”和“pointerup”事件附加到的dom元素|RefObject&lt;HTMLElement \| SVGElement \| Window \| Document&gt; |`window`|
|handle|触发拖动事件的dom元素|RefObject&lt;HTMLElement \| SVGElement&gt; |`target`|
|pointerTypes|监听的事件类型|[PointerType](#PointerType)[] |`['mouse', 'touch', 'pen']`|
|initialValue|初始的元素位置|[Position](#Position) |`{ x: 0, y: 0 }`|
|onStart|拖动开始时的回调。 返回“false”以防止拖动|(position: [Position](#Position), event: PointerEvent) => void \| false |`-`|
|onMove|拖动时候的回调|(position: [Position](#Position), event: PointerEvent) => void |`-`|
|onEnd|拖动结束的回调|(position: [Position](#Position), event: PointerEvent) => void |`-`|

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