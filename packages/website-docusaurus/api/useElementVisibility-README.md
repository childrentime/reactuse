### useElementVisibility

#### Returns
`readonly [boolean, () => void]`: A tuple with the following elements:
- is the current element visible.
- stop observer listening function.

#### Arguments
|Argument|Description|Type|DefaultValue|
|---|---|---|---|
|target|dom element|[BasicTarget](#BasicTarget)&lt;HTMLElement \| SVGElement&gt;  **(Required)**|-|
|options|options passed to `intersectionObserver`|IntersectionObserverInit \| undefined |-|

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