### UseScratchState

|參數名|描述|類型|預設值|
|---|---|---|---|
|isScratching|是否正在刮擦|boolean  **(必填)**|`-`|
|start|開始時間戳|number |`-`|
|end|結束時間戳|number |`-`|
|x|相對於元素的 x 座標|number |`-`|
|y|相對於元素的 y 座標|number |`-`|
|dx|x 方向的增量|number |`-`|
|dy|y 方向的增量|number |`-`|
|docX|文檔中的 x 座標|number |`-`|
|docY|文檔中的 y 座標|number |`-`|
|posX|元素在文檔中的 x 位置|number |`-`|
|posY|元素在文檔中的 y 位置|number |`-`|
|elH|元素高度|number |`-`|
|elW|元素寬度|number |`-`|
|elX|元素 x 位置|number |`-`|
|elY|元素 y 位置|number |`-`|

### UseScratchOptions

|參數名|描述|類型|預設值|
|---|---|---|---|
|disabled|是否禁用|boolean |`false`|
|onScratch|刮擦時的回調|(state: [UseScratchState](#usescratchstate)) => void |`-`|
|onScratchStart|開始刮擦時的回調|(state: [UseScratchState](#usescratchstate)) => void |`-`|
|onScratchEnd|結束刮擦時的回調|(state: [UseScratchState](#usescratchstate)) => void |`-`|

### useScratch

#### Returns
`UseScratchState`: 刮擦狀態

#### Arguments
|參數名|描述|類型|預設值|
|---|---|---|---|
|target|目標元素|[BasicTarget](#basictarget)&lt;HTMLElement&gt;  **(必填)**|-|
|options|配置項|[UseScratchOptions](#usescratchoptions) \| undefined |-|

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