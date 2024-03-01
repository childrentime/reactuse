### useHover

#### Returns
`boolean`

#### Arguments
|参数名|描述|类型|默认值|
|---|---|---|---|
|target|dom对象|[BasicTarget](#BasicTarget)&lt;T&gt;  **(必填)**|-|

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