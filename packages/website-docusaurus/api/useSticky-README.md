### useSticky

#### Returns
`[boolean, React.Dispatch<React.SetStateAction<boolean>>]`: A tuple with the following elements:
- The current state of sticky.
- A function to update the value of sticky.

#### Arguments
|Argument|Description|Type|DefaultValue|
|---|---|---|---|
|targetElement|dom element|[BasicTarget](#BasicTarget)&lt;HTMLElement&gt;  **(Required)**|-|
|params|optional params|[UseStickyParams](#UseStickyParams)  **(Required)**|-|
|scrollElement|scroll container|[BasicTarget](#BasicTarget)&lt;HTMLElement&gt; |-|

### UseStickyParams

|Property|Description|Type|DefaultValue|
|---|---|---|---|
|axis|axis of scroll|'x' \| 'y' |`y`|
|nav|cover height or width|number  **(Required)**|`0`|

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