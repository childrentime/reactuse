### useScrollLock

#### Returns
`readonly [boolean, (flag: boolean) => void]`: A tuple with the following elements:
- whether scroll is locked.
- A function to update the value of lock state.

#### Arguments
|Argument|Description|Type|DefaultValue|
|---|---|---|---|
|target|dom element|[BasicTarget](#BasicTarget)&lt;HTMLElement&gt;  **(Required)**|-|
|initialState|default value|boolean \| undefined |`false`|

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