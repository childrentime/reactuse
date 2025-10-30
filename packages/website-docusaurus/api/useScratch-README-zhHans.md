### UseScratchState

|参数名|描述|类型|默认值|
|---|---|---|---|
|isScratching|是否正在刮擦|boolean  **(必填)**|`-`|
|start|开始时间戳|number |`-`|
|end|结束时间戳|number |`-`|
|x|相对于元素的 x 坐标|number |`-`|
|y|相对于元素的 y 坐标|number |`-`|
|dx|x 方向的增量|number |`-`|
|dy|y 方向的增量|number |`-`|
|docX|文档中的 x 坐标|number |`-`|
|docY|文档中的 y 坐标|number |`-`|
|posX|元素在文档中的 x 位置|number |`-`|
|posY|元素在文档中的 y 位置|number |`-`|
|elH|元素高度|number |`-`|
|elW|元素宽度|number |`-`|
|elX|元素 x 位置|number |`-`|
|elY|元素 y 位置|number |`-`|

### UseScratchOptions

|参数名|描述|类型|默认值|
|---|---|---|---|
|disabled|是否禁用|boolean |`-`|
|onScratch|刮擦时的回调|(state: [UseScratchState](#usescratchstate)) => void |`-`|
|onScratchStart|开始刮擦时的回调|(state: [UseScratchState](#usescratchstate)) => void |`-`|
|onScratchEnd|结束刮擦时的回调|(state: [UseScratchState](#usescratchstate)) => void |`-`|

### useScratch

#### Returns
`UseScratchState`: 刮擦状态

#### Arguments
|参数名|描述|类型|默认值|
|---|---|---|---|
|target|目标元素|[BasicTarget](#basictarget)&lt;HTMLElement&gt;  **(必填)**|-|
|options|配置项|[UseScratchOptions](#usescratchoptions) \| undefined |-|

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