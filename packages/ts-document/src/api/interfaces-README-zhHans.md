### useFullScreen

#### Returns
`UseFullscreenReturn`: 包含以下元素的元组：
- 当前是否处于全屏。
- 更新 cookie 值的函数。
- 刷新 cookie 值的函数，以防其他事件更改它。

#### Arguments
|参数名|描述|类型|默认值|
|---|---|---|---|
|target|dom元素|React.RefObject&lt;Element&gt;  **(必填)**|-|
|options|可选参数|[UseFullScreenOptions](#UseFullScreenOptions) \| undefined |-|

### UseFullScreenOptions

|参数名|描述|类型|默认值|
|---|---|---|---|
|onExit|退出时候的回调|() => void |`-`|
|onEnter|进入时候的回调|() => void |`-`|

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
