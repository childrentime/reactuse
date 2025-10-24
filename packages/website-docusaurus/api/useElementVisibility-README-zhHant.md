### useElementVisibility

#### Returns
`readonly [boolean, () => void]`: 包含以下元素的元組：
- 當前元素是否可見。
- 停止監聽函數。

#### Arguments
|參數名|描述|類型|預設值|
|---|---|---|---|
|target|dom对象|[BasicTarget](#basictarget)&lt;HTMLElement \| SVGElement&gt;  **(必填)**|-|
|options|传递给 `intersectionObserver` 的选项|IntersectionObserverInit \| undefined |-|

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