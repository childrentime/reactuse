### useElementSize

#### Returns
`readonly [number, number]`: 包含以下元素的元組：
- 元素寬度。
- 元素高度。

#### Arguments
|参数名|描述|类型|默认值|
|---|---|---|---|
|target|dom对象|[BasicTarget](#BasicTarget)&lt;Element&gt;  **(必填)**|-|
|options|`resizeObserver` 参数|ResizeObserverOptions \| undefined |-|

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