### useCssVar

#### Returns
`readonly [string, (v: string) => void]`: A tuple with the following elements:
- The current value of the css var.
- A function to update the value of the css var.

#### Arguments
|Argument|Description|Type|DefaultValue|
|---|---|---|---|
|prop|prop, eg: --color|string  **(Required)**|-|
|target|dom element|[BasicTarget](#basictarget)&lt;T&gt;  **(Required)**|-|
|defaultValue|default value|string \| undefined |-|
|options|options|[UseCssVarOptions](#usecssvaroptions) \| undefined |-|

### UseCssVarOptions

|Property|Description|Type|DefaultValue|
|---|---|---|---|
|observe|Use MutationObserver to monitor variable changes|boolean |`false`|

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