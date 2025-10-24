### useFocus

#### Returns
`readonly [boolean, (value: boolean) => void]`: A tuple with the following elements:
-  whether the element focus.
- A function to update focus state.

#### Arguments
|Argument|Description|Type|DefaultValue|
|---|---|---|---|
|target|dom element|[BasicTarget](#basictarget)&lt;HTMLElement \| SVGElement&gt;  **(Required)**|-|
|initialValue|defaultValue|boolean \| undefined |`false`|

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