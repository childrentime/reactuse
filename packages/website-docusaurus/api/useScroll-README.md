### useScroll

#### Returns
`readonly [number, number, boolean, UseScrollArrivedState, UseScrollDirection]`: A tuple with the following elements:
- The x value.
- The y value.
- Whether it is scrolling.
- Boundary arrival status.
- Scroll direction.

#### Arguments
|Argument|Description|Type|DefaultValue|
|---|---|---|---|
|target|dom elment|[BasicTarget](#BasicTarget)&lt;Element&gt; \| Document \| Window  **(Required)**|-|
|options|optional params|[UseScrollOptions](#UseScrollOptions) \| undefined |-|

### UseScrollOptions

|Property|Description|Type|DefaultValue|
|---|---|---|---|
|throttle|Throttle time for scroll event, it's disabled by default.|number |`0`|
|idle|The check time when scrolling ends.This configuration will be setting to (throttle + idle) when the `throttle` is configured.|number |`-`|
|offset|Offset arrived states by x pixels|[UseScrollOffset](#UseScrollOffset) |`-`|
|onScroll|Trigger it when scrolling.|(e: Event) => void |`-`|
|onStop|Trigger it when scrolling ends.|(e: Event) => void |`-`|
|eventListenerOptions|Listener options for scroll event.|boolean \| AddEventListenerOptions |`{capture: false, passive: true}`|

### UseScrollArrivedState

|Property|Description|Type|DefaultValue|
|---|---|---|---|
|left|arrived left|boolean  **(Required)**|`-`|
|right|arrived right|boolean  **(Required)**|`-`|
|top|arrived top|boolean  **(Required)**|`-`|
|bottom|arrived bottom|boolean  **(Required)**|`-`|

### UseScrollDirection

|Property|Description|Type|DefaultValue|
|---|---|---|---|
|left|scroll left|boolean  **(Required)**|`-`|
|right|scroll right|boolean  **(Required)**|`-`|
|top|scroll top|boolean  **(Required)**|`-`|
|bottom|scroll bottom|boolean  **(Required)**|`-`|

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

### UseScrollOffset

```js
export interface UseScrollOffset {
  left?: number;
  right?: number;
  top?: number;
  bottom?: number;
}
```