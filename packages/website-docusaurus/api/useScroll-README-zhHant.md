### useScroll

#### Returns
`readonly [number, number, boolean, UseScrollArrivedState, UseScrollDirection]`: 包含以下元素的元組：
- x 值。
- y 值。
- 是否在滚動。
- 到達邊界狀態。
- 滚動方向

#### Arguments
|參數名|描述|類型|預設值|
|---|---|---|---|
|target|dom元素|[BasicTarget](#basictarget)&lt;Element&gt; \| Document \| Window  **(必填)**|-|
|options|可选参数|[UseScrollOptions](#usescrolloptions) \| undefined |-|

### UseScrollOptions

|參數名|描述|類型|預設值|
|---|---|---|---|
|throttle|滚动事件的节流时间，默认关闭。|number |`0`|
|idle|滚动结束时的检查时间。当配置 `throttle` 时，此配置将设置为 (throttle +idle)。|number |`-`|
|offset|将到达状态偏移 x 像素|[UseScrollOffset](#usescrolloffset) |`-`|
|onScroll|滚动的回调|(e: Event) => void |`-`|
|onStop|滚动结束的回调|(e: Event) => void |`-`|
|eventListenerOptions|滚动事件参数|boolean \| AddEventListenerOptions |`{capture: false, passive: true}`|

### UseScrollArrivedState

|參數名|描述|類型|預設值|
|---|---|---|---|
|left|到达左边|boolean  **(必填)**|`-`|
|right|到达右边|boolean  **(必填)**|`-`|
|top|到达顶部|boolean  **(必填)**|`-`|
|bottom|到达底部|boolean  **(必填)**|`-`|

### UseScrollDirection

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