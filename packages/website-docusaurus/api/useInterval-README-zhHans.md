### useInterval

#### Returns
`Pausable`

#### Arguments
|参数名|描述|类型|默认值|
|---|---|---|---|
|callback|回调|() => void  **(必填)**|-|
|delay|时间，如果为 `null` 的话则停止计时器|number \| null \| undefined |-|
|options|可选参数|[UseIntervalOptions](#useintervaloptions) \| undefined |-|

### UseIntervalOptions

|参数名|描述|类型|默认值|
|---|---|---|---|
|immediate|是否在定时器启动时（挂载以及每次 `delay` 变化时）立即执行一次回调。`delay` 为 `null`（暂停）时不会执行。|boolean |`-`|
|controls|是否改为手动控制：不再根据 `delay` 自动启动，而是通过返回的 `resume()` / `pause()` 启停。卸载时仍会自动清除。|boolean |`-`|

### Pausable

|参数名|描述|类型|默认值|
|---|---|---|---|
|isActive|一个 ref，指示一个 pausable 实例是否处于激活状态|RefObject&lt;boolean&gt;  **(必填)**|`-`|
|pause|暂时暂停执行效果|() => void  **(必填)**|`-`|
|resume|恢复效果|() => void  **(必填)**|`-`|