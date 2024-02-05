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
|target|dom element|React.RefObject&lt;Element&gt;  **(Required)**|-|
|options|optional params|[UseFullScreenOptions](#UseFullScreenOptions) \| undefined |-|

### UseFullScreenOptions

|Property|Description|Type|DefaultValue|
|---|---|---|---|
|onExit|exit callback|() => void |`-`|
|onEnter|enter callback|() => void |`-`|