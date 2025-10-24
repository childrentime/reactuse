### useIntersectionObserver

#### Returns
`() => void`: 停止監聽函數

#### Arguments
|參數名|描述|類型|預設值|
|---|---|---|---|
|target|dom元素|[BasicTarget](#basictarget)&lt;Element&gt;  **(必填)**|-|
|callback|回调|IntersectionObserverCallback  **(必填)**|-|
|options|传递给 `IntersectionObserver` 的参数|IntersectionObserverInit \| undefined |-|

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