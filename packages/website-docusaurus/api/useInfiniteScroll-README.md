### useInfiniteScroll

#### Returns
`void`

#### Arguments
|Argument|Description|Type|DefaultValue|
|---|---|---|---|
|target|dom element|React.RefObject&lt;Element&gt;  **(Required)**|-|
|onLoadMore|load more function|[UseInfiniteScrollLoadMore](#UseInfiniteScrollLoadMore)  **(Required)**|-|
|options|optional params|[UseInfiniteScrollOptions](#UseInfiniteScrollOptions) \| undefined |-|

### UseInfiniteScrollLoadMore

#### Returns
`void | Promise<void>`

#### Arguments
|Argument|Description|Type|DefaultValue|
|---|---|---|---|
|state|the return state of `useScroll`|readonly [number, number, boolean, [UseScrollArrivedState](#UseScrollArrivedState), [UseScrollDirection](#UseScrollDirection)]  **(Required)**|-|

### UseInfiniteScrollOptions

|Property|Description|Type|DefaultValue|
|---|---|---|---|
|distance|The minimum distance between the bottom of the element and the bottom of the viewport|number |`0`|
|direction|The direction in which to listen the scroll.|"top" \| "bottom" \| "left" \| "right" |`'bottom'`|
|preserveScrollPosition|Whether to preserve the current scroll position when loading more items.|boolean |`-`|
|throttle|Throttle time for scroll event, it’s disabled by default.|number |`0`|
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

### UseScrollOffset

```js
export interface UseScrollOffset {
  left?: number;
  right?: number;
  top?: number;
  bottom?: number;
}
```