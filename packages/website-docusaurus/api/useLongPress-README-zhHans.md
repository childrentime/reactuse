### useLongPress

#### Returns
`{ readonly onMouseDown: (e: any) => void; readonly onTouchStart: (e: any) => void; readonly onMouseUp: () => void; readonly onMouseLeave: () => void; readonly onTouchEnd: () => void; }`: 包含以下元素的对象：
- onMouseDown 鼠标按下事件。
- onTouchStart 手指按下事件。
- onMouseUp 鼠标松开事件。
- onMouseLeave 鼠标离开事件
- onTouchEnd 手指松开事件

#### Arguments
|参数名|描述|类型|默认值|
|---|---|---|---|
|callback|回调|(e: MouseEvent \| TouchEvent) => void  **(必填)**|-|
|options|可选参数|[UseLongPressOptions](#uselongpressoptions) \| undefined |-|

### UseLongPressOptions

|参数名|描述|类型|默认值|
|---|---|---|---|
|isPreventDefault|阻止默认事件|boolean |`true`|
|delay|延迟|number |`300`|