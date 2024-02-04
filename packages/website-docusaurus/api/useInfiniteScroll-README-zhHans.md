### useInfiniteScroll

#### Returns
`void`

#### Arguments
|参数名|描述|类型|默认值|
|---|---|---|---|
|target|dom元素|React.RefObject&lt;Element&gt;  **(必填)**|-|
|onLoadMore|加载更多函数|[UseInfiniteScrollLoadMore](#UseInfiniteScrollLoadMore)  **(必填)**|-|
|options|可选参数|[UseInfiniteScrollOptions](#UseInfiniteScrollOptions) \| undefined |-|

### UseInfiniteScrollLoadMore

#### Returns
`void | Promise<void>`

#### Arguments
|参数名|描述|类型|默认值|
|---|---|---|---|
|state|`useScroll` 返回的状态|readonly [number, number, boolean, [UseScrollArrivedState](#UseScrollArrivedState), [UseScrollDirection](#UseScrollDirection)]  **(必填)**|-|

### UseInfiniteScrollOptions

|参数名|描述|类型|默认值|
|---|---|---|---|
|distance|元素底部与视口底部之间的最小距离|number |`0`|
|direction|滚动方向|"top" \| "bottom" \| "left" \| "right" |`'bottom'`|
|preserveScrollPosition|加载更多项目时是否保留当前滚动位置|boolean |`-`|
|throttle|滚动事件的节流时间，默认关闭。|number |`0`|
|idle|滚动结束时的检查时间。当配置 `throttle` 时，此配置将设置为 (throttle +idle)。|number |`-`|
|offset|将到达状态偏移 x 像素|[UseScrollOffset](#UseScrollOffset) |`-`|
|onScroll|滚动的回调|(e: Event) => void |`-`|
|onStop|滚动结束的回调|(e: Event) => void |`-`|
|eventListenerOptions|滚动事件参数|boolean \| AddEventListenerOptions |`{capture: false, passive: true}`|

### UseScrollArrivedState

|参数名|描述|类型|默认值|
|---|---|---|---|
|left|到达左边|boolean  **(必填)**|`-`|
|right|到达右边|boolean  **(必填)**|`-`|
|top|到达顶部|boolean  **(必填)**|`-`|
|bottom|到达底部|boolean  **(必填)**|`-`|

### UseScrollDirection

|参数名|描述|类型|默认值|
|---|---|---|---|
|left|向左滚动|boolean  **(必填)**|`-`|
|right|向右滚动|boolean  **(必填)**|`-`|
|top|向上滚动|boolean  **(必填)**|`-`|
|bottom|向下滚动|boolean  **(必填)**|`-`|

### UseScrollOffset

```js
export interface UseScrollOffset {
  left?: number;
  right?: number;
  top?: number;
  bottom?: number;
}
```