### useInterval

#### Returns
`Pausable`

#### Arguments
|參數名|描述|類型|預設值|
|---|---|---|---|
|callback|回調|() => void  **(必填)**|-|
|delay|時間，如果為 `null` 的話則停止計時器|number \| null \| undefined |-|
|options|可选参数|[UseIntervalOptions](#useintervaloptions) \| undefined |-|

### UseIntervalOptions

|參數名|描述|類型|預設值|
|---|---|---|---|
|immediate|是否在計時器啟動時（掛載以及每次 `delay` 變化時）立即執行一次回呼。`delay` 為 `null`（暫停）時不會執行。|boolean |`-`|
|controls|是否改為手動控制：不再根據 `delay` 自動啟動，而是透過回傳的 `resume()` / `pause()` 啟停。卸載時仍會自動清除。|boolean |`-`|

### Pausable

|參數名|描述|類型|預設值|
|---|---|---|---|
|isActive|一个 ref，指示一个 pausable 实例是否处于激活状态|RefObject&lt;boolean&gt;  **(必填)**|`-`|
|pause|暂时暂停执行效果|() => void  **(必填)**|`-`|
|resume|恢复效果|() => void  **(必填)**|`-`|