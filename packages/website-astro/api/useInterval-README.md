### useInterval

#### Returns
`Pausable`

#### Arguments
|Argument|Description|Type|DefaultValue|
|---|---|---|---|
|callback|callback|() => void  **(Required)**|-|
|delay|Time, if `null` then stop the timer|number \| null \| undefined |-|
|options|optional params|[UseIntervalOptions](#useintervaloptions) \| undefined |-|

### UseIntervalOptions

|Property|Description|Type|DefaultValue|
|---|---|---|---|
|immediate|Whether to run the callback once immediately when the interval starts (on mount and on every `delay` change). Not run while `delay` is `null` (paused).|boolean |`-`|
|controls|Whether to control the interval manually with the returned `resume()` / `pause()` instead of starting it automatically from `delay`. It is still cleared on unmount.|boolean |`-`|

### Pausable

|Property|Description|Type|DefaultValue|
|---|---|---|---|
|isActive|A ref indicate whether a pausable instance is active|RefObject&lt;boolean&gt;  **(Required)**|`-`|
|pause|Temporary pause the effect from executing|() => void  **(Required)**|`-`|
|resume|Resume the effects|() => void  **(Required)**|`-`|