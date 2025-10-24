### useMeasure

#### Returns
`readonly [UseMeasureRect, () => void]`: [DOMRect值,停止監聽函數]

#### Arguments
|參數名|描述|類型|預設值|
|---|---|---|---|
|target|dom对象|[BasicTarget](#basictarget)&lt;Element&gt;  **(必填)**|-|
|options|可选参数|ResizeObserverOptions \| undefined |-|

### UseMeasureRect

|參數名|描述|類型|預設值|
|---|---|---|---|
|top|[MDN Reference](https://developer.mozilla.org/docs/Web/API/DOMRectReadOnly/top)|number  **(必填)**|`-`|
|bottom|[MDN Reference](https://developer.mozilla.org/docs/Web/API/DOMRectReadOnly/bottom)|number  **(必填)**|`-`|
|left|[MDN Reference](https://developer.mozilla.org/docs/Web/API/DOMRectReadOnly/left)|number  **(必填)**|`-`|
|right|[MDN Reference](https://developer.mozilla.org/docs/Web/API/DOMRectReadOnly/right)|number  **(必填)**|`-`|
|height|[MDN Reference](https://developer.mozilla.org/docs/Web/API/DOMRectReadOnly/height)|number  **(必填)**|`-`|
|width|[MDN Reference](https://developer.mozilla.org/docs/Web/API/DOMRectReadOnly/width)|number  **(必填)**|`-`|
|x|[MDN Reference](https://developer.mozilla.org/docs/Web/API/DOMRectReadOnly/x)|number  **(必填)**|`-`|
|y|[MDN Reference](https://developer.mozilla.org/docs/Web/API/DOMRectReadOnly/y)|number  **(必填)**|`-`|

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