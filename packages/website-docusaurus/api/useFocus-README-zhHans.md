### useFocus

#### Returns
`readonly [boolean, (value: boolean) => void]`: 包含以下元素的元組：
- 元素是否聚焦。
- 更新聚焦狀態。

#### Arguments
|参数名|描述|类型|默认值|
|---|---|---|---|
|target|dom对象|[BasicTarget](#BasicTarget)&lt;HTMLElement \| SVGElement&gt;  **(必填)**|-|
|initialValue|默认值|boolean \| undefined |`false`|

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