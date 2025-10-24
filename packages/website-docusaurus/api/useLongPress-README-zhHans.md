### useLongPress

#### Returns
`{ readonly onMouseDown: (e: any) => void; readonly onTouchStart: (e: any) => void; readonly onMouseUp: () => void; readonly onMouseLeave: () => void; readonly onTouchEnd: () => void; }`: 包含以下元素的對象：
- onMouseDown 滑鼠按下事件。
- onTouchStart 手指按下事件。
- onMouseUp 滑鼠放開事件。
- onMouseLeave 滑鼠離開事件
- onTouchEnd 手指放開事件

#### Arguments
|参数名|描述|类型|默认值|
|---|---|---|---|
|callback|回调|(e: MouseEvent \| TouchEvent) => void  **(必填)**|-|
|options|可选参数|[UseLongPressOptions](#UseLongPressOptions) \| undefined |-|

### UseLongPressOptions

|参数名|描述|类型|默认值|
|---|---|---|---|
|isPreventDefault|阻止默认事件|boolean |`true`|
|delay|延迟|number |`300`|