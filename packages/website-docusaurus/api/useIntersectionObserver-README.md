### useIntersectionObserver

#### Returns
`() => void`: stop listening function

#### Arguments
|Argument|Description|Type|DefaultValue|
|---|---|---|---|
|target|dom element|[BasicTarget](#BasicTarget)&lt;Element&gt;  **(Required)**|-|
|callback|callback|IntersectionObserverCallback  **(Required)**|-|
|options|options passed to `IntersectionObserver`|IntersectionObserverInit \| undefined |-|

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