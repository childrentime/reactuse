### useLongPress

#### Returns
`{ readonly onMouseDown: (e: any) => void; readonly onTouchStart: (e: any) => void; readonly onMouseUp: () => void; readonly onMouseLeave: () => void; readonly onTouchEnd: () => void; }`: A object with the following elements:
- onMouseDown: Mouse down event.
- onTouchStart: Finger touch start event.
- onMouseUp: Mouse up event.
- onMouseLeave: Mouse leave event.
- onTouchEnd: Finger touch end event.

#### Arguments
|Argument|Description|Type|DefaultValue|
|---|---|---|---|
|callback|callback|(e: MouseEvent \| TouchEvent) => void  **(Required)**|-|
|options|optional params|[UseLongPressOptions](#UseLongPressOptions) \| undefined |-|

### UseLongPressOptions

|Property|Description|Type|DefaultValue|
|---|---|---|---|
|isPreventDefault|whether prevent default event|boolean |`true`|
|delay|delay time|number |`300`|