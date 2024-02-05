### useDoubleClick

#### Returns
`void`

#### Arguments
|Argument|Description|Type|DefaultValue|
|---|---|---|---|
|props|-|[UseDoubleClickProps](#UseDoubleClickProps)  **(Required)**|-|

### UseDoubleClickProps

|Property|Description|Type|DefaultValue|
|---|---|---|---|
|target|dom element|RefObject&lt;Element&gt;  **(Required)**|`-`|
|latency|latency time (milliseconds)|number \| undefined |`-`|
|onSingleClick|single click event handler|((e?: MouseEvent \| TouchEvent) => void) \| undefined |`-`|
|onDoubleClick|double click event handler|((e?: MouseEvent \| TouchEvent) => void) \| undefined |`-`|