### useMousePressed

#### Returns
`readonly [boolean, UseMousePressedSourceType]`: 包含以下元素的元组：
- 鼠标是否按下。
- 按下的事件来源。

#### Arguments
|参数名|描述|类型|默认值|
|---|---|---|---|
|target|dom对象|React.RefObject&lt;Element&gt; \| undefined |-|
|options|可选参数|[UseMousePressedOptions](#UseMousePressedOptions) \| undefined |-|

### UseMousePressedOptions

|参数名|描述|类型|默认值|
|---|---|---|---|
|touch|监听 `touchstart` 事件|boolean |`true`|
|drag|监听 `dragStart` 事件|boolean |`true`|
|initialValue|初始值|boolean \| (() => boolean) |`false`|

### UseMousePressedSourceType

#### Type

`export type UseMousePressedSourceType = "mouse" | "touch" | null;`
