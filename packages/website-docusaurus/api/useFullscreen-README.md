### useFullScreen

#### Returns
`readonly [boolean, { readonly enterFullscreen: () => void; readonly exitFullscreen: () => void; readonly toggleFullscreen: () => void; readonly isEnabled: boolean; }]`: A tuple with the following elements:
- whether the browser is in fullscreen.
- a object：
- enterFullscreen
- exitFullscreen
- toggleFullscreen
- isEnabled: whether the browser support fullscreen

#### Arguments
|Argument|Description|Type|DefaultValue|
|---|---|---|---|
|target|dom element|[BasicTarget](#BasicTarget)&lt;Element&gt;  **(Required)**|-|
|options|optional params|[UseFullScreenOptions](#UseFullScreenOptions) \| undefined |-|

### UseFullScreenOptions

|Property|Description|Type|DefaultValue|
|---|---|---|---|
|onExit|exit callback|() => void |`-`|
|onEnter|enter callback|() => void |`-`|

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