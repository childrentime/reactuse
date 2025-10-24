### UseMutationObserver

#### Returns
`() => void`: 停止函數

#### Arguments
|參數名|描述|類型|預設值|
|---|---|---|---|
|callback|回调|MutationCallback  **(必填)**|-|
|target|dom元素|[BasicTarget](#BasicTarget)  **(必填)**|-|
|options|传递给 `MutationObserver` 的参数|MutationObserverInit \| undefined |-|

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