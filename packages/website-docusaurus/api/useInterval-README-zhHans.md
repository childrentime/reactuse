### useInterval

#### Returns
`Pausable`

#### Arguments
|参数名|描述|类型|默认值|
|---|---|---|---|
|callback|回调|() => void  **(必填)**|-|
|delay|时间，如果为 `null` 的话则停止计时器|number \| null \| undefined |-|
|options|可选参数|[UseIntervalOptions](#UseIntervalOptions) \| undefined |-|

### UseIntervalOptions

|参数名|描述|类型|默认值|
|---|---|---|---|
|immediate|是否立即执行。|boolean |`-`|
|controls|是否控制执行。|boolean |`-`|

### Pausable

|参数名|描述|类型|默认值|
|---|---|---|---|
|isActive|一个 ref，指示一个 pausable 实例是否处于激活状态|RefObject&lt;boolean&gt;  **(必填)**|`-`|
|pause|暂时暂停执行效果|() => void  **(必填)**|`-`|
|resume|恢复效果|() => void  **(必填)**|`-`|