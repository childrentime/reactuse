### useDoubleClick

#### Returns
`void`

#### Arguments
|Argument|Description|Type|DefaultValue|
|---|---|---|---|
|props|-|[UseDoubleClickProps](#UseDoubleClickProps)  **(Required)**|-|

### UseDoubleClickProps

|Property|Description|Type|DefaultValue|
|---|---|---|---|
|target|dom element|[BasicTarget](#BasicTarget)&lt;Element&gt;  **(Required)**|`-`|
|latency|latency time (milliseconds)|number \| undefined |`-`|
|onSingleClick|single click event handler|((e?: MouseEvent \| TouchEvent) => void) \| undefined |`-`|
|onDoubleClick|double click event handler|((e?: MouseEvent \| TouchEvent) => void) \| undefined |`-`|

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