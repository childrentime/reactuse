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
|options|可選參數|[UseScrollOptions](#usescrolloptions) \| undefined |-|

### UseScrollOptions

|參數名|描述|類型|預設值|
|---|---|---|---|
|throttle|滚動事件的節流時間，預設關閉。|number |`0`|
|idle|滚動結束時的檢查時間。當配置 `throttle` 時，此配置將設置為 (throttle +idle)。|number |`200`|
|offset|將到達狀態偏移 x 像素|[UseScrollOffset](#usescrolloffset) |`-`|
|onScroll|滚動的回調|(e: Event) => void |`-`|
|onStop|滚動結束的回調|(e: Event) => void |`-`|
|eventListenerOptions|滚動事件參數|boolean \| AddEventListenerOptions |`{capture: false, passive: true}`|

### UseScrollArrivedState

|參數名|描述|類型|預設值|
|---|---|---|---|
|left|到達左邊|boolean  **(必填)**|`-`|
|right|到達右邊|boolean  **(必填)**|`-`|
|top|到達頂部|boolean  **(必填)**|`-`|
|bottom|到達底部|boolean  **(必填)**|`-`|

### UseScrollDirection

|參數名|描述|類型|預設值|
|---|---|---|---|
|left|向左滚動|boolean  **(必填)**|`-`|
|right|向右滚動|boolean  **(必填)**|`-`|
|top|向上滚動|boolean  **(必填)**|`-`|
|bottom|向下滚動|boolean  **(必填)**|`-`|

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