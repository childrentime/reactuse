### useScrollIntoView

#### Returns
`{ scrollIntoView: (animation?: UseScrollIntoViewAnimation | undefined) => void; cancel: () => void; }`: A object with the following elements:
- scrollIntoView: scroll target element into viewport
- cancel: cancel scroll function

#### Arguments
|Argument|Description|Type|DefaultValue|
|---|---|---|---|
|targetElement|dom element|[BasicTarget](#BasicTarget)&lt;HTMLElement&gt;  **(Required)**|-|
|params|optional params|[UseScrollIntoViewParams](#UseScrollIntoViewParams) \| undefined |-|
|scrollElement|scroll container|[BasicTarget](#BasicTarget)&lt;HTMLElement&gt; |-|

### UseScrollIntoViewAnimation

|Property|Description|Type|DefaultValue|
|---|---|---|---|
|alignment|target element alignment relatively to parent based on current axis|"start" \| "end" \| "center" |`-`|

### UseScrollIntoViewParams

|Property|Description|Type|DefaultValue|
|---|---|---|---|
|onScrollFinish|callback fired after scroll|() => void |`-`|
|duration|duration of scroll in milliseconds|number |`1250`|
|axis|axis of scroll|"x" \| "y" |`y`|
|easing|custom mathematical easing function|(t: number) => number |`(t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t`|
|offset|additional distance between nearest edge and element|number |`0`|
|cancelable|indicator if animation may be interrupted by user scrolling|boolean |`true`|
|isList|prevents content jumping in scrolling lists with multiple targets|boolean |`-`|

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