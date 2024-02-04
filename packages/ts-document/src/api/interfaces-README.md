### useFullScreen

#### Returns
`UseFullscreenReturn`: A tuple with the following elements:
- The current value of the cookie.
- A function to update the value of the cookie.
- A function to refresh the value of the cookie, incase other events change it.

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

### UseFullscreenReturn

#### Type

`export type UseFullscreenReturn = readonly [
  /**
   * @zh 当前是否处于全屏
   * @en whether is in fullscreen
   */
  boolean,
  {
    /**
     * @zh 进入全屏
     * @en enter fullscreen
     */
    readonly enterFullscreen: () => void;
    /**
     * @zh 退出全屏
     * @en exit fullscreen
     */
    readonly exitFullscreen: () => void;
    /**
     * @zh 切换全屏
     * @en toggle fullscreen
     */
    readonly toggleFullscreen: () => void;
    /**
     * @zh 浏览器是否支持
     * @en whether the browser support fullscreen
     */
    readonly isEnabled: boolean;
  },
];`
