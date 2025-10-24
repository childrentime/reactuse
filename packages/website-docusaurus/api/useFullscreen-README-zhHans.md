### useFullScreen

#### Returns
`readonly [boolean, { readonly enterFullscreen: () => void; readonly exitFullscreen: () => void; readonly toggleFullscreen: () => void; readonly isEnabled: boolean; }]`: 包含以下元素的元组：
- 当前是否处于全屏。
- 一个操作对象:
- enterFullscreen： 进入全屏。
- exitFullscreen： 退出全屏。
- toggleFullscreen： 切换全屏。
- isEnabled： 当前浏览器是否支持全屏。

#### Arguments
|参数名|描述|类型|默认值|
|---|---|---|---|
|target|dom元素|[BasicTarget](#basictarget)&lt;Element&gt;  **(必填)**|-|
|options|可选参数|[UseFullScreenOptions](#usefullscreenoptions) \| undefined |-|

### UseFullScreenOptions

|参数名|描述|类型|默认值|
|---|---|---|---|
|onExit|退出时候的回调|() => void |`-`|
|onEnter|进入时候的回调|() => void |`-`|

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