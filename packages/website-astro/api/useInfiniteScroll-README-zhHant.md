### useInfiniteScroll

#### Returns
`void`

#### Arguments
|參數名|描述|類型|預設值|
|---|---|---|---|
|target|dom元素|[BasicTarget](#basictarget)&lt;Element&gt;  **(必填)**|-|
|onLoadMore|加載更多函數|[UseInfiniteScrollLoadMore](#useinfinitescrollloadmore)  **(必填)**|-|
|options|可选参数|[UseInfiniteScrollOptions](#useinfinitescrolloptions) \| undefined |-|

### UseInfiniteScrollLoadMore

#### Returns
`void | Promise<void>`

#### Arguments
|參數名|描述|類型|預設值|
|---|---|---|---|
|state|`useScroll` 返回的状态|readonly [number, number, boolean, [UseInfiniteScrollArrivedState](#useinfinitescrollarrivedstate), [UseInfiniteScrollDirection](#useinfinitescrolldirection)]  **(必填)**|-|

### UseInfiniteScrollOptions

|參數名|描述|類型|預設值|
|---|---|---|---|
|distance|元素底部与视口底部之间的最小距离|number |`0`|
|direction|滚动方向|'top' \| 'bottom' \| 'left' \| 'right' |`'bottom'`|
|preserveScrollPosition|加载更多项目时是否保留当前滚动位置|boolean |`-`|
|throttle|滚動事件的節流時間，預設關閉。|number |`0`|
|idle|滚動結束時的檢查時間。當配置 `throttle` 時，此配置將設置為 (throttle +idle)。|number |`200`|
|offset|將到達狀態偏移 x 像素|[UseScrollOffset](#usescrolloffset) |`-`|
|onScroll|滚動的回調|(e: Event) => void |`-`|
|onStop|滚動結束的回調|(e: Event) => void |`-`|
|eventListenerOptions|滚動事件參數|boolean \| AddEventListenerOptions |`{capture: false, passive: true}`|

### UseInfiniteScrollArrivedState

|參數名|描述|類型|預設值|
|---|---|---|---|
|left|到达左边|boolean  **(必填)**|`-`|
|right|到达右边|boolean  **(必填)**|`-`|
|top|到达顶部|boolean  **(必填)**|`-`|
|bottom|到达底部|boolean  **(必填)**|`-`|

### UseInfiniteScrollDirection

|參數名|描述|類型|預設值|
|---|---|---|---|
|left|向左滚动|boolean  **(必填)**|`-`|
|right|向右滚动|boolean  **(必填)**|`-`|
|top|向上滚动|boolean  **(必填)**|`-`|
|bottom|向下滚动|boolean  **(必填)**|`-`|

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