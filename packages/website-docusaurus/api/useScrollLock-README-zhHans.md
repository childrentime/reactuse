### useScrollLock

#### Returns
`readonly [boolean, (flag: boolean) => void]`: 包含以下元素的元组：
- 是否锁定。
- 更新锁定值的函数。

#### Arguments
|参数名|描述|类型|默认值|
|---|---|---|---|
|target|dom元素|[BasicTarget](#BasicTarget)&lt;HTMLElement&gt;  **(必填)**|-|
|initialState|默认值|boolean \| undefined |`false`|

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