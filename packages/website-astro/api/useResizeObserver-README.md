### useResizeObserver

#### Returns
`() => void`

#### Arguments
|Argument|Description|Type|DefaultValue|
|---|---|---|---|
|target|dom element|[BasicTarget](#basictarget)&lt;Element&gt;  **(Required)**|-|
|callback|callback|ResizeObserverCallback  **(Required)**|-|
|options|options passed to `resizeObserver`|ResizeObserverOptions \| undefined |-|

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