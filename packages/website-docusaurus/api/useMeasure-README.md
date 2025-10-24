### useMeasure

#### Returns
`readonly [UseMeasureRect, () => void]`: [DOMRect, stop listening function]

#### Arguments
|Argument|Description|Type|DefaultValue|
|---|---|---|---|
|target|dom element|[BasicTarget](#basictarget)&lt;Element&gt;  **(Required)**|-|
|options|optional params|ResizeObserverOptions \| undefined |-|

### UseMeasureRect

|Property|Description|Type|DefaultValue|
|---|---|---|---|
|top|[MDN Reference](https://developer.mozilla.org/docs/Web/API/DOMRectReadOnly/top)|number  **(Required)**|`-`|
|bottom|[MDN Reference](https://developer.mozilla.org/docs/Web/API/DOMRectReadOnly/bottom)|number  **(Required)**|`-`|
|left|[MDN Reference](https://developer.mozilla.org/docs/Web/API/DOMRectReadOnly/left)|number  **(Required)**|`-`|
|right|[MDN Reference](https://developer.mozilla.org/docs/Web/API/DOMRectReadOnly/right)|number  **(Required)**|`-`|
|height|[MDN Reference](https://developer.mozilla.org/docs/Web/API/DOMRectReadOnly/height)|number  **(Required)**|`-`|
|width|[MDN Reference](https://developer.mozilla.org/docs/Web/API/DOMRectReadOnly/width)|number  **(Required)**|`-`|
|x|[MDN Reference](https://developer.mozilla.org/docs/Web/API/DOMRectReadOnly/x)|number  **(Required)**|`-`|
|y|[MDN Reference](https://developer.mozilla.org/docs/Web/API/DOMRectReadOnly/y)|number  **(Required)**|`-`|

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